import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/smartbet',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.debug('Nueva conexión establecida con la base de datos');
});

pool.on('error', (err) => {
  logger.error('Error inesperado en la base de datos', { error: err.message });
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Conexión a base de datos exitosa', { time: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Error conectando a la base de datos', { error: (error as Error).message });
    return false;
  }
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('Ejecutada consulta', { text, duration, rows: result.rowCount });
  return result;
}
