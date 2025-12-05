const express = require('express');
const router = express.Router();
const investmentsController = require('../controllers/investmentsController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas as rotas de investimentos requerem autenticação
router.use(authMiddleware);

router.get('/', (req, res) => investmentsController.getAll(req, res));
router.post('/calculate', (req, res) => investmentsController.calculate(req, res));
router.get('/total', (req, res) => investmentsController.getTotalInvested(req, res));
router.get('/:id', (req, res) => investmentsController.getById(req, res));
router.post('/', (req, res) => investmentsController.create(req, res));
router.put('/:id', (req, res) => investmentsController.update(req, res));
router.delete('/:id', (req, res) => investmentsController.delete(req, res));

module.exports = router;
