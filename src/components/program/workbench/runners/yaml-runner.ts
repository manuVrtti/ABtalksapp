// YAML "runs" by parsing with js-yaml and pretty-printing the resulting
// structure (or the parse error). No CDN — js-yaml is a bundled dep.

import { load, YAMLException } from "js-yaml";

export type RunResult = { output: string; error?: string };

export function run(code: string): Promise<RunResult> {
  return Promise.resolve().then(() => {
    try {
      const parsed = load(code);
      if (parsed === undefined) {
        return { output: "(empty document)" };
      }
      return { output: JSON.stringify(parsed, null, 2) };
    } catch (e) {
      if (e instanceof YAMLException) {
        return { output: "", error: e.message };
      }
      return { output: "", error: String(e) };
    }
  });
}
