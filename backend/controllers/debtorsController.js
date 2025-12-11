const debtorModel = require('../models/debtorModel');
const debtHistoryModel = require('../models/debtHistoryModel');

class DebtorsController {
  // Listar todos os devedores do usuário
  async getAll(req, res) {
    try {
      const debtors = await debtorModel.findByUserId(req.userId);
      
      res.json({
        sucesso: true,
        devedores: debtors
      });
    } catch (error) {
      console.error('Erro ao buscar devedores:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao buscar devedores',
        erro: error.message
      });
    }
  }

  // Buscar devedor por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const debtor = await debtorModel.findById(id);

      if (!debtor) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Devedor não encontrado'
        });
      }

      // Verificar se o devedor pertence ao usuário
      if (debtor.userId !== req.userId) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado'
        });
      }

      res.json({
        sucesso: true,
        devedor: debtor
      });
    } catch (error) {
      console.error('Erro ao buscar devedor:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao buscar devedor',
        erro: error.message
      });
    }
  }

  // Criar novo devedor
  async create(req, res) {
    try {
      const { name, amount, description, dueDate, status } = req.body;

      // Validação
      if (!name || amount === undefined) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Nome e valor são obrigatórios'
        });
      }

      const debtor = await debtorModel.create({
        userId: req.userId,
        name,
        amount,
        description,
        dueDate,
        status
      });

      // Registrar no histórico
      await debtHistoryModel.create({
        userId: req.userId,
        debtorId: debtor.id,
        debtorName: debtor.name,
        amount: debtor.amount,
        action: 'criado',
        description: `Dívida criada: ${debtor.name}`
      });

      res.status(201).json({
        sucesso: true,
        mensagem: 'Devedor criado com sucesso',
        devedor: debtor
      });
    } catch (error) {
      console.error('Erro ao criar devedor:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao criar devedor',
        erro: error.message
      });
    }
  }

  // Atualizar devedor
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      const actionType = updates.actionType; // pagou | emprestou | undefined
      const actionValue = updates.actionValue;
      const actionDate = updates.actionDate;
      const actionDesc = updates.actionDescription;

      // Remover metadados que não devem ser salvos no devedor
      delete updates.actionType;
      delete updates.actionValue;
      delete updates.actionDate;
      delete updates.actionDescription;

      // Verificar se o devedor existe e pertence ao usuário
      const debtor = await debtorModel.findById(id);
      if (!debtor) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Devedor não encontrado'
        });
      }

      if (debtor.userId !== req.userId) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado'
        });
      }

      const updatedDebtor = await debtorModel.update(id, updates);

      // Registrar no histórico
      const isBalanceAction = actionType === 'pagou' || actionType === 'emprestou';
      const historyAction = isBalanceAction ? actionType : 'atualizado';
      const historyAmount = isBalanceAction && actionValue ? actionValue : updatedDebtor.amount;
      const historyDescription = isBalanceAction
        ? `${actionType === 'pagou' ? 'Pagamento registrado' : 'Empréstimo registrado'}: R$ ${Number(historyAmount).toFixed(2)}${actionDesc ? ` - ${actionDesc}` : ''}`
        : `Dívida atualizada: ${updatedDebtor.name}`;

      await debtHistoryModel.create({
        userId: req.userId,
        debtorId: updatedDebtor.id,
        debtorName: updatedDebtor.name,
        amount: historyAmount,
        action: historyAction,
        description: historyDescription,
        date: actionDate || undefined
      });

      res.json({
        sucesso: true,
        mensagem: 'Devedor atualizado com sucesso',
        devedor: updatedDebtor
      });
    } catch (error) {
      console.error('Erro ao atualizar devedor:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao atualizar devedor',
        erro: error.message
      });
    }
  }

  // Deletar devedor
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se o devedor existe e pertence ao usuário
      const debtor = await debtorModel.findById(id);
      if (!debtor) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Devedor não encontrado'
        });
      }

      if (debtor.userId !== req.userId) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado'
        });
      }

      await debtorModel.delete(id);

      // Registrar no histórico
      await debtHistoryModel.create({
        userId: req.userId,
        debtorId: debtor.id,
        debtorName: debtor.name,
        amount: debtor.amount,
        action: 'deletado',
        description: `Dívida removida: ${debtor.name}`
      });

      res.json({
        sucesso: true,
        mensagem: 'Devedor deletado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar devedor:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao deletar devedor',
        erro: error.message
      });
    }
  }
}

module.exports = new DebtorsController();
