/**
 * Evita builds de producción con VITE_API_BASE_URL apuntando a localhost:
 * en el navegador del usuario 127.0.0.1 es su propia máquina, no el VPS.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const BAD = /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?\b/i;

function stripQuotes(v) {
  const t = v.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\n/)) {
    const m = line.match(/^\s*VITE_API_BASE_URL\s*=\s*(.*)$/);
    if (m) out.VITE_API_BASE_URL = stripQuotes(m[1]);
  }
  return out;
}

const fromFiles = [
  parseEnvFile(path.join(root, '.env')),
  parseEnvFile(path.join(root, '.env.local')),
  parseEnvFile(path.join(root, '.env.production')),
  parseEnvFile(path.join(root, '.env.production.local')),
];

const merged = Object.assign({}, ...fromFiles);
const fromEnv = process.env.VITE_API_BASE_URL;
const effective =
  fromEnv !== undefined && fromEnv !== ''
    ? fromEnv
    : merged.VITE_API_BASE_URL;

if (effective !== undefined && effective !== '' && BAD.test(effective)) {
  console.error(
    '[build] VITE_API_BASE_URL apunta a localhost/127.0.0.1:',
    effective,
  );
  console.error(
    '[build] En producción detrás de Nginx use ruta relativa /api o deje la variable sin definir.',
  );
  process.exit(1);
}

process.exit(0);
