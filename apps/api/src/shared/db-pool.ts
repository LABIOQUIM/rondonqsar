import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (_pool) return _pool;

  const user = process.env.DB_USER;
  const pass = process.env.DB_PASS;
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const name = process.env.DB_DATABASE;

  const connectionString = `postgresql://${user}:${pass}@${host}:${port}/${name}`;

  _pool = new pg.Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX) || 5,
    connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECTION_TIMEOUT) || 5000,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
    ...(process.env.DB_STATEMENT_TIMEOUT
      ? { statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT) }
      : {}),
    ...(process.env.DB_KEEPALIVES_IDLE
      ? { keepalives_idle: Number(process.env.DB_KEEPALIVES_IDLE) }
      : {}),
  });

  return _pool;
}

export function createPrismaAdapter(): PrismaPg {
  return new PrismaPg(getPool(), { disposeExternalPool: false });
}
