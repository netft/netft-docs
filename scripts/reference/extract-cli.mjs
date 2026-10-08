import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

export function extractCli(root, metadata) {
  const executable = [
    process.env.NETFT_CLI_EXECUTABLE,
    join(root, 'build/netft'),
    join(root, 'build/release/netft'),
  ]
    .filter(Boolean)
    .find(existsSync);
  if (!executable)
    throw new Error(
      'netft-cli executable not found; build the exact checkout before extraction',
    );
  const result = spawnSync(executable, ['--schema'], {
    encoding: 'utf8',
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
  if (result.status !== 0)
    throw new Error(
      'selected CLI must support --schema; use an explicit unpublished candidate until the interface is released',
    );
  const manifest = JSON.parse(result.stdout);
  validateCliIdentity(manifest, metadata);
  const {sourceDirty, ...data} = manifest;
  return {...data, ...metadata};
}

export function validateCliIdentity(manifest, metadata) {
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cli' ||
    manifest.component !== 'netft-cli'
  )
    throw new Error('unsupported CLI machine interface');
  if (
    manifest.version !== metadata.version ||
    manifest.sourceCommit !== metadata.sourceCommit ||
    manifest.sourceDirty !== false
  )
    throw new Error(
      'CLI executable identity does not match clean source checkout',
    );
}
