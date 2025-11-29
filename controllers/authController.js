const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const userModel = require('../models/userModel');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Campos obrigatórios faltando' });

    const existing = await userModel.findUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'Email já cadastrado' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const userId = await userModel.createUser(name, email, hash);

    return res.status(201).json({ id: userId, name, email });
  } catch (err) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') return res.status(500).json({ message: 'Erro interno' });
    return res.status(500).json({ message: 'Erro interno', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Campos obrigatórios faltando' });

    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Credenciais inválidas' });

  const payload = { id: user.id, email: user.email };
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const token = jwt.sign(payload, secret, { expiresIn });

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') return res.status(500).json({ message: 'Erro interno' });
    return res.status(500).json({ message: 'Erro interno', error: err.message });
  }
}

module.exports = { register, login };
