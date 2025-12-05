const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  initialAmount: {
    type: Number,
    min: 0
  },
  returnRate: {
    type: Number,
    default: 0
  },
  cdiPercent: {
    type: Number,
    min: 0,
    max: 200
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['ativo', 'encerrado'],
    default: 'ativo'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices
InvestmentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Investment', InvestmentSchema);
