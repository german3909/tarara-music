import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'tarara-music-dev-secret-cambiar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || '',
  dbDriver: process.env.DB_DRIVER || (process.env.DATABASE_URL ? 'postgres' : 'memory'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  isTest: nodeEnv === 'test'
};
