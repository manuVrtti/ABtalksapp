import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const targetPath = path.join(repoRoot, "prisma", "content", "problems.json");

// Source files passed in via CLI args. Each file contains an array of
// "rich" task entries (with phase / realWorldImpact / whatToDo / submission)
// that we normalise into the schema used by prisma/content/problems.json.
const sourceArgs = process.argv.slice(2);
if (sourceArgs.length === 0) {
  console.error("Usage: node scripts/merge-problems.mjs <source-json> [source-json...]");
  process.exit(1);
}

const DOMAIN_MAP = {
  "Software Engineering": "SE",
  SE: "SE",
  "Data Science": "DS",
  DS: "DS",
  "AI Engineering": "AI",
  "Artificial Intelligence": "AI",
  AI: "AI",
};

function normaliseDomain(raw) {
  const mapped = DOMAIN_MAP[raw];
  if (!mapped) {
    throw new Error(`Unknown domain "${raw}". Add a mapping in scripts/merge-problems.mjs.`);
  }
  return mapped;
}

function bullet(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildProblemStatement(entry) {
  const sections = [];
  if (entry.phase) {
    sections.push(`**Phase:** ${entry.phase}`);
  }
  if (entry.problemStatement) {
    sections.push(`**Context:** ${entry.problemStatement}`);
  }
  if (entry.realWorldImpact) {
    sections.push(`**Real-World Impact:** ${entry.realWorldImpact}`);
  }
  if (Array.isArray(entry.whatToDo) && entry.whatToDo.length > 0) {
    sections.push(`**What to do:**\n${bullet(entry.whatToDo)}`);
  }
  if (Array.isArray(entry.submission) && entry.submission.length > 0) {
    sections.push(`**Submission:**\n${bullet(entry.submission)}`);
  }
  return sections.join("\n\n");
}

function defaultTags(domain, entry) {
  if (Array.isArray(entry.tags) && entry.tags.length > 0) return entry.tags;
  const base = {
    SE: ["software-engineering"],
    DS: ["data-science"],
    AI: ["ai-engineering"],
  }[domain];
  return [...base, `day-${entry.dayNumber}`];
}

function defaultSolutionApproach(entry) {
  if (typeof entry.solutionApproach === "string" && entry.solutionApproach.trim().length > 0) {
    return entry.solutionApproach;
  }
  return "Break the task into small steps, implement incrementally, test as you go, and document your reasoning.";
}

function normaliseEntry(entry) {
  const domain = normaliseDomain(entry.domain);
  if (typeof entry.dayNumber !== "number") {
    throw new Error(`Entry missing dayNumber: ${JSON.stringify(entry).slice(0, 200)}`);
  }
  return {
    dayNumber: entry.dayNumber,
    domain,
    title: entry.title,
    problemStatement: buildProblemStatement(entry),
    learningObjectives: Array.isArray(entry.learningObjectives) ? entry.learningObjectives : [],
    resources: Array.isArray(entry.resources) ? entry.resources : [],
    difficulty: entry.difficulty ?? "Medium",
    estimatedMinutes: typeof entry.estimatedMinutes === "number" ? entry.estimatedMinutes : 60,
    linkedinTemplate: entry.linkedinTemplate ?? "",
    solutionApproach: defaultSolutionApproach(entry),
    tags: defaultTags(domain, entry),
  };
}

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

const existing = fs.existsSync(targetPath) ? loadJson(targetPath) : [];
if (!Array.isArray(existing)) {
  throw new Error(`Existing ${targetPath} is not an array.`);
}

const merged = new Map();
for (const entry of existing) {
  if (!entry?.domain || typeof entry.dayNumber !== "number") continue;
  merged.set(`${entry.domain}:${entry.dayNumber}`, entry);
}

let added = 0;
let replaced = 0;
for (const sourceArg of sourceArgs) {
  const sourcePath = path.resolve(sourceArg);
  console.log(`\nProcessing ${sourcePath}`);
  const source = loadJson(sourcePath);
  if (!Array.isArray(source)) {
    throw new Error(`Source ${sourcePath} is not a JSON array.`);
  }
  for (const rawEntry of source) {
    const normalised = normaliseEntry(rawEntry);
    const key = `${normalised.domain}:${normalised.dayNumber}`;
    if (merged.has(key)) {
      replaced += 1;
      console.log(`  replace ${key}: ${normalised.title}`);
    } else {
      added += 1;
      console.log(`  add     ${key}: ${normalised.title}`);
    }
    merged.set(key, normalised);
  }
}

const orderedDomains = ["SE", "DS", "AI"];
const out = [...merged.values()].sort((a, b) => {
  const domainCompare = orderedDomains.indexOf(a.domain) - orderedDomains.indexOf(b.domain);
  if (domainCompare !== 0) return domainCompare;
  return a.dayNumber - b.dayNumber;
});

fs.writeFileSync(targetPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");

console.log(`\nWrote ${out.length} entries to ${targetPath}`);
console.log(`  added=${added}  replaced=${replaced}`);
const counts = out.reduce((acc, e) => ({ ...acc, [e.domain]: (acc[e.domain] ?? 0) + 1 }), {});
console.log(`  per domain: ${JSON.stringify(counts)}`);
