import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    timeout: 10000,
  });
  if (result.status !== 0)
    throw new Error(`cannot verify source checkout: ${result.stderr}`);
  return result.stdout.trim();
}
export function verifySourceIdentity(root, component, metadata) {
  if (!/^[0-9a-f]{40}$/.test(metadata.sourceCommit ?? ''))
    throw new Error('full sourceCommit is required');
  if (git(root, ['rev-parse', 'HEAD']) !== metadata.sourceCommit)
    throw new Error('source HEAD does not match reference identity');
  if (git(root, ['status', '--porcelain']))
    throw new Error('source checkout is dirty');
  const repository = `https://github.com/netft/${component}`;
  if (
    git(root, ['remote', 'get-url', 'origin']).replace(/\.git$/, '') !==
    repository
  )
    throw new Error('source repository does not match component');
  if (metadata.sourceTag === 'unreleased') {
    if (
      metadata.publication !== 'unreleased' ||
      metadata.sourceUrl !== `${repository}/tree/${metadata.sourceCommit}`
    )
      throw new Error('candidate publication identity is invalid');
  } else if (
    git(root, ['rev-parse', `${metadata.sourceTag}^{commit}`]) !==
      metadata.sourceCommit ||
    metadata.sourceUrl !== `${repository}/tree/${metadata.sourceTag}`
  ) {
    throw new Error('source tag does not match reference identity');
  }
  let version;
  if (component === 'pyNetFT') {
    version = readFileSync(join(root, 'pyproject.toml'), 'utf8').match(
      /^version\s*=\s*"([^"]+)"/m,
    )?.[1];
  } else if (component === 'ros-netft') {
    version = readFileSync(join(root, 'package.xml'), 'utf8').match(
      /<version>([^<]+)<\/version>/,
    )?.[1];
  } else {
    version = readFileSync(join(root, 'CMakeLists.txt'), 'utf8').match(
      /project\([^)]*\bVERSION\s+([0-9.]+)/,
    )?.[1];
  }
  if (version !== metadata.version)
    throw new Error('source version does not match reference version');
}
