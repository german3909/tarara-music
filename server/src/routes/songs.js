import express from 'express';
import { asyncHandler, httpError, parseId, serializeSong } from '../lib/helpers.js';
import { SUPPORTED_FORMATS } from '../db/schema.js';

export function createSongsRouter({ db, optionalAuth }) {
  const router = express.Router();

  function buildSongQuery({ userId, query, songId }) {
    const params = [];
    const conditions = [];
    let favoriteSelect = 'false AS is_favorite';
    let join = '';

    if (userId) {
      params.push(userId);
      join = `LEFT JOIN favorites f ON f.song_id = s.id AND f.user_id = $1`;
      favoriteSelect = `CASE WHEN f.song_id IS NULL THEN false ELSE true END AS is_favorite`;
    }

    if (songId) {
      params.push(songId);
      conditions.push(`s.id = $${params.length}`);
    }

    if (query) {
      params.push(`%${query.toLowerCase()}%`);
      const placeholder = `$${params.length}`;
      conditions.push(`(
        LOWER(s.title) LIKE ${placeholder}
        OR LOWER(s.artist) LIKE ${placeholder}
        OR LOWER(s.album) LIKE ${placeholder}
      )`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return {
      sql: `SELECT s.*, ${favoriteSelect} FROM songs s ${join} ${where} ORDER BY s.id ASC`,
      params
    };
  }

  router.get('/formats', (_req, res) => {
    res.json({ formats: SUPPORTED_FORMATS });
  });

  router.get(
    '/songs',
    optionalAuth,
    asyncHandler(async (req, res) => {
      const query = String(req.query.q ?? '').trim();
      if (query.length > 80) {
        throw httpError(400, 'La búsqueda admite como máximo 80 caracteres.');
      }

      const { sql, params } = buildSongQuery({
        userId: req.userId,
        query
      });
      const result = await db.query(sql, params);
      const songs = result.rows.map(serializeSong);

      res.json({ songs, total: songs.length, query });
    })
  );

  router.get(
    '/songs/:id',
    optionalAuth,
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (!id) throw httpError(400, 'Identificador de canción inválido.');

      const { sql, params } = buildSongQuery({ userId: req.userId, songId: id });
      const result = await db.query(sql, params);
      if (result.rowCount === 0) {
        throw httpError(404, 'La canción solicitada no existe.');
      }

      res.json({ song: serializeSong(result.rows[0]) });
    })
  );

  return router;
}
