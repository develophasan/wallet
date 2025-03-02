const mongoose = require('mongoose');

const passphraseSchema = new mongoose.Schema({
  passphrase: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: String,
  userAgent: String,
  uniqueId: {
    type: String,
    default: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
    unique: true
  }
});

// Timestamp'e göre index oluştur
passphraseSchema.index({ timestamp: -1 });

// Benzersiz index oluştur
passphraseSchema.index({ uniqueId: 1 }, { unique: true });

module.exports = mongoose.model('Passphrase', passphraseSchema); 