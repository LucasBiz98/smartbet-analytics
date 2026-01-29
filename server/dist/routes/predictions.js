"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predictionsController_1 = require("../controllers/predictionsController");
const router = (0, express_1.Router)();
// Rutas de predicciones
router.get('/', predictionsController_1.predictionsController.getPredictions);
router.get('/today', predictionsController_1.predictionsController.getTodayPredictions);
router.get('/stake/:stake', predictionsController_1.predictionsController.getByStake);
router.get('/leagues', predictionsController_1.predictionsController.getLeagues);
router.get('/:id', predictionsController_1.predictionsController.getPrediction);
exports.default = router;
//# sourceMappingURL=predictions.js.map