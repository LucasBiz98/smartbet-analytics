"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scraperController_1 = require("../controllers/scraperController");
const router = (0, express_1.Router)();
// Rutas del scraper
router.post('/trigger', scraperController_1.scraperController.triggerFootyStats);
router.post('/sofascore', scraperController_1.scraperController.triggerSofascore);
router.post('/verify-results', scraperController_1.scraperController.verifyResults);
router.get('/status', scraperController_1.scraperController.getStatus);
exports.default = router;
//# sourceMappingURL=scrapers.js.map