import chalk from 'chalk';
import { dirname, join } from 'path';
import { detectProviders, PROVIDERS } from '../lib/providers.js';
import { installProvider } from '../lib/installer.js';

// After esbuild bundles to dist/index.js, process.argv[1] = dist/index.js
// So dirname gives dist/ and ../templates gives the templates/ root
const templatesDir = join(dirname(process.argv[1]), '../templates');

export interface InstallOptions {
  all?: boolean;
  dryRun?: boolean;
}

export async function installCommand(options: InstallOptions): Promise<void> {
  const targetDir = process.cwd();

  console.log(chalk.bold('\n  AI-SDLC Framework\n'));

  const detected = detectProviders(targetDir);

  let toInstall: string[];
  if (options.all) {
    toInstall = Object.keys(PROVIDERS);
  } else if (detected.length > 0) {
    toInstall = detected;
    console.log(chalk.dim(`  Detected: ${detected.map(k => PROVIDERS[k].label).join(', ')}\n`));
  } else {
    toInstall = ['agents'];
    console.log(chalk.yellow('  No agent directories detected. Installing generic .agents/ workflows.'));
    console.log(chalk.dim('  Tip: run with --all to install adapters for all supported agents.\n'));
  }

  let installedCount = 0;
  let upToDateCount  = 0;

  for (const provider of toInstall) {
    const config = PROVIDERS[provider];
    if (!config) continue;

    const result = installProvider({
      templatesDir,
      targetDir,
      provider,
      config,
      dryRun: options.dryRun ?? false,
    });

    if (result.installed > 0) {
      const icon = options.dryRun ? chalk.cyan('  ○') : chalk.green('  ✓');
      console.log(`${icon} ${chalk.bold(config.label)}`);
      console.log(chalk.dim(`    → ${config.targetDir}  (${result.installed} file${result.installed !== 1 ? 's' : ''})`));
      installedCount++;
    } else {
      console.log(chalk.dim(`  - ${config.label} — already up to date`));
      upToDateCount++;
    }
  }

  console.log('');

  if (options.dryRun) {
    console.log(chalk.cyan('  Dry run complete. No files were written.\n'));
    return;
  }

  if (installedCount > 0) {
    console.log(chalk.green(`  Done! Workflows installed for ${installedCount} agent(s).`));
  } else {
    console.log(chalk.dim('  Everything is already up to date.'));
  }

  console.log('');
}
