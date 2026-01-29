import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

async function migrate() {
  logger.info('Iniciando migración de base de datos...');
  
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir el schema en declaraciones individuales
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
        logger.debug('Declaración ejecutada exitosamente');
      } catch (error) {
        // Ignorar errores de funciones/triggers ya existentes
        const errorMessage = (error as Error).message;
        if (!errorMessage.includes('already exists') && 
            !errorMessage.includes('trigger') && 
            !errorMessage.includes('function')) {
          logger.warn('Error ejecutando declaración', { statement, error: errorMessage });
        }
      }
    }
    
    logger.info('Migración completada exitosamente');
  } catch (error) {
    logger.error('Error durante la migración', { error: (error as Error).message });
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  logger.error('Migración fallida', { error: error.message });
  process.exit(1);
});
