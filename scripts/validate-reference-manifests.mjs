import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {
  loadReferenceManifest,
  validateReferenceIdentity,
} from './reference/manifest.mjs';

const versions = JSON.parse(
  readFileSync('data/reference/versions.json', 'utf8'),
).components;
const catalog = JSON.parse(readFileSync('data/ecosystem.json', 'utf8'));
for (const offering of catalog.categories.flatMap(
  (category) => category.offerings,
)) {
  const name = offering.repository.split('/').at(-1);
  const component = versions[name];
  if (
    !component ||
    offering.version !== component.version ||
    offering.repository !== component.repository
  )
    throw new Error(`catalog identity does not match versions: ${name}`);
}
for (const [name, kind, component] of [
  ['cpp.json', 'cpp-api', 'netft-cpp'],
  ['python.json', 'python-api', 'pyNetFT'],
  ['cli.json', 'cli', 'netft-cli'],
  ['ros.json', 'ros', 'ros-netft'],
]) {
  validateReferenceIdentity(
    loadReferenceManifest(resolve('data/reference', name), kind),
    versions[component],
  );
}
