import { contextBridge, ipcRenderer } from 'electron';
import {
  ElectronApi,
  FrameGuiConfig,
  IPC_CHANNELS,
  RunIngestRequest,
  RunPipelineRequest,
  SaveCsvRequest,
} from './shared/ipc';

const electronApi: ElectronApi = {
  selectRepoRoot: () => ipcRenderer.invoke(IPC_CHANNELS.selectFolder) as Promise<string | null>,
  loadConfig: () => ipcRenderer.invoke(IPC_CHANNELS.loadConfig) as Promise<FrameGuiConfig>,
  saveConfig: (cfg: FrameGuiConfig) => ipcRenderer.invoke(IPC_CHANNELS.saveConfig, cfg) as Promise<void>,
  openCsvFile: (defaultDir?: string) => ipcRenderer.invoke(IPC_CHANNELS.openCsv, defaultDir),
  saveCsv: (opts: SaveCsvRequest) => ipcRenderer.invoke(IPC_CHANNELS.saveCsv, opts),
  runIngest: (opts: RunIngestRequest) => ipcRenderer.invoke(IPC_CHANNELS.runIngest, opts),
  runPipeline: (opts: RunPipelineRequest) => ipcRenderer.invoke(IPC_CHANNELS.runPipeline, opts),
};

contextBridge.exposeInMainWorld('electronAPI', electronApi);
