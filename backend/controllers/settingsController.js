const jsonStore = require('../config/jsonStore');

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
}

module.exports = new SettingsController();
