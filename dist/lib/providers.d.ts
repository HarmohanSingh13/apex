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
export declare const PROVIDERS: Record<string, ProviderConfig>;
/** Returns provider keys whose detection directory already exists in targetDir. */
export declare function detectProviders(targetDir: string): string[];
