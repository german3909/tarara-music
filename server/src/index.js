import { config } from './config.js';
import { createApp } from './app.js';
import { createDb } from './db/index.js';
import { initSchema } from './db/schema.js';
import { seedSongs } from './seed.js';

async function main() {
  const db = await createDb(config);
  await initSchema(db);
  const seeded = await seedSongs(db);

  const app = createApp({ db, config });
  const server = app.listen(config.port, () => {
    console.log(`\n🎵 Tarara Music API en http://localhost:${config.port}`);
    console.log(`   Base de datos: ${db.driver === 'postgres' ? 'PostgreSQL' : 'memoria (demo)'}`);
    console.log(`   Catálogo: ${seeded.total} canciones\n`);
    if (db.driver === 'memory') {
      console.log(
        '   Aviso: usando base de datos en memoria. Los datos se reinician al apagar.\n' +
          '   Define DATABASE_URL para usar PostgreSQL.\n'
      );
    }
  });

  async function shutdown(signal) {
    console.log(`\n${signal} recibido. Cerrando Tarara Music...`);
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('No se pudo iniciar Tarara Music:', error);
  process.exit(1);
});
