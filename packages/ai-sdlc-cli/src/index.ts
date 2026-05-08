#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { installCommand } from './commands/install.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require(join(__dirname, '../package.json')) as { version: string };

const program = new Command();

program
  .name('ai-sdlc')
  .description('Mahindra Enterprise AI-SDLC Framework — install agent skills and workflows into any project')
  .version(pkg.version);

program
  .command('install')
  .description('Install AI-SDLC skills into the current project')
  .option('--all', 'Install for all supported agents, even if not auto-detected')
  .option('--prefix <prefix>', 'Prefix added to each installed skill/rule name')
  .option('--dry-run', 'Preview what would be installed without writing files')
  .action(installCommand);

// default: run install when no command given
program.action(() => {
  installCommand({ all: false });
});

program.parse();
