import {existsSync} from 'node:fs';
import {resolve} from 'node:path';

import {loadReferenceManifest} from './reference/manifest.mjs';

for (const [name, kind] of [
  ['cpp.json', 'cpp-api'],
  ['python.json', 'python-api'],
  ['cli.json', 'cli'],
  ['ros.json', 'ros'],
]) {
  const file = resolve('data/reference', name);
  if (existsSync(file)) loadReferenceManifest(file, kind);
}
