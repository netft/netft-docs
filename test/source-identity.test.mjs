import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {verifySourceIdentity} from '../scripts/reference/source-identity.mjs';

test('reference provenance binds tag, version and clean checkout to a real commit', () => {
  const root = mkdtempSync(join(tmpdir(), 'netft-reference-git-'));
  const git = (...args) => {
    const result = spawnSync('git', ['-C', root, ...args], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  try {
    git('init');
    git('config', 'user.email', 'test@example.invalid');
    git('config', 'user.name', 'Fixture');
    git('remote', 'add', 'origin', 'https://github.com/netft/netft-cpp.git');
    writeFileSync(
      join(root, 'CMakeLists.txt'),
      'project(netft VERSION 1.2.3 LANGUAGES CXX)\n',
    );
    git('add', '.');
    git('commit', '-m', 'release');
    git('tag', 'v1.2.3');
    const metadata = {
      version: '1.2.3',
      sourceTag: 'v1.2.3',
      sourceCommit: git('rev-parse', 'HEAD'),
      sourceUrl: 'https://github.com/netft/netft-cpp/tree/v1.2.3',
    };
    assert.doesNotThrow(() =>
      verifySourceIdentity(root, 'netft-cpp', metadata),
    );
    assert.throws(
      () =>
        verifySourceIdentity(root, 'netft-cpp', {
          ...metadata,
          version: '1.2.4',
        }),
      /version/,
    );
    writeFileSync(join(root, 'changed.txt'), 'new');
    assert.throws(
      () => verifySourceIdentity(root, 'netft-cpp', metadata),
      /dirty/,
    );
    git('add', '.');
    git('commit', '-m', 'next');
    assert.throws(
      () => verifySourceIdentity(root, 'netft-cpp', metadata),
      /HEAD/,
    );
    assert.throws(
      () =>
        verifySourceIdentity(root, 'netft-cpp', {
          ...metadata,
          sourceCommit: git('rev-parse', 'HEAD'),
        }),
      /tag/,
    );
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
