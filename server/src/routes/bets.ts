import { Router } from 'express';
import { betsController } from '../controllers/betsController';

const router = Router();

// Rutas de apuestas
router.get('/', betsController.getBets);
router.get('/pending', betsController.getPendingBets);
router.get('/:id', betsController.getBet);
router.post('/', betsController.createBet);
router.patch('/:id', betsController.updateBet);
router.delete('/:id', betsController.deleteBet);

export default router;
