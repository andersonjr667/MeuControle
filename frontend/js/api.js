// Configuração da API
// Use a origem atual (quando o frontend é servido pelo backend) ou
// fallback para localhost:3000 (valor padrão do backend definido em .env)
const API_URL = (window.location && window.location.origin && window.location.origin !== 'null')
  ? `${window.location.origin}/api`
  : 'http://localhost:3000/api';

// Funções auxiliares para requisições
const api = {
  // Obter token do localStorage
  getToken() {
    return localStorage.getItem('token');
  },

  // Salvar token no localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  },

  // Remover token do localStorage
  removeToken() {
    localStorage.removeItem('token');
  },

  // Salvar usuário no localStorage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Obter usuário do localStorage
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Remover usuário do localStorage
  removeUser() {
    localStorage.removeItem('user');
  },

  // Fazer requisição com autenticação
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      // Se token expirado, redirecionar para login
      if (response.status === 401) {
        this.removeToken();
        this.removeUser();
        window.location.href = '/pages/login.html';
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      return { status: response.status, data };
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  },

  // Autenticação
  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.data.sucesso) {
      this.setToken(response.data.token);
      this.setUser(response.data.usuario);
    }

    return response;
  },

  async logout() {
    this.removeToken();
    this.removeUser();
    window.location.href = '/pages/login.html';
  },

  async verifyToken() {
    return this.request('/auth/verify');
  },

  // Devedores
  async getDebtors() {
    return this.request('/debtors');
  },

  async getDebtor(id) {
    return this.request(`/debtors/${id}`);
  },

  async createDebtor(debtor) {
    return this.request('/debtors', {
      method: 'POST',
      body: JSON.stringify(debtor)
    });
  },

  async updateDebtor(id, debtor) {
    return this.request(`/debtors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(debtor)
    });
  },

  async deleteDebtor(id) {
    return this.request(`/debtors/${id}`, {
      method: 'DELETE'
    });
  },

  // Transações
  async getTransactions() {
    return this.request('/transactions');
  },

  async getTransaction(id) {
    return this.request(`/transactions/${id}`);
  },

  async createTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  },

  async updateTransaction(id, transaction) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction)
    });
  },

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE'
    });
  },

  async getBalance() {
    return this.request('/transactions/balance');
  },

  // Investimentos
  async getInvestments() {
    return this.request('/investments');
  },

  async getInvestment(id) {
    return this.request(`/investments/${id}`);
  },

  async createInvestment(investment) {
    return this.request('/investments', {
      method: 'POST',
      body: JSON.stringify(investment)
    });
  },

  async updateInvestment(id, investment) {
    return this.request(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(investment)
    });
  },

  async deleteInvestment(id) {
    return this.request(`/investments/${id}`, {
      method: 'DELETE'
    });
  },

  async getTotalInvested() {
    return this.request('/investments/total');
  },

  async calculateInvestment(simulation) {
    return this.request('/investments/calculate', {
      method: 'POST',
      body: JSON.stringify(simulation)
    });
  },

  // Histórico de dívidas
  async getDebtHistory() {
    return this.request('/debt-history');
  },

  async getDebtHistoryByDebtor(debtorId) {
    return this.request(`/debt-history/debtor/${debtorId}`);
  },

  // Configurações
  async getSettings() {
    return this.request('/settings');
  },

  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};
