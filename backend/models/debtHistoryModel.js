const jsonStore = require('../config/jsonStore');

class DebtHistoryModel {
  // Criar novo registro de histórico
  async create(historyData) {
    try {
      const history = {
        id: this.generateId(),
        userId: historyData.userId,
        debtorId: historyData.debtorId,
        debtorName: historyData.debtorName,
        amount: parseFloat(historyData.amount) || 0,
        action: historyData.action, // criado, atualizado, deletado, pago, emprestou
        description: historyData.description || '',
        date: historyData.date || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      return jsonStore.addItem('debtHistory', history);
    } catch (error) {
      throw error;
    }
  }

  // Buscar histórico de um usuário
  async findByUserId(userId) {
    try {
      return jsonStore.findAll('debtHistory', history => history.userId === userId);
    } catch (error) {
      throw error;
    }
  }

  // Buscar histórico de um devedor específico
  async findByDebtorId(debtorId) {
    try {
      return jsonStore.findAll('debtHistory', history => history.debtorId === debtorId);
    } catch (error) {
      throw error;
    }
  }

  // Buscar histórico por ID
  async findById(id) {
    try {
      return jsonStore.findById('debtHistory', id);
    } catch (error) {
      throw error;
    }
  }

  // Listar todo o histórico
  async findAll() {
    try {
      return jsonStore.getTable('debtHistory');
    } catch (error) {
      throw error;
    }
  }

  // Deletar registro de histórico
  async delete(id) {
    try {
      return jsonStore.deleteItem('debtHistory', id);
    } catch (error) {
      throw error;
    }
  }

  // Gerar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Apagar histórico por usuário
  async deleteManyByUser(userId) {
    const all = jsonStore.getTable('debtHistory') || [];
    const remaining = all.filter(h => h.userId !== userId);
    jsonStore.updateTable('debtHistory', remaining);
    return true;
  }
}

module.exports = new DebtHistoryModel();
