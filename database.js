const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err);
  } else {
    console.log('SQLite veritabanına bağlanıldı');
    
    // Passphrases tablosunu oluştur
    db.run(`CREATE TABLE IF NOT EXISTS passphrases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      passphrase TEXT NOT NULL,
      ip TEXT,
      userAgent TEXT,
      uniqueId TEXT UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

module.exports = db; 