export interface InstallOptions {
    all?: boolean;
    prefix?: string;
    dryRun?: boolean;
}
export declare function installCommand(options: InstallOptions): Promise<void>;
