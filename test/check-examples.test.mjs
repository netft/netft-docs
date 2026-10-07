import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

test('an isolated checkout cannot silently pass without SDK headers', () => {
  const directory = mkdtempSync(join(tmpdir(), 'netft-docs-examples-'));
  try {
    const result = spawnSync(process.execPath, ['scripts/check-examples.mjs'], {
      env: {...process.env, NETFT_CPP_ROOT: directory},
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SDK headers missing/);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
