"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const browser_1 = require("./scrapers/core/browser");
// Importar rutas
const scrapers_1 = __importDefault(require("./routes/scrapers"));
const predictions_1 = __importDefault(require("./routes/predictions"));
const bets_1 = __importDefault(require("./routes/bets"));
const stats_1 = __importDefault(require("./routes/stats"));
// Cargar variables de entorno
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Servir archivos estáticos del cliente en producción
app.use(express_1.default.static(path_1.default.join(__dirname, '../../client/dist')));
// Rutas API
app.use('/api/scrapers', scrapers_1.default);
app.use('/api/predictions', predictions_1.default);
app.use('/api/bets', bets_1.default);
app.use('/api/stats', stats_1.default);
// Endpoint de salud
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Manejo de errores
app.use((err, req, res, next) => {
    logger_1.logger.error('Error no manejado', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Ruta 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});
// Configurar jobs cron para tareas programadas
function setupCronJobs() {
    // Scraping automático cada día a las 6 AM
    node_cron_1.default.schedule('0 6 * * *', async () => {
        logger_1.logger.info('Ejecutando scraping programado de FootyStats');
        try {
            const { scrapeFootyStats, savePredictionsToDatabase } = await Promise.resolve().then(() => __importStar(require('./scrapers/footystats')));
            const result = await scrapeFootyStats();
            if (result.success) {
                await savePredictionsToDatabase(result.predictions);
                logger_1.logger.info(`Scraping programado completado: ${result.predictions.length} predicciones`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error en scraping programado', { error: error.message });
        }
    });
    // Verificación de resultados cada hora
    node_cron_1.default.schedule('0 * * * *', async () => {
        logger_1.logger.info('Ejecutando verificación programada de resultados');
        try {
            const { verifyMatchResults } = await Promise.resolve().then(() => __importStar(require('./scrapers/sofascore')));
            const result = await verifyMatchResults();
            logger_1.logger.info(`Verificación programada: ${result.verified} verificados, ${result.pending} pendientes`);
        }
        catch (error) {
            logger_1.logger.error('Error en verificación programada', { error: error.message });
        }
    });
    logger_1.logger.info('Jobs cron configurados correctamente');
}
// Iniciar servidor
async function startServer() {
    try {
        // Probar conexión a base de datos
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            throw new Error('No se pudo conectar a la base de datos');
        }
        // Configurar jobs cron
        setupCronJobs();
        // Iniciar servidor
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Servidor SmartBet Analytics corriendo en puerto ${PORT}`);
            logger_1.logger.info(`📊 API disponible en http://localhost:${PORT}/api`);
            logger_1.logger.info(`🌐 Frontend disponible en http://localhost:${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Error iniciando servidor', { error: error.message });
        process.exit(1);
    }
}
// Manejo de cierre graceful
process.on('SIGTERM', async () => {
    logger_1.logger.info('Recibida señal SIGTERM, cerrando servidor...');
    await (0, browser_1.closeBrowser)();
    await database_1.pool.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('Recibida señal SIGINT, cerrando servidor...');
    await (0, browser_1.closeBrowser)();
    await database_1.pool.end();
    process.exit(0);
});
// Iniciar
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map