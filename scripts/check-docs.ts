import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const canonicalFiles = [
  "AGENTS.md",
  "README.md",
  "INDEX.md",
  "PRD.md",
  "ARCHITECTURE.md",
  "DECISIONS.md",
  "DATA-MODEL.md",
  "IAM.md",
  "SECURITY.md",
  "PRIVACY.md",
  "BILLING.md",
  "OBSERVABILITY.md",
  "RELEASE.md",
  "TASKS.md",
  "STATUS.md",
  "BUILD-LOG.md",
  "openapi.yaml",
] as const;

async function text(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

for (const file of canonicalFiles) {
  assert.ok((await text(file)).trim().length > 0, `${file} must exist and not be empty`);
}

const mirroredFiles = (await readdir(new URL("../docs/", import.meta.url))).filter(
  (file) => file.endsWith(".md") || file === "openapi.yaml"
);

for (const file of mirroredFiles) {
  assert.equal(await text(file), await text(`docs/${file}`), `${file} compatibility mirror drifted`);
}

const prd = await text("PRD.md");
const requirementIds = [...prd.matchAll(/\bREQ-[A-Z]+-\d{3}\b/g)].map(([id]) => id);
const uniqueRequirementIds = new Set(requirementIds);
assert.ok(uniqueRequirementIds.size > 0, "PRD must declare permanent REQ-* identifiers");
assert.equal(requirementIds.length, uniqueRequirementIds.size, "PRD requirement identifiers must be unique");

const tasks = await text("TASKS.md");
const taskIds = [...tasks.matchAll(/\*\*(T-\d{4}):/g)].map(([, id]) => id);
assert.ok(taskIds.length > 0, "TASKS must declare permanent T-* identifiers");
assert.equal(taskIds.length, new Set(taskIds).size, "Task identifiers must be unique");

const taskBlocks = tasks.split(/(?=- \[[ x]\] \*\*T-\d{4}:)/).filter((block) => /^- \[[ x]\] \*\*T-\d{4}:/.test(block));
for (const block of taskBlocks) {
  const taskId = block.match(/\*\*(T-\d{4}):/)?.[1];
  const metadata = [...block.matchAll(/\*\*(Primary requirement|Verification target):\*\* ([^\n]+)/g)];
  assert.equal(metadata.length, 1, `${taskId} must declare exactly one Primary requirement or Verification target`);
  if (metadata[0][1] === "Primary requirement") {
    assert.match(metadata[0][2], /^REQ-[A-Z]+-\d{3}$/, `${taskId} primary requirement must be one permanent REQ-* ID`);
    assert.ok(uniqueRequirementIds.has(metadata[0][2]), `${taskId} references missing requirement ${metadata[0][2]}`);
  }
}

assert.ok(!tasks.includes("\\n"), "TASKS must not contain escaped newline artifacts");

console.log(
  `DOCS CHECK PASSED: ${canonicalFiles.length} canonical owners, ${mirroredFiles.length} controlled mirrors, ${uniqueRequirementIds.size} requirements, ${taskIds.length} tasks`
);
