'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Folder picker
  selectRepoRoot: () => ipcRenderer.invoke('dialog:select-folder'),

  // Persistent config
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (cfg) => ipcRenderer.invoke('config:save', cfg),

  // File I/O
  openCsvFile: (defaultDir) => ipcRenderer.invoke('fs:open-csv', defaultDir),
  saveCsv: (opts) => ipcRenderer.invoke('fs:save-csv', opts),

  // Child processes
  runIngest: (opts) => ipcRenderer.invoke('proc:run-ingest', opts),
  runPipeline: (opts) => ipcRenderer.invoke('proc:run-pipeline', opts),
});
