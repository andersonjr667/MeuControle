const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const ctrl = require('../controllers/transactionsController');

router.use(authenticate);
router.post('/', ctrl.createTransaction);
router.get('/', ctrl.listTransactions);
router.get('/totals', ctrl.getTotals);
router.get('/aggregates/categories', ctrl.getCategoryDistribution);
router.get('/aggregates/monthly', ctrl.getMonthlyBalance);
router.put('/:id', ctrl.updateTransaction);
router.delete('/:id', ctrl.deleteTransaction);

module.exports = router;
