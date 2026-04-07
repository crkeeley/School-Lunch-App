import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set([".git", "node_modules", ".next", "coverage", "out", "build"]);
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".env",
  ".md",
  ".txt",
  ".prisma",
]);

const SECRET_PATTERNS = [
  { name: "AWS Access Key", regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: "Stripe Live Secret Key", regex: /\bsk_live_[A-Za-z0-9]+\b/g },
  { name: "Stripe Live Publishable Key", regex: /\bpk_live_[A-Za-z0-9]+\b/g },
  { name: "GitHub Personal Access Token", regex: /\bghp_[A-Za-z0-9]{36}\b/g },
  { name: "GitHub Fine-grained Token", regex: /\bgithub_pat_[A-Za-z0-9_]+\b/g },
  { name: "Slack Token", regex: /\bxox[baprs]-[A-Za-z0-9-]+\b/g },
  { name: "Google API Key", regex: /\bAIza[0-9A-Za-z-_]{35}\b/g },
  { name: "Private Key Block", regex: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PRIVATE) KEY-----/g },
];

const ALLOWLIST_SUBSTRINGS = [
  "replace_me",
  "replace-with",
  "example.com",
  "your-rds-endpoint",
  "<account-id>",
  "<region>",
  "school-lunch-app/database-url",
];

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) {
    return true;
  }

  return path.basename(filePath).startsWith(".env");
}

function collectFiles(dirPath, output = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      collectFiles(fullPath, output);
      continue;
    }

    if (isTextFile(fullPath)) {
      output.push(fullPath);
    }
  }

  return output;
}

function hasAllowlistedMarker(line) {
  const normalized = line.toLowerCase();
  return ALLOWLIST_SUBSTRINGS.some((marker) => normalized.includes(marker));
}

function getLineNumber(content, offset) {
  return content.slice(0, offset).split("\n").length;
}

function detectSecrets(filePath, content) {
  const findings = [];

  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match = pattern.regex.exec(content);

    while (match) {
      const lineNumber = getLineNumber(content, match.index);
      const line = content.split("\n")[lineNumber - 1] ?? "";

      if (!hasAllowlistedMarker(line)) {
        findings.push({
          filePath,
          lineNumber,
          type: pattern.name,
          value: match[0],
        });
      }

      match = pattern.regex.exec(content);
    }
  }

  return findings;
}

function detectFrontendEnvExposure(filePath, content) {
  const isClientFile = /["']use client["']/.test(content);
  if (!isClientFile) {
    return [];
  }

  const matches = [...content.matchAll(/process\.env\.([A-Z0-9_]+)/g)];
  return matches
    .filter((match) => !match[1].startsWith("NEXT_PUBLIC_"))
    .map((match) => ({
      filePath,
      lineNumber: getLineNumber(content, match.index ?? 0),
      type: "Frontend non-public env usage",
      value: match[0],
    }));
}

function detectTrackedEnvLeak() {
  try {
    const output = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => {
        const normalized = line.replace(/\\/g, "/");
        return normalized.startsWith(".env") && normalized !== ".env.example";
      })
      .map((line) => ({
        filePath: path.join(ROOT, line),
        lineNumber: 1,
        type: "Tracked env file",
        value: line,
      }));
  } catch {
    return [];
  }
}

const files = collectFiles(ROOT);
const findings = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  findings.push(...detectSecrets(filePath, content));
  findings.push(...detectFrontendEnvExposure(filePath, content));
}

const envLeaks = detectTrackedEnvLeak();
findings.push(...envLeaks);

if (findings.length > 0) {
  console.error("Security scan failed. Potential secret exposure found:\n");
  for (const finding of findings) {
    const relative = path.relative(ROOT, finding.filePath).replace(/\\/g, "/");
    console.error(`- ${relative}:${finding.lineNumber} [${finding.type}] ${finding.value}`);
  }
  process.exit(1);
}

console.log("Security scan passed: no hardcoded secrets or frontend env leaks detected.");