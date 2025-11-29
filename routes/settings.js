const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const ctrl = require('../controllers/settingsController');

// valid types
const allowed = ['income_categories','expense_categories','payment_methods'];

router.use(authenticate);
router.get('/:type', (req, res, next) => { if (!allowed.includes(req.params.type)) return res.status(400).json({ message: 'Tipo inválido' }); next(); }, ctrl.list);
router.post('/:type', (req, res, next) => { if (!allowed.includes(req.params.type)) return res.status(400).json({ message: 'Tipo inválido' }); next(); }, ctrl.create);
router.put('/:type/:id', (req, res, next) => { if (!allowed.includes(req.params.type)) return res.status(400).json({ message: 'Tipo inválido' }); next(); }, ctrl.update);
router.delete('/:type/:id', (req, res, next) => { if (!allowed.includes(req.params.type)) return res.status(400).json({ message: 'Tipo inválido' }); next(); }, ctrl.remove);

// restore defaults for authenticated user
router.post('/restore_defaults', ctrl.restoreDefaults);

module.exports = router;
