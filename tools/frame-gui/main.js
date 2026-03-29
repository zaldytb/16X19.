'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

// ── Node.js availability check ───────────────────────────────────────────────

function isNodeAvailable() {
  try {
    execSync('node --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ── Config helpers ──────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(app.getPath('userData'), 'frame-gui-config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return { repoRoot: '' };
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

// ── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Frame GUI — Loadout Lab',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  if (!isNodeAvailable()) {
    dialog.showErrorBox(
      'Node.js not found',
      'Loadout Lab Frame Editor requires Node.js to run the import pipeline.\n\n' +
      'Download it from https://nodejs.org (LTS version recommended), ' +
      'install it, then relaunch this app.'
    );
    app.quit();
    return;
  }

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC handlers ────────────────────────────────────────────────────────────

// Select repo root folder
ipcMain.handle('dialog:select-folder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Loadout Lab repo root',
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Config
ipcMain.handle('config:load', () => loadConfig());
ipcMain.handle('config:save', (_event, cfg) => saveConfig(cfg));

// Open a CSV file and return its text content
ipcMain.handle('fs:open-csv', async (_event, defaultDir) => {
  const result = await dialog.showOpenDialog({
    title: 'Open frame CSV',
    defaultPath: defaultDir || undefined,
    filters: [{ name: 'CSV files', extensions: ['csv'] }],
    properties: ['openFile'],
  });
  if (result.canceled) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf8');
  return { filePath, content };
});

// Save CSV content to pipeline/import/<filename> inside the repo root
ipcMain.handle('fs:save-csv', (_event, { repoRoot, filename, content }) => {
  const importDir = path.join(repoRoot, 'pipeline', 'import');
  fs.mkdirSync(importDir, { recursive: true });
  const savedPath = path.join(importDir, filename);
  fs.writeFileSync(savedPath, content, 'utf8');
  return { savedPath };
});

// Run the ingest script (tsx — same as npm run ingest:frame)
ipcMain.handle('proc:run-ingest', (_event, { repoRoot, csvPath }) => {
  const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx' + (process.platform === 'win32' ? '.cmd' : ''));
  return runProcess(tsxBin, ['pipeline/scripts/ingest.ts', '--type', 'frame', '--csv', csvPath], repoRoot);
});

// Run npm run pipeline
ipcMain.handle('proc:run-pipeline', (_event, { repoRoot }) => {
  return runProcess('npm', ['run', 'pipeline'], repoRoot, true);
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function runProcess(cmd, args, cwd, useShell = false) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: useShell || process.platform === 'win32',
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (err) => {
      resolve({ code: -1, stdout: '', stderr: err.message });
    });
  });
}
