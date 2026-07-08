// User JS runs inside a Blob Worker — never eval'd on the main thread. A hard
// 5-second terminate() protects against infinite loops (the worker is killed;
// the page stays responsive).

const TIMEOUT_MS = 5000;

export type RunResult = { output: string; error?: string };

const WORKER_SOURCE = `
  self.onmessage = (e) => {
    const logs = [];
    const format = (v) => {
      if (typeof v === "string") return v;
      try { return JSON.stringify(v); } catch { return String(v); }
    };
    const push = (...args) => logs.push(args.map(format).join(" "));
    self.console = { log: push, info: push, warn: push, error: push, debug: push };
    try {
      const result = (0, eval)(e.data);
      self.postMessage({ ok: true, output: logs.join("\\n") });
    } catch (err) {
      self.postMessage({ ok: false, output: logs.join("\\n"), error: String(err) });
    }
  };
`;

export function run(code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    let blobUrl: string | null = null;
    let worker: Worker | null = null;

    const cleanup = () => {
      if (worker) worker.terminate();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      worker = null;
      blobUrl = null;
    };

    try {
      const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
      blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl);
    } catch (e) {
      cleanup();
      resolve({ output: "", error: `Could not start the JS runtime. ${String(e)}` });
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        output: "",
        error: `Execution timed out after ${TIMEOUT_MS / 1000}s (possible infinite loop).`,
      });
    }, TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent<RunResult & { ok: boolean }>) => {
      clearTimeout(timer);
      cleanup();
      resolve({ output: e.data.output, error: e.data.error });
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      cleanup();
      resolve({ output: "", error: e.message || "Worker error" });
    };

    worker.postMessage(code);
  });
}
