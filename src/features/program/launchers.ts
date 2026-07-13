import "server-only";

import { parseRepo } from "@/features/program/verify-mission";

export type LauncherUrls = {
  colabUrl: string;
  codespacesUrl: string;
  githubFileUrl: string;
  githubRepoUrl: string;
  notebookPath: string | null;
  colabHint: string | null;
};

function normalizeNotebookPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim().replace(/^\/+/, "");
  if (!trimmed) return null;
  return trimmed.endsWith(".ipynb") ? trimmed : `${trimmed}.ipynb`;
}

/** Build Colab / Codespaces / GitHub links for a member repo and optional notebook path. */
export function buildLauncherUrls(
  githubRepoUrl: string,
  notebookPath?: string | null,
  branch = "main",
): LauncherUrls | null {
  const parsed = parseRepo(githubRepoUrl);
  if (!parsed) return null;

  const { owner, repo } = parsed;
  const normalizedPath = normalizeNotebookPath(notebookPath);
  const repoRoot = `https://github.com/${owner}/${repo}`;
  const codespacesUrl = `https://codespaces.new/${owner}/${repo}`;

  if (!normalizedPath) {
    return {
      colabUrl: repoRoot,
      codespacesUrl,
      githubFileUrl: repoRoot,
      githubRepoUrl: repoRoot,
      notebookPath: null,
      colabHint:
        "Push your notebook to the repo first, then use Colab on the file link below.",
    };
  }

  const githubFileUrl = `${repoRoot}/blob/${branch}/${normalizedPath}`;
  const colabUrl = `https://colab.research.google.com/github/${owner}/${repo}/blob/${branch}/${normalizedPath}`;

  return {
    colabUrl,
    codespacesUrl,
    githubFileUrl,
    githubRepoUrl: repoRoot,
    notebookPath: normalizedPath,
    colabHint: null,
  };
}

/** Git commands snippet for pushing notebook deliverables. */
export function buildGitSubmitSnippet(
  githubRepoUrl: string,
  notebookPath: string | null,
): string {
  const pathLine = notebookPath ?? "notebooks/your-notebook.ipynb";
  return [
    `git clone ${githubRepoUrl}.git`,
    `# ... work in the notebook ...`,
    `git add ${pathLine}`,
    `git commit -m "Submit day notebook"`,
    `git push origin main`,
  ].join("\n");
}
