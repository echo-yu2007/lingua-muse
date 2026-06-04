const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

// === Persistent data directory (auto-adapting) ===
// Prefer D:\WordMaster_Data (keeps existing users' data in place); if there is
// no D: drive — common on machines with only a C: drive — fall back to the
// per-user app-data folder, which is always writable. This makes the app
// portable across any Windows machine.
function pickDataDir() {
  const candidates = [];
  try { if (fs.existsSync('D:\\')) candidates.push('D:\\WordMaster_Data'); } catch (e) {}
  try { candidates.push(path.join(app.getPath('appData'), 'WordMaster_Data')); } catch (e) {}
  for (const dir of candidates) {
    try { fs.mkdirSync(dir, { recursive: true }); return dir; } catch (e) {}
  }
  return app.getPath('userData');
}
const userDataPath = pickDataDir();
// Share the resolved path with the preload (renderer) process.
process.env.LM_DATA_DIR = userDataPath;
try { app.setPath('userData', userDataPath); } catch (e) {}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    title: 'Lingua Muse',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // Bypass system/VPN proxy — API calls go direct, much faster with VPN on.
  try { session.defaultSession.setProxy({ mode: 'direct' }); } catch (e) {}
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
