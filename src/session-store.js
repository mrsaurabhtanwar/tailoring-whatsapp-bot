const fs = require('fs');
const path = require('path');

const DEFAULT_DIR = process.env.SESSION_PATH || path.join(process.cwd(), '.wwebjs_auth');
const INFO_FILE = 'session-info.json';

function ensureDir(dir = DEFAULT_DIR) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function rotate(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const b1 = filePath + '.bak';
    const b2 = filePath + '.bak2';
    if (fs.existsSync(b1)) fs.renameSync(b1, b2);
    fs.renameSync(filePath, b1);
  } catch {}
}

function saveInfo(data, dir = DEFAULT_DIR) {
  ensureDir(dir);
  const infoPath = path.join(dir, INFO_FILE);
  try {
    rotate(infoPath);
    fs.writeFileSync(infoPath, JSON.stringify(data, null, 2));
  } catch {}
}

function loadInfo(dir = DEFAULT_DIR) {
  try {
    const p = path.join(ensureDir(dir), INFO_FILE);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return null; }
}

module.exports = { ensureDir, saveInfo, loadInfo };
