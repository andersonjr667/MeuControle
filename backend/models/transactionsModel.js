const jsonStore = require('../config/jsonStore');
const { isConnected } = require('../config/db');
const TransactionSchema = require('./schemas/Transaction');

class TransactionsModel {
  // Criar nova transação
  async create(transactionData) {
    try {
      if (isConnected()) {
        const transaction = new TransactionSchema({
          userId: transactionData.userId,
          type: transactionData.type,
          category: transactionData.category || '',
          amount: parseFloat(transactionData.amount) || 0,
          description: transactionData.description || '',
          date: transactionData.date || new Date()
        });
        const saved = await transaction.save();
        return saved.toJSON();
      } else {
        const transaction = {
          id: this.generateId(),
          userId: transactionData.userId,
          type: transactionData.type,
          category: transactionData.category || '',
          amount: parseFloat(transactionData.amount) || 0,
          description: transactionData.description || '',
          date: transactionData.date || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return jsonStore.addItem('transactions', transaction);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar todas as transações de um usuário
  async findByUserId(userId) {
    try {
      if (isConnected()) {
        const transactions = await TransactionSchema.find({ userId }).sort({ date: -1 });
        return transactions.map(t => t.toJSON());
      } else {
        return jsonStore.findAll('transactions', transaction => transaction.userId === userId);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar transação por ID
  async findById(id) {
    try {
      if (isConnected()) {
        const transaction = await TransactionSchema.findById(id);
        return transaction ? transaction.toJSON() : null;
      } else {
        return jsonStore.findById('transactions', id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Listar todas as transações
  async findAll() {
    try {
      if (isConnected()) {
        const transactions = await TransactionSchema.find().sort({ date: -1 });
        return transactions.map(t => t.toJSON());
      } else {
        return jsonStore.getTable('transactions');
      }
    } catch (error) {
      throw error;
    }
  }

  // Atualizar transação
  async update(id, updates) {
    try {
      if (isConnected()) {
        if (updates.amount) {
          updates.amount = parseFloat(updates.amount);
        }
        const transaction = await TransactionSchema.findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true, runValidators: true }
        );
        return transaction ? transaction.toJSON() : null;
      } else {
        if (updates.amount) {
          updates.amount = parseFloat(updates.amount);
        }
        updates.updatedAt = new Date().toISOString();
        return jsonStore.updateItem('transactions', id, updates);
      }
    } catch (error) {
      throw error;
    }
  }

  // Deletar transação
  async delete(id) {
    try {
      if (isConnected()) {
        const transaction = await TransactionSchema.findByIdAndDelete(id);
        return transaction ? transaction.toJSON() : null;
      } else {
        return jsonStore.deleteItem('transactions', id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Calcular saldo total
  async calculateBalance(userId) {
    try {
      const transactions = await this.findByUserId(userId);
      
      const balance = transactions.reduce((total, transaction) => {
        if (transaction.type === 'entrada') {
          return total + transaction.amount;
        } else if (transaction.type === 'saida') {
          return total - transaction.amount;
        }
        return total;
      }, 0);

      return balance;
    } catch (error) {
      throw error;
    }
  }

  // Gerar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new TransactionsModel();
