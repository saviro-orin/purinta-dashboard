import type { Database } from 'bun:sqlite';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const bundledMigrationsDir = new URL('./migrations', import.meta.url).pathname;
const sourceMigrationsDir = './server/migrations';

export function runMigrations(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = new Set(
    db
      .query<{ version: string }, []>('SELECT version FROM schema_migrations')
      .all()
      .map((row) => row.version)
  );

  const migrationsDir = existsSync(sourceMigrationsDir) ? sourceMigrationsDir : bundledMigrationsDir;

  for (const file of readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    const tx = db.transaction(() => {
      db.exec(sql);
      db.query('INSERT INTO schema_migrations (version) VALUES (?)').run(file);
    });

    tx();
  }
}
