import { Request, Response, NextFunction } from 'express';
import { scrapeFootyStats, savePredictionsToDatabase } from '../scrapers/footystats';
import { scrapeSofascore, verifyMatchResults } from '../scrapers/sofascore';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export const scraperController = {
  // Trigger manual de scraping de FootyStats
  async triggerFootyStats(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Iniciando scraping manual de FootyStats');
      
      // Registrar inicio de job
      const jobResult = await pool.query(
        `INSERT INTO scraping_jobs (source, status) VALUES ('FootyStats', 'RUNNING') RETURNING id`
      );
      const jobId = jobResult.rows[0].id;
      
      // Ejecutar scraping
      const scrapingResult = await scrapeFootyStats();
      
      // Guardar predicciones si el scraping fue exitoso
      if (scrapingResult.success && scrapingResult.predictions.length > 0) {
        const saveResult = await savePredictionsToDatabase(scrapingResult.predictions);
        scrapingResult.matchesFound = saveResult.saved;
      }
      
      // Actualizar estado del job
      await pool.query(
        `UPDATE scraping_jobs 
         SET status = $1, matches_found = $2, predictions_found = $3, 
             error_message = $4, completed_at = NOW()
         WHERE id = $5`,
        [
          scrapingResult.success ? 'COMPLETED' : 'FAILED',
          scrapingResult.matchesFound,
          scrapingResult.predictions.length,
          scrapingResult.error || null,
          jobId
        ]
      );
      
      res.json({
        success: scrapingResult.success,
        matchesFound: scrapingResult.matchesFound,
        predictionsCount: scrapingResult.predictions.length,
        error: scrapingResult.error,
        jobId
      });
      
    } catch (error) {
      logger.error('Error en triggerFootyStats', { error: (error as Error).message });
      next(error);
    }
  },
  
  // Trigger manual de scraping de Sofascore
  async triggerSofascore(req: Request, res: Response, next: NextFunction) {
    try {
      const { league } = req.body;
      logger.info(`Iniciando scraping manual de Sofascore${league ? ` - ${league}` : ''}`);
      
      const result = await scrapeSofascore(league);
      
      res.json({
        success: result.success,
        resultsCount: result.results.length,
        error: result.error,
        results: result.results
      });
      
    } catch (error) {
      logger.error('Error en triggerSofascore', { error: (error as Error).message });
      next(error);
    }
  },
  
  // Verificar resultados de partidos
  async verifyResults(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Iniciando verificación de resultados');
      
      const verificationResult = await verifyMatchResults();
      
      res.json({
        success: true,
        verified: verificationResult.verified,
        pending: verificationResult.pending
      });
      
    } catch (error) {
      logger.error('Error en verifyResults', { error: (error as Error).message });
      next(error);
    }
  },
  
  // Obtener estado del scraper
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const lastJob = await pool.query(
        `SELECT * FROM scraping_jobs 
         WHERE source = 'FootyStats' 
         ORDER BY started_at DESC LIMIT 1`
      );
      
      const pendingBets = await pool.query(
        `SELECT COUNT(*) as count FROM bets WHERE status = 'PENDING'`
      );
      
      res.json({
        scraperStatus: lastJob.rows[0]?.status || 'UNKNOWN',
        lastRun: lastJob.rows[0]?.started_at || null,
        lastSuccess: lastJob.rows[0]?.status === 'COMPLETED',
        pendingBets: parseInt(pendingBets.rows[0]?.count || '0'),
        browserReady: true // El navegador se inicializa bajo demanda
      });
      
    } catch (error) {
      logger.error('Error en getStatus', { error: (error as Error).message });
      next(error);
    }
  }
};
