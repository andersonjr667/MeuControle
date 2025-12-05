const investmentsModel = require('../models/investmentsModel');
const transactionsModel = require('../models/transactionsModel');

class InvestmentsController {
  // Listar todos os investimentos do usuário
  async getAll(req, res) {
    try {
      const investments = await investmentsModel.findByUserId(req.userId);
      
      // Ordenar por data de início (mais recentes primeiro)
      investments.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

      res.json({
        sucesso: true,
        investimentos: investments
      });
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao buscar investimentos',
        erro: error.message
      });
    }
  }

  // Buscar investimento por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const investment = await investmentsModel.findById(id);

      if (!investment) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Investimento não encontrado'
        });
      }

      // Verificar se o investimento pertence ao usuário
      if (investment.userId !== req.userId) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado'
        });
      }

      res.json({
        sucesso: true,
        investimento: investment
      });
    } catch (error) {
      console.error('Erro ao buscar investimento:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao buscar investimento',
        erro: error.message
      });
    }
  }

  // Criar novo investimento
  async create(req, res) {
    try {
      const { name, type, amount, initialAmount, returnRate, description, startDate, endDate, status, cdiPercent } = req.body;

      // Validação
      if (!name || amount === undefined) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Nome e valor são obrigatórios'
        });
      }

      const investment = await investmentsModel.create({
        userId: req.userId,
        name,
        type,
        amount,
        initialAmount,
        returnRate,
        cdiPercent,
        description,
        startDate,
        endDate,
        status
      });

      // Criar transação de saída (investimento é um gasto)
      const investmentAmount = initialAmount || amount;
      await transactionsModel.create({
        userId: req.userId,
        description: `Investimento: ${name}`,
        amount: investmentAmount,
        type: 'saida',
        category: 'Investimentos',
        date: startDate || new Date().toISOString()
      });

      res.status(201).json({
        sucesso: true,
        mensagem: 'Investimento criado com sucesso',
        investimento: investment
      });
    } catch (error) {
      console.error('Erro ao criar investimento:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao criar investimento',
        erro: error.message
      });
    }
  }

  // Atualizar investimento
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Verificar se o investimento existe e pertence ao usuário
      const investment = await investmentsModel.findById(id);
      if (!investment) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Investimento não encontrado'
        });
      }

      if (investment.userId !== req.userId) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado'
        });
      }

      const updatedInvestment = await investmentsModel.update(id, updates);

      res.json({
        sucesso: true,
        mensagem: 'Investimento atualizado com sucesso',
        investimento: updatedInvestment
      });
    } catch (error) {
      console.error('Erro ao atualizar investimento:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao atualizar investimento',
        erro: error.message
      });
    }
  }

  // Deletar investimento
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se o investimento existe e pertence ao usuário
      const investment = await investmentsModel.findById(id);
      if (!investment) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Investimento não encontrado'
        });
      }

      if (investment.userId !== req.userId) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado'
        });
      }

      await investmentsModel.delete(id);

      res.json({
        sucesso: true,
        mensagem: 'Investimento deletado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar investimento:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao deletar investimento',
        erro: error.message
      });
    }
  }

  // Obter total investido
  async getTotalInvested(req, res) {
    try {
      const total = await investmentsModel.calculateTotalInvested(req.userId);

      res.json({
        sucesso: true,
        totalInvestido: total
      });
    } catch (error) {
      console.error('Erro ao calcular total investido:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao calcular total investido',
        erro: error.message
      });
    }
  }
}

module.exports = new InvestmentsController();
