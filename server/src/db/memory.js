import { newDb } from 'pg-mem';

/**
 * Base de datos PostgreSQL en memoria (compatible con el mismo SQL del
 * proyecto). Se usa para la demo sin servidor PostgreSQL y para las pruebas
 * de aceptación automatizadas.
 */
export function createMemoryDb() {
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = mem.adapters.createPg();
  const pool = new adapter.Pool();

  return {
    driver: 'memory',
    query: (text, params) => pool.query(text, params),
    close: () => pool.end()
  };
}
