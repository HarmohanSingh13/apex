import { installCommand } from './commands/install.js';

const VERSION = '1.0.0';

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
  console.log(VERSION);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  ai-sdlc v${VERSION}
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
