"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.betsController = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
exports.betsController = {
    // Obtener todas las apuestas con filtros
    async getBets(req, res, next) {
        try {
            const { status, limit = 50, offset = 0, dateFrom, dateTo, bookmaker } = req.query;
            let query = `
        SELECT 
          b.*,
          m.home_team,
          m.away_team,
          m.league,
          m.match_date,
          p.market as prediction_market,
          p.probability,
          p.stake
        FROM bets b
        LEFT JOIN matches m ON b.match_id = m.id
        LEFT JOIN predictions p ON b.prediction_id = p.id
        WHERE 1=1
      `;
            const params = [];
            let paramIndex = 1;
            if (status) {
                query += ` AND b.status = $${paramIndex++}`;
                params.push(status);
            }
            if (bookmaker) {
                query += ` AND b.bookmaker = $${paramIndex++}`;
                params.push(bookmaker);
            }
            if (dateFrom) {
                query += ` AND b.placed_at >= $${paramIndex++}`;
                params.push(dateFrom);
            }
            if (dateTo) {
                query += ` AND b.placed_at <= $${paramIndex++}`;
                params.push(dateTo);
            }
            query += ` ORDER BY b.placed_at DESC`;
            query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            params.push(parseInt(limit), parseInt(offset));
            const result = await database_1.pool.query(query, params);
            res.json({
                bets: result.rows,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getBets', { error: error.message });
            next(error);
        }
    },
    // Obtener apuesta por ID
    async getBet(req, res, next) {
        try {
            const { id } = req.params;
            const result = await database_1.pool.query(`
        SELECT 
          b.*,
          m.home_team,
          m.away_team,
          m.league,
          m.match_date,
          m.home_score,
          m.away_score,
          p.market as prediction_market,
          p.probability,
          p.stake
        FROM bets b
        LEFT JOIN matches m ON b.match_id = m.id
        LEFT JOIN predictions p ON b.prediction_id = p.id
        WHERE b.id = $1
      `, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Apuesta no encontrada' });
            }
            res.json({
                bet: result.rows[0]
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getBet', { error: error.message });
            next(error);
        }
    },
    // Crear nueva apuesta
    async createBet(req, res, next) {
        try {
            const { predictionId, matchId, amount, oddsTaken, market, selection, bookmaker, notes } = req.body;
            // Validar datos requeridos
            if (!amount || !oddsTaken || !market) {
                return res.status(400).json({
                    error: 'Faltan datos requeridos: amount, oddsTaken, market'
                });
            }
            const result = await database_1.pool.query(`
        INSERT INTO bets (prediction_id, match_id, amount, odds_taken, market, selection, bookmaker, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
                predictionId || null,
                matchId || null,
                amount,
                oddsTaken,
                market,
                selection || null,
                bookmaker || null,
                notes || null
            ]);
            logger_1.logger.info('Apuesta creada', { betId: result.rows[0].id, amount, oddsTaken });
            res.status(201).json({
                bet: result.rows[0],
                message: 'Apuesta creada exitosamente'
            });
        }
        catch (error) {
            logger_1.logger.error('Error en createBet', { error: error.message });
            next(error);
        }
    },
    // Actualizar apuesta (principalmente para resolver resultados)
    async updateBet(req, res, next) {
        try {
            const { id } = req.params;
            const { status, profitLoss, notes } = req.body;
            const updates = [];
            const params = [];
            let paramIndex = 1;
            if (status) {
                updates.push(`status = $${paramIndex++}`);
                params.push(status);
                // Si se marca como ganada o perdida, calcular profit/loss
                if (status === 'WON' || status === 'LOST') {
                    updates.push(`settled_at = NOW()`);
                    // Obtener apuesta para calcular profit
                    const betResult = await database_1.pool.query('SELECT * FROM bets WHERE id = $1', [id]);
                    if (betResult.rows.length > 0) {
                        const bet = betResult.rows[0];
                        const profit = status === 'WON'
                            ? bet.amount * (bet.odds_taken - 1)
                            : -bet.amount;
                        updates.push(`profit_loss = $${paramIndex++}`);
                        params.push(profit);
                    }
                }
            }
            if (profitLoss !== undefined) {
                updates.push(`profit_loss = $${paramIndex++}`);
                params.push(profitLoss);
            }
            if (notes) {
                updates.push(`notes = $${paramIndex++}`);
                params.push(notes);
            }
            if (updates.length === 0) {
                return res.status(400).json({ error: 'No hay datos para actualizar' });
            }
            params.push(id);
            const result = await database_1.pool.query(`UPDATE bets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, params);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Apuesta no encontrada' });
            }
            logger_1.logger.info('Apuesta actualizada', { betId: id, status });
            res.json({
                bet: result.rows[0],
                message: 'Apuesta actualizada exitosamente'
            });
        }
        catch (error) {
            logger_1.logger.error('Error en updateBet', { error: error.message });
            next(error);
        }
    },
    // Eliminar apuesta
    async deleteBet(req, res, next) {
        try {
            const { id } = req.params;
            const result = await database_1.pool.query('DELETE FROM bets WHERE id = $1 RETURNING id', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Apuesta no encontrada' });
            }
            logger_1.logger.info('Apuesta eliminada', { betId: id });
            res.json({
                message: 'Apuesta eliminada exitosamente'
            });
        }
        catch (error) {
            logger_1.logger.error('Error en deleteBet', { error: error.message });
            next(error);
        }
    },
    // Obtener apuestas pendientes
    async getPendingBets(req, res, next) {
        try {
            const result = await database_1.pool.query(`
        SELECT 
          b.*,
          m.home_team,
          m.away_team,
          m.league,
          m.match_date,
          m.match_time,
          p.probability,
          p.stake
        FROM bets b
        LEFT JOIN matches m ON b.match_id = m.id
        LEFT JOIN predictions p ON b.prediction_id = p.id
        WHERE b.status = 'PENDING'
        ORDER BY m.match_date ASC
      `);
            res.json({
                bets: result.rows,
                count: result.rows.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error en getPendingBets', { error: error.message });
            next(error);
        }
    }
};
//# sourceMappingURL=betsController.js.map