"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const betsController_1 = require("../controllers/betsController");
const router = (0, express_1.Router)();
// Rutas de apuestas
router.get('/', betsController_1.betsController.getBets);
router.get('/pending', betsController_1.betsController.getPendingBets);
router.get('/:id', betsController_1.betsController.getBet);
router.post('/', betsController_1.betsController.createBet);
router.patch('/:id', betsController_1.betsController.updateBet);
router.delete('/:id', betsController_1.betsController.deleteBet);
exports.default = router;
//# sourceMappingURL=bets.js.map