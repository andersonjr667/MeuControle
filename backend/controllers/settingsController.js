const jsonStore = require('../config/jsonStore');
const transactionsModel = require('../models/transactionsModel');
const investmentsModel = require('../models/investmentsModel');
const debtorModel = require('../models/debtorModel');
const debtHistoryModel = require('../models/debtHistoryModel');

class SettingsController {
  // Obter configurações do usuário
  async getSettings(req, res) {
    try {
      const data = jsonStore.read();
      const userSettings = data.settings[req.userId] || {
        currency: 'BRL',
        language: 'pt-BR',
        notifications: true,
        theme: 'light',
        categories: {
          income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
          expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Investimentos', 'Outros']
        }
      };

      res.json({
        sucesso: true,
        configuracoes: userSettings
      });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao buscar configurações',
        erro: error.message
      });
    }
  }

  // Atualizar configurações do usuário
  async updateSettings(req, res) {
    try {
      const updates = req.body;
      const data = jsonStore.read();

      // Inicializar settings se não existir
      if (!data.settings) {
        data.settings = {};
      }

      // Obter configurações atuais ou criar padrão
      const currentSettings = data.settings[req.userId] || {
        currency: 'BRL',
        language: 'pt-BR',
        notifications: true,
        theme: 'light',
        categories: {
          income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
          expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Investimentos', 'Outros']
        }
      };

      // Atualizar configurações
      data.settings[req.userId] = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      jsonStore.write(data);

      res.json({
        sucesso: true,
        mensagem: 'Configurações atualizadas com sucesso',
        configuracoes: data.settings[req.userId]
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao atualizar configurações',
        erro: error.message
      });
    }
  }

  // Limpeza de dados (por usuário)
  async cleanup(req, res) {
    try {
      const { scope } = req.body;
      if (!scope) {
        return res.status(400).json({ sucesso: false, mensagem: 'Escopo não informado' });
      }

      const userId = req.userId;
      switch (scope) {
        case 'all_data':
          await transactionsModel.deleteManyByUser(userId);
          await investmentsModel.deleteManyByUser(userId);
          await debtorModel.deleteManyByUser(userId);
          await debtHistoryModel.deleteManyByUser(userId);
          // limpar configurações para voltar ao padrão
          const data = jsonStore.read();
          if (data.settings && data.settings[userId]) {
            delete data.settings[userId];
            jsonStore.write(data);
          }
          break;
        case 'transactions_all':
          await transactionsModel.deleteManyByUser(userId);
          break;
        case 'transactions_entrada':
          await transactionsModel.deleteManyByUser(userId, 'entrada');
          break;
        case 'transactions_saida':
          await transactionsModel.deleteManyByUser(userId, 'saida');
          break;
        case 'investments_all':
          await investmentsModel.deleteManyByUser(userId);
          break;
        case 'debtors_all':
          await debtorModel.deleteManyByUser(userId);
          break;
        case 'debtors_reset':
          await debtorModel.resetAmountsByUser(userId);
          break;
        case 'debtHistory_all':
          await debtHistoryModel.deleteManyByUser(userId);
          break;
        default:
          return res.status(400).json({ sucesso: false, mensagem: 'Escopo inválido' });
      }

      return res.json({ sucesso: true, mensagem: 'Dados apagados com sucesso' });
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      res.status(500).json({ sucesso: false, mensagem: 'Erro ao limpar dados', erro: error.message });
    }
  }
}

module.exports = new SettingsController();
