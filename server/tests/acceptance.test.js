import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createTestContext, uniqueEmail, userPayload } from './helpers/testContext.js';

let ctx;

beforeAll(async () => {
  ctx = await createTestContext();
});

afterAll(async () => {
  await ctx.db.close();
});

async function register(overrides = {}) {
  const payload = userPayload(overrides);
  const response = await request(ctx.app).post('/api/auth/register').send(payload);
  expect(response.status).toBe(201);
  return { payload, token: response.body.token, user: response.body.user, response };
}

describe('PA-01 · Biblioteca musical', () => {
  it('carga al menos 10 canciones en menos de 3 segundos y expone los 4 formatos', async () => {
    const startedAt = Date.now();
    const response = await request(ctx.app).get('/api/songs');
    const elapsed = Date.now() - startedAt;

    expect(response.status).toBe(200);
    expect(response.body.songs.length).toBeGreaterThanOrEqual(10);
    expect(elapsed).toBeLessThan(3000);

    const formats = [...new Set(response.body.songs.map((song) => song.format))];
    expect(formats).toEqual(expect.arrayContaining(['mp3', 'wav', 'flac', 'aac']));

    for (const song of response.body.songs) {
      expect(song).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          artist: expect.any(String),
          album: expect.any(String),
          duration: expect.any(Number),
          format: expect.any(String),
          url: expect.any(String)
        })
      );
      expect(song.duration).toBeGreaterThan(0);
      expect(song.url).toMatch(/^\/media\/.+\.(mp3|wav|flac|m4a)$/);
    }

    const formatsResponse = await request(ctx.app).get('/api/formats');
    expect(formatsResponse.status).toBe(200);
    expect(formatsResponse.body.formats).toEqual(
      expect.arrayContaining(['mp3', 'wav', 'flac', 'aac'])
    );
  });

  it('permite consultar una canción concreta del catálogo', async () => {
    const response = await request(ctx.app).get('/api/songs/1');
    expect(response.status).toBe(200);
    expect(response.body.song.id).toBe(1);
    expect(response.body.song.title).toBe('Neón de Medianoche');
  });
});

describe('PA-02 · Buscador de canciones, artistas y álbumes', () => {
  it('encuentra por título sin distinguir mayúsculas', async () => {
    const response = await request(ctx.app).get('/api/songs').query({ q: 'NEÓN' });
    expect(response.status).toBe(200);
    expect(response.body.songs).toHaveLength(1);
    expect(response.body.songs[0].title).toBe('Neón de Medianoche');
  });

  it('encuentra por artista y por álbum', async () => {
    const byArtist = await request(ctx.app).get('/api/songs').query({ q: 'luna nova' });
    expect(byArtist.body.songs).toHaveLength(2);
    expect(byArtist.body.songs.every((song) => song.artist === 'Luna Nova')).toBe(true);

    const byAlbum = await request(ctx.app).get('/api/songs').query({ q: 'ciudad eléctrica' });
    expect(byAlbum.body.songs).toHaveLength(2);
    expect(byAlbum.body.songs.every((song) => song.album === 'Ciudad Eléctrica')).toBe(true);
  });

  it('devuelve una lista vacía cuando no hay coincidencias', async () => {
    const response = await request(ctx.app).get('/api/songs').query({ q: 'zzzz-no-existe' });
    expect(response.status).toBe(200);
    expect(response.body.songs).toEqual([]);
  });

  it('rechaza búsquedas excesivamente largas', async () => {
    const response = await request(ctx.app).get('/api/songs').query({ q: 'a'.repeat(81) });
    expect(response.status).toBe(400);
  });
});

describe('PA-03 · Reproductor de música (fuentes de audio locales)', () => {
  it('sirve los 10 archivos de audio con tipos MIME reproducibles', async () => {
    const { body } = await request(ctx.app).get('/api/songs');

    for (const song of body.songs) {
      const media = await request(ctx.app).get(song.url);
      expect(media.status).toBe(200);
      expect(media.headers['content-type']).toMatch(/^audio\//);
      expect(Number(media.headers['content-length'])).toBeGreaterThan(1000);
    }
  });

  it('incluye un catálogo con al menos un archivo de cada formato admitido', async () => {
    const { body } = await request(ctx.app).get('/api/songs');
    for (const format of ['mp3', 'wav', 'flac', 'aac']) {
      expect(body.songs.some((song) => song.format === format)).toBe(true);
    }
  });
});

describe('PA-05 · Registro de usuarios', () => {
  it('crea la cuenta, devuelve un token y nunca expone la contraseña', async () => {
    const payload = userPayload({ name: 'Carla Ruiz' });
    const response = await request(ctx.app).post('/api/auth/register').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toEqual({
      id: expect.any(Number),
      name: 'Carla Ruiz',
      email: payload.email,
      createdAt: expect.anything()
    });
    expect(JSON.stringify(response.body)).not.toContain(payload.password);
    expect(response.body.user.password_hash).toBeUndefined();

    const stored = await ctx.db.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [payload.email]
    );
    expect(stored.rows[0].password_hash).toMatch(/^\$2[aby]\$/);
    expect(stored.rows[0].password_hash).not.toBe(payload.password);
    expect(await bcrypt.compare(payload.password, stored.rows[0].password_hash)).toBe(true);
  });

  it('rechaza correos duplicados, correos inválidos y contraseñas cortas', async () => {
    const { payload } = await register();
    const duplicate = await request(ctx.app).post('/api/auth/register').send(payload);
    expect(duplicate.status).toBe(409);

    const invalidEmail = await request(ctx.app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'no-es-correo', password: 'Segura123' });
    expect(invalidEmail.status).toBe(400);

    const shortPassword = await request(ctx.app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: uniqueEmail(), password: '123' });
    expect(shortPassword.status).toBe(400);
  });
});

describe('PA-06 · Inicio de sesión', () => {
  it('permite entrar con las credenciales correctas', async () => {
    const { payload } = await register();
    const login = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: payload.email.toUpperCase(), password: payload.password });

    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
    expect(login.body.user.email).toBe(payload.email);
    expect(JSON.stringify(login.body)).not.toContain(payload.password);
  });

  it('rechaza contraseña incorrecta y cuentas inexistentes', async () => {
    const { payload } = await register();

    const wrongPassword = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'Incorrecta123' });
    expect(wrongPassword.status).toBe(401);

    const missing = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail('fantasma'), password: 'Segura123' });
    expect(missing.status).toBe(401);
  });
});

describe('PA-07 · Favoritos', () => {
  it('guarda, lista y elimina canciones favoritas por usuario', async () => {
    const userA = await register();
    const userB = await register();

    const empty = await request(ctx.app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(empty.status).toBe(200);
    expect(empty.body.songs).toEqual([]);

    const added = await request(ctx.app)
      .put('/api/favorites/1')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(added.status).toBe(200);
    expect(added.body.favorite).toBe(true);

    const addedAgain = await request(ctx.app)
      .put('/api/favorites/1')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(addedAgain.status).toBe(200);

    const favorites = await request(ctx.app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(favorites.body.songs).toHaveLength(1);
    expect(favorites.body.songs[0].id).toBe(1);

    const libraryA = await request(ctx.app)
      .get('/api/songs')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(libraryA.body.songs.find((song) => song.id === 1).isFavorite).toBe(true);

    const libraryB = await request(ctx.app)
      .get('/api/songs')
      .set('Authorization', `Bearer ${userB.token}`);
    expect(libraryB.body.songs.find((song) => song.id === 1).isFavorite).toBe(false);

    const removed = await request(ctx.app)
      .delete('/api/favorites/1')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(removed.status).toBe(200);

    const after = await request(ctx.app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(after.body.songs).toEqual([]);
  });

  it('exige sesión y valida que la canción exista', async () => {
    const anonymous = await request(ctx.app).put('/api/favorites/1');
    expect(anonymous.status).toBe(401);

    const user = await register();
    const missingSong = await request(ctx.app)
      .put('/api/favorites/99999')
      .set('Authorization', `Bearer ${user.token}`);
    expect(missingSong.status).toBe(404);
  });
});

describe('PA-08 · Listas de reproducción', () => {
  it('crea, renombra, llena, consulta y elimina una lista', async () => {
    const { token } = await register();

    const created = await request(ctx.app)
      .post('/api/playlists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Viaje' });
    expect(created.status).toBe(201);
    const playlistId = created.body.playlist.id;
    expect(created.body.playlist.name).toBe('Viaje');

    const listed = await request(ctx.app)
      .get('/api/playlists')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.body.playlists).toHaveLength(1);
    expect(listed.body.playlists[0].songCount).toBe(0);

    for (const songId of [1, 3]) {
      const added = await request(ctx.app)
        .post(`/api/playlists/${playlistId}/songs`)
        .set('Authorization', `Bearer ${token}`)
        .send({ songId });
      expect(added.status).toBe(201);
    }

    const duplicate = await request(ctx.app)
      .post(`/api/playlists/${playlistId}/songs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ songId: 1 });
    expect(duplicate.status).toBe(409);

    const detail = await request(ctx.app)
      .get(`/api/playlists/${playlistId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.playlist.songs).toHaveLength(2);
    expect(detail.body.playlist.songs.map((song) => song.id)).toEqual([1, 3]);
    expect(detail.body.playlist.songCount).toBe(2);

    const removed = await request(ctx.app)
      .delete(`/api/playlists/${playlistId}/songs/1`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);

    const renamed = await request(ctx.app)
      .patch(`/api/playlists/${playlistId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Viaje largo' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.playlist.name).toBe('Viaje largo');

    const afterRemove = await request(ctx.app)
      .get(`/api/playlists/${playlistId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(afterRemove.body.playlist.songs.map((song) => song.id)).toEqual([3]);

    const deleted = await request(ctx.app)
      .delete(`/api/playlists/${playlistId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(200);

    const empty = await request(ctx.app)
      .get('/api/playlists')
      .set('Authorization', `Bearer ${token}`);
    expect(empty.body.playlists).toEqual([]);
  });

  it('aísla las listas de cada usuario y valida nombres', async () => {
    const owner = await register();
    const stranger = await register();

    const created = await request(ctx.app)
      .post('/api/playlists')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Privada' });

    const forbidden = await request(ctx.app)
      .get(`/api/playlists/${created.body.playlist.id}`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(forbidden.status).toBe(404);

    const emptyName = await request(ctx.app)
      .post('/api/playlists')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: '   ' });
    expect(emptyName.status).toBe(400);
  });
});

describe('PA-09 · Perfil de usuario', () => {
  it('consulta y actualiza la información personal', async () => {
    const { token, payload } = await register();

    const me = await request(ctx.app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.name).toBe(payload.name);

    const newEmail = uniqueEmail('perfil');
    const updated = await request(ctx.app)
      .patch('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana Actualizada', email: newEmail });
    expect(updated.status).toBe(200);
    expect(updated.body.user.name).toBe('Ana Actualizada');
    expect(updated.body.user.email).toBe(newEmail);
  });

  it('permite cambiar la contraseña verificando la contraseña actual', async () => {
    const { token, payload } = await register();

    const wrongCurrent = await request(ctx.app)
      .patch('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'NoEsLaCorrecta', password: 'NuevaClave123' });
    expect(wrongCurrent.status).toBe(400);

    const changed = await request(ctx.app)
      .patch('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: payload.password, password: 'NuevaClave123' });
    expect(changed.status).toBe(200);

    const oldLogin = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'NuevaClave123' });
    expect(newLogin.status).toBe(200);
  });
});

describe('PA-10 · Seguridad de sesiones y datos', () => {
  it('protege los recursos privados sin token o con token inválido', async () => {
    const noToken = await request(ctx.app).get('/api/me');
    expect(noToken.status).toBe(401);

    const badToken = await request(ctx.app)
      .get('/api/me')
      .set('Authorization', 'Bearer token.invalido.aqui');
    expect(badToken.status).toBe(401);

    const playlists = await request(ctx.app).get('/api/playlists');
    expect(playlists.status).toBe(401);
  });

  it('permite explorar la biblioteca como invitado', async () => {
    const response = await request(ctx.app).get('/api/songs');
    expect(response.status).toBe(200);
    expect(response.body.songs.length).toBeGreaterThanOrEqual(10);
  });
});

describe('PA-12 · Rendimiento del catálogo', () => {
  it('mantiene el catálogo disponible para reproducción inmediata', async () => {
    const startedAt = performance.now();
    const response = await request(ctx.app).get('/api/songs').query({ q: 'luna' });
    const elapsed = performance.now() - startedAt;

    expect(response.status).toBe(200);
    expect(response.body.songs).toHaveLength(2);
    expect(elapsed).toBeLessThan(2000);
  });
});
