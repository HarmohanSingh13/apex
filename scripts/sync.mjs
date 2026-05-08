/**
 * Syncs canonical agent files from the repo root into templates/ so they
 * get bundled into the published package. Run automatically before every
 * build via the "prebuild" script.
 *
 * Source                          → Destination (inside templates/)
 * ─────────────────────────────────────────────────────────────────
 * .agents/                        → templates/.agents/
 * .claude/agents/                 → templates/.claude/agents/
 * .cursor/                        → templates/.cursor/
 * .gemini/                        → templates/.gemini/
 * .github/                        → templates/.github/
 * .kiro/                          → templates/.kiro/
 * .opencode/                      → templates/.opencode/
 */

import { cpSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname    = dirname(fileURLToPath(import.meta.url));
const rootDir      = join(__dirname, '..');           // scripts/ → root
const templatesDir = join(__dirname, '../templates'); // scripts/ → root/templates

const mappings = [
  { src: join(rootDir, '.agents'),           dest: join(templatesDir, '.agents') },
  { src: join(rootDir, '.claude', 'agents'), dest: join(templatesDir, '.claude', 'agents') },
  { src: join(rootDir, '.cursor'),           dest: join(templatesDir, '.cursor') },
  { src: join(rootDir, '.gemini'),           dest: join(templatesDir, '.gemini') },
  { src: join(rootDir, '.github'),           dest: join(templatesDir, '.github') },
  { src: join(rootDir, '.kiro'),             dest: join(templatesDir, '.kiro') },
  { src: join(rootDir, '.opencode'),         dest: join(templatesDir, '.opencode') },
];

let synced  = 0;
let missing = 0;

for (const { src, dest } of mappings) {
  if (!existsSync(src)) {
    console.warn(`  skip  ${src} (not found)`);
    missing++;
    continue;
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, {
    recursive: true,
    force: true,
    filter: (source) => {
      if (source.includes('settings.local.json')) return false;
      if (/\.(docx|pdf|exe|dll)$/i.test(source))  return false;
      if (/assets[/\\](Swaraj|mahindra-rise).*\.png$/i.test(source)) return false;
      return true;
    },
  });
  console.log(`  sync  ${src.replace(rootDir, '.')} → ${dest.replace(rootDir, '.')}`);
  synced++;
}

console.log(`\n  Templates synced: ${synced} director${synced !== 1 ? 'ies' : 'y'} (${missing} skipped)\n`);
