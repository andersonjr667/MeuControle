const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  language: {
    type: String,
    default: 'pt-BR'
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  notifications: {
    type: Boolean,
    default: true
  },
  categories: {
    income: [{
      type: String
    }],
    expense: [{
      type: String
    }]
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
SettingsSchema.index({ userId: 1 });

module.exports = mongoose.model('Settings', SettingsSchema);
