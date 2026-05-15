/**
 * Generates prisma/content/claude-problems.json and claude-quizzes.json.
 * Run: node prisma/scripts/build-claude-json.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, "..", "content");

const PLACEHOLDER_NOTE =
  "\n\n**Note:** Real content from our team launches before June 1, 2026.";

function difficulty(day) {
  if (day <= 15) return "Beginner";
  if (day <= 45) return "Intermediate";
  return "Advanced";
}

function minutes(day) {
  return 30 + ((day - 1) % 6) * 5;
}

/** Returns { title, focus, bullets } for each day 1..60 */
function daySpec(day) {
  if (day <= 5) {
    const topics = [
      "Set Up Claude & Build Your AIY Framework",
      "Projects, Memory & Workspace Hygiene",
      "Claude Skills — Install & First Automations",
      "10 Real Prompts Across Domains (Bank)",
      "Weekly Review — Tune Your Defaults",
    ];
    return {
      title: topics[day - 1],
      focus: "Phase 1 — Foundation & Prompt Engineering (Orientation)",
      bullets: [
        "Use Claude for structured thinking; save useful threads.",
        "Document what worked in a simple prompt log.",
        "Prepare your share link or notes for submission.",
      ],
    };
  }
  if (day <= 10) {
    return {
      title: `Prompt Engineering Lab — Day ${day}`,
      focus: "Role prompts, chain-of-thought, few-shot, XML tags",
      bullets: [
        "Practice one technique end-to-end with a real work example.",
        "Compare a naive vs structured prompt; note quality delta.",
        "Add constraints and negative instructions where helpful.",
      ],
    };
  }
  if (day <= 15) {
    return {
      title: `Content & Office Stack — Day ${day}`,
      focus: "Blogs, LinkedIn, email, SOPs, tone control",
      bullets: [
        "Draft one asset (post, email, or SOP outline) with tone variants.",
        "Build a mini content calendar snippet in Claude.",
        "Export or screenshot your best output for submission.",
      ],
    };
  }
  if (day <= 20) {
    return {
      title: `Code & Developer Workflow — Day ${day}`,
      focus: "Code gen, debugging, tests, IDE integration",
      bullets: [
        "Solve one coding task with Claude (explain + implement).",
        "Optional: try Claude in VS Code / CLI patterns from your setup.",
        "Capture a Claude artifact or share link showing the result.",
      ],
    };
  }
  if (day <= 25) {
    return {
      title: `Research & Ecosystem — Day ${day}`,
      focus: "Research workflows, NotebookLM, competitive scans",
      bullets: [
        "Run a structured research brief (sources + synthesis).",
        "Compare approaches (e.g. general search vs Claude-led synthesis).",
        "Summarize insights as bullets you could present to a manager.",
      ],
    };
  }
  if (day <= 30) {
    return {
      title: `Artifacts, Projects & Web — Day ${day}`,
      focus: "HTML/React/SVG/Mermaid, dashboards, landing pages",
      bullets: [
        "Create a small interactive artifact or page scaffold.",
        "Use Projects to keep context tight across iterations.",
        "Polish UX copy and layout in one pass before sharing.",
      ],
    };
  }
  if (day <= 35) {
    return {
      title: `Workflow Automation — Day ${day}`,
      focus: "Zapier/Make patterns, APIs, daily briefing bots",
      bullets: [
        "Map one repetitive workflow and automate the draft step.",
        "Sketch triggers, inputs, and outputs (even if partially mocked).",
        "Document failure modes and human review checkpoints.",
      ],
    };
  }
  if (day <= 40) {
    return {
      title: `MCP Connectors & Plugins — Day ${day}`,
      focus: "Drive, Gmail, Calendar, GitHub, Slack, spreadsheets",
      bullets: [
        "Design one connector-assisted flow (read-only is fine).",
        "List permissions and privacy considerations explicitly.",
        "Show the prompt chain or checklist you would run in production.",
      ],
    };
  }
  if (day <= 45) {
    return {
      title: `Agentic Claude — Day ${day}`,
      focus: "Multi-step agents, autonomy boundaries, system prompts",
      bullets: [
        "Contrast agentic vs interactive use on the same task.",
        "Define stop conditions and escalation to human review.",
        "Capture a transcript or artifact that proves the multi-step run.",
      ],
    };
  }
  if (day <= 50) {
    return {
      title: `Domain Deep Dive (Track A/B) — Day ${day}`,
      focus: "Personas, domain packs, custom system prompts",
      bullets: [
        "Pick a domain track and deepen prompts for that context.",
        "Iterate a persona card (role, constraints, output format).",
        "Save a reusable template for your next 90 days.",
      ],
    };
  }
  if (day <= 55) {
    return {
      title: `Advanced Prompting — Day ${day}`,
      focus: "Opus vs Sonnet, libraries, edge cases",
      bullets: [
        "Stress-test one complex prompt with variants and edge inputs.",
        "Document when to escalate model tier vs refine instructions.",
        "Share one 'golden prompt' you will reuse.",
      ],
    };
  }
  return {
    title: `Capstone & Closeout — Day ${day}`,
    focus: "Finalize capstone, journey doc, community showcase",
    bullets: [
      "Consolidate artifacts from Days 46–55 into a capstone package.",
      "Draft your public LinkedIn recap (honest wins + learnings).",
      "Plan next 90 days — 3 habits, 3 prompts, 1 automation to ship.",
    ],
  };
}

function problemForDay(day) {
  if (day === 1) {
    return {
      dayNumber: 1,
      domain: "CLAUDE",
      title: "Day 1: Set Up Claude & Build Your AIY Framework",
      problemStatement:
        "Welcome to Day 1! Today you'll set up your Claude account, explore the interface, and start building your personal AIY (AI for You) framework.\n\n**Tasks:**\n1. Sign up for Claude at claude.ai\n2. Explore Projects, Memory, and Settings\n3. Identify 5 areas where Claude could help you daily\n4. Document your AIY framework — a personal map of how you'll use Claude\n\n**Submission:** Share notes, a Claude conversation link, or a short doc that captures your framework.\n\n**Note:** Real content from our team launches before June 1, 2026.",
      learningObjectives: [
        "Understand Claude's core features",
        "Identify personal use cases for AI",
        "Set up your workspace",
      ],
      resources: [
        "https://claude.ai",
        "https://docs.anthropic.com",
      ],
      difficulty: "Beginner",
      estimatedMinutes: 30,
      linkedinTemplate:
        "Day 1 of #60DayClaudeChallenge with @AnilBajpai's @ABtalks 🚀\n\nToday I set up my Claude account and started mapping my AIY (AI for You) framework — identifying 5 daily areas where AI can make me more productive.\n\nWhat would YOUR top 5 use cases be? Drop them in the comments 👇\n\n#60DayClaudeChallenge #ABtalks",
      solutionApproach:
        "Share your AIY framework. Could be a Claude conversation, a doc, or a screenshot of your notes.",
      tags: ["setup", "foundation", "framework"],
    };
  }

  const spec = daySpec(day);
  const diff = difficulty(day);
  const est = minutes(day);
  const problemStatement = `Welcome to **Day ${day}** of the 60-Day Claude AI Mastery Challenge.\n\n**Theme:** ${spec.focus}\n\n**Today's focus:** ${spec.title}\n\n**Tasks:**\n1. ${spec.bullets[0]}\n2. ${spec.bullets[1]}\n3. ${spec.bullets[2]}\n\n**Submission:** Share a Claude conversation link, artifact, or short doc that shows your work.${PLACEHOLDER_NOTE}`;

  const learningObjectives = [
    `Apply Day ${day} concepts to your real role or studies`,
    "Build repeatable prompts you can reuse after the challenge",
    "Practice safe, reviewable AI workflows",
  ];

  const linkedinTemplate = `Day ${day}/60 of #60DayClaudeChallenge with @ABtalks 🚀\n\nToday (${spec.title}): ${spec.focus.split("—")[0]?.trim() ?? "Claude mastery"} — building real skills, not just hype.\n\nWhat did you automate or clarify with Claude today? 👇\n\n#60DayClaudeChallenge #ABtalks`;

  return {
    dayNumber: day,
    domain: "CLAUDE",
    title: `Day ${day}: ${spec.title}`,
    problemStatement,
    learningObjectives,
    resources: [
      "https://claude.ai",
      "https://docs.anthropic.com",
      "https://www.anthropic.com/claude",
    ],
    difficulty: diff,
    estimatedMinutes: est,
    linkedinTemplate,
    solutionApproach:
      "Submit a valid Claude share or artifact URL, plus your LinkedIn post URL when prompted.",
    tags: [
      "claude",
      "placeholder",
      `day-${day}`,
      diff.toLowerCase(),
    ],
  };
}

const problems = [];
for (let d = 1; d <= 60; d++) {
  problems.push(problemForDay(d));
}

const weekTitles = [
  "Week 1: Foundation & Prompt Setup",
  "Week 2: Prompt Engineering Patterns",
  "Week 3: Content, Writing & Office",
  "Week 4: Code & Developer Workflow",
  "Week 5: Research, Data & Ecosystem",
  "Week 6: Artifacts, Projects & Automation",
  "Week 7: MCP, Plugins & Agentic Flows",
  "Week 8: Capstone, Advanced Techniques & Launch",
];

function weekQuestion(week, qn) {
  const title = weekTitles[week - 1] ?? `Week ${week}`;
  return {
    questionOrder: qn,
    questionText: `${title} — Question ${qn}: What is the best default habit when using Claude for serious work?`,
    optionA:
      "Write a clear goal, constraints, output format, and review steps before accepting outputs",
    optionB: "Paste sensitive credentials so Claude can debug faster",
    optionC: "Ship external content without reading for speed",
    optionD: "Avoid saving reusable prompts or templates",
    correctAnswer: "A",
    explanation: `Week ${week} placeholder: structured prompting plus human review is the backbone of responsible use. Final quiz copy arrives with curriculum.`,
  };
}

const quizzes = [];
for (let week = 1; week <= 8; week++) {
  const questions = [];
  for (let qn = 1; qn <= 10; qn++) {
    questions.push(weekQuestion(week, qn));
  }
  quizzes.push({
    weekNumber: week,
    domain: "CLAUDE",
    title: weekTitles[week - 1],
    questions,
  });
}

fs.mkdirSync(contentDir, { recursive: true });
fs.writeFileSync(
  path.join(contentDir, "claude-problems.json"),
  JSON.stringify(problems, null, 2),
  "utf-8",
);
fs.writeFileSync(
  path.join(contentDir, "claude-quizzes.json"),
  JSON.stringify(quizzes, null, 2),
  "utf-8",
);

console.log(
  `Wrote ${problems.length} problems and ${quizzes.length} quizzes to ${contentDir}`,
);
