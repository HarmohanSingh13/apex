import { createInterface } from 'readline';
import { dirname, join } from 'path';
import { detectProviders, PROVIDERS } from '../lib/providers.js';
import { installProvider } from '../lib/installer.js';
import { bold, dim, green, yellow, cyan } from '../lib/ansi.js';

// After esbuild bundles to dist/index.js, process.argv[1] = dist/index.js
// dirname gives dist/ and ../templates gives the templates/ root
const templatesDir = join(dirname(process.argv[1]), '../templates');

export interface InstallOptions {
  all?: boolean;
}

export async function installCommand(options: InstallOptions): Promise<void> {
  const targetDir = process.cwd();

  console.log(bold('\n  AI-SDLC Framework\n'));

  const detected = detectProviders(targetDir);

  let toInstall: string[];

  if (options.all) {
    toInstall = Object.keys(PROVIDERS);
    console.log(dim('  Installing for all supported agents...\n'));
  } else if (detected.length > 0) {
    toInstall = detected;
    console.log(dim(`  Detected: ${detected.map(k => PROVIDERS[k].label).join(', ')}\n`));
  } else {
    toInstall = await promptForAgents();
  }

  let installedCount = 0;

  for (const provider of toInstall) {
    const config = PROVIDERS[provider];
    if (!config) continue;

    const result = installProvider({
      templatesDir,
      targetDir,
      provider,
      config,
      dryRun: false,
    });

    if (result.installed > 0) {
      console.log(`${green('  ✓')} ${bold(config.label)}`);
      console.log(dim(`    → ${config.targetDir}  (${result.installed} file${result.installed !== 1 ? 's' : ''})`));
      installedCount++;
    } else {
      console.log(dim(`  - ${config.label} — already up to date`));
    }
  }

  console.log('');

  if (installedCount > 0) {
    console.log(green(`  Done! Workflows installed for ${installedCount} agent(s).\n`));
  } else {
    console.log(dim('  Everything is already up to date.\n'));
  }
}

async function promptForAgents(): Promise<string[]> {
  const entries = Object.entries(PROVIDERS);

  console.log(yellow('  No agent directory detected in this project.\n'));
  console.log('  Which AI agent are you using?\n');

  entries.forEach(([, cfg], i) => {
    console.log(`    ${bold(String(i + 1))}) ${cfg.label}`);
  });
  console.log(`    ${bold(String(entries.length + 1))}) All of the above\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question('  Enter number: ', (answer) => {
      rl.close();
      console.log('');

      const num = parseInt(answer.trim(), 10);

      if (num === entries.length + 1) {
        resolve(entries.map(([key]) => key));
      } else if (num >= 1 && num <= entries.length) {
        resolve([entries[num - 1][0]]);
      } else {
        console.log(dim('  Invalid selection. Installing generic .agents/ as fallback.\n'));
        resolve(['agents']);
      }
    });
  });
}
