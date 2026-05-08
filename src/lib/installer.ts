import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';
import type { ProviderConfig } from './providers.js';

export interface InstallOptions {
  templatesDir: string;
  targetDir: string;
  provider: string;
  config: ProviderConfig;
  dryRun: boolean;
}

export interface InstallResult {
  installed: number;
  skipped: number;
}

export function installProvider(opts: InstallOptions): InstallResult {
  const srcDir  = join(opts.templatesDir, opts.config.sourceDir);
  const destDir = join(opts.targetDir, opts.config.targetDir);

  if (!existsSync(srcDir)) return { installed: 0, skipped: 0 };

  return copyDir(srcDir, destDir, opts.dryRun);
}

function copyDir(src: string, dest: string, dryRun: boolean): InstallResult {
  let installed = 0;
  let skipped   = 0;

  if (!dryRun) mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const sub = copyDir(join(src, entry.name), join(dest, entry.name), dryRun);
      installed += sub.installed;
      skipped   += sub.skipped;
    } else if (entry.isFile()) {
      const srcFile  = join(src, entry.name);
      const destFile = join(dest, entry.name);

      if (existsSync(destFile) && sha256(srcFile) === sha256(destFile)) {
        skipped++;
        continue;
      }

      if (!dryRun) copyFileSync(srcFile, destFile);
      installed++;
    }
  }

  return { installed, skipped };
}

function sha256(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}
