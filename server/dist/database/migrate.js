"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
async function migrate() {
    logger_1.logger.info('Iniciando migración de base de datos...');
    try {
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        // Dividir el schema en declaraciones individuales
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        for (const statement of statements) {
            try {
                await database_1.pool.query(statement);
                logger_1.logger.debug('Declaración ejecutada exitosamente');
            }
            catch (error) {
                // Ignorar errores de funciones/triggers ya existentes
                const errorMessage = error.message;
                if (!errorMessage.includes('already exists') &&
                    !errorMessage.includes('trigger') &&
                    !errorMessage.includes('function')) {
                    logger_1.logger.warn('Error ejecutando declaración', { statement, error: errorMessage });
                }
            }
        }
        logger_1.logger.info('Migración completada exitosamente');
    }
    catch (error) {
        logger_1.logger.error('Error durante la migración', { error: error.message });
        throw error;
    }
    finally {
        await database_1.pool.end();
    }
}
migrate().catch((error) => {
    logger_1.logger.error('Migración fallida', { error: error.message });
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map