import { installCommand } from './commands/install.js';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json') as { version: string };

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  ai-sdlc v${pkg.version}
  Enterprise AI-SDLC Framework

  Usage:
    npx github:HarmohanSingh13/apex           Auto-detect agent and install
    npx github:HarmohanSingh13/apex --all     Install for all supported agents

  Options:
    --all         Install for all agents, not just auto-detected
    --version     Show version number
    --help        Show this help message
`);
  process.exit(0);
}

installCommand({ all: args.includes('--all') });
