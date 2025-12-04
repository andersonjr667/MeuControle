const mongoose = require('mongoose');
const path = require('path');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://alsj1520:152070an@cluster0.zvfhmzd.mongodb.net/meucontrole?retryWrites=true&w=majority&appName=Cluster0';

// Configuração do banco de dados JSON (fallback)
const DB_PATH = path.join(__dirname, '../../database/store.json');

let isMongoConnected = false;

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    isMongoConnected = true;
    console.log('✅ MongoDB conectado com sucesso!');
    console.log(`📊 Banco: ${mongoose.connection.name}`);
    console.log(`🌍 Host: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    console.log('⚠️  Usando armazenamento local JSON como fallback');
    isMongoConnected = false;
    return false;
  }
};

// Verificar status da conexão
const isConnected = () => isMongoConnected && mongoose.connection.readyState === 1;

// Desconectar
const disconnectDB = async () => {
  if (isMongoConnected) {
    await mongoose.disconnect();
    isMongoConnected = false;
    console.log('MongoDB desconectado');
  }
};

module.exports = {
  connectDB,
  isConnected,
  disconnectDB,
  DB_PATH,
  mongoose
};
