import express from 'express';
import bcrypt from 'bcryptjs';
import {
  asyncHandler,
  cleanText,
  httpError,
  parseId,
  publicUser,
  serializePlaylist,
  serializeSong
} from '../lib/helpers.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findOwnedPlaylist(db, playlistId, userId) {
  const result = await db.query(
    'SELECT id, user_id, name, created_at FROM playlists WHERE id = $1 AND user_id = $2',
    [playlistId, userId]
  );
  if (result.rowCount === 0) {
    throw httpError(404, 'La lista de reproducción no existe.');
  }
  return result.rows[0];
}

async function assertSongExists(db, songId) {
  const result = await db.query('SELECT id FROM songs WHERE id = $1', [songId]);
  if (result.rowCount === 0) {
    throw httpError(404, 'La canción no existe.');
  }
}

export function createMeRouter({ db, config, requireAuth }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const result = await db.query(
        'SELECT id, name, email, created_at FROM users WHERE id = $1',
        [req.userId]
      );
      if (result.rowCount === 0) throw httpError(401, 'La cuenta ya no existe.');
      res.json({ user: publicUser(result.rows[0]) });
    })
  );

  router.patch(
    '/me',
    asyncHandler(async (req, res) => {
      const current = await db.query(
        'SELECT id, name, email, password_hash FROM users WHERE id = $1',
        [req.userId]
      );
      if (current.rowCount === 0) throw httpError(401, 'La cuenta ya no existe.');

      const row = current.rows[0];
      const updates = [];
      const params = [];

      if (req.body?.name !== undefined) {
        const name = cleanText(req.body.name, { min: 2, max: 60 });
        if (!name) throw httpError(400, 'El nombre debe tener entre 2 y 60 caracteres.');
        params.push(name);
        updates.push(`name = $${params.length}`);
      }

      if (req.body?.email !== undefined) {
        const email = String(req.body.email).trim().toLowerCase();
        if (!EMAIL_RE.test(email)) {
          throw httpError(400, 'Ingresa un correo electrónico válido.');
        }
        const repeated = await db.query(
          'SELECT id FROM users WHERE email = $1 AND id <> $2',
          [email, req.userId]
        );
        if (repeated.rowCount > 0) {
          throw httpError(409, 'Ese correo electrónico ya está en uso.');
        }
        params.push(email);
        updates.push(`email = $${params.length}`);
      }

      if (req.body?.password !== undefined) {
        const password = String(req.body.password);
        const currentPassword = String(req.body.currentPassword ?? '');
        if (password.length < 8) {
          throw httpError(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
        }
        const matches = await bcrypt.compare(currentPassword, row.password_hash);
        if (!matches) {
          throw httpError(400, 'La contraseña actual no es correcta.');
        }
        const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
        params.push(passwordHash);
        updates.push(`password_hash = $${params.length}`);
      }

      if (updates.length === 0) {
        throw httpError(400, 'No se enviaron datos para actualizar.');
      }

      params.push(req.userId);
      const updated = await db.query(
        `UPDATE users SET ${updates.join(', ')}
         WHERE id = $${params.length}
         RETURNING id, name, email, created_at`,
        params
      );

      res.json({ user: publicUser(updated.rows[0]) });
    })
  );

  // ----------------------------- Favoritos -----------------------------

  router.get(
    '/favorites',
    asyncHandler(async (req, res) => {
      const result = await db.query(
        `SELECT s.*, true AS is_favorite
         FROM favorites f
         JOIN songs s ON s.id = f.song_id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC, s.id ASC`,
        [req.userId]
      );
      res.json({ songs: result.rows.map(serializeSong) });
    })
  );

  router.put(
    '/favorites/:songId',
    asyncHandler(async (req, res) => {
      const songId = parseId(req.params.songId);
      if (!songId) throw httpError(400, 'Identificador de canción inválido.');
      await assertSongExists(db, songId);

      const existing = await db.query(
        'SELECT 1 FROM favorites WHERE user_id = $1 AND song_id = $2',
        [req.userId, songId]
      );
      if (existing.rowCount === 0) {
        await db.query(
          'INSERT INTO favorites (user_id, song_id) VALUES ($1, $2)',
          [req.userId, songId]
        );
      }

      res.json({ favorite: true, songId });
    })
  );

  router.delete(
    '/favorites/:songId',
    asyncHandler(async (req, res) => {
      const songId = parseId(req.params.songId);
      if (!songId) throw httpError(400, 'Identificador de canción inválido.');

      await db.query(
        'DELETE FROM favorites WHERE user_id = $1 AND song_id = $2',
        [req.userId, songId]
      );
      res.json({ favorite: false, songId });
    })
  );

  // -------------------------- Listas de reproducción --------------------------

  router.get(
    '/playlists',
    asyncHandler(async (req, res) => {
      const result = await db.query(
        `SELECT p.id, p.name, p.created_at, COUNT(ps.song_id) AS song_count
         FROM playlists p
         LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
         WHERE p.user_id = $1
         GROUP BY p.id, p.name, p.created_at
         ORDER BY p.id ASC`,
        [req.userId]
      );
      res.json({ playlists: result.rows.map(serializePlaylist) });
    })
  );

  router.post(
    '/playlists',
    asyncHandler(async (req, res) => {
      const name = cleanText(req.body?.name, { min: 1, max: 60 });
      if (!name) throw httpError(400, 'El nombre de la lista debe tener entre 1 y 60 caracteres.');

      const inserted = await db.query(
        'INSERT INTO playlists (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
        [req.userId, name]
      );
      res.status(201).json({
        playlist: serializePlaylist({ ...inserted.rows[0], song_count: 0 })
      });
    })
  );

  router.get(
    '/playlists/:id',
    asyncHandler(async (req, res) => {
      const playlistId = parseId(req.params.id);
      if (!playlistId) throw httpError(400, 'Identificador de lista inválido.');

      const playlist = await findOwnedPlaylist(db, playlistId, req.userId);
      const songs = await db.query(
        `SELECT s.*, ps.position,
          CASE WHEN f.song_id IS NULL THEN false ELSE true END AS is_favorite
         FROM playlist_songs ps
         JOIN songs s ON s.id = ps.song_id
         LEFT JOIN favorites f ON f.song_id = s.id AND f.user_id = $2
         WHERE ps.playlist_id = $1
         ORDER BY ps.position ASC`,
        [playlistId, req.userId]
      );

      res.json({
        playlist: {
          ...serializePlaylist({ ...playlist, song_count: songs.rowCount }),
          songs: songs.rows.map(serializeSong)
        }
      });
    })
  );

  router.patch(
    '/playlists/:id',
    asyncHandler(async (req, res) => {
      const playlistId = parseId(req.params.id);
      if (!playlistId) throw httpError(400, 'Identificador de lista inválido.');
      const name = cleanText(req.body?.name, { min: 1, max: 60 });
      if (!name) throw httpError(400, 'El nombre de la lista debe tener entre 1 y 60 caracteres.');

      await findOwnedPlaylist(db, playlistId, req.userId);
      const updated = await db.query(
        'UPDATE playlists SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
        [name, playlistId]
      );
      res.json({
        playlist: serializePlaylist({ ...updated.rows[0], song_count: 0 })
      });
    })
  );

  router.delete(
    '/playlists/:id',
    asyncHandler(async (req, res) => {
      const playlistId = parseId(req.params.id);
      if (!playlistId) throw httpError(400, 'Identificador de lista inválido.');

      await findOwnedPlaylist(db, playlistId, req.userId);
      await db.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [playlistId]);
      await db.query('DELETE FROM playlists WHERE id = $1', [playlistId]);
      res.json({ deleted: true, playlistId });
    })
  );

  router.post(
    '/playlists/:id/songs',
    asyncHandler(async (req, res) => {
      const playlistId = parseId(req.params.id);
      const songId = parseId(req.body?.songId);
      if (!playlistId) throw httpError(400, 'Identificador de lista inválido.');
      if (!songId) throw httpError(400, 'Identificador de canción inválido.');

      await findOwnedPlaylist(db, playlistId, req.userId);
      await assertSongExists(db, songId);

      const duplicate = await db.query(
        'SELECT 1 FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
        [playlistId, songId]
      );
      if (duplicate.rowCount > 0) {
        throw httpError(409, 'La canción ya está en esta lista.');
      }

      const max = await db.query(
        'SELECT COALESCE(MAX(position), 0) AS last_position FROM playlist_songs WHERE playlist_id = $1',
        [playlistId]
      );
      const position = Number(max.rows[0]?.last_position ?? 0) + 1;
      await db.query(
        'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3)',
        [playlistId, songId, position]
      );

      res.status(201).json({ playlistId, songId, position });
    })
  );

  router.delete(
    '/playlists/:id/songs/:songId',
    asyncHandler(async (req, res) => {
      const playlistId = parseId(req.params.id);
      const songId = parseId(req.params.songId);
      if (!playlistId) throw httpError(400, 'Identificador de lista inválido.');
      if (!songId) throw httpError(400, 'Identificador de canción inválido.');

      await findOwnedPlaylist(db, playlistId, req.userId);
      await db.query(
        'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
        [playlistId, songId]
      );
      res.json({ removed: true, playlistId, songId });
    })
  );

  return router;
}
