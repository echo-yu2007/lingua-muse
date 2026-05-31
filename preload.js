// === Preload: file-backed persistent storage on D: drive ===
// Exposes a tiny synchronous-snapshot + write-through store to the renderer.
// All app data (books, history, word cache, settings) lives in a single JSON
// file so it survives app restarts reliably (localStorage under file:// is not).
const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

// Resolve the data directory. Main process passes the chosen path via
// LM_DATA_DIR; if that is missing for any reason, replicate the same
// auto-adapting logic (D: drive if present, else the user's app-data folder).
function resolveDataDir() {
  if (process.env.LM_DATA_DIR) return process.env.LM_DATA_DIR;
  const candidates = [];
  try { if (fs.existsSync('D:\\')) candidates.push('D:\\WordMaster_Data'); } catch (e) {}
  if (process.env.APPDATA) candidates.push(path.join(process.env.APPDATA, 'WordMaster_Data'));
  if (process.env.USERPROFILE) candidates.push(path.join(process.env.USERPROFILE, 'WordMaster_Data'));
  for (const dir of candidates) {
    try { fs.mkdirSync(dir, { recursive: true }); return dir; } catch (e) {}
  }
  return '.';
}

const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, 'linguamuse-data.json');
const BACKUP_FILE = path.join(DATA_DIR, 'linguamuse-data.backup.json');

function readData() {
  for (const f of [DATA_FILE, BACKUP_FILE]) {
    try {
      const raw = fs.readFileSync(f, 'utf8');
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') return obj;
    } catch (e) { /* try next */ }
  }
  return {};
}

// Synchronous snapshot taken once at load — renderer keeps its own working copy.
let snapshot = readData();

function writeData(obj) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const json = JSON.stringify(obj);
    // Atomic-ish write: keep a backup of the previous good file first.
    try { if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, BACKUP_FILE); } catch (e) {}
    fs.writeFileSync(DATA_FILE, json, 'utf8');
    snapshot = obj;
    return true;
  } catch (e) {
    return false;
  }
}

contextBridge.exposeInMainWorld('LMStore', {
  // Full persisted object captured at startup.
  getAll() { return snapshot; },
  // Write-through save of the entire data object.
  save(obj) { return writeData(obj); },
  // Hard reset: wipe the data file.
  reset() {
    try { fs.writeFileSync(DATA_FILE, '{}', 'utf8'); } catch (e) {}
    try { fs.unlinkSync(BACKUP_FILE); } catch (e) {}
    snapshot = {};
    return true;
  },
  dataPath: DATA_FILE,
});
