import { createMemoryDb } from '../../src/db/memory.js';
import { initSchema } from '../../src/db/schema.js';
import { seedSongs } from '../../src/seed.js';
import { createApp } from '../../src/app.js';

let emailCounter = 0;

export async function createTestContext() {
  const db = createMemoryDb();
  await initSchema(db);
  await seedSongs(db);

  const config = {
    nodeEnv: 'test',
    jwtSecret: 'tarara-music-test-secret',
    jwtExpiresIn: '1h',
    bcryptRounds: 4,
    clientOrigin: 'http://localhost:5173',
    port: 0
  };

  return { db, config, app: createApp({ db, config }) };
}

export function uniqueEmail(prefix = 'alumno') {
  emailCounter += 1;
  return `${prefix}-${Date.now()}-${emailCounter}@tarara.test`;
}

export function userPayload(overrides = {}) {
  return {
    name: 'Ana Torres',
    email: uniqueEmail(),
    password: 'Segura123',
    ...overrides
  };
}
