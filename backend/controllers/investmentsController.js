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

  // Calcular simulação de investimento (API para o frontend)
  async calculate(req, res) {
    try {
      const {
        initial = 0,
        monthly = 0,
        rate = 0,
        years = 1,
        inflation = 0,
        taxRate = 0,
        yearlyIncrease = 0
      } = req.body;

      const monthlyRate = (Number(rate) || 0) / 100 / 12;
      const monthlyInflation = (Number(inflation) || 0) / 100 / 12;
      const months = (Number(years) || 1) * 12;

      let balance = Number(initial) || 0;
      let currentMonthly = Number(monthly) || 0;
      let totalInvested = balance;

      const balanceHistory = [balance];
      const investedHistory = [totalInvested];
      const realValueHistory = [balance];

      for (let i = 1; i <= months; i++) {
        if (i % 12 === 0 && Number(yearlyIncrease) > 0) {
          currentMonthly = currentMonthly * (1 + Number(yearlyIncrease) / 100);
        }
        balance = balance * (1 + monthlyRate) + currentMonthly;
        totalInvested += currentMonthly;

        const realValue = balance / Math.pow(1 + monthlyInflation, i);
        balanceHistory.push(balance);
        investedHistory.push(totalInvested);
        realValueHistory.push(realValue);
      }

      const finalBalance = balance;
      const grossEarnings = finalBalance - totalInvested;
      const taxes = (grossEarnings * (Number(taxRate) || 0)) / 100;
      const netEarnings = grossEarnings - taxes;
      const finalValue = totalInvested + netEarnings;
      const realFinalValue = realValueHistory[realValueHistory.length - 1];

      const returnPercentage = totalInvested > 0 ? (netEarnings / totalInvested) * 100 : 0;
      const yearlyReturn = totalInvested > 0 ? (Math.pow(finalValue / totalInvested, 1 / (Number(years) || 1)) - 1) * 100 : 0;

      return res.json({
        sucesso: true,
        result: {
          totalInvested,
          grossEarnings,
          taxes,
          netEarnings,
          finalValue,
          realFinalValue,
          returnPercentage,
          yearlyReturn,
          months,
          balanceHistory,
          investedHistory,
          realValueHistory
        }
      });
    } catch (error) {
      console.error('Erro na simulação de investimento:', error);
      res.status(500).json({ sucesso: false, mensagem: 'Erro ao calcular simulação', erro: error.message });
    }
  }
}

module.exports = new InvestmentsController();
