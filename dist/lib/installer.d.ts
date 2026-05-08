import type { ProviderConfig } from './providers.js';
export interface InstallOptions {
    templatesDir: string;
    targetDir: string;
    provider: string;
    config: ProviderConfig;
    prefix?: string;
    dryRun: boolean;
}
export interface InstallResult {
    installed: number;
    skipped: number;
}
export declare function installProvider(opts: InstallOptions): InstallResult;
