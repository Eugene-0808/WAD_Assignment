// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Open database (the file created by generateDB.js)
const db = new sqlite3.Database('notes.db');

// Helper function to convert DB row to NoteItem format
function rowToNote(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title || '',
    content: row.content || undefined,
    items: row.items ? JSON.parse(row.items) : undefined,
    imageUri: row.imageUri || undefined,
    createdAt: row.createdAt,
  };
}

// ---------- ROUTES ----------

// GET all notes (ordered by newest first)
app.get('/api/notes', (req, res) => {
  db.all('SELECT * FROM notes ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    const notes = rows.map(rowToNote);
    res.json(notes);
  });
});

// GET single note by id
app.get('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(rowToNote(row));
  });
});

// POST create a new note
app.post('/api/notes', (req, res) => {
  const { id, type, title, content, items, imageUri, createdAt } = req.body;

  // Validate required fields
  if (!id || !type || !createdAt) {
    return res.status(400).json({ error: 'Missing required fields: id, type, createdAt' });
  }

  const itemsJson = items ? JSON.stringify(items) : null;
  const contentValue = content || null;
  const imageUriValue = imageUri || null;

  db.run(
    `INSERT INTO notes (id, type, title, content, items, imageUri, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, type, title || '', contentValue, itemsJson, imageUriValue, createdAt],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, affected: this.changes });
    }
  );
});

// PUT update an existing note (full replacement)
app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { id: bodyId, type, title, content, items, imageUri, createdAt } = req.body;

  if (id !== bodyId) {
    return res.status(400).json({ error: 'ID in URL does not match ID in body' });
  }

  const itemsJson = items ? JSON.stringify(items) : null;
  const contentValue = content || null;
  const imageUriValue = imageUri || null;

  db.run(
    `UPDATE notes
     SET type = ?, title = ?, content = ?, items = ?, imageUri = ?, createdAt = ?
     WHERE id = ?`,
    [type, title || '', contentValue, itemsJson, imageUriValue, createdAt, id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Note not found' });
      }
      res.json({ id, affected: this.changes });
    }
  );
});

// DELETE a note
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM notes WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ id, affected: this.changes });
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);  
});