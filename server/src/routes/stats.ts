import { Router } from 'express';
import { statsController } from '../controllers/statsController';

const router = Router();

// Rutas de estadísticas
router.get('/dashboard', statsController.getDashboardStats);
router.get('/markets', statsController.getMarketStats);
router.get('/leagues', statsController.getLeagueStats);
router.get('/history', statsController.getPerformanceHistory);

export default router;
