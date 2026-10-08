import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {verifySourceIdentity} from './source-identity.mjs';

import {extractCli} from './extract-cli.mjs';
import {extractCpp} from './extract-cpp.mjs';
import {extractPython} from './extract-python.mjs';
import {extractRos} from './extract-ros.mjs';
import {validateReferenceManifest} from './manifest.mjs';

const required = ['cpp', 'python', 'cli', 'ros'];

export function parseSourcePaths(arguments_) {
  if (arguments_[0] === '--') arguments_ = arguments_.slice(1);
  const values = new Map();
  for (let index = 0; index < arguments_.length; index += 2) {
    const option = arguments_[index];
    const value = arguments_[index + 1];
    if (!option?.startsWith('--') || value === undefined) return null;
    values.set(option.slice(2), resolve(value));
  }
  if (required.some((name) => !values.has(name))) return null;
  return Object.fromEntries(required.map((name) => [name, values.get(name)]));
}

function metadata(component, versions) {
  const value = versions.components[component];
  return {
    version: value.version,
    sourceCommit: value.sourceCommit,
    publication: value.publication ?? 'released',
    sourceTag: value.sourceTag,
    sourceUrl: value.sourceUrl,
  };
}

export function updateReferenceManifests(paths) {
  const versions = JSON.parse(
    readFileSync(
      resolve(
        process.env.NETFT_REFERENCE_VERSIONS || 'data/reference/versions.json',
      ),
      'utf8',
    ),
  );
  for (const [key, component] of Object.entries({
    cpp: 'netft-cpp',
    python: 'pyNetFT',
    cli: 'netft-cli',
    ros: 'ros-netft',
  })) {
    verifySourceIdentity(paths[key], component, metadata(component, versions));
  }
  const manifests = {
    'cpp.json': validateReferenceManifest(
      extractCpp(paths.cpp, metadata('netft-cpp', versions)),
      'cpp-api',
    ),
    'python.json': validateReferenceManifest(
      extractPython(paths.python, metadata('pyNetFT', versions)),
      'python-api',
    ),
    'cli.json': validateReferenceManifest(
      extractCli(paths.cli, metadata('netft-cli', versions)),
      'cli',
    ),
    'ros.json': validateReferenceManifest(
      extractRos(paths.ros, metadata('ros-netft', versions)),
      'ros',
    ),
  };
  for (const [filename, manifest] of Object.entries(manifests)) {
    writeFileSync(
      resolve(process.env.NETFT_REFERENCE_OUTPUT || 'data/reference', filename),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const paths = parseSourcePaths(process.argv.slice(2));
  if (paths === null) {
    process.stderr.write(
      'Usage: update.mjs --cpp PATH --python PATH --cli PATH --ros PATH\n',
    );
    process.exitCode = 2;
  } else {
    updateReferenceManifests(paths);
  }
}
