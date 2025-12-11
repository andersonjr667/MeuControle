const jsonStore = require('../config/jsonStore');
const { isConnected } = require('../config/db');
const DebtorSchema = require('./schemas/Debtor');

class DebtorModel {
  // Criar novo devedor
  async create(debtorData) {
    try {
      if (isConnected()) {
        const debtor = new DebtorSchema({
          userId: debtorData.userId,
          name: debtorData.name,
          amount: parseFloat(debtorData.amount) || 0,
          description: debtorData.description || '',
          dueDate: debtorData.dueDate,
          status: debtorData.status || 'pending'
        });
        const saved = await debtor.save();
        return saved.toJSON();
      } else {
        const debtor = {
          id: this.generateId(),
          userId: debtorData.userId,
          name: debtorData.name,
          amount: parseFloat(debtorData.amount) || 0,
          description: debtorData.description || '',
          dueDate: debtorData.dueDate || null,
          status: debtorData.status || 'pendente',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return jsonStore.addItem('debtors', debtor);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar todos os devedores de um usuário
  async findByUserId(userId) {
    try {
      if (isConnected()) {
        const debtors = await DebtorSchema.find({ userId }).sort({ dueDate: 1 });
        return debtors.map(d => d.toJSON());
      } else {
        return jsonStore.findAll('debtors', debtor => debtor.userId === userId);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar devedor por ID
  async findById(id) {
    try {
      if (isConnected()) {
        const debtor = await DebtorSchema.findById(id);
        return debtor ? debtor.toJSON() : null;
      } else {
        return jsonStore.findById('debtors', id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Listar todos os devedores
  async findAll() {
    try {
      if (isConnected()) {
        const debtors = await DebtorSchema.find().sort({ dueDate: 1 });
        return debtors.map(d => d.toJSON());
      } else {
        return jsonStore.getTable('debtors');
      }
    } catch (error) {
      throw error;
    }
  }

  // Atualizar devedor
  async update(id, updates) {
    try {
      if (isConnected()) {
        if (updates.amount) {
          updates.amount = parseFloat(updates.amount);
        }
        const debtor = await DebtorSchema.findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true, runValidators: true }
        );
        return debtor ? debtor.toJSON() : null;
      } else {
        if (updates.amount) {
          updates.amount = parseFloat(updates.amount);
        }
        updates.updatedAt = new Date().toISOString();
        return jsonStore.updateItem('debtors', id, updates);
      }
    } catch (error) {
      throw error;
    }
  }

  // Deletar devedor
  async delete(id) {
    try {
      if (isConnected()) {
        const debtor = await DebtorSchema.findByIdAndDelete(id);
        return debtor ? debtor.toJSON() : null;
      } else {
        return jsonStore.deleteItem('debtors', id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Gerar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Apagar todos os devedores do usuário
  async deleteManyByUser(userId) {
    if (isConnected()) {
      await DebtorSchema.deleteMany({ userId });
      return true;
    }
    const all = jsonStore.getTable('debtors') || [];
    const remaining = all.filter(d => d.userId !== userId);
    jsonStore.updateTable('debtors', remaining);
    return true;
  }

  // Zerar valores de dívida mantendo cadastros
  async resetAmountsByUser(userId) {
    const all = jsonStore.getTable('debtors') || [];
    const updated = all.map(d => {
      if (d.userId !== userId) return d;
      return { ...d, amount: 0, updatedAt: new Date().toISOString() };
    });
    jsonStore.updateTable('debtors', updated);
    return true;
  }
}

module.exports = new DebtorModel();
