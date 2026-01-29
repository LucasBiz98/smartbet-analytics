import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';

import { pool, testConnection } from './config/database';
import { logger } from './utils/logger';
import { closeBrowser } from './scrapers/core/browser';

// Importar rutas
import scraperRoutes from './routes/scrapers';
import predictionsRoutes from './routes/predictions';
import betsRoutes from './routes/bets';
import statsRoutes from './routes/stats';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del cliente en producción
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Rutas API
app.use('/api/scrapers', scraperRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/stats', statsRoutes);

// Endpoint de salud
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error no manejado', { 
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
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Configurar jobs cron para tareas programadas
function setupCronJobs() {
  // Scraping automático cada día a las 6 AM
  cron.schedule('0 6 * * *', async () => {
    logger.info('Ejecutando scraping programado de FootyStats');
    try {
      const { scrapeFootyStats, savePredictionsToDatabase } = await import('./scrapers/footystats');
      const result = await scrapeFootyStats();
      if (result.success) {
        await savePredictionsToDatabase(result.predictions);
        logger.info(`Scraping programado completado: ${result.predictions.length} predicciones`);
      }
    } catch (error) {
      logger.error('Error en scraping programado', { error: (error as Error).message });
    }
  });
  
  // Verificación de resultados cada hora
  cron.schedule('0 * * * *', async () => {
    logger.info('Ejecutando verificación programada de resultados');
    try {
      const { verifyMatchResults } = await import('./scrapers/sofascore');
      const result = await verifyMatchResults();
      logger.info(`Verificación programada: ${result.verified} verificados, ${result.pending} pendientes`);
    } catch (error) {
      logger.error('Error en verificación programada', { error: (error as Error).message });
    }
  });
  
  logger.info('Jobs cron configurados correctamente');
}

// Iniciar servidor
async function startServer() {
  try {
    // Probar conexión a base de datos
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    // Configurar jobs cron
    setupCronJobs();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor SmartBet Analytics corriendo en puerto ${PORT}`);
      logger.info(`📊 API disponible en http://localhost:${PORT}/api`);
      logger.info(`🌐 Frontend disponible en http://localhost:${PORT}`);
    });
    
  } catch (error) {
    logger.error('Error iniciando servidor', { error: (error as Error).message });
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  logger.info('Recibida señal SIGTERM, cerrando servidor...');
  await closeBrowser();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Recibida señal SIGINT, cerrando servidor...');
  await closeBrowser();
  await pool.end();
  process.exit(0);
});

// Iniciar
startServer();

export default app;
