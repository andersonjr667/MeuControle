const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const ctrl = require('../controllers/debtHistoryController');

router.use(authenticate);
// create movement for a debtor
router.post('/debtor/:debtorId', ctrl.createMovement);
// list all movements
router.get('/', ctrl.listAll);

module.exports = router;
