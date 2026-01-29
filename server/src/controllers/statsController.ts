import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export const statsController = {
  // Obtener estadísticas del dashboard principal
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = '30' } = req.query; // Últimos X días
      
      // Estadísticas generales
      const generalStats = await pool.query(`
        SELECT 
          COUNT(*) as total_bets,
          COUNT(CASE WHEN status = 'WON' THEN 1 END) as won_bets,
          COUNT(CASE WHEN status = 'LOST' THEN 1 END) as lost_bets,
          COUNT(CASE WHEN status = 'VOID' THEN 1 END) as void_bets,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_bets,
          COALESCE(SUM(amount), 0) as total_staked,
          COALESCE(SUM(CASE WHEN status IN ('WON', 'LOST', 'VOID') THEN amount ELSE 0 END), 0) as settled_staked,
          COALESCE(SUM(profit_loss), 0) as total_profit_loss,
          COALESCE(AVG(CASE WHEN status IN ('WON', 'LOST') THEN profit_loss END), 0) as avg_profit_loss
        FROM bets
        WHERE placed_at >= NOW() - INTERVAL '${parseInt(period as string)} days'
      `);
      
      // Calcular win rate
      const totalSettled = parseInt(generalStats.rows[0].won_bets) + parseInt(generalStats.rows[0].lost_bets);
      const winRate = totalSettled > 0 
        ? (parseInt(generalStats.rows[0].won_bets) / totalSettled * 100).toFixed(2) 
        : '0';
      
      // Calcular ROI
      const totalStaked = parseFloat(generalStats.rows[0].settled_staked);
      const totalProfit = parseFloat(generalStats.rows[0].total_profit_loss);
      const roi = totalStaked > 0 
        ? ((totalProfit / totalStaked) * 100).toFixed(2) 
        : '0';
      
      // Estadísticas por stake
      const stakeStats = await pool.query(`
        SELECT 
          p.stake,
          COUNT(b.id) as bet_count,
          COUNT(CASE WHEN b.status = 'WON' THEN 1 END) as won,
          COUNT(CASE WHEN b.status = 'LOST' THEN 1 END) as lost,
          COALESCE(SUM(b.amount), 0) as total_staked,
          COALESCE(SUM(b.profit_loss), 0) as profit_loss,
          COALESCE(AVG(b.profit_loss), 0) as avg_profit
        FROM predictions p
        LEFT JOIN bets b ON p.id = b.prediction_id
        WHERE b.id IS NOT NULL
        AND b.placed_at >= NOW() - INTERVAL '${parseInt(period as string)} days'
        GROUP BY p.stake
        ORDER BY p.stake DESC
      `);
      
      // Últimas 10 apuestas
      const recentBets = await pool.query(`
        SELECT 
          b.*,
          m.home_team,
          m.away_team,
          m.league,
          p.stake,
          p.probability
        FROM bets b
        LEFT JOIN matches m ON b.match_id = m.id
        LEFT JOIN predictions p ON b.prediction_id = p.id
        ORDER BY b.placed_at DESC
        LIMIT 10
      `);
      
      // Resumen por día (últimos 7 días)
      const dailyStats = await pool.query(`
        SELECT 
          DATE(placed_at) as date,
          COUNT(*) as bet_count,
          COALESCE(SUM(amount), 0) as staked,
          COALESCE(SUM(profit_loss), 0) as profit_loss
        FROM bets
        WHERE placed_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(placed_at)
        ORDER BY date DESC
      `);
      
      res.json({
        general: {
          totalBets: parseInt(generalStats.rows[0].total_bets),
          wonBets: parseInt(generalStats.rows[0].won_bets),
          lostBets: parseInt(generalStats.rows[0].lost_bets),
          pendingBets: parseInt(generalStats.rows[0].pending_bets),
          totalStaked: parseFloat(generalStats.rows[0].total_staked),
          totalProfitLoss: parseFloat(generalStats.rows[0].total_profit_loss),
          winRate: parseFloat(winRate),
          roi: parseFloat(roi),
          averageOdd: 0 // Calcular si es necesario
        },
        byStake: stakeStats.rows.map(row => ({
          stake: parseInt(row.stake),
          betCount: parseInt(row.bet_count),
          won: parseInt(row.won),
          lost: parseInt(row.lost),
          totalStaked: parseFloat(row.total_staked),
          profitLoss: parseFloat(row.profit_loss)
        })),
        recentBets: recentBets.rows,
        dailyStats: dailyStats.rows
      });
      
    } catch (error) {
      logger.error('Error en getDashboardStats', { error: (error as Error).message });
      next(error);
    }
  },
  
  // Obtener rendimiento por mercado
  async getMarketStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = '30' } = req.query;
      
      const result = await pool.query(`
        SELECT 
          b.market,
          COUNT(*) as bet_count,
          COUNT(CASE WHEN b.status = 'WON' THEN 1 END) as won,
          COUNT(CASE WHEN b.status = 'LOST' THEN 1 END) as lost,
          COALESCE(SUM(b.amount), 0) as total_staked,
          COALESCE(SUM(b.profit_loss), 0) as profit_loss,
          AVG(b.odds_taken) as avg_odds
        FROM bets b
        WHERE b.placed_at >= NOW() - INTERVAL '${parseInt(period as string)} days'
        GROUP BY b.market
        ORDER BY profit_loss DESC
      `);
      
      res.json({
        markets: result.rows.map(row => ({
          market: row.market,
          betCount: parseInt(row.bet_count),
          won: parseInt(row.won),
          lost: parseInt(row.lost),
          winRate: parseInt(row.bet_count) > 0 
            ? (parseInt(row.won) / parseInt(row.bet_count) * 100).toFixed(2) 
            : '0',
          totalStaked: parseFloat(row.total_staked),
          profitLoss: parseFloat(row.profit_loss),
          avgOdds: parseFloat(row.avg_odds).toFixed(2)
        }))
      });
      
    } catch (error) {
      logger.error('Error en getMarketStats', { error: (error as Error).message });
      next(error);
    }
  },
  
  // Obtener rendimiento por liga
  async getLeagueStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = '30' } = req.query;
      
      const result = await pool.query(`
        SELECT 
          m.league,
          COUNT(*) as bet_count,
          COUNT(CASE WHEN b.status = 'WON' THEN 1 END) as won,
          COUNT(CASE WHEN b.status = 'LOST' THEN 1 END) as lost,
          COALESCE(SUM(b.amount), 0) as total_staked,
          COALESCE(SUM(b.profit_loss), 0) as profit_loss
        FROM bets b
        LEFT JOIN matches m ON b.match_id = m.id
        WHERE b.placed_at >= NOW() - INTERVAL '${parseInt(period as string)} days'
        AND m.league IS NOT NULL
        GROUP BY m.league
        ORDER BY profit_loss DESC
      `);
      
      res.json({
        leagues: result.rows.map(row => ({
          league: row.league,
          betCount: parseInt(row.bet_count),
          won: parseInt(row.won),
          lost: parseInt(row.lost),
          winRate: parseInt(row.bet_count) > 0 
            ? (parseInt(row.won) / parseInt(row.bet_count) * 100).toFixed(2) 
            : '0',
          totalStaked: parseFloat(row.total_staked),
          profitLoss: parseFloat(row.profit_loss)
        }))
      });
      
    } catch (error) {
      logger.error('Error en getLeagueStats', { error: (error as Error).message });
      next(error);
    }
  },
  
  // Obtener historial de rendimiento
  async getPerformanceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { days = 30 } = req.query;
      
      const result = await pool.query(`
        SELECT 
          DATE(placed_at) as date,
          COUNT(*) as bet_count,
          COALESCE(SUM(amount), 0) as staked,
          COALESCE(SUM(profit_loss), 0) as profit_loss,
          COALESCE(SUM(profit_loss) OVER (ORDER BY DATE(placed_at) 
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0) as cumulative_profit
        FROM bets
        WHERE placed_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
        AND status IN ('WON', 'LOST')
        GROUP BY DATE(placed_at)
        ORDER BY date ASC
      `);
      
      res.json({
        history: result.rows,
        period: parseInt(days as string)
      });
      
    } catch (error) {
      logger.error('Error en getPerformanceHistory', { error: (error as Error).message });
      next(error);
    }
  }
};
