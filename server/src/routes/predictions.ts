import { Router } from 'express';
import { predictionsController } from '../controllers/predictionsController';

const router = Router();

// Rutas de predicciones
router.get('/', predictionsController.getPredictions);
router.get('/today', predictionsController.getTodayPredictions);
router.get('/stake/:stake', predictionsController.getByStake);
router.get('/leagues', predictionsController.getLeagues);
router.get('/:id', predictionsController.getPrediction);

export default router;
