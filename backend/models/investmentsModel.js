const jsonStore = require('../config/jsonStore');
const { isConnected } = require('../config/db');
const InvestmentSchema = require('./schemas/Investment');

class InvestmentsModel {
  // Criar novo investimento
  async create(investmentData) {
    try {
      if (isConnected()) {
        const investment = new InvestmentSchema({
          userId: investmentData.userId,
          name: investmentData.name,
          type: investmentData.type || '',
          amount: parseFloat(investmentData.amount) || 0,
          initialAmount: parseFloat(investmentData.initialAmount) || parseFloat(investmentData.amount) || 0,
          returnRate: parseFloat(investmentData.returnRate) || 0,
          description: investmentData.description || '',
          startDate: investmentData.startDate || new Date(),
          status: investmentData.status || 'ativo'
        });
        const saved = await investment.save();
        return saved.toJSON();
      } else {
        const investment = {
          id: this.generateId(),
          userId: investmentData.userId,
          name: investmentData.name,
          type: investmentData.type || '',
          amount: parseFloat(investmentData.amount) || 0,
          initialAmount: parseFloat(investmentData.initialAmount) || parseFloat(investmentData.amount) || 0,
          returnRate: parseFloat(investmentData.returnRate) || 0,
          description: investmentData.description || '',
          startDate: investmentData.startDate || new Date().toISOString(),
          endDate: investmentData.endDate || null,
          status: investmentData.status || 'ativo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return jsonStore.addItem('investments', investment);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar todos os investimentos de um usuário
  async findByUserId(userId) {
    try {
      if (isConnected()) {
        const investments = await InvestmentSchema.find({ userId }).sort({ startDate: -1 });
        return investments.map(i => i.toJSON());
      } else {
        return jsonStore.findAll('investments', investment => investment.userId === userId);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar investimento por ID
  async findById(id) {
    try {
      if (isConnected()) {
        const investment = await InvestmentSchema.findById(id);
        return investment ? investment.toJSON() : null;
      } else {
        return jsonStore.findById('investments', id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Listar todos os investimentos
  async findAll() {
    try {
      if (isConnected()) {
        const investments = await InvestmentSchema.find().sort({ startDate: -1 });
        return investments.map(i => i.toJSON());
      } else {
        return jsonStore.getTable('investments');
      }
    } catch (error) {
      throw error;
    }
  }

  // Atualizar investimento
  async update(id, updates) {
    try {
      if (isConnected()) {
        if (updates.amount) {
          updates.amount = parseFloat(updates.amount);
        }
        if (updates.initialAmount) {
          updates.initialAmount = parseFloat(updates.initialAmount);
        }
        if (updates.returnRate) {
          updates.returnRate = parseFloat(updates.returnRate);
        }
        const investment = await InvestmentSchema.findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true, runValidators: true }
        );
        return investment ? investment.toJSON() : null;
      } else {
        if (updates.amount) {
          updates.amount = parseFloat(updates.amount);
        }
        if (updates.initialAmount) {
          updates.initialAmount = parseFloat(updates.initialAmount);
        }
        if (updates.returnRate) {
          updates.returnRate = parseFloat(updates.returnRate);
        }
        updates.updatedAt = new Date().toISOString();
        return jsonStore.updateItem('investments', id, updates);
      }
    } catch (error) {
      throw error;
    }
  }

  // Deletar investimento
  async delete(id) {
    try {
      if (isConnected()) {
        const investment = await InvestmentSchema.findByIdAndDelete(id);
        return investment ? investment.toJSON() : null;
      } else {
        return jsonStore.deleteItem('investments', id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Calcular total investido
  async calculateTotalInvested(userId) {
    try {
      const investments = await this.findByUserId(userId);
      
      const total = investments
        .filter(inv => inv.status === 'ativo')
        .reduce((sum, inv) => sum + inv.amount, 0);

      return total;
    } catch (error) {
      throw error;
    }
  }

  // Gerar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new InvestmentsModel();
