import { createMemoryDb } from './memory.js';
import { createPostgresDb } from './postgres.js';

export async function createDb(config) {
  if (config.dbDriver === 'postgres') {
    if (!config.databaseUrl) {
      throw new Error(
        'DATABASE_URL no está definida. Configúrala o usa DB_DRIVER=memory para la demo.'
      );
    }
    return createPostgresDb(config.databaseUrl);
  }

  return createMemoryDb();
}
