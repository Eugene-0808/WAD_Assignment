const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('notes.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    items TEXT,
    imageUri TEXT,
    createdAt TEXT NOT NULL
  )`);
  
});

db.close();