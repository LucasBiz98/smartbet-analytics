"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeSofascore = scrapeSofascore;
exports.verifyMatchResults = verifyMatchResults;
exports.extractResultsFromPage = extractResultsFromPage;
exports.waitForPageLoad = waitForPageLoad;
const browser_1 = require("../core/browser");
const logger_1 = require("../../utils/logger");
const database_1 = require("../../config/database");
async function waitForPageLoad(page) {
    try {
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        return true;
    }
    catch (error) {
        logger_1.logger.warn('Timeout esperando carga de página', { error: error.message });
        return true; // Continuar de todas formas
    }
}
async function extractResultsFromPage(page) {
    const results = [];
    try {
        // Buscar contenedores de partidos
        const matchContainers = await page.$$('[class*="match"], [class*="event"], [class*="game"], .Event, .match-row, [data-testid*="match"]');
        logger_1.logger.info(`Encontrados ${matchContainers.length} contenedores de partidos`);
        for (const container of matchContainers) {
            try {
                const result = await extractMatchResult(container, page);
                if (result) {
                    results.push(result);
                }
            }
            catch (error) {
                logger_1.logger.debug('Error extrayendo contenedor de partido', { error: error.message });
            }
        }
        // Si no se encuentran partidos con los selectors principales, intentar extraer de另一种方式
        if (results.length === 0) {
            const alternativeResults = await extractResultsAlternative(page);
            results.push(...alternativeResults);
        }
    }
    catch (error) {
        logger_1.logger.error('Error extrayendo resultados', { error: error.message });
    }
    return results;
}
async function extractMatchResult(container, page) {
    try {
        // Extraer equipos
        const homeTeamElement = await container.$('[class*="home"], [class*="team-home"], [class*="homeTeam"]');
        const awayTeamElement = await container.$('[class*="away"], [class*="team-away"], [class*="awayTeam"]');
        const homeTeam = homeTeamElement ? await homeTeamElement.textContent() : '';
        const awayTeam = awayTeamElement ? await awayTeamElement.textContent() : '';
        if (!homeTeam || !awayTeam) {
            return null;
        }
        // Extraer marcador
        const homeScoreElement = await container.$('[class*="score-home"], [class*="home-score"], .homeScore');
        const awayScoreElement = await container.$('[class*="score-away"], [class*="away-score"], .awayScore');
        const homeScoreText = homeScoreElement ? await homeScoreElement.textContent() : '0';
        const awayScoreText = awayScoreElement ? await awayScoreElement.textContent() : '0';
        const homeScore = parseInt(homeScoreText?.trim() || '0');
        const awayScore = parseInt(awayScoreText?.trim() || '0');
        // Extraer estado del partido
        const statusElement = await container.$('[class*="status"], [class*="time"], [class*="state"]');
        const statusText = statusElement ? await statusElement.textContent() : '';
        const finished = statusText?.toLowerCase().includes('ft') ||
            statusText?.toLowerCase().includes('finished') ||
            statusText?.toLowerCase().includes('final');
        const status = finished ? 'FINISHED' : statusText || 'SCHEDULED';
        // Generar external ID
        const externalId = generateResultId(homeTeam, awayTeam);
        return {
            externalId,
            homeTeam: homeTeam.trim(),
            awayTeam: awayTeam.trim(),
            homeScore,
            awayScore,
            status,
            finished
        };
    }
    catch (error) {
        logger_1.logger.debug('Error procesando contenedor', { error: error.message });
        return null;
    }
}
async function extractResultsAlternative(page) {
    const results = [];
    try {
        // Extraer usando evaluación de página
        const pageData = await page.evaluate(() => {
            const matches = [];
            // Buscar todos los elementos con patrones de puntuación
            const scoreElements = document.querySelectorAll('[class*="score"], [class*="result"]');
            scoreElements.forEach((el) => {
                const text = el.textContent || '';
                const scoreMatch = text.match(/(\d+)\s*-\s*(\d+)/);
                if (scoreMatch) {
                    // Buscar equipos cercanos
                    const parent = el.parentElement;
                    const siblings = parent?.querySelectorAll('[class*="team"]') || [];
                    let homeTeam = '';
                    let awayTeam = '';
                    siblings.forEach((sibling, index) => {
                        if (index === 0)
                            homeTeam = sibling.textContent || '';
                        if (index === 1)
                            awayTeam = sibling.textContent || '';
                    });
                    if (homeTeam && awayTeam) {
                        matches.push({
                            homeTeam: homeTeam.trim(),
                            awayTeam: awayTeam.trim(),
                            homeScore: parseInt(scoreMatch[1]),
                            awayScore: parseInt(scoreMatch[2]),
                            status: 'FINISHED',
                            finished: true
                        });
                    }
                }
            });
            return matches;
        });
        results.push(...pageData);
    }
    catch (error) {
        logger_1.logger.error('Error en extracción alternativa', { error: error.message });
    }
    return results;
}
function generateResultId(homeTeam, awayTeam) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${homeTeam.toLowerCase()}${awayTeam.toLowerCase()}`).digest('hex');
    return `sofascore_${hash.substring(0, 12)}`;
}
async function scrapeSofascore(league) {
    const result = {
        success: false,
        results: []
    };
    let page = null;
    try {
        logger_1.logger.info(`Iniciando scraping de Sofascore${league ? ` para ${league}` : ''}...`);
        const { browser: browserInstance, context } = await (0, browser_1.getBrowser)();
        page = await context.newPage();
        // Navegar a Sofascore
        let url = 'https://www.sofascore.com/es-la/';
        if (league) {
            url = `https://www.sofascore.com/es-la/${league}`;
        }
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        // Esperar carga de página
        await waitForPageLoad(page);
        // Delay para permitir carga dinámica
        await (0, browser_1.randomDelay)(2000, 3000);
        // Extraer resultados
        const results = await extractResultsFromPage(page);
        result.results = results;
        result.success = true;
        logger_1.logger.info(`Scraping Sofascore completado: ${results.length} resultados encontrados`);
    }
    catch (error) {
        logger_1.logger.error('Error durante scraping de Sofascore', { error: error.message });
        result.error = error.message;
    }
    finally {
        if (page) {
            await page.close().catch(() => { });
        }
    }
    return result;
}
async function verifyMatchResults() {
    let verified = 0;
    let pending = 0;
    try {
        // Obtener partidos pendientes de verificación
        const pendingMatches = await database_1.pool.query(`SELECT m.id, m.external_id, m.home_team, m.away_team 
       FROM matches m 
       LEFT JOIN bets b ON m.id = b.match_id AND b.status = 'PENDING'
       WHERE m.status = 'SCHEDULED' 
       AND b.id IS NOT NULL
       LIMIT 50`);
        logger_1.logger.info(`Verificando ${pendingMatches.rows.length} partidos pendientes`);
        // Verificar resultados en Sofascore
        const sofascoreResult = await scrapeSofascore();
        if (!sofascoreResult.success) {
            logger_1.logger.error('Error obteniendo resultados de Sofascore');
            return { verified, pending: pendingMatches.rows.length };
        }
        // Actualizar partidos encontrados
        for (const matchResult of sofascoreResult.results) {
            if (matchResult.finished) {
                // Buscar partido correspondiente en nuestra base de datos
                const matchUpdate = await database_1.pool.query(`UPDATE matches 
           SET home_score = $1, away_score = $2, status = 'FINISHED'
           WHERE LOWER(home_team) LIKE LOWER($3) 
           AND LOWER(away_team) LIKE LOWER($4)
           AND status = 'SCHEDULED'
           RETURNING id`, [matchResult.homeScore, matchResult.awayScore, `%${matchResult.homeTeam}%`, `%${matchResult.awayTeam}%`]);
                if (matchUpdate.rows.length > 0) {
                    const matchId = matchUpdate.rows[0].id;
                    // Actualizar estado de apuestas asociadas
                    const betsUpdate = await database_1.pool.query(`UPDATE bets 
             SET status = 'WON',
                 profit_loss = amount * (odds_taken - 1)
             WHERE match_id = $1 
             AND selection LIKE '%' || $2 || '%'
             AND market IN ('Home', '1X2', 'HomeWin')`, [matchId, matchResult.homeTeam]);
                    // Verificar si perdió
                    if (betsUpdate.rowCount === 0) {
                        await database_1.pool.query(`UPDATE bets 
               SET status = 'LOST', profit_loss = -amount
               WHERE match_id = $1 AND status = 'PENDING'`, [matchId]);
                    }
                    verified++;
                }
            }
        }
        // Marcar partidos no encontrados como pendientes
        pending = pendingMatches.rows.length;
        logger_1.logger.info(`Verificación completada: ${verified} verificados, ${pending} pendientes`);
    }
    catch (error) {
        logger_1.logger.error('Error verificando resultados', { error: error.message });
    }
    return { verified, pending };
}
//# sourceMappingURL=index.js.map