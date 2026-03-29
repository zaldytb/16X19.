import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  FrameGuiConfig,
  IPC_CHANNELS,
  ProcessResult,
  RunIngestRequest,
  RunPipelineRequest,
  SaveCsvRequest,
} from './shared/ipc';

const CONFIG_PATH = path.join(app.getPath('userData'), 'frame-gui-config.json');

function isNodeAvailable(): boolean {
  try {
    execSync('node --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function loadConfig(): FrameGuiConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as FrameGuiConfig;
  } catch {
    return { repoRoot: '' };
  }
}

function saveConfig(cfg: FrameGuiConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Frame GUI - Loadout Lab',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  void win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

function runProcess(cmd: string, args: string[], cwd: string, useShell = false): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: useShell || process.platform === 'win32',
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (err) => {
      resolve({ code: -1, stdout: '', stderr: err.message });
    });
  });
}

app.whenReady().then(() => {
  if (!isNodeAvailable()) {
    dialog.showErrorBox(
      'Node.js not found',
      'Loadout Lab Frame Editor requires Node.js to run the import pipeline.\n\n' +
      'Download it from https://nodejs.org (LTS version recommended), install it, then relaunch this app.'
    );
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle(IPC_CHANNELS.selectFolder, async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Loadout Lab repo root',
    properties: ['openDirectory'],
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle(IPC_CHANNELS.loadConfig, () => loadConfig());
ipcMain.handle(IPC_CHANNELS.saveConfig, (_event, cfg: FrameGuiConfig) => {
  saveConfig(cfg);
});

ipcMain.handle(IPC_CHANNELS.openCsv, async (_event, defaultDir?: string) => {
  const result = await dialog.showOpenDialog({
    title: 'Open frame CSV',
    defaultPath: defaultDir || undefined,
    filters: [{ name: 'CSV files', extensions: ['csv'] }],
    properties: ['openFile'],
  });

  if (result.canceled) {
    return null;
  }

  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf8');
  return { filePath, content };
});

ipcMain.handle(IPC_CHANNELS.saveCsv, (_event, request: SaveCsvRequest) => {
  const importDir = path.join(request.repoRoot, 'pipeline', 'import');
  fs.mkdirSync(importDir, { recursive: true });

  const savedPath = path.join(importDir, request.filename);
  fs.writeFileSync(savedPath, request.content, 'utf8');

  return { savedPath };
});

ipcMain.handle(IPC_CHANNELS.runIngest, (_event, request: RunIngestRequest) => {
  const tsxBin = path.join(
    request.repoRoot,
    'node_modules',
    '.bin',
    `tsx${process.platform === 'win32' ? '.cmd' : ''}`
  );

  return runProcess(
    tsxBin,
    ['pipeline/scripts/ingest.ts', '--type', 'frame', '--csv', request.csvPath],
    request.repoRoot
  );
});

ipcMain.handle(IPC_CHANNELS.runPipeline, (_event, request: RunPipelineRequest) => {
  return runProcess('npm', ['run', 'pipeline'], request.repoRoot, true);
});
