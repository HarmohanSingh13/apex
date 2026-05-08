/**
 * Syncs canonical agent files from the repo root into templates/ so they
 * get bundled into the npm package. Run automatically before every build
 * via the "prebuild" script.
 *
 * Source                          → Destination (inside templates/)
 * ─────────────────────────────────────────────────────────────────
 * <root>/.agents/                 → templates/.agents/
 * <root>/.claude/agents/          → templates/.claude/agents/
 * <root>/.cursor/                 → templates/.cursor/
 * <root>/.gemini/                 → templates/.gemini/
 * <root>/.github/copilot-*.md    → templates/.github/
 * <root>/.kiro/                   → templates/.kiro/
 * <root>/.opencode/               → templates/.opencode/
 */

import { cpSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../../..');
const templatesDir = join(__dirname, '../templates');

const mappings = [
  { src: join(rootDir, '.agents'),           dest: join(templatesDir, '.agents') },
  { src: join(rootDir, '.claude', 'agents'), dest: join(templatesDir, '.claude', 'agents') },
  { src: join(rootDir, '.cursor'),           dest: join(templatesDir, '.cursor') },
  { src: join(rootDir, '.gemini'),           dest: join(templatesDir, '.gemini') },
  { src: join(rootDir, '.github'),           dest: join(templatesDir, '.github') },
  { src: join(rootDir, '.kiro'),             dest: join(templatesDir, '.kiro') },
  { src: join(rootDir, '.opencode'),         dest: join(templatesDir, '.opencode') },
];

let synced = 0;
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
    // Exclude binary assets and local settings that should not be published
    filter: (source) => {
      const rel = source.replace(src, '');
      if (rel.includes('settings.local.json')) return false;
      if (/\.(docx|pdf|exe|dll)$/i.test(source)) return false;
      // Exclude large logo files from .agents/assets/ — kept in repo but not shipped
      if (/assets[/\\](Swaraj|mahindra-rise).*\.png$/i.test(source)) return false;
      return true;
    },
  });
  console.log(`  sync  ${src.replace(rootDir, '.')} → ${dest.replace(join(__dirname, '..'), '.')}`);
  synced++;
}

console.log(`\n  Templates synced: ${synced} director${synced !== 1 ? 'ies' : 'y'} (${missing} skipped)\n`);
