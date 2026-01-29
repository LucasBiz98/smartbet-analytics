"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
exports.query = query;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
const poolConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/smartbet',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
exports.pool = new pg_1.Pool(poolConfig);
exports.pool.on('connect', () => {
    logger_1.logger.debug('Nueva conexión establecida con la base de datos');
});
exports.pool.on('error', (err) => {
    logger_1.logger.error('Error inesperado en la base de datos', { error: err.message });
});
async function testConnection() {
    try {
        const client = await exports.pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        logger_1.logger.info('Conexión a base de datos exitosa', { time: result.rows[0].now });
        return true;
    }
    catch (error) {
        logger_1.logger.error('Error conectando a la base de datos', { error: error.message });
        return false;
    }
}
async function query(text, params) {
    const start = Date.now();
    const result = await exports.pool.query(text, params);
    const duration = Date.now() - start;
    logger_1.logger.debug('Ejecutada consulta', { text, duration, rows: result.rowCount });
    return result;
}
//# sourceMappingURL=database.js.map