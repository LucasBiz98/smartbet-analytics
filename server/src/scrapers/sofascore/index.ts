import { Page } from 'playwright';
import { getBrowser, randomDelay } from '../core/browser';
import { logger } from '../../utils/logger';
import { pool } from '../../config/database';

export interface MatchResult {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  finished: boolean;
}

export interface VerificationResult {
  success: boolean;
  results: MatchResult[];
  error?: string;
}

async function waitForPageLoad(page: Page): Promise<boolean> {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    return true;
  } catch (error) {
    logger.warn('Timeout esperando carga de página', { error: (error as Error).message });
    return true; // Continuar de todas formas
  }
}

async function extractResultsFromPage(page: Page): Promise<MatchResult[]> {
  const results: MatchResult[] = [];
  
  try {
    // Buscar contenedores de partidos
    const matchContainers = await page.$$(
      '[class*="match"], [class*="event"], [class*="game"], .Event, .match-row, [data-testid*="match"]'
    );
    
    logger.info(`Encontrados ${matchContainers.length} contenedores de partidos`);
    
    for (const container of matchContainers) {
      try {
        const result = await extractMatchResult(container, page);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        logger.debug('Error extrayendo contenedor de partido', { error: (error as Error).message });
      }
    }
    
    // Si no se encuentran partidos con los selectors principales, intentar extraer de另一种方式
    if (results.length === 0) {
      const alternativeResults = await extractResultsAlternative(page);
      results.push(...alternativeResults);
    }
    
  } catch (error) {
    logger.error('Error extrayendo resultados', { error: (error as Error).message });
  }
  
  return results;
}

async function extractMatchResult(container: any, page: Page): Promise<MatchResult | null> {
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
    
  } catch (error) {
    logger.debug('Error procesando contenedor', { error: (error as Error).message });
    return null;
  }
}

async function extractResultsAlternative(page: Page): Promise<MatchResult[]> {
  const results: MatchResult[] = [];
  
  try {
    // Extraer usando evaluación de página
    const pageData = await page.evaluate(() => {
      const matches: any[] = [];
      
      // Buscar todos los elementos con patrones de puntuación
      const scoreElements = document.querySelectorAll('[class*="score"], [class*="result"]');
      
      scoreElements.forEach((el: Element) => {
        const text = el.textContent || '';
        const scoreMatch = text.match(/(\d+)\s*-\s*(\d+)/);
        
        if (scoreMatch) {
          // Buscar equipos cercanos
          const parent = el.parentElement;
          const siblings = parent?.querySelectorAll('[class*="team"]') || [];
          
          let homeTeam = '';
          let awayTeam = '';
          
          siblings.forEach((sibling: Element, index: number) => {
            if (index === 0) homeTeam = sibling.textContent || '';
            if (index === 1) awayTeam = sibling.textContent || '';
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
    
  } catch (error) {
    logger.error('Error en extracción alternativa', { error: (error as Error).message });
  }
  
  return results;
}

function generateResultId(homeTeam: string, awayTeam: string): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(`${homeTeam.toLowerCase()}${awayTeam.toLowerCase()}`).digest('hex');
  return `sofascore_${hash.substring(0, 12)}`;
}

export async function scrapeSofascore(league?: string): Promise<VerificationResult> {
  const result: VerificationResult = {
    success: false,
    results: []
  };
  
  let page: any = null;
  
  try {
    logger.info(`Iniciando scraping de Sofascore${league ? ` para ${league}` : ''}...`);
    
    const { browser: browserInstance, context } = await getBrowser();
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
    await randomDelay(2000, 3000);
    
    // Extraer resultados
    const results = await extractResultsFromPage(page);
    
    result.results = results;
    result.success = true;
    
    logger.info(`Scraping Sofascore completado: ${results.length} resultados encontrados`);
    
  } catch (error) {
    logger.error('Error durante scraping de Sofascore', { error: (error as Error).message });
    result.error = (error as Error).message;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
  
  return result;
}

export async function verifyMatchResults(): Promise<{ verified: number; pending: number }> {
  let verified = 0;
  let pending = 0;
  
  try {
    // Obtener partidos pendientes de verificación
    const pendingMatches = await pool.query(
      `SELECT m.id, m.external_id, m.home_team, m.away_team 
       FROM matches m 
       LEFT JOIN bets b ON m.id = b.match_id AND b.status = 'PENDING'
       WHERE m.status = 'SCHEDULED' 
       AND b.id IS NOT NULL
       LIMIT 50`
    );
    
    logger.info(`Verificando ${pendingMatches.rows.length} partidos pendientes`);
    
    // Verificar resultados en Sofascore
    const sofascoreResult = await scrapeSofascore();
    
    if (!sofascoreResult.success) {
      logger.error('Error obteniendo resultados de Sofascore');
      return { verified, pending: pendingMatches.rows.length };
    }
    
    // Actualizar partidos encontrados
    for (const matchResult of sofascoreResult.results) {
      if (matchResult.finished) {
        // Buscar partido correspondiente en nuestra base de datos
        const matchUpdate = await pool.query(
          `UPDATE matches 
           SET home_score = $1, away_score = $2, status = 'FINISHED'
           WHERE LOWER(home_team) LIKE LOWER($3) 
           AND LOWER(away_team) LIKE LOWER($4)
           AND status = 'SCHEDULED'
           RETURNING id`,
          [matchResult.homeScore, matchResult.awayScore, `%${matchResult.homeTeam}%`, `%${matchResult.awayTeam}%`]
        );
        
        if (matchUpdate.rows.length > 0) {
          const matchId = matchUpdate.rows[0].id;
          
          // Actualizar estado de apuestas asociadas
          const betsUpdate = await pool.query(
            `UPDATE bets 
             SET status = 'WON',
                 profit_loss = amount * (odds_taken - 1)
             WHERE match_id = $1 
             AND selection LIKE '%' || $2 || '%'
             AND market IN ('Home', '1X2', 'HomeWin')`,
            [matchId, matchResult.homeTeam]
          );
          
          // Verificar si perdió
          if (betsUpdate.rowCount === 0) {
            await pool.query(
              `UPDATE bets 
               SET status = 'LOST', profit_loss = -amount
               WHERE match_id = $1 AND status = 'PENDING'`,
              [matchId]
            );
          }
          
          verified++;
        }
      }
    }
    
    // Marcar partidos no encontrados como pendientes
    pending = pendingMatches.rows.length;
    
    logger.info(`Verificación completada: ${verified} verificados, ${pending} pendientes`);
    
  } catch (error) {
    logger.error('Error verificando resultados', { error: (error as Error).message });
  }
  
  return { verified, pending };
}

export { extractResultsFromPage, waitForPageLoad };
