"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_1 = require("../controllers/statsController");
const router = (0, express_1.Router)();
// Rutas de estadísticas
router.get('/dashboard', statsController_1.statsController.getDashboardStats);
router.get('/markets', statsController_1.statsController.getMarketStats);
router.get('/leagues', statsController_1.statsController.getLeagueStats);
router.get('/history', statsController_1.statsController.getPerformanceHistory);
exports.default = router;
//# sourceMappingURL=stats.js.map