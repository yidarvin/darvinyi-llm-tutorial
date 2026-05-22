declare global {
  interface Window {
    __pyodide?: any;
    __pyodideLoading?: Promise<any>;
    loadPyodide?: (options: { indexURL: string }) => Promise<any>;
  }
}

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

function injectPyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Pyodide loader script can only be injected in the browser.'));
      return;
    }
    if (window.loadPyodide) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-pyodide-loader]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Pyodide loader script failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = `${PYODIDE_INDEX_URL}pyodide.js`;
    script.async = true;
    script.dataset.pyodideLoader = 'true';
    script.addEventListener('load', () => {
      if (window.loadPyodide) resolve();
      else reject(new Error('Pyodide script loaded but window.loadPyodide is undefined'));
    });
    script.addEventListener('error', () =>
      reject(new Error('Failed to load Pyodide loader script from CDN'))
    );
    document.head.appendChild(script);
  });
}

export async function getPyodide(packages: string[] = []): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Pyodide is client-only; do not call from Astro server context.');
  }

  if (window.__pyodide) {
    await ensurePackages(window.__pyodide, packages);
    return window.__pyodide;
  }

  if (window.__pyodideLoading) {
    const py = await window.__pyodideLoading;
    await ensurePackages(py, packages);
    return py;
  }

  window.__pyodideLoading = (async () => {
    await injectPyodideScript();
    if (!window.loadPyodide) {
      throw new Error('Pyodide script loaded but loadPyodide is unavailable.');
    }
    const py = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    window.__pyodide = py;
    await ensurePackages(py, packages);
    return py;
  })();

  return window.__pyodideLoading;
}

async function ensurePackages(py: any, packages: string[]): Promise<void> {
  if (packages.length === 0) return;
  await py.loadPackage(packages);
}

export interface RunResult {
  stdout: string;
  error?: string;
}

export async function runPython(code: string, packages: string[] = []): Promise<RunResult> {
  const py = await getPyodide(packages);

  const buffer: string[] = [];
  py.setStdout({ batched: (s: string) => buffer.push(s) });
  py.setStderr({ batched: (s: string) => buffer.push(s) });

  try {
    await py.runPythonAsync(code);
    return { stdout: buffer.join('') };
  } catch (e: any) {
    const errorMessage = String(e?.message ?? e);
    return { stdout: buffer.join(''), error: errorMessage };
  }
}
