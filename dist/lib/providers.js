import { existsSync } from 'fs';
import { join } from 'path';
export const PROVIDERS = {
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
export function detectProviders(targetDir) {
    return Object.entries(PROVIDERS)
        .filter(([, cfg]) => existsSync(join(targetDir, cfg.detectDir)))
        .map(([key]) => key);
}
