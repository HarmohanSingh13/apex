#!/usr/bin/env node
"use strict";

// src/commands/install.ts
var import_readline = require("readline");
var import_path3 = require("path");

// src/lib/providers.ts
var import_fs = require("fs");
var import_path = require("path");
var PROVIDERS = {
  agents: {
    label: "Generic (.agents)",
    targetDir: ".agents",
    detectDir: ".agents",
    sourceDir: ".agents"
  },
  claude: {
    label: "Claude Code (.claude/agents)",
    targetDir: ".claude/agents",
    detectDir: ".claude",
    sourceDir: ".claude"
  },
  cursor: {
    label: "Cursor (.cursor/rules)",
    targetDir: ".cursor/rules",
    detectDir: ".cursor",
    sourceDir: ".cursor"
  },
  gemini: {
    label: "Gemini CLI (.gemini)",
    targetDir: ".gemini",
    detectDir: ".gemini",
    sourceDir: ".gemini"
  },
  github: {
    label: "GitHub Copilot (.github)",
    targetDir: ".github",
    detectDir: ".github",
    sourceDir: ".github"
  },
  kiro: {
    label: "Kiro (.kiro)",
    targetDir: ".kiro",
    detectDir: ".kiro",
    sourceDir: ".kiro"
  },
  opencode: {
    label: "OpenCode (.opencode)",
    targetDir: ".opencode",
    detectDir: ".opencode",
    sourceDir: ".opencode"
  }
};
function detectProviders(targetDir) {
  return Object.entries(PROVIDERS).filter(([, cfg]) => (0, import_fs.existsSync)((0, import_path.join)(targetDir, cfg.detectDir))).map(([key]) => key);
}

// src/lib/installer.ts
var import_fs2 = require("fs");
var import_crypto = require("crypto");
var import_path2 = require("path");
function installProvider(opts) {
  const srcDir = (0, import_path2.join)(opts.templatesDir, opts.config.sourceDir);
  const destDir = (0, import_path2.join)(opts.targetDir, opts.config.targetDir);
  if (!(0, import_fs2.existsSync)(srcDir)) return { installed: 0, skipped: 0 };
  return copyDir(srcDir, destDir, opts.dryRun);
}
function copyDir(src, dest, dryRun) {
  let installed = 0;
  let skipped = 0;
  if (!dryRun) (0, import_fs2.mkdirSync)(dest, { recursive: true });
  for (const entry of (0, import_fs2.readdirSync)(src, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const sub = copyDir((0, import_path2.join)(src, entry.name), (0, import_path2.join)(dest, entry.name), dryRun);
      installed += sub.installed;
      skipped += sub.skipped;
    } else if (entry.isFile()) {
      const srcFile = (0, import_path2.join)(src, entry.name);
      const destFile = (0, import_path2.join)(dest, entry.name);
      if ((0, import_fs2.existsSync)(destFile) && sha256(srcFile) === sha256(destFile)) {
        skipped++;
        continue;
      }
      if (!dryRun) (0, import_fs2.copyFileSync)(srcFile, destFile);
      installed++;
    }
  }
  return { installed, skipped };
}
function sha256(filePath) {
  return (0, import_crypto.createHash)("sha256").update((0, import_fs2.readFileSync)(filePath)).digest("hex");
}

// src/lib/ansi.ts
var ESC = "\x1B[";
var bold = (s) => `${ESC}1m${s}${ESC}0m`;
var dim = (s) => `${ESC}2m${s}${ESC}0m`;
var green = (s) => `${ESC}32m${s}${ESC}0m`;
var yellow = (s) => `${ESC}33m${s}${ESC}0m`;

// src/commands/install.ts
var templatesDir = (0, import_path3.join)((0, import_path3.dirname)(process.argv[1]), "../templates");
async function installCommand(options) {
  const targetDir = process.cwd();
  console.log(bold("\n  AI-SDLC Framework\n"));
  const detected = detectProviders(targetDir);
  let toInstall;
  if (options.all) {
    toInstall = Object.keys(PROVIDERS);
    console.log(dim("  Installing for all supported agents...\n"));
  } else if (detected.length > 0) {
    toInstall = detected;
    console.log(dim(`  Detected: ${detected.map((k) => PROVIDERS[k].label).join(", ")}
`));
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
      dryRun: false
    });
    if (result.installed > 0) {
      console.log(`${green("  \u2713")} ${bold(config.label)}`);
      console.log(dim(`    \u2192 ${config.targetDir}  (${result.installed} file${result.installed !== 1 ? "s" : ""})`));
      installedCount++;
    } else {
      console.log(dim(`  - ${config.label} \u2014 already up to date`));
    }
  }
  console.log("");
  if (installedCount > 0) {
    console.log(green(`  Done! Workflows installed for ${installedCount} agent(s).
`));
  } else {
    console.log(dim("  Everything is already up to date.\n"));
  }
}
async function promptForAgents() {
  const entries = Object.entries(PROVIDERS);
  console.log(yellow("  No agent directory detected in this project.\n"));
  console.log("  Which AI agent are you using?\n");
  entries.forEach(([, cfg], i) => {
    console.log(`    ${bold(String(i + 1))}) ${cfg.label}`);
  });
  console.log(`    ${bold(String(entries.length + 1))}) All of the above
`);
  const rl = (0, import_readline.createInterface)({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("  Enter number: ", (answer) => {
      rl.close();
      console.log("");
      const num = parseInt(answer.trim(), 10);
      if (num === entries.length + 1) {
        resolve(entries.map(([key]) => key));
      } else if (num >= 1 && num <= entries.length) {
        resolve([entries[num - 1][0]]);
      } else {
        console.log(dim("  Invalid selection. Installing generic .agents/ as fallback.\n"));
        resolve(["agents"]);
      }
    });
  });
}

// src/index.ts
var VERSION = "1.0.0";
var args = process.argv.slice(2);
if (args.includes("--version") || args.includes("-v")) {
  console.log(VERSION);
  process.exit(0);
}
if (args.includes("--help") || args.includes("-h")) {
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
installCommand({ all: args.includes("--all") });
