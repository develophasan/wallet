const mongoose = require('mongoose');

const passphraseSchema = new mongoose.Schema({
  passphrase: {
    type: String,
    required: true
  },
  ip: String,
  userAgent: String,
  uniqueId: {
    type: String,
    unique: true,
    required: true
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Passphrase', passphraseSchema); 