import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler, httpError, publicUser } from '../lib/helpers.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user, config) {
  return jwt.sign(
    { sub: String(user.id), email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function createAuthRouter({ db, config }) {
  const router = express.Router();

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const name = String(req.body?.name ?? '').trim();
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      const password = String(req.body?.password ?? '');

      if (name.length < 2 || name.length > 60) {
        throw httpError(400, 'El nombre debe tener entre 2 y 60 caracteres.');
      }
      if (!EMAIL_RE.test(email)) {
        throw httpError(400, 'Ingresa un correo electrónico válido.');
      }
      if (password.length < 8) {
        throw httpError(400, 'La contraseña debe tener al menos 8 caracteres.');
      }

      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rowCount > 0) {
        throw httpError(409, 'Ya existe una cuenta con ese correo electrónico.');
      }

      const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
      const inserted = await db.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [name, email, passwordHash]
      );

      const user = publicUser(inserted.rows[0]);
      res.status(201).json({ token: signToken(inserted.rows[0], config), user });
    })
  );

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      const password = String(req.body?.password ?? '');

      if (!EMAIL_RE.test(email) || !password) {
        throw httpError(400, 'Correo y contraseña son obligatorios.');
      }

      const found = await db.query(
        'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
        [email]
      );

      if (found.rowCount === 0) {
        throw httpError(401, 'Correo o contraseña incorrectos.');
      }

      const row = found.rows[0];
      const matches = await bcrypt.compare(password, row.password_hash);
      if (!matches) {
        throw httpError(401, 'Correo o contraseña incorrectos.');
      }

      res.json({ token: signToken(row, config), user: publicUser(row) });
    })
  );

  return router;
}
