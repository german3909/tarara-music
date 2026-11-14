import jwt from 'jsonwebtoken';

export function createAuth(jwtSecret) {
  function readToken(req) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    return header.slice(7).trim() || null;
  }

  function verify(token) {
    const payload = jwt.verify(token, jwtSecret);
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Token inválido');
    }
    return userId;
  }

  function required(req, res, next) {
    const token = readToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Debes iniciar sesión para continuar.' });
    }

    try {
      req.userId = verify(token);
      return next();
    } catch {
      return res.status(401).json({ error: 'Sesión inválida o expirada.' });
    }
  }

  function optional(req, _res, next) {
    const token = readToken(req);
    if (!token) return next();

    try {
      req.userId = verify(token);
    } catch {
      req.userId = null;
    }
    return next();
  }

  return { required, optional };
}
