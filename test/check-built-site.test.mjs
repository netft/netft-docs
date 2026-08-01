import assert from 'node:assert/strict';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const checker = path.resolve('scripts/check-built-site.mjs');

async function runChecker({files, routes}) {
  const root = await mkdtemp(path.join(tmpdir(), 'netft-docs-build-'));
  const buildRoot = path.join(root, 'build');
  const routesFile = path.join(root, 'routes.json');
  await mkdir(buildRoot);
  await writeFile(routesFile, JSON.stringify(routes));

  for (const [relativePath, contents] of Object.entries(files)) {
    const target = path.join(buildRoot, relativePath);
    await mkdir(path.dirname(target), {recursive: true});
    await writeFile(target, contents);
  }

  const result = spawnSync(
    process.execPath,
    [
      checker,
      '--build-root',
      buildRoot,
      '--routes',
      routesFile,
      '--base-url',
      '/netft-docs/',
    ],
    {encoding: 'utf8'},
  );

  await rm(root, {recursive: true, force: true});
  return result;
}

test('accepts expected routes with resolvable internal links', async () => {
  const result = await runChecker({
    routes: ['', 'docs/example'],
    files: {
      'index.html': '<a href="/netft-docs/docs/example/">Docs</a>',
      'docs/example/index.html': '<a href="/netft-docs/">Home</a>',
    },
  });

  assert.equal(result.status, 0, result.stderr);
});

test('rejects a missing expected route', async () => {
  const result = await runChecker({
    routes: ['', 'docs/example'],
    files: {'index.html': '<main></main>'},
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing route/i);
});

test('rejects a broken internal link', async () => {
  const result = await runChecker({
    routes: [''],
    files: {
      'index.html': '<a href="/netft-docs/docs/missing/">Missing</a>',
    },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /broken internal link/i);
});
