# 035 — B2B Program 12 — Project Lab: JupyterLite notebooks + real-environment project pipeline

> Extends the shipped Workbench (026/027). Owner directive: members must finish the
> cohort as hands-on AI engineers building end-to-end projects — not just passing
> in-browser checks. Three moves: (1) embed JupyterLite as an in-platform notebook
> lab, (2) wire "Open in Colab / Codespaces" real-environment launchers off each
> member's program repo, (3) submit notebook work through git so the EXISTING
> verification (SHIP_IT repo checks, commits cron, AI grading) grades real artifacts.
> **No server-side code execution anywhere — that constraint is non-negotiable.**

## 1. Goal
Mission days flagged as "lab" days render a full Jupyter notebook environment in the
platform (JupyterLite, client-side WASM); every mission page offers one-click launch
into Colab/Codespaces against the member's program repo; notebook deliverables are
submitted by pushing `.ipynb` to the repo and verified/graded by existing machinery.

## 2. Current behavior
Workbench = styled textarea + Pyodide/sql.js/Worker runners (026); missions verified
per type (027); members have a public program repo already validated at apply time;
SHIP_IT checks fetch repo files; `gradeProject` reads README/tree; commits cron polls
daily. No notebook UI, no devcontainer/colab links, no `.ipynb` handling.

## 3. Files to touch
**JupyterLite (static, in-repo build artifact)**
- `[new] public/lab/**` — JupyterLite static build. One-time build (document in the
  plan commit message and a README): `pip install jupyterlite-core
  jupyterlite-pyodide-kernel && jupyter lite build --output-dir public/lab`.
  Commit the artifact; note rebuild steps in `[new] public/lab/README-BUILD.md`.
  Verify total size stays well under Vercel limits (~expect 40–70 MB; if larger,
  prune unused extensions per JupyterLite docs).
- `[new] src/components/program/workbench/notebook-lab.tsx` — Client; renders
  `<iframe src="/lab/lab/index.html?path=...">` sized to the workbench pane, with a
  toolbar above it: day title, "How to submit" popover (git add/commit/push snippet
  with the member's repo URL preselected), and the launcher buttons (below).
  Notebooks persist locally via JupyterLite's own IndexedDB (same origin) — no
  custom save bridge in v1 (submission is via git, which is the point).
- `[edit] src/components/program/mission-panel.tsx` — when the day's
  `assetsJson.workbenchMode === "notebook"`, render `notebook-lab.tsx` instead of the
  code editor (mission type stays SHIP_IT; its repoChecks verify the pushed
  notebook). No schema change — `workbenchMode` is a content-phase convention.

**Real-environment launchers**
- `[new] src/features/program/launchers.ts` — pure helpers building launch URLs from
  the member's `githubRepoUrl` + day paths:
  - Colab: `https://colab.research.google.com/github/{owner}/{repo}/blob/main/{path}.ipynb`
  - Codespaces: `https://codespaces.new/{owner}/{repo}`
  - GitHub file link for the expected deliverable path.
- `[edit] src/components/program/mission-panel.tsx` — SHIP_IT and BOSS_BUILD panels
  gain a "Work in a real environment" row: Open in Colab / Open in Codespaces /
  View repo buttons (plain `<Link>`s with `buttonVariants`, external target).
- `[edit] src/app/program/(app)/day/[day]/page.tsx` — pass repo/launch props (plain
  strings) down.

**Notebook-aware verification & grading (small extensions, no new engines)**
- `[edit] src/features/program/verify-mission.ts` — add two repoCheck kinds to the
  SHIP_IT runner: `notebookParses` (fetch file, `JSON.parse`, has `cells` array) and
  `notebookMinCells` (`{ min: N, ofType?: "code" }`). Named check lines like the rest.
- `[edit] src/features/program/projects.ts` — `gradeProject` repo-context fetch also
  pulls up to 2 `.ipynb` files (≤150 KB each): strip outputs/base64, include
  markdown+code cell sources in the grading prompt. Larger → include tree entry only.

**Content phase additions (architect-authored, seeded templates)**
- `[new] prisma/content/program/repo-template/**` — devcontainer
  (`.devcontainer/devcontainer.json`: python 3.11 image + pip requirements),
  `notebooks/` starter `.ipynb` per lab day, `README.md` scaffold. Surfaced to
  members on Day 1 as a "set up your repo" mission step (copy-into-repo
  instructions — we do NOT push to their repos).

**Docs**
- `[edit] docs/project-context.md` — Project Lab shipped (+ public/lab build note).

## 4. Server vs Client
| File | Type | Notes |
|---|---|---|
| `notebook-lab.tsx`, mission-panel edits | Client | iframe + string props only; no member data posted into the iframe |
| `launchers.ts`, verify/grade edits | server | pure URL builders; GitHub fetches server-side as today |
| `public/lab/**` | static | no runtime server involvement |

## 5. Steps
1. Build JupyterLite artifact → `public/lab/` (+ README-BUILD). Load it standalone in
   the browser and run a pandas cell before wiring anything.
2. `notebook-lab.tsx` + mission-panel `workbenchMode` branch.
3. `launchers.ts` + launcher row on SHIP_IT/BOSS_BUILD panels.
4. Verify-mission notebook checks; projects.ts notebook-aware grading context.
5. Repo template content + Day-1 setup surfacing.
6. Verify (§8), context doc, commit.

## 6. Guardrails for Cursor (DO NOT)
- Do NOT execute notebooks server-side, ever — JupyterLite runs client-side; grading
  reads notebook JSON as text only.
- Do NOT build a notebook save-to-DB bridge in v1 — submission is git push; local
  persistence is JupyterLite's IndexedDB. (Server sync is a possible v2; not now.)
- Do NOT post messages into / read state out of the JupyterLite iframe.
- Do NOT push to or write into members' GitHub repos — read-only API access only.
- Do NOT add npm deps for this; JupyterLite is a static artifact, launchers are URLs.
- Notebook grading context is size-capped (≤150 KB/file, ≤2 files, outputs stripped)
  — never ship raw base64 images to the model.
- Colab/Codespaces buttons must degrade gracefully when the expected notebook path
  doesn't exist yet (link to repo root with a hint, not a 404 chase).

## 7. DB safety
No schema change. No data migrations. `public/lab` is static assets only.

## 8. Verification
- `/lab/lab/index.html` loads standalone; pandas + matplotlib cell runs; notebook
  survives a page reload (IndexedDB).
- A `workbenchMode: "notebook"` day renders the lab; submit before pushing → red
  `notebookParses` check names the missing path; push the notebook → green, day
  clears, points awarded.
- Colab button opens the member's actual pushed notebook in Colab; Codespaces button
  opens repo; both correct for a second member (URL building is per-member).
- Boss Build grading with a notebook in the repo: AI feedback references notebook
  content; a 5 MB notebook is excluded from prompt context without error.
- Mobile 390 px: lab day shows the desktop-recommended banner (reuse Workbench's),
  launcher buttons still usable. Build + tsc clean; only §3 files changed.

## 9. Commit message
`feat(program): Project Lab — in-platform JupyterLite notebooks, Colab/Codespaces launchers, git-native notebook verification and grading`
