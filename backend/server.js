require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

// Importar rotas
const authRoutes = require('./routes/auth');
const debtorsRoutes = require('./routes/debtors');
const transactionsRoutes = require('./routes/transactions');
const investmentsRoutes = require('./routes/investments');
const debtHistoryRoutes = require('./routes/debtHistory');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 4000;

// Conectar ao MongoDB
connectDB().catch(err => {
  console.log('Servidor iniciará com armazenamento local');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/debtors', debtorsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/investments', investmentsRoutes);
app.use('/api/debt-history', debtHistoryRoutes);
app.use('/api/settings', settingsRoutes);

// Rota de informações da API
app.get('/api', (req, res) => {
  res.json({
    sucesso: true,
    mensagem: 'API Meu Controle Financeiro',
    versao: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        verify: 'GET /api/auth/verify'
      },
      debtors: {
        list: 'GET /api/debtors',
        create: 'POST /api/debtors',
        update: 'PUT /api/debtors/:id',
        delete: 'DELETE /api/debtors/:id'
      },
      transactions: {
        list: 'GET /api/transactions',
        create: 'POST /api/transactions',
        update: 'PUT /api/transactions/:id',
        delete: 'DELETE /api/transactions/:id'
      },
      investments: {
        list: 'GET /api/investments',
        create: 'POST /api/investments',
        update: 'PUT /api/investments/:id',
        delete: 'DELETE /api/investments/:id'
      },
      debtHistory: {
        list: 'GET /api/debt-history',
        byDebtor: 'GET /api/debt-history/debtor/:debtorId'
      },
      settings: {
        get: 'GET /api/settings',
        update: 'PUT /api/settings'
      }
    }
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    sucesso: false, 
    mensagem: 'Erro interno do servidor',
    erro: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📂 Frontend disponível em http://localhost:${PORT}`);
  console.log(`🔌 API disponível em http://localhost:${PORT}/api`);
});

module.exports = app;
