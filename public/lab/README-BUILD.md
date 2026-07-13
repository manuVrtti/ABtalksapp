# JupyterLite build (Project Lab)

Static JupyterLite artifact served at `/lab/lab/index.html`.

## Rebuild

```bash
pip install jupyterlite-core jupyterlite-pyodide-kernel
jupyter lite build --output-dir public/lab
```

If `jupyter-lite` is not on PATH (macOS user install):

```bash
python3 -m pip install jupyterlite-core jupyterlite-pyodide-kernel
~/.local/bin/jupyter-lite build --output-dir public/lab
# or: ~/Library/Python/3.9/bin/jupyter-lite build --output-dir public/lab
```

## Verify locally

1. Open `/lab/lab/index.html` (via `npm run dev`).
2. Run a pandas cell; reload the page — notebook state should persist via IndexedDB.

## Size

Expect ~40–70 MB. Prune unused JupyterLite extensions if the bundle grows too large for Vercel.
