const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Token inválido' });
  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ message: 'Token mal formado' });

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id, email: decoded.email };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

module.exports = authenticate;
