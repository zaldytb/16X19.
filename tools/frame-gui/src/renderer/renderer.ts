import type {
  ColumnDefinition,
  FrameGuiRow,
  FrameGuiRowValue,
  OpenCsvResult,
  ProcessResult,
} from '../shared/ipc';

type LogLevel = 'info' | 'warn' | 'error' | 'ok' | 'muted';
type RowIndex = number | null;
type CsvRow = Record<string, string>;

const COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'id', type: 'string', required: true, default: '' },
  { key: 'name', label: 'name', type: 'string', required: true, default: '' },
  { key: 'year', label: 'year', type: 'integer', required: true, default: new Date().getFullYear() },
  { key: 'headSize', label: 'headSize', type: 'number', required: true, default: 100 },
  { key: 'strungWeight', label: 'strungWeight', type: 'number', required: true, default: 300 },
  { key: 'balance', label: 'balance', type: 'number', required: true, default: 32 },
  { key: 'swingweight', label: 'swingweight', type: 'number', required: true, default: 320 },
  { key: 'stiffness', label: 'stiffness', type: 'number', required: true, default: 65 },
  { key: 'beamWidth', label: 'beamWidth', type: 'string', required: true, default: '23', hint: 'e.g. 23 or 23,26,23' },
  { key: 'pattern', label: 'pattern', type: 'string', required: true, default: '16x19', hint: 'e.g. 16x19' },
  { key: 'tensionRange', label: 'tensionRange', type: 'string', required: true, default: '50,59', hint: 'e.g. 50,59' },
  { key: 'balancePts', label: 'balancePts', type: 'string', required: false, default: '' },
  { key: 'powerLevel', label: 'powerLevel', type: 'string', required: false, default: '' },
  { key: 'strokeStyle', label: 'strokeStyle', type: 'string', required: false, default: '' },
  { key: 'swingSpeed', label: 'swingSpeed', type: 'string', required: false, default: '' },
  { key: 'frameProfile', label: 'frameProfile', type: 'string', required: false, default: '' },
  { key: 'identity', label: 'identity', type: 'string', required: false, default: '' },
  { key: 'notes', label: 'notes', type: 'string', required: false, default: '' },
  { key: 'aeroBonus', label: 'aeroBonus', type: 'number', required: false, default: 0 },
  { key: 'comfortTech', label: 'comfortTech', type: 'number', required: false, default: 0 },
  { key: 'spinTech', label: 'spinTech', type: 'number', required: false, default: 0 },
  { key: 'genBonus', label: 'genBonus', type: 'number', required: false, default: 0 },
];

const CSV_HEADERS = [
  'id', 'name', 'year', 'headSize', 'strungWeight', 'balance', 'balancePts',
  'swingweight', 'stiffness', 'beamWidth', 'pattern', 'tensionRange',
  'powerLevel', 'strokeStyle', 'swingSpeed', 'frameProfile', 'identity', 'notes',
  'aeroBonus', 'comfortTech', 'spinTech', 'genBonus',
] as const;

let rows: FrameGuiRow[] = [];
let selectedRow: RowIndex = null;
let repoRoot = '';

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as T;
}

function requireQuery<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element as T;
}

const repoRootInput = requireElement<HTMLInputElement>('repoRootInput');
const browseBtn = requireElement<HTMLButtonElement>('browseBtn');
const addRowBtn = requireElement<HTMLButtonElement>('addRowBtn');
const dupRowBtn = requireElement<HTMLButtonElement>('dupRowBtn');
const delRowBtn = requireElement<HTMLButtonElement>('delRowBtn');
const clearAllBtn = requireElement<HTMLButtonElement>('clearAllBtn');
const loadCsvBtn = requireElement<HTMLButtonElement>('loadCsvBtn');
const saveCsvBtn = requireElement<HTMLButtonElement>('saveCsvBtn');
const importBtn = requireElement<HTMLButtonElement>('importBtn');
const runPipelineChk = requireElement<HTMLInputElement>('runPipelineChk');
const tableBody = requireElement<HTMLTableSectionElement>('tableBody');
const logPanel = requireElement<HTMLDivElement>('log-panel');
const emptyState = requireElement<HTMLDivElement>('empty-state');
const rowCount = requireElement<HTMLSpanElement>('rowCount');

async function init(): Promise<void> {
  buildTableHead();
  const cfg = await window.electronAPI.loadConfig();
  if (cfg.repoRoot) {
    repoRoot = cfg.repoRoot;
    repoRootInput.value = repoRoot;
  }
  renderTable();
  updateButtonStates();
}

function buildTableHead(): void {
  const theadRow = requireQuery<HTMLTableRowElement>('#frame-table thead tr');
  theadRow.innerHTML = '';

  const rowNumberHeader = document.createElement('th');
  rowNumberHeader.textContent = '#';
  theadRow.appendChild(rowNumberHeader);

  for (const col of COLUMNS) {
    const th = document.createElement('th');
    th.textContent = col.label;
    th.className = `col-${col.key}${col.required ? ' req' : ''}`;
    if (col.hint) {
      th.title = col.hint;
    }
    theadRow.appendChild(th);
  }
}

function emptyRow(): FrameGuiRow {
  const row: FrameGuiRow = {};
  for (const col of COLUMNS) {
    row[col.key] = col.default;
  }
  return row;
}

function cloneRow(row: FrameGuiRow): FrameGuiRow {
  return { ...row };
}

function renderTable(): void {
  tableBody.innerHTML = '';
  emptyState.style.display = rows.length === 0 ? 'flex' : 'none';
  rowCount.textContent = `${rows.length} row${rows.length !== 1 ? 's' : ''}`;

  rows.forEach((row, rowIdx) => {
    const tr = document.createElement('tr');
    if (rowIdx === selectedRow) {
      tr.classList.add('selected');
    }

    const rowNumberCell = document.createElement('td');
    rowNumberCell.className = 'row-num';
    rowNumberCell.textContent = String(rowIdx + 1);
    rowNumberCell.addEventListener('click', () => selectRow(rowIdx));
    tr.appendChild(rowNumberCell);

    for (const col of COLUMNS) {
      const td = document.createElement('td');
      const input = document.createElement('input');

      input.type = col.type === 'number' || col.type === 'integer' ? 'number' : 'text';
      input.value = String(row[col.key] ?? col.default);

      if (col.type === 'integer') {
        input.step = '1';
      }
      if (col.hint) {
        input.placeholder = col.hint;
      }

      input.addEventListener('focus', () => selectRow(rowIdx));
      input.addEventListener('input', () => {
        const value = parseInputValue(input.value, col);
        rows[rowIdx][col.key] = value;
        validateCell(input, col, value);
      });
      input.addEventListener('blur', () => {
        validateCell(input, col, rows[rowIdx][col.key]);
      });

      td.appendChild(input);
      tr.appendChild(td);
    }

    tableBody.appendChild(tr);
  });
}

function parseInputValue(raw: string, col: ColumnDefinition): FrameGuiRowValue {
  if (col.type === 'number') {
    return raw === '' ? col.default : Number.parseFloat(raw);
  }
  if (col.type === 'integer') {
    return raw === '' ? col.default : Number.parseInt(raw, 10);
  }
  return raw;
}

function validateCell(input: HTMLInputElement, col: ColumnDefinition, value: FrameGuiRowValue | undefined): void {
  let invalid = false;
  const textValue = value == null ? '' : String(value);

  if (col.required && textValue === '') {
    invalid = true;
  }
  if (col.key === 'pattern' && textValue && !/^\d+x\d+$/.test(textValue)) {
    invalid = true;
  }
  if (col.key === 'id' && textValue && !/^[a-z0-9-]+$/.test(textValue)) {
    invalid = true;
  }
  if (col.key === 'beamWidth' && textValue && !/^[\d.,\s]+$/.test(textValue)) {
    invalid = true;
  }
  if (col.key === 'tensionRange' && textValue && !/^\d+\s*,\s*\d+$/.test(textValue)) {
    invalid = true;
  }

  input.classList.toggle('invalid', invalid);
}

function selectRow(idx: number): void {
  selectedRow = idx;
  document.querySelectorAll<HTMLTableRowElement>('#frame-table tbody tr').forEach((tr, index) => {
    tr.classList.toggle('selected', index === idx);
  });
  updateButtonStates();
}

function updateButtonStates(): void {
  const hasRows = rows.length > 0;
  const hasSelection = selectedRow !== null && selectedRow < rows.length;
  dupRowBtn.disabled = !hasSelection;
  delRowBtn.disabled = !hasSelection;
  clearAllBtn.disabled = !hasRows;
  saveCsvBtn.disabled = !hasRows;
  importBtn.disabled = !hasRows;
}

addRowBtn.addEventListener('click', () => {
  rows.push(emptyRow());
  selectedRow = rows.length - 1;
  renderTable();
  updateButtonStates();

  const lastRow = tableBody.lastElementChild as HTMLTableRowElement | null;
  if (lastRow) {
    lastRow.scrollIntoView({ block: 'nearest' });
    lastRow.querySelector<HTMLInputElement>('input')?.focus();
  }
});

dupRowBtn.addEventListener('click', () => {
  if (selectedRow === null) {
    return;
  }

  rows.splice(selectedRow + 1, 0, cloneRow(rows[selectedRow]));
  selectedRow += 1;
  renderTable();
  updateButtonStates();
});

delRowBtn.addEventListener('click', () => {
  if (selectedRow === null) {
    return;
  }

  rows.splice(selectedRow, 1);
  selectedRow = rows.length > 0 ? Math.min(selectedRow, rows.length - 1) : null;
  renderTable();
  updateButtonStates();
});

clearAllBtn.addEventListener('click', () => {
  if (rows.length === 0) {
    return;
  }
  if (!window.confirm(`Clear all ${rows.length} row(s)?`)) {
    return;
  }

  rows = [];
  selectedRow = null;
  renderTable();
  updateButtonStates();
  log('Cleared all rows.', 'muted');
});

browseBtn.addEventListener('click', async () => {
  const folder = await window.electronAPI.selectRepoRoot();
  if (!folder) {
    return;
  }

  repoRoot = folder;
  repoRootInput.value = folder;
  await window.electronAPI.saveConfig({ repoRoot: folder });
  log(`Repo root set to: ${folder}`, 'info');
});

repoRootInput.addEventListener('change', async () => {
  repoRoot = repoRootInput.value.trim();
  await window.electronAPI.saveConfig({ repoRoot });
});

function csvCell(value: FrameGuiRowValue | undefined): string {
  const text = value == null ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rowList: FrameGuiRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rowList) {
    lines.push(CSV_HEADERS.map((header) => csvCell(row[header])).join(','));
  }
  return lines.join('\r\n');
}

function parseCsv(text: string): CsvRow[] {
  const source = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parsed: CsvRow[] = [];
  let i = 0;

  function parseField(): string {
    if (source[i] === '"') {
      i += 1;
      let field = '';
      while (i < source.length) {
        if (source[i] === '"' && source[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (source[i] === '"') {
          i += 1;
          break;
        } else {
          field += source[i];
          i += 1;
        }
      }
      return field;
    }

    let field = '';
    while (i < source.length && source[i] !== ',' && source[i] !== '\n') {
      field += source[i];
      i += 1;
    }
    return field;
  }

  function parseLine(): string[] {
    const fields: string[] = [];
    while (i < source.length && source[i] !== '\n') {
      fields.push(parseField());
      if (i < source.length && source[i] === ',') {
        i += 1;
      }
    }
    if (source[i] === '\n') {
      i += 1;
    }
    return fields;
  }

  const headerFields = parseLine();
  while (i < source.length) {
    if (source[i] === '\n') {
      i += 1;
      continue;
    }

    const fields = parseLine();
    if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) {
      continue;
    }

    const row: CsvRow = {};
    headerFields.forEach((header, index) => {
      row[header] = fields[index] ?? '';
    });
    parsed.push(row);
  }

  return parsed;
}

function csvRowToTableRow(csvRow: CsvRow): FrameGuiRow {
  const row = emptyRow();
  for (const col of COLUMNS) {
    const raw = csvRow[col.key];
    if (raw === undefined || raw === '') {
      continue;
    }
    row[col.key] = parseCsvValue(raw, col);
  }
  return row;
}

function parseCsvValue(raw: string, col: ColumnDefinition): FrameGuiRowValue {
  if (col.type === 'number') {
    return Number.parseFloat(raw) || col.default;
  }
  if (col.type === 'integer') {
    return Number.parseInt(raw, 10) || col.default;
  }
  return raw;
}

loadCsvBtn.addEventListener('click', async () => {
  const importDir = repoRoot ? `${repoRoot}/pipeline/import` : undefined;
  const result = await window.electronAPI.openCsvFile(importDir);
  if (!result) {
    return;
  }

  try {
    rows = parseCsv(result.content).map(csvRowToTableRow);
    if (rows.length === 0) {
      log('CSV file is empty or has no data rows.', 'warn');
      return;
    }
    selectedRow = null;
    renderTable();
    updateButtonStates();
    log(`Loaded ${rows.length} row(s) from: ${result.filePath}`, 'ok');
  } catch (error) {
    log(`Error parsing CSV: ${formatError(error)}`, 'error');
  }
});

saveCsvBtn.addEventListener('click', async () => {
  if (!repoRoot) {
    log('Set the repo root first.', 'warn');
    return;
  }
  if (rows.length === 0) {
    log('No rows to save.', 'warn');
    return;
  }

  await doSaveCsv('frames-batch.csv');
});

async function doSaveCsv(filename: string): Promise<string> {
  const result = await window.electronAPI.saveCsv({
    repoRoot,
    filename,
    content: rowsToCsv(rows),
  });
  log(`Saved CSV to: ${result.savedPath}`, 'ok');
  return result.savedPath;
}

importBtn.addEventListener('click', async () => {
  if (!repoRoot) {
    log('Set the repo root first.', 'warn');
    return;
  }
  if (rows.length === 0) {
    log('No rows to import.', 'warn');
    return;
  }

  importBtn.disabled = true;
  importBtn.textContent = 'Importing...';

  try {
    log('Saving CSV...', 'info');
    const csvPath = await doSaveCsv('frames-gui.csv');

    log(`Running: tsx pipeline/scripts/ingest.ts --type frame --csv ${csvPath}`, 'info');
    const ingestResult = await window.electronAPI.runIngest({ repoRoot, csvPath });
    appendProcessLogs(ingestResult);

    if (ingestResult.code === 0) {
      const added = ingestResult.stdout.match(/(\d+)\s+added/i)?.[1] ?? '?';
      const skipped = ingestResult.stdout.match(/(\d+)\s+skipped/i)?.[1] ?? '0';
      log(`Ingest completed: ${added} added, ${skipped} skipped.`, 'ok');
    } else {
      appendProcessErrors(ingestResult);
      log(`Ingest exited with code ${String(ingestResult.code)}. Check CSV rows for errors.`, 'error');
    }

    if (runPipelineChk.checked && ingestResult.code === 0) {
      log('Running: npm run pipeline...', 'info');
      const pipelineResult = await window.electronAPI.runPipeline({ repoRoot });
      appendProcessLogs(pipelineResult);
      if (pipelineResult.code === 0) {
        log('Pipeline completed. data.ts regenerated.', 'ok');
      } else {
        appendProcessErrors(pipelineResult);
        log(`Pipeline exited with code ${String(pipelineResult.code)}.`, 'error');
      }
    }
  } catch (error) {
    log(`Unexpected error: ${formatError(error)}`, 'error');
  } finally {
    importBtn.disabled = false;
    importBtn.textContent = 'Import into Loadout Lab';
    updateButtonStates();
  }
});

function appendProcessLogs(result: ProcessResult): void {
  if (result.stdout.trim()) {
    result.stdout.trim().split('\n').forEach((line) => log(line, 'muted'));
  }
}

function appendProcessErrors(result: ProcessResult): void {
  if (result.stderr.trim()) {
    result.stderr.trim().split('\n').forEach((line) => log(line, 'error'));
  }
}

function log(message: string, level: LogLevel = 'info'): void {
  const line = document.createElement('span');
  line.className = `log-line ${level}`;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logPanel.appendChild(line);
  logPanel.scrollTop = logPanel.scrollHeight;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

void init();
