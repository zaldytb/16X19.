'use strict';

// ── Column definitions ────────────────────────────────────────────────────

const COLUMNS = [
  // Required fields
  { key: 'id',            label: 'id',            type: 'string',  required: true,  default: '' },
  { key: 'name',          label: 'name',          type: 'string',  required: true,  default: '' },
  { key: 'year',          label: 'year',          type: 'integer', required: true,  default: new Date().getFullYear() },
  { key: 'headSize',      label: 'headSize',      type: 'number',  required: true,  default: 100 },
  { key: 'strungWeight',  label: 'strungWeight',  type: 'number',  required: true,  default: 300 },
  { key: 'balance',       label: 'balance',       type: 'number',  required: true,  default: 32 },
  { key: 'swingweight',   label: 'swingweight',   type: 'number',  required: true,  default: 320 },
  { key: 'stiffness',     label: 'stiffness',     type: 'number',  required: true,  default: 65 },
  { key: 'beamWidth',     label: 'beamWidth',     type: 'string',  required: true,  default: '23',    hint: 'e.g. 23 or 23,26,23' },
  { key: 'pattern',       label: 'pattern',       type: 'string',  required: true,  default: '16x19', hint: 'e.g. 16x19' },
  { key: 'tensionRange',  label: 'tensionRange',  type: 'string',  required: true,  default: '50,59', hint: 'e.g. 50,59' },
  // Optional fields
  { key: 'balancePts',    label: 'balancePts',    type: 'string',  required: false, default: '' },
  { key: 'powerLevel',    label: 'powerLevel',    type: 'string',  required: false, default: '' },
  { key: 'strokeStyle',   label: 'strokeStyle',   type: 'string',  required: false, default: '' },
  { key: 'swingSpeed',    label: 'swingSpeed',    type: 'string',  required: false, default: '' },
  { key: 'frameProfile',  label: 'frameProfile',  type: 'string',  required: false, default: '' },
  { key: 'identity',      label: 'identity',      type: 'string',  required: false, default: '' },
  { key: 'notes',         label: 'notes',         type: 'string',  required: false, default: '' },
  // _meta fields
  { key: 'aeroBonus',     label: 'aeroBonus',     type: 'number',  required: false, default: 0 },
  { key: 'comfortTech',   label: 'comfortTech',   type: 'number',  required: false, default: 0 },
  { key: 'spinTech',      label: 'spinTech',      type: 'number',  required: false, default: 0 },
  { key: 'genBonus',      label: 'genBonus',      type: 'number',  required: false, default: 0 },
];

// CSV header order (matches ingest.js expectation)
const CSV_HEADERS = [
  'id','name','year','headSize','strungWeight','balance','balancePts',
  'swingweight','stiffness','beamWidth','pattern','tensionRange',
  'powerLevel','strokeStyle','swingSpeed','frameProfile','identity','notes',
  'aeroBonus','comfortTech','spinTech','genBonus',
];

// ── State ─────────────────────────────────────────────────────────────────

let rows = [];           // Array of row objects {id, name, year, ...}
let selectedRow = null;  // index
let repoRoot = '';

// ── DOM refs ──────────────────────────────────────────────────────────────

const repoRootInput  = document.getElementById('repoRootInput');
const browseBtn      = document.getElementById('browseBtn');
const addRowBtn      = document.getElementById('addRowBtn');
const dupRowBtn      = document.getElementById('dupRowBtn');
const delRowBtn      = document.getElementById('delRowBtn');
const clearAllBtn    = document.getElementById('clearAllBtn');
const loadCsvBtn     = document.getElementById('loadCsvBtn');
const saveCsvBtn     = document.getElementById('saveCsvBtn');
const importBtn      = document.getElementById('importBtn');
const runPipelineChk = document.getElementById('runPipelineChk');
const tableBody      = document.getElementById('tableBody');
const logPanel       = document.getElementById('log-panel');
const emptyState     = document.getElementById('empty-state');
const rowCount       = document.getElementById('rowCount');

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  buildTableHead();
  const cfg = await window.electronAPI.loadConfig();
  if (cfg && cfg.repoRoot) {
    repoRoot = cfg.repoRoot;
    repoRootInput.value = repoRoot;
  }
  renderTable();
  updateButtonStates();
}

// ── Table head ────────────────────────────────────────────────────────────

function buildTableHead() {
  const thead = document.querySelector('#frame-table thead tr');
  // Row-number header
  const th0 = document.createElement('th');
  th0.textContent = '#';
  thead.appendChild(th0);

  for (const col of COLUMNS) {
    const th = document.createElement('th');
    th.textContent = col.label;
    th.className = `col-${col.key}${col.required ? ' req' : ''}`;
    if (col.hint) th.title = col.hint;
    thead.appendChild(th);
  }
}

// ── Row creation ──────────────────────────────────────────────────────────

function emptyRow() {
  const row = {};
  for (const col of COLUMNS) row[col.key] = col.default;
  return row;
}

function cloneRow(r) {
  return Object.assign({}, r);
}

// ── Render ────────────────────────────────────────────────────────────────

function renderTable() {
  tableBody.innerHTML = '';
  emptyState.style.display = rows.length === 0 ? 'flex' : 'none';
  rowCount.textContent = `${rows.length} row${rows.length !== 1 ? 's' : ''}`;

  rows.forEach((row, rowIdx) => {
    const tr = document.createElement('tr');
    if (rowIdx === selectedRow) tr.classList.add('selected');

    // Row-number cell
    const td0 = document.createElement('td');
    td0.className = 'row-num';
    td0.textContent = rowIdx + 1;
    td0.addEventListener('click', () => selectRow(rowIdx));
    tr.appendChild(td0);

    for (const col of COLUMNS) {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = col.type === 'number' || col.type === 'integer' ? 'number' : 'text';
      input.value = row[col.key] !== undefined ? row[col.key] : col.default;
      input.className = '';
      if (col.type === 'integer') input.step = '1';
      if (col.hint) input.placeholder = col.hint;

      input.addEventListener('focus', () => selectRow(rowIdx));
      input.addEventListener('input', () => {
        let val = input.value;
        if (col.type === 'number') val = val === '' ? col.default : parseFloat(val);
        else if (col.type === 'integer') val = val === '' ? col.default : parseInt(val, 10);
        rows[rowIdx][col.key] = val;
        validateCell(input, col, val);
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

function validateCell(input, col, val) {
  let invalid = false;
  if (col.required) {
    if (val === '' || val === null || val === undefined) invalid = true;
  }
  if (col.key === 'pattern' && val && !/^\d+x\d+$/.test(val)) invalid = true;
  if (col.key === 'id' && val && !/^[a-z0-9-]+$/.test(val)) invalid = true;
  if (col.key === 'beamWidth' && val && !/^[\d.,\s]+$/.test(val)) invalid = true;
  if (col.key === 'tensionRange' && val && !/^\d+\s*,\s*\d+$/.test(val)) invalid = true;
  input.classList.toggle('invalid', invalid);
}

// ── Row selection ─────────────────────────────────────────────────────────

function selectRow(idx) {
  selectedRow = idx;
  document.querySelectorAll('#frame-table tbody tr').forEach((tr, i) => {
    tr.classList.toggle('selected', i === idx);
  });
  updateButtonStates();
}

function updateButtonStates() {
  const hasRows = rows.length > 0;
  const hasSelection = selectedRow !== null && selectedRow < rows.length;
  dupRowBtn.disabled = !hasSelection;
  delRowBtn.disabled = !hasSelection;
  clearAllBtn.disabled = !hasRows;
  saveCsvBtn.disabled = !hasRows;
  importBtn.disabled = !hasRows;
}

// ── Row operations ────────────────────────────────────────────────────────

addRowBtn.addEventListener('click', () => {
  rows.push(emptyRow());
  selectedRow = rows.length - 1;
  renderTable();
  updateButtonStates();
  // Scroll new row into view and focus first cell
  const lastTr = tableBody.lastElementChild;
  if (lastTr) {
    lastTr.scrollIntoView({ block: 'nearest' });
    const firstInput = lastTr.querySelector('input');
    if (firstInput) firstInput.focus();
  }
});

dupRowBtn.addEventListener('click', () => {
  if (selectedRow === null) return;
  const copy = cloneRow(rows[selectedRow]);
  rows.splice(selectedRow + 1, 0, copy);
  selectedRow = selectedRow + 1;
  renderTable();
  updateButtonStates();
});

delRowBtn.addEventListener('click', () => {
  if (selectedRow === null) return;
  rows.splice(selectedRow, 1);
  selectedRow = rows.length > 0 ? Math.min(selectedRow, rows.length - 1) : null;
  renderTable();
  updateButtonStates();
});

clearAllBtn.addEventListener('click', () => {
  if (rows.length === 0) return;
  if (!confirm(`Clear all ${rows.length} row(s)?`)) return;
  rows = [];
  selectedRow = null;
  renderTable();
  updateButtonStates();
  log('Cleared all rows.', 'muted');
});

// ── Repo root ─────────────────────────────────────────────────────────────

browseBtn.addEventListener('click', async () => {
  const folder = await window.electronAPI.selectRepoRoot();
  if (folder) {
    repoRoot = folder;
    repoRootInput.value = folder;
    await window.electronAPI.saveConfig({ repoRoot: folder });
    log(`Repo root set to: ${folder}`, 'info');
  }
});

repoRootInput.addEventListener('change', async () => {
  repoRoot = repoRootInput.value.trim();
  await window.electronAPI.saveConfig({ repoRoot });
});

// ── CSV serialization ─────────────────────────────────────────────────────

function csvCell(val) {
  const s = (val === undefined || val === null) ? '' : String(val);
  // Always quote if contains comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function rowsToCsv(rowList) {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rowList) {
    const cells = CSV_HEADERS.map(h => csvCell(row[h] !== undefined ? row[h] : ''));
    lines.push(cells.join(','));
  }
  return lines.join('\r\n');
}

function parseCsv(text) {
  // Simple RFC 4180 parser
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parsed = [];
  let i = 0;

  function parseField() {
    if (lines[i] === '"') {
      i++; // skip opening quote
      let field = '';
      while (i < lines.length) {
        if (lines[i] === '"' && lines[i + 1] === '"') {
          field += '"'; i += 2;
        } else if (lines[i] === '"') {
          i++; break;
        } else {
          field += lines[i++];
        }
      }
      return field;
    } else {
      let field = '';
      while (i < lines.length && lines[i] !== ',' && lines[i] !== '\n') {
        field += lines[i++];
      }
      return field;
    }
  }

  function parseLine() {
    const fields = [];
    while (i < lines.length && lines[i] !== '\n') {
      fields.push(parseField());
      if (i < lines.length && lines[i] === ',') i++;
    }
    if (lines[i] === '\n') i++;
    return fields;
  }

  const headerFields = parseLine();
  while (i < lines.length) {
    if (lines[i] === '\n') { i++; continue; }
    const fields = parseLine();
    if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) continue;
    const obj = {};
    headerFields.forEach((h, idx) => { obj[h] = fields[idx] !== undefined ? fields[idx] : ''; });
    parsed.push(obj);
  }
  return parsed;
}

function csvRowToTableRow(csvObj) {
  const row = emptyRow();
  for (const col of COLUMNS) {
    const raw = csvObj[col.key];
    if (raw === undefined || raw === '') continue;
    if (col.type === 'number') row[col.key] = parseFloat(raw) || col.default;
    else if (col.type === 'integer') row[col.key] = parseInt(raw, 10) || col.default;
    else row[col.key] = raw;
  }
  return row;
}

// ── File operations ───────────────────────────────────────────────────────

loadCsvBtn.addEventListener('click', async () => {
  const importDir = repoRoot ? repoRoot + '/pipeline/import' : undefined;
  const result = await window.electronAPI.openCsvFile(importDir);
  if (!result) return;

  try {
    const parsed = parseCsv(result.content);
    if (parsed.length === 0) { log('CSV file is empty or has no data rows.', 'warn'); return; }
    rows = parsed.map(csvRowToTableRow);
    selectedRow = null;
    renderTable();
    updateButtonStates();
    log(`Loaded ${rows.length} row(s) from: ${result.filePath}`, 'ok');
  } catch (err) {
    log(`Error parsing CSV: ${err.message}`, 'error');
  }
});

saveCsvBtn.addEventListener('click', async () => {
  if (!repoRoot) { log('Set the repo root first.', 'warn'); return; }
  if (rows.length === 0) { log('No rows to save.', 'warn'); return; }
  await doSaveCsv('frames-batch.csv');
});

async function doSaveCsv(filename) {
  const content = rowsToCsv(rows);
  const result = await window.electronAPI.saveCsv({ repoRoot, filename, content });
  log(`Saved CSV to: ${result.savedPath}`, 'ok');
  return result.savedPath;
}

// ── Import ────────────────────────────────────────────────────────────────

importBtn.addEventListener('click', async () => {
  if (!repoRoot) { log('Set the repo root first.', 'warn'); return; }
  if (rows.length === 0) { log('No rows to import.', 'warn'); return; }

  importBtn.disabled = true;
  importBtn.textContent = 'Importing…';

  try {
    // 1. Save CSV
    log('Saving CSV…', 'info');
    const csvPath = await doSaveCsv('frames-gui.csv');

    // 2. Run ingest
    log(`Running: tsx pipeline/scripts/ingest.ts --type frame --csv ${csvPath}`, 'info');
    const ingestResult = await window.electronAPI.runIngest({ repoRoot, csvPath });

    if (ingestResult.stdout) {
      ingestResult.stdout.trim().split('\n').forEach(l => log(l, 'muted'));
    }

    if (ingestResult.code === 0) {
      // Parse summary from stdout
      const addedMatch  = ingestResult.stdout.match(/(\d+)\s+added/i);
      const skippedMatch = ingestResult.stdout.match(/(\d+)\s+skipped/i);
      const added   = addedMatch  ? addedMatch[1]  : '?';
      const skipped = skippedMatch ? skippedMatch[1] : '0';
      log(`Ingest completed: ${added} added, ${skipped} skipped.`, 'ok');
    } else {
      if (ingestResult.stderr) {
        ingestResult.stderr.trim().split('\n').forEach(l => log(l, 'error'));
      }
      log(`Ingest exited with code ${ingestResult.code}. Check CSV rows for errors.`, 'error');
    }

    // 3. Optionally run pipeline
    if (runPipelineChk.checked && ingestResult.code === 0) {
      log('Running: npm run pipeline…', 'info');
      const pipeResult = await window.electronAPI.runPipeline({ repoRoot });
      if (pipeResult.stdout) {
        pipeResult.stdout.trim().split('\n').forEach(l => log(l, 'muted'));
      }
      if (pipeResult.code === 0) {
        log('Pipeline completed. data.js regenerated.', 'ok');
      } else {
        if (pipeResult.stderr) {
          pipeResult.stderr.trim().split('\n').forEach(l => log(l, 'error'));
        }
        log(`Pipeline exited with code ${pipeResult.code}.`, 'error');
      }
    }

  } catch (err) {
    log(`Unexpected error: ${err.message}`, 'error');
  } finally {
    importBtn.disabled = false;
    importBtn.textContent = 'Import into Loadout Lab';
    updateButtonStates();
  }
});

// ── Log ───────────────────────────────────────────────────────────────────

function log(msg, level = 'info') {
  const span = document.createElement('span');
  span.className = `log-line ${level}`;
  const ts = new Date().toLocaleTimeString();
  span.textContent = `[${ts}] ${msg}`;
  logPanel.appendChild(span);
  logPanel.scrollTop = logPanel.scrollHeight;
}

// ── Boot ──────────────────────────────────────────────────────────────────

init();
