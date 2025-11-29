const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const transactionsRoutes = require('./routes/transactions');
const debtorsRoutes = require('./routes/debtors');
const debtHistoryRoutes = require('./routes/debtHistory');
const settingsRoutes = require('./routes/settings');
const investmentsRoutes = require('./routes/investments');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/debtors', debtorsRoutes);
app.use('/api/debt_history', debtHistoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/investments', investmentsRoutes);

// Serve frontend static files (so visiting / will return the SPA/index)
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));

app.get('/api/ping', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

// Debug route: summary of JSON store (safe for local development)
app.get('/api/debug/db', async (req, res) => {
	try {
		const db = require('./config/db');
		if (!db.load) return res.status(400).json({ message: 'DB debug not available' });
		const data = await db.load();
		const summary = {};
		Object.keys(data).forEach(k => summary[k] = data[k].length);
		return res.json({ ok: true, summary });
	} catch (err) {
		return res.status(500).json({ message: 'Erro debug DB', detail: err.message });
	}
});

	// Allow short URLs like /dashboard.html to serve files from /pages/dashboard.html
	app.get('/:page.html', (req, res) => {
		try{
			const page = req.params.page;
			const file = path.join(__dirname, '..', 'frontend', 'pages', `${page}.html`);
			fs.access(file, fs.constants.R_OK, (err) => {
				if (err) return res.status(404).send('<!doctype html><html><body><pre>Cannot GET ' + req.path + '</pre></body></html>');
				return res.sendFile(file);
			});
		}catch(e){
			return res.status(500).send('Erro interno');
		}
	});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
