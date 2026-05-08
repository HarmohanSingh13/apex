import { existsSync } from 'fs';
import { join } from 'path';

export interface ProviderConfig {
  /** Human-readable label shown in CLI output */
  label: string;
  /** Directory written into the target project */
  targetDir: string;
  /** Directory whose presence triggers auto-detection */
  detectDir: string;
  /** Subdirectory inside templates/ to copy from */
  sourceDir: string;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  agents: {
    label: 'Generic (.agents)',
    targetDir: '.agents',
    detectDir: '.agents',
    sourceDir: '.agents',
  },
  claude: {
    label: 'Claude Code (.claude/agents)',
    targetDir: '.claude/agents',
    detectDir: '.claude',
    sourceDir: '.claude',
  },
  cursor: {
    label: 'Cursor (.cursor/rules)',
    targetDir: '.cursor/rules',
    detectDir: '.cursor',
    sourceDir: '.cursor',
  },
  gemini: {
    label: 'Gemini CLI (.gemini)',
    targetDir: '.gemini',
    detectDir: '.gemini',
    sourceDir: '.gemini',
  },
  github: {
    label: 'GitHub Copilot (.github)',
    targetDir: '.github',
    detectDir: '.github',
    sourceDir: '.github',
  },
  kiro: {
    label: 'Kiro (.kiro)',
    targetDir: '.kiro',
    detectDir: '.kiro',
    sourceDir: '.kiro',
  },
  opencode: {
    label: 'OpenCode (.opencode)',
    targetDir: '.opencode',
    detectDir: '.opencode',
    sourceDir: '.opencode',
  },
};

/** Returns provider keys whose detection directory already exists in targetDir. */
export function detectProviders(targetDir: string): string[] {
  return Object.entries(PROVIDERS)
    .filter(([, cfg]) => existsSync(join(targetDir, cfg.detectDir)))
    .map(([key]) => key);
}
