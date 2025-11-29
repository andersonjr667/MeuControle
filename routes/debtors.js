const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const ctrl = require('../controllers/debtorsController');

router.use(authenticate);
router.post('/', ctrl.createDebtor);
router.get('/', ctrl.listDebtors);
router.get('/:id', ctrl.getDebtor);
router.delete('/:id', ctrl.deleteDebtor);

module.exports = router;
