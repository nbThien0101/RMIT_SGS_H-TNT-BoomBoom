import { Pool } from 'pg';

let _pool: Pool | null = null;

// Lazy: never connect at module load (Next evaluates modules during `next build`).
export function db(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ?? 'postgres://quynhom:quynhom-dev@localhost:5433/quynhom',
    });
  }
  return _pool;
}
