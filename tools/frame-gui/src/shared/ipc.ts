export const IPC_CHANNELS = {
  selectFolder: 'dialog:select-folder',
  loadConfig: 'config:load',
  saveConfig: 'config:save',
  openCsv: 'fs:open-csv',
  saveCsv: 'fs:save-csv',
  runIngest: 'proc:run-ingest',
  runPipeline: 'proc:run-pipeline',
} as const;

export interface FrameGuiConfig {
  repoRoot: string;
}

export interface OpenCsvResult {
  filePath: string;
  content: string;
}

export interface SaveCsvRequest {
  repoRoot: string;
  filename: string;
  content: string;
}

export interface SaveCsvResult {
  savedPath: string;
}

export interface RunIngestRequest {
  repoRoot: string;
  csvPath: string;
}

export interface RunPipelineRequest {
  repoRoot: string;
}

export interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export interface ElectronApi {
  selectRepoRoot: () => Promise<string | null>;
  loadConfig: () => Promise<FrameGuiConfig>;
  saveConfig: (cfg: FrameGuiConfig) => Promise<void>;
  openCsvFile: (defaultDir?: string) => Promise<OpenCsvResult | null>;
  saveCsv: (opts: SaveCsvRequest) => Promise<SaveCsvResult>;
  runIngest: (opts: RunIngestRequest) => Promise<ProcessResult>;
  runPipeline: (opts: RunPipelineRequest) => Promise<ProcessResult>;
}

export type ColumnType = 'string' | 'number' | 'integer';

export type FrameGuiRowValue = string | number;

export type FrameGuiRow = Record<string, FrameGuiRowValue>;

export interface ColumnDefinition {
  key: string;
  label: string;
  type: ColumnType;
  required: boolean;
  default: FrameGuiRowValue;
  hint?: string;
}
