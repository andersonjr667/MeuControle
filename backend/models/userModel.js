const jsonStore = require('../config/jsonStore');
const { isConnected } = require('../config/db');
const UserSchema = require('./schemas/User');
const { v4: uuidv4 } = require('crypto');

class UserModel {
  // Criar novo usuário
  async create(userData) {
    try {
      if (isConnected()) {
        // Usar MongoDB
        const user = new UserSchema({
          name: userData.name,
          email: userData.email,
          password: userData.password
        });
        const saved = await user.save();
        return saved.toJSON();
      } else {
        // Usar JSON local
        const user = {
          id: this.generateId(),
          name: userData.name,
          email: userData.email,
          password: userData.password,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return jsonStore.addItem('users', user);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por email
  async findByEmail(email) {
    try {
      if (isConnected()) {
        const user = await UserSchema.findOne({ email });
        return user ? user.toJSON() : null;
      } else {
        return jsonStore.findOne('users', user => user.email === email);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por ID
  async findById(id) {
    try {
      if (isConnected()) {
        const user = await UserSchema.findById(id);
        return user ? user.toJSON() : null;
      } else {
        return jsonStore.findById('users', id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Listar todos os usuários
  async findAll() {
    try {
      if (isConnected()) {
        const users = await UserSchema.find();
        return users.map(u => u.toJSON());
      } else {
        return jsonStore.getTable('users');
      }
    } catch (error) {
      throw error;
    }
  }

  // Atualizar usuário
  async update(id, updates) {
    try {
      if (isConnected()) {
        const user = await UserSchema.findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true, runValidators: true }
        );
        return user ? user.toJSON() : null;
      } else {
        updates.updatedAt = new Date().toISOString();
        return jsonStore.updateItem('users', id, updates);
      }
    } catch (error) {
      throw error;
    }
  }

  // Deletar usuário
  async delete(id) {
    try {
      if (isConnected()) {
        const user = await UserSchema.findByIdAndDelete(id);
        return user ? user.toJSON() : null;
      } else {
        return jsonStore.deleteItem('users', id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Gerar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new UserModel();
