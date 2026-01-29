import { Router } from 'express';
import { scraperController } from '../controllers/scraperController';

const router = Router();

// Rutas del scraper
router.post('/trigger', scraperController.triggerFootyStats);
router.post('/sofascore', scraperController.triggerSofascore);
router.post('/verify-results', scraperController.verifyResults);
router.get('/status', scraperController.getStatus);

export default router;
