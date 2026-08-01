import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const validator = path.resolve('scripts/validate-sources.mjs');
const valid = [
  {
    id: 'ati-manual',
    title: 'Net F/T manual',
    publisher: 'ATI Industrial Automation',
    documentNumber: '9620-05-NET FT-23',
    url: 'https://www.ati-ia.com/manual.pdf',
    accessed: '2026-08-01',
  },
];

async function run(sources) {
  const root = await mkdtemp(path.join(tmpdir(), 'netft-sources-'));
  const file = path.join(root, 'sources.json');
  await writeFile(file, JSON.stringify(sources));
  const result = spawnSync(process.execPath, [validator, '--sources', file], {
    encoding: 'utf8',
  });
  await rm(root, {recursive: true, force: true});
  return result;
}

test('accepts complete official source metadata', async () => {
  assert.equal((await run(valid)).status, 0);
});

test('rejects duplicate source identifiers', async () => {
  const result = await run([...valid, {...valid[0]}]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate source id/i);
});

test('rejects non-HTTPS source URLs', async () => {
  const result = await run([
    {...valid[0], url: 'http://www.ati-ia.com/manual.pdf'},
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /https/i);
});

test('rejects malformed access dates', async () => {
  const result = await run([{...valid[0], accessed: 'August 1'}]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /access date/i);
});
