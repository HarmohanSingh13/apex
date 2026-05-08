import { Command } from 'commander';
import { installCommand } from './commands/install.js';

// package version — esbuild inlines this at build time
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json') as { version: string };

const program = new Command();

program
  .name('ai-sdlc')
  .description('Enterprise AI-SDLC Framework — install agent workflows into any project')
  .version(pkg.version);

program
  .command('install')
  .description('Install AI-SDLC workflows into the current project')
  .option('--all', 'Install for all supported agents, even if not auto-detected')
  .option('--dry-run', 'Preview what would be installed without writing files')
  .action(installCommand);

// default: run install when no command given (npx github:org/apex)
program.action(() => {
  installCommand({ all: false });
});

program.parse();
