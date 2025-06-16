import { Umzug, JSONStorage } from 'umzug';
import { createPool } from 'mysql2/promise';
import * as fs from 'fs/promises';
import path from 'path';

async function run() {
  const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  const umzug = new Umzug({
    migrations: {
      glob: path.join(__dirname, '../scripts/migrations/*.sql'),
      resolve: ({ name, path: filepath }) => ({
        name,
        up: async () => {
          const sql = await fs.readFile(filepath!, 'utf8');
          await pool.query(sql);
        },
      }),
    },
    context: pool,
    storage: new JSONStorage({ path: path.join(__dirname, '../scripts/migrations.json') }),
    logger: console,
  });

  await umzug.up();
  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
