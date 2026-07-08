// sql.js (SQLite compiled to WASM) runs entirely in the browser. Each run spins
// up a fresh in-memory database, applies optional setup SQL, then the user's
// query. Lazy-loaded from the CDN on first Run.

const SQLJS_VERSION = "1.11.0";
const SQLJS_BASE = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}/dist/`;

type SqlValue = string | number | Uint8Array | null;

type SqlJsExecResult = { columns: string[]; values: SqlValue[][] };

type SqlDatabase = {
  run: (sql: string) => void;
  exec: (sql: string) => SqlJsExecResult[];
  close: () => void;
};

type SqlJsStatic = {
  Database: new () => SqlDatabase;
};

declare global {
  interface Window {
    initSqlJs?: (config: {
      locateFile: (file: string) => string;
    }) => Promise<SqlJsStatic>;
  }
}

export type SqlRunResult = {
  output: string;
  error?: string;
  columns?: string[];
  rows?: SqlValue[][];
};

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

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
    script.onerror = () => reject(new Error("Failed to load sql.js"));
    document.head.appendChild(script);
  });
}

async function ensureSqlJs(): Promise<SqlJsStatic> {
  if (sqlJsPromise) return sqlJsPromise;
  sqlJsPromise = (async () => {
    await injectScript(`${SQLJS_BASE}sql-wasm.js`);
    if (!window.initSqlJs) throw new Error("sql.js loader unavailable");
    return window.initSqlJs({ locateFile: (file) => `${SQLJS_BASE}${file}` });
  })();
  return sqlJsPromise;
}

function toAsciiTable(columns: string[], rows: SqlValue[][]): string {
  if (columns.length === 0) return "(no results)";
  const cells = [columns, ...rows.map((r) => r.map((v) => String(v ?? "NULL")))];
  const widths = columns.map((_, i) =>
    Math.max(...cells.map((row) => (row[i] ?? "").length)),
  );
  const line = (row: string[]) =>
    "| " + row.map((c, i) => (c ?? "").padEnd(widths[i]!)).join(" | ") + " |";
  const sep = "+-" + widths.map((w) => "-".repeat(w)).join("-+-") + "-+";
  const body = rows.map((r) => line(r.map((v) => String(v ?? "NULL"))));
  return [sep, line(columns), sep, ...body, sep].join("\n");
}

export async function run(
  sql: string,
  setupSql?: string,
): Promise<SqlRunResult> {
  let SQL: SqlJsStatic;
  try {
    SQL = await ensureSqlJs();
  } catch (e) {
    sqlJsPromise = null;
    return { output: "", error: `Could not load the SQL runtime. ${String(e)}` };
  }

  const db = new SQL.Database();
  try {
    if (setupSql && setupSql.trim()) db.run(setupSql);
    const results = db.exec(sql);
    if (results.length === 0) {
      return { output: "Query OK (no rows returned).", columns: [], rows: [] };
    }
    const last = results[results.length - 1]!;
    return {
      output: toAsciiTable(last.columns, last.values),
      columns: last.columns,
      rows: last.values,
    };
  } catch (e) {
    return { output: "", error: String(e) };
  } finally {
    db.close();
  }
}
