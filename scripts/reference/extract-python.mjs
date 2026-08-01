import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function extractPython(root, metadata) {
  const script = fileURLToPath(new URL('./extract-python.py', import.meta.url));
  const result = spawnSync(
    'python3',
    [script, root, JSON.stringify(metadata)],
    {
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) {
    throw new Error(`Python API extraction failed: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}
