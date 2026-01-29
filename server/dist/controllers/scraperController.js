"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scraperController = void 0;
const footystats_1 = require("../scrapers/footystats");
const sofascore_1 = require("../scrapers/sofascore");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
exports.scraperController = {
    // Trigger manual de scraping de FootyStats
    async triggerFootyStats(req, res, next) {
        try {
            logger_1.logger.info('Iniciando scraping manual de FootyStats');
            // Registrar inicio de job
            const jobResult = await database_1.pool.query(`INSERT INTO scraping_jobs (source, status) VALUES ('FootyStats', 'RUNNING') RETURNING id`);
            const jobId = jobResult.rows[0].id;
            // Ejecutar scraping
            const scrapingResult = await (0, footystats_1.scrapeFootyStats)();
            // Guardar predicciones si el scraping fue exitoso
            if (scrapingResult.success && scrapingResult.predictions.length > 0) {
                const saveResult = await (0, footystats_1.savePredictionsToDatabase)(scrapingResult.predictions);
                scrapingResult.matchesFound = saveResult.saved;
            }
            // Actualizar estado del job
            await database_1.pool.query(`UPDATE scraping_jobs 
         SET status = $1, matches_found = $2, predictions_found = $3, 
             error_message = $4, completed_at = NOW()
         WHERE id = $5`, [
                scrapingResult.success ? 'COMPLETED' : 'FAILED',
                scrapingResult.matchesFound,
                scrapingResult.predictions.length,
                scrapingResult.error || null,
                jobId
            ]);
            res.json({
                success: scrapingResult.success,
                matchesFound: scrapingResult.matchesFound,
                predictionsCount: scrapingResult.predictions.length,
                error: scrapingResult.error,
                jobId
            });
        }
        catch (error) {
            logger_1.logger.error('Error en triggerFootyStats', { error: error.message });
            next(error);
        }
    },
    // Trigger manual de scraping de Sofascore
    async triggerSofascore(req, res, next) {
        try {
            const { league } = req.body;
            logger_1.logger.info(`Iniciando scraping manual de Sofascore${league ? ` - ${league}` : ''}`);
            const result = await (0, sofascore_1.scrapeSofascore)(league);
            res.json({
                success: result.success,
                resultsCount: result.results.length,
                error: result.error,
                results: result.results
            });
        }
        catch (error) {
            logger_1.logger.error('Error en triggerSofascore', { error: error.message });
            next(error);
        }
    },
    // Verificar resultados de partidos
    async verifyResults(req, res, next) {
        try {
            logger_1.logger.info('Iniciando verificación de resultados');
            const verificationResult = await (0, sofascore_1.verifyMatchResults)();
            res.json({
                success: true,
                verified: verificationResult.verified,
                pending: verificationResult.pending
            });
        }
        catch (error) {
            logger_1.logger.error('Error en verifyResults', { error: error.message });
            next(error);
        }
    },
    // Obtener estado del scraper
    async getStatus(req, res, next) {
        try {
            const lastJob = await database_1.pool.query(`SELECT * FROM scraping_jobs 
         WHERE source = 'FootyStats' 
         ORDER BY started_at DESC LIMIT 1`);
            const pendingBets = await database_1.pool.query(`SELECT COUNT(*) as count FROM bets WHERE status = 'PENDING'`);
            res.json({
                scraperStatus: lastJob.rows[0]?.status || 'UNKNOWN',
                lastRun: lastJob.rows[0]?.started_at || null,
                lastSuccess: lastJob.rows[0]?.status === 'COMPLETED',
                pendingBets: parseInt(pendingBets.rows[0]?.count || '0'),
                browserReady: true // El navegador se inicializa bajo demanda
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getStatus', { error: error.message });
            next(error);
        }
    }
};
//# sourceMappingURL=scraperController.js.map