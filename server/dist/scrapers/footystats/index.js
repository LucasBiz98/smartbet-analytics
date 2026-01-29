"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeFootyStats = scrapeFootyStats;
exports.savePredictionsToDatabase = savePredictionsToDatabase;
exports.extractPredictionData = extractPredictionData;
exports.waitForCloudflare = waitForCloudflare;
const browser_1 = require("../core/browser");
const logger_1 = require("../../utils/logger");
const database_1 = require("../../config/database");
async function waitForCloudflare(page) {
    try {
        // Esperar a que la página cargue completamente
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        // Verificar si hay verificación de Cloudflare
        const cloudflareElement = await page.$('#cf-challenge-running, .challenge-running');
        if (cloudflareElement) {
            logger_1.logger.warn('Detectada verificación Cloudflare, esperando...');
            await page.waitForSelector('#cf-challenge-running', { state: 'hidden', timeout: 60000 }).catch(() => { });
        }
        // Verificar si la página cargó correctamente
        const content = await page.content();
        if (content.includes('404') || content.includes('Access Denied')) {
            throw new Error('Acceso denegado o página no encontrada');
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error('Error esperando Cloudflare', { error: error.message });
        return false;
    }
}
async function extractPredictionData(page) {
    const predictions = [];
    try {
        // selectors ajustados según la estructura de FootyStats
        const rows = await page.$$('tr.match-row, tr.prediction-row, .prediction-row, [class*="prediction"]');
        logger_1.logger.info(`Encontradas ${rows.length} filas de predicciones`);
        for (const row of rows) {
            try {
                const data = await extractRowData(row, page);
                if (data) {
                    predictions.push(data);
                }
            }
            catch (error) {
                logger_1.logger.debug('Error extrayendo fila', { error: error.message });
            }
        }
        // Si no encuentra filas con los selectors principales, intentar extraer datos de另一种方式
        if (predictions.length === 0) {
            const alternativeData = await extractAlternativeData(page);
            predictions.push(...alternativeData);
        }
    }
    catch (error) {
        logger_1.logger.error('Error extrayendo datos de predicciones', { error: error.message });
    }
    return predictions;
}
async function extractRowData(row, page) {
    try {
        // Intentar extraer equipos
        const teamsElement = await row.$('[class*="team"], [class*="versus"]');
        const teamsText = teamsElement ? await teamsElement.textContent() : '';
        // Extraer fecha y hora
        const dateElement = await row.$('[class*="date"], [class*="time"]');
        const dateText = dateElement ? await dateElement.textContent() : '';
        // Extraer liga
        const leagueElement = await row.$('[class*="league"], [class*="country"]');
        const league = leagueElement ? await leagueElement.textContent() : '';
        // Extraer cuotas
        const oddsElements = await row.$$('[class*="odd"], [class*="odds"]');
        const odds = [];
        for (const oddsEl of oddsElements) {
            const text = await oddsEl.textContent();
            const value = parseFloat(text?.replace(',', '.') || '0');
            if (value > 0)
                odds.push(value);
        }
        // Extraer probabilidad
        const probElement = await row.$('[class*="prob"], [class*="percentage"]');
        const probText = probElement ? await probElement.textContent() : '';
        const probability = parseFloat(probText?.replace('%', '').replace(',', '.') || '0');
        // Extraer stake (si está disponible)
        const stakeElement = await row.$('[class*="stake"], [class*="rating"]');
        const stakeText = stakeElement ? await stakeElement.textContent() : '';
        let stake = calculateStakeFromProbability(probability);
        if (stakeText) {
            const stakeMatch = stakeText.match(/\d+/);
            if (stakeMatch) {
                stake = parseInt(stakeMatch[0]);
            }
        }
        // Extraer mercado
        const marketElement = await row.$('[class*="market"], [class*="tip"], [class*="prediction"]');
        const market = marketElement ? await marketElement.textContent() : '1X2';
        // Generar external ID único
        const externalId = generateExternalId(teamsText, dateText);
        // Parsear fecha
        const { date, time } = parseDateTime(dateText);
        // Procesar equipos
        const teams = teamsText.split('vs').map((t) => t.trim());
        const homeTeam = teams[0] || 'Unknown';
        const awayTeam = teams[1] || 'Unknown';
        if (!homeTeam || !awayTeam) {
            return null;
        }
        return {
            externalId,
            homeTeam,
            awayTeam,
            league: league || 'Unknown League',
            matchDate: date,
            matchTime: time,
            market: cleanMarketName(market),
            odds: odds[0] || 0,
            probability,
            stake,
            confidenceLevel: getConfidenceLevel(probability),
            homeOdds: odds[0],
            drawOdds: odds[1],
            awayOdds: odds[2]
        };
    }
    catch (error) {
        logger_1.logger.debug('Error procesando fila', { error: error.message });
        return null;
    }
}
async function extractAlternativeData(page) {
    // Método alternativo usando extracción por texto
    const predictions = [];
    try {
        const pageContent = await page.content();
        // Extraer todos los partidos mencionados en la página
        const matchPattern = /([A-Za-z\s]+)\s+vs\s+([A-Za-z\s]+)/g;
        let match;
        while ((match = matchPattern.exec(pageContent)) !== null) {
            const homeTeam = match[1].trim();
            const awayTeam = match[2].trim();
            if (homeTeam.length > 2 && awayTeam.length > 2) {
                const externalId = generateExternalId(homeTeam, awayTeam);
                predictions.push({
                    externalId,
                    homeTeam,
                    awayTeam,
                    league: 'Extracted from Page',
                    matchDate: new Date(),
                    matchTime: '',
                    market: '1X2',
                    odds: 0,
                    probability: 0,
                    stake: 5,
                    confidenceLevel: 'MEDIUM'
                });
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error en extracción alternativa', { error: error.message });
    }
    return predictions;
}
function generateExternalId(teams, date) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${teams}${date}`).digest('hex');
    return hash.substring(0, 16);
}
function parseDateTime(dateText) {
    const date = new Date();
    const time = '';
    // Intentar extraer hora del texto
    const timeMatch = dateText.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
        date.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
    }
    // Intentar extraer fecha
    const datePatterns = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/
    ];
    for (const pattern of datePatterns) {
        const match = dateText.match(pattern);
        if (match) {
            // Procesar según el patrón encontrado
            return { date, time };
        }
    }
    return { date, time };
}
function calculateStakeFromProbability(probability) {
    if (probability >= 85)
        return 10;
    if (probability >= 75)
        return 8;
    if (probability >= 65)
        return 6;
    if (probability >= 55)
        return 4;
    if (probability >= 45)
        return 3;
    return 2;
}
function getConfidenceLevel(probability) {
    if (probability >= 85)
        return 'EXCELLENT';
    if (probability >= 75)
        return 'HIGH';
    if (probability >= 65)
        return 'GOOD';
    if (probability >= 55)
        return 'MODERATE';
    if (probability >= 45)
        return 'LOW';
    return 'VERY_LOW';
}
function cleanMarketName(market) {
    const cleanMarket = market.toLowerCase().trim();
    if (cleanMarket.includes('btts') || cleanMarket.includes('both'))
        return 'BTTS';
    if (cleanMarket.includes('over') && cleanMarket.includes('2.5'))
        return 'Over 2.5';
    if (cleanMarket.includes('under') && cleanMarket.includes('2.5'))
        return 'Under 2.5';
    if (cleanMarket.includes('over') && cleanMarket.includes('1.5'))
        return 'Over 1.5';
    if (cleanMarket.includes('under') && cleanMarket.includes('1.5'))
        return 'Under 1.5';
    if (cleanMarket.includes('home') || cleanMarket.includes('1'))
        return 'Home';
    if (cleanMarket.includes('away') || cleanMarket.includes('2'))
        return 'Away';
    if (cleanMarket.includes('draw') || cleanMarket.includes('x'))
        return 'Draw';
    if (cleanMarket.includes('1x2') || cleanMarket.includes('result'))
        return '1X2';
    return market.substring(0, 50);
}
async function scrapeFootyStats() {
    const result = {
        success: false,
        predictions: [],
        matchesFound: 0
    };
    let page = null;
    try {
        logger_1.logger.info('Iniciando scraping de FootyStats...');
        const { browser: browserInstance, context } = await (0, browser_1.getBrowser)();
        page = await context.newPage();
        // Configurar manejo de errores
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                logger_1.logger.debug('Error en consola', { text: msg.text() });
            }
        });
        page.on('pageerror', (error) => {
            logger_1.logger.debug('Error en página', { message: error.message });
        });
        // Navegar a la página
        await page.goto('https://footystats.org/predictions/mathematical', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        // Esperar a que pase Cloudflare
        const cloudflarePassed = await waitForCloudflare(page);
        if (!cloudflarePassed) {
            throw new Error('No se pudo pasar la verificación de Cloudflare');
        }
        // Delay aleatorio para simular comportamiento humano
        await (0, browser_1.randomDelay)(2000, 4000);
        // Scroll para cargar contenido lazy
        await (0, browser_1.scrollPage)(page, 2);
        // Extraer datos
        const predictions = await extractPredictionData(page);
        result.predictions = predictions;
        result.matchesFound = predictions.length;
        result.success = predictions.length > 0;
        logger_1.logger.info(`Scraping completado: ${predictions.length} predicciones encontradas`);
    }
    catch (error) {
        logger_1.logger.error('Error durante scraping de FootyStats', { error: error.message });
        result.error = error.message;
    }
    finally {
        if (page) {
            await page.close().catch(() => { });
        }
    }
    return result;
}
async function savePredictionsToDatabase(predictions) {
    let saved = 0;
    let errors = 0;
    for (const pred of predictions) {
        try {
            // Primero, insertar o actualizar el partido
            const matchResult = await database_1.pool.query(`INSERT INTO matches (external_id, home_team, away_team, league, match_date, match_time)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (external_id) 
         DO UPDATE SET home_team = $2, away_team = $3, league = $4, match_date = $5, match_time = $6
         RETURNING id`, [pred.externalId, pred.homeTeam, pred.awayTeam, pred.league, pred.matchDate, pred.matchTime]);
            const matchId = matchResult.rows[0].id;
            // Luego, insertar la predicción
            await database_1.pool.query(`INSERT INTO predictions (match_id, market, odds, probability, stake, confidence_level, home_odds, draw_odds, away_odds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (match_id, market) 
         DO UPDATE SET odds = $3, probability = $4, stake = $5, confidence_level = $6`, [matchId, pred.market, pred.odds, pred.probability, pred.stake, pred.confidenceLevel, pred.homeOdds, pred.drawOdds, pred.awayOdds]);
            saved++;
        }
        catch (error) {
            logger_1.logger.error('Error guardando predicción', { error: error.message, prediction: pred });
            errors++;
        }
    }
    logger_1.logger.info(`Predicciones guardadas: ${saved}, errores: ${errors}`);
    return { saved, errors };
}
//# sourceMappingURL=index.js.map