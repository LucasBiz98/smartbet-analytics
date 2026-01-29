"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictionsController = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
exports.predictionsController = {
    // Obtener todas las predicciones con filtros
    async getPredictions(req, res, next) {
        try {
            const { minStake, maxStake, league, market, limit = 100, offset = 0, dateFrom, dateTo, sortBy = 'match_date', sortOrder = 'ASC' } = req.query;
            let query = `
        SELECT 
          p.id,
          p.market,
          p.odds,
          p.probability,
          p.stake,
          p.confidence_level,
          p.home_odds,
          p.draw_odds,
          p.away_odds,
          m.id as match_id,
          m.home_team,
          m.away_team,
          m.league,
          m.match_date,
          m.match_time,
          m.status as match_status
        FROM predictions p
        JOIN matches m ON p.match_id = m.id
        WHERE 1=1
      `;
            const params = [];
            let paramIndex = 1;
            if (minStake) {
                query += ` AND p.stake >= $${paramIndex++}`;
                params.push(parseInt(minStake));
            }
            if (maxStake) {
                query += ` AND p.stake <= $${paramIndex++}`;
                params.push(parseInt(maxStake));
            }
            if (league) {
                query += ` AND m.league ILIKE $${paramIndex++}`;
                params.push(`%${league}%`);
            }
            if (market) {
                query += ` AND p.market = $${paramIndex++}`;
                params.push(market);
            }
            if (dateFrom) {
                query += ` AND m.match_date >= $${paramIndex++}`;
                params.push(dateFrom);
            }
            if (dateTo) {
                query += ` AND m.match_date <= $${paramIndex++}`;
                params.push(dateTo);
            }
            // Validar ordenamiento
            const validSortColumns = ['match_date', 'stake', 'probability', 'odds', 'league'];
            const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'match_date';
            const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY p.${sortColumn} ${order}`;
            query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            params.push(parseInt(limit), parseInt(offset));
            const result = await database_1.pool.query(query, params);
            // Obtener total para paginación
            const countQuery = `
        SELECT COUNT(*) 
        FROM predictions p
        JOIN matches m ON p.match_id = m.id
        WHERE 1=1
        ${minStake ? ' AND p.stake >= ' + parseInt(minStake) : ''}
        ${maxStake ? ' AND p.stake <= ' + parseInt(maxStake) : ''}
        ${league ? ` AND m.league ILIKE '%${league}%'` : ''}
        ${market ? ` AND p.market = '${market}'` : ''}
      `;
            const countResult = await database_1.pool.query(countQuery);
            res.json({
                predictions: result.rows,
                total: parseInt(countResult.rows[0].count),
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getPredictions', { error: error.message });
            next(error);
        }
    },
    // Obtener predicciones de hoy
    async getTodayPredictions(req, res, next) {
        try {
            const result = await database_1.pool.query(`
        SELECT 
          p.*,
          m.home_team,
          m.away_team,
          m.league,
          m.match_date,
          m.match_time
        FROM predictions p
        JOIN matches m ON p.match_id = m.id
        WHERE m.match_date::date = CURRENT_DATE
        AND m.status = 'SCHEDULED'
        ORDER BY p.stake DESC, p.probability DESC
      `);
            res.json({
                predictions: result.rows,
                count: result.rows.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getTodayPredictions', { error: error.message });
            next(error);
        }
    },
    // Obtener predicciones por stake
    async getByStake(req, res, next) {
        try {
            const { stake } = req.params;
            const result = await database_1.pool.query(`
        SELECT 
          p.*,
          m.home_team,
          m.away_team,
          m.league,
          m.match_date,
          m.match_time
        FROM predictions p
        JOIN matches m ON p.match_id = m.id
        WHERE p.stake = $1
        AND m.status = 'SCHEDULED'
        ORDER BY p.probability DESC
      `, [parseInt(stake)]);
            res.json({
                predictions: result.rows,
                stake: parseInt(stake),
                count: result.rows.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getByStake', { error: error.message });
            next(error);
        }
    },
    // Obtener ligas disponibles
    async getLeagues(req, res, next) {
        try {
            const result = await database_1.pool.query(`
        SELECT DISTINCT league, COUNT(*) as prediction_count
        FROM matches m
        JOIN predictions p ON m.id = p.match_id
        WHERE m.status = 'SCHEDULED'
        GROUP BY league
        ORDER BY prediction_count DESC
      `);
            res.json({
                leagues: result.rows
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getLeagues', { error: error.message });
            next(error);
        }
    },
    // Obtener detalle de una predicción
    async getPrediction(req, res, next) {
        try {
            const { id } = req.params;
            const result = await database_1.pool.query(`
        SELECT 
          p.*,
          m.home_team,
          m.away_team,
          m.league,
          m.match_date,
          m.match_time,
          m.home_score,
          m.away_score,
          m.status as match_status
        FROM predictions p
        JOIN matches m ON p.match_id = m.id
        WHERE p.id = $1
      `, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Predicción no encontrada' });
            }
            res.json({
                prediction: result.rows[0]
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getPrediction', { error: error.message });
            next(error);
        }
    }
};
//# sourceMappingURL=predictionsController.js.map