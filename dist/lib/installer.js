import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';
export function installProvider(opts) {
    const srcDir = join(opts.templatesDir, opts.config.sourceDir);
    const destDir = join(opts.targetDir, opts.config.targetDir);
    if (!existsSync(srcDir))
        return { installed: 0, skipped: 0 };
    return copyDir(srcDir, destDir, opts.dryRun, opts.prefix);
}
function copyDir(src, dest, dryRun, prefix) {
    let installed = 0;
    let skipped = 0;
    if (!dryRun)
        mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            const sub = copyDir(join(src, entry.name), join(dest, entry.name), dryRun, prefix);
            installed += sub.installed;
            skipped += sub.skipped;
        }
        else if (entry.isFile()) {
            const destName = prefix ? applyPrefix(entry.name, prefix) : entry.name;
            const srcFile = join(src, entry.name);
            const destFile = join(dest, destName);
            if (existsSync(destFile) && sha256(srcFile) === sha256(destFile)) {
                skipped++;
                continue;
            }
            if (!dryRun)
                copyFileSync(srcFile, destFile);
            installed++;
        }
    }
    return { installed, skipped };
}
/** Inserts prefix before the file extension: foo.md → <prefix>-foo.md */
function applyPrefix(filename, prefix) {
    const dot = filename.lastIndexOf('.');
    if (dot === -1)
        return `${prefix}-${filename}`;
    return `${prefix}-${filename.slice(0, dot)}${filename.slice(dot)}`;
}
function sha256(filePath) {
    return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}
