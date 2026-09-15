import './env.js'
import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { db } from './clickhouse.js'

// Local checkout puts migrations at ../../clickhouse/migrations; the
// Docker image copies them to /clickhouse/migrations. Resolve either,
// rather than silently applying zero migrations in one of the two.
const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ??
  (existsSync('/clickhouse/migrations')
    ? '/clickhouse/migrations'
    : join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'clickhouse', 'migrations'))

/**
 * Apply every .sql migration in filename order.
 *
 * Migrations are written with IF NOT EXISTS throughout, so this is
 * idempotent and safe to run on every deploy. That is deliberate: a
 * migration-tracking table would be one more thing to keep in sync for a
 * schema this small.
 */
export async function migrate() {
  const database = process.env.CLICKHOUSE_DB ?? 'home_service'
  await db.command({ query: `CREATE DATABASE IF NOT EXISTS ${database}` })

  const applied = []

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')

    // Split on semicolons: the ClickHouse HTTP interface takes one
    // statement per request.
    //
    // Line comments are stripped BEFORE splitting, because prose inside
    // a comment may itself contain a semicolon ("the account; client_id
    // is what to group by ..."). Splitting first would cut mid-comment
    // and hand ClickHouse a fragment starting with bare English.
    const statements = sql
      .split(/\r?\n/)
      .map((line) => (line.trim().startsWith('--') ? '' : line))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)

    for (const statement of statements) {
      await db.command({ query: statement })
    }
    console.log(`  applied ${file} (${statements.length} statements)`)
    applied.push({ file, statements: statements.length })
  }

  console.log(`\nmigrations complete -> ${database}`)
  // No db.close() here: the client is shared and the HTTP server calls
  // this per request -- closing it would break every later request.
  return applied
}

// Only self-run as a CLI. Imported by server.js for POST /migrate, where
// exiting the process or closing the shared client would kill the server.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrate()
    .then(() => db.close())
    .catch(async (err) => {
      console.error('migration failed:', err.message)
      await db.close().catch(() => {})
      process.exit(1)
    })
}
