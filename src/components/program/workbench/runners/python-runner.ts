// Pyodide runs on the main thread in v1. Tradeoff: a long-running / infinite
// Python loop can freeze the tab (no worker to terminate). We accept this for
// v1 to keep the integration simple; CODE_SPRINT missions are short scripts.
// The ~7 MB runtime is lazy-loaded from the CDN only on first Run.

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

type PyodideInterface = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

export type RunResult = { output: string; error?: string };

let pyodidePromise: Promise<PyodideInterface> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.head.appendChild(script);
  });
}

async function ensurePyodide(): Promise<PyodideInterface> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    await injectScript(`${PYODIDE_BASE}pyodide.js`);
    if (!window.loadPyodide) {
      throw new Error("Pyodide loader unavailable");
    }
    return window.loadPyodide({ indexURL: PYODIDE_BASE });
  })();
  return pyodidePromise;
}

/** True once the runtime has been requested (used to show a size warning). */
export function isPythonLoaded(): boolean {
  return pyodidePromise !== null;
}

export async function run(code: string): Promise<RunResult> {
  let pyodide: PyodideInterface;
  try {
    pyodide = await ensurePyodide();
  } catch (e) {
    pyodidePromise = null;
    return { output: "", error: `Could not load the Python runtime. ${String(e)}` };
  }

  const out: string[] = [];
  const err: string[] = [];
  pyodide.setStdout({ batched: (s) => out.push(s) });
  pyodide.setStderr({ batched: (s) => err.push(s) });

  try {
    await pyodide.runPythonAsync(code);
    return { output: out.join("\n"), error: err.length ? err.join("\n") : undefined };
  } catch (e) {
    return { output: out.join("\n"), error: String(e) };
  }
}
