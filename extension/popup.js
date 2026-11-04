import { maxBoardBytes, reviewBoard } from './board.js';

const byId = (id) => document.getElementById(id);
const choose = byId('choose');
const sample = byId('sample');
const fileInput = byId('board-file');
const report = byId('report');
const status = byId('status');
const error = byId('error');
const maxVisibleFindings = 100;

async function updateInstructions() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    const url = new URL(tab.url);
    const onCircuit = url.protocol === 'https:'
      && ['www.tinkercad.com', 'tinkercad.com'].includes(url.hostname)
      && /^\/things\/[^/]+\/editel(?:\/|$)/.test(url.pathname);
    if (onCircuit) {
      byId('instructions').textContent = 'Tinkercad circuit open. Use Send To or Export to download the EAGLE board when available, then select it here.';
    }
  } catch {
    // The manual import remains available if the active tab cannot be read.
  }
}

function showReport(result, source) {
  byId('source').textContent = source;
  for (const metric of ['components', 'signals', 'contacts']) {
    byId(metric).textContent = result[metric];
  }

  const list = byId('findings');
  const errors = result.findings.filter((finding) => finding.kind === 'error');
  const notes = result.findings.filter((finding) => finding.kind === 'review');
  const summary = result.findings.length
    ? `${errors.length} export ${errors.length === 1 ? 'error' : 'errors'} · ${notes.length} review ${notes.length === 1 ? 'note' : 'notes'}`
    : 'No findings in the supported checks.';
  byId('finding-summary').textContent = result.contacts === 0
    ? `${summary} No signal contacts were available to inspect.`
    : summary;

  const items = document.createDocumentFragment();
  for (const { kind, rule, subject, detail } of [...errors, ...notes].slice(0, maxVisibleFindings)) {
    const item = document.createElement('li');
    const heading = document.createElement('h3');
    const description = document.createElement('p');
    heading.className = kind;
    heading.textContent = `${kind === 'error' ? 'Export error' : 'Review note'} · ${rule}`;
    description.textContent = `${subject} — ${detail}`;
    item.append(heading, description);
    items.append(item);
  }
  list.replaceChildren(items);

  if (result.findings.length > maxVisibleFindings) {
    byId('finding-summary').append(`. Showing the first ${maxVisibleFindings} findings.`);
  }
  report.hidden = false;
  return summary;
}

async function runReview(source, readBoard) {
  report.hidden = true;
  status.textContent = 'Reading board…';
  error.textContent = '';
  choose.disabled = sample.disabled = true;

  try {
    const summary = showReport(reviewBoard(await readBoard()), source);
    status.textContent = `Review complete. ${summary}`;
  } catch (failure) {
    status.textContent = '';
    error.textContent = failure instanceof Error ? failure.message : 'The board could not be read.';
  } finally {
    choose.disabled = sample.disabled = false;
  }
}

choose.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const [file] = fileInput.files;
  fileInput.value = '';
  if (!file) return;

  void runReview(file.name, async () => {
    if (file.size > maxBoardBytes) throw new Error('Choose a board file up to 5 MB.');
    return file.text();
  });
});

sample.addEventListener('click', () => {
  void runReview('Built-in example · synthetic circuit', async () => {
    const response = await fetch('./example.brd');
    if (!response.ok) throw new Error('The built-in example could not be loaded.');
    return response.text();
  });
});

void updateInstructions();
