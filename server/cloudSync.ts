import { NoteItem } from '../screens/HomeScreen';
// Import the configuration settings
const config = require('./Config'); 

// Dynamically build the base URL
const API_BASE = `${config.settings.serverPath}/api`; 

export async function fetchAllNotesFromCloud(): Promise<NoteItem[]> {
  try {
    const res = await fetch(`${API_BASE}/notes`); // GET request to fetch data
    if (!res.ok) return [];
    return await res.json(); // Parse JSON response
  } catch (err) {
    console.error('Cloud fetch error:', err);
    return [];
  }
}

export async function createNoteInCloud(note: NoteItem): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST', // Specifies an HTTP POST request to create a resource
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note), // Convert data to JSON string
    });
    return res.ok;
  } catch (err) {
    console.error('Cloud create error:', err);
    return false;
  }
}

export async function updateNoteInCloud(note: NoteItem): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notes/${note.id}`, {
      method: 'PUT', // Specifies an HTTP PUT request to update a resource
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return res.ok;
  } catch (err) {
    console.error('Cloud update error:', err);
    return false;
  }
}

export async function deleteNoteInCloud(noteId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notes/${noteId}`, { 
      method: 'DELETE' // Specifies an HTTP DELETE request to remove a resource
    });
    return res.ok;
  } catch (err) {
    console.error('Cloud delete error:', err);
    return false;
  }
}