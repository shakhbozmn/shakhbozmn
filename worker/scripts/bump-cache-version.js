import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const readmePath = resolve(here, "..", "..", "README.md");

const readme = readFileSync(readmePath, "utf8");
const versionRegex = /([?&])v=(\d+)/g;

let maxVersion = 0;
for (const match of readme.matchAll(versionRegex)) {
  const n = Number(match[2]);
  if (n > maxVersion) maxVersion = n;
}

const nextVersion = maxVersion + 1;

const updated = readme.replace(versionRegex, (full, sep) => `${sep}v=${nextVersion}`);

if (updated === readme) {
  console.log("no v= parameter found in README; add one before running bump");
  process.exit(1);
}

writeFileSync(readmePath, updated);
console.log(`bumped README cache version to v=${nextVersion}`);
