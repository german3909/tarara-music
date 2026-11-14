import pg from 'pg';

export function createPostgresDb(connectionString) {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000
  });

  return {
    driver: 'postgres',
    query: (text, params) => pool.query(text, params),
    close: () => pool.end()
  };
}
