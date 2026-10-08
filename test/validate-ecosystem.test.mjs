import assert from 'node:assert/strict';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const validator = path.resolve('scripts/validate-ecosystem.mjs');

async function runValidator(catalog, routes) {
  const root = await mkdtemp(path.join(tmpdir(), 'netft-docs-ecosystem-'));
  const catalogPath = path.join(root, 'ecosystem.json');
  const docsRoot = path.join(root, 'docs');

  await mkdir(docsRoot);
  await writeFile(catalogPath, JSON.stringify(catalog));

  for (const route of routes) {
    const file = path.join(docsRoot, `${route}.md`);
    await mkdir(path.dirname(file), {recursive: true});
    await writeFile(file, '# Fixture\n');
  }

  const result = spawnSync(
    process.execPath,
    [validator, '--catalog', catalogPath, '--docs-root', docsRoot],
    {encoding: 'utf8'},
  );

  await rm(root, {recursive: true, force: true});
  return result;
}

const offering = {
  id: 'netft-cpp',
  name: 'netft-cpp',
  summary: 'Fixture summary.',
  audience: 'C++ developers',
  docsPath: 'sdks/cpp',
  repository: 'https://github.com/netft/netft-cpp',
  version: '0.3.3',
  platforms: ['Linux', 'macOS', 'Windows'],
  installMethods: ['source'],
  documentationOwner: 'netft-docs',
  priority: 1,
};

const validCatalog = {
  categories: [
    {
      id: 'sdks',
      label: 'SDKs',
      summary: 'Fixture category.',
      offerings: [offering],
    },
  ],
  workflows: [
    {
      id: 'develop',
      label: 'Build an application',
      summary: 'Fixture workflow.',
      offeringIds: ['netft-cpp'],
      priority: 1,
    },
  ],
};

test('accepts categorized offerings referenced by valid workflows', async () => {
  const result = await runValidator(validCatalog, ['sdks/cpp']);

  assert.equal(result.status, 0, result.stderr);
});

test('rejects duplicate offering identifiers across categories', async () => {
  const result = await runValidator(
    {
      ...validCatalog,
      categories: [
        ...validCatalog.categories,
        {
          id: 'applications',
          label: 'Applications',
          summary: 'Fixture category.',
          offerings: [{...offering, priority: 2}],
        },
      ],
    },
    ['sdks/cpp'],
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate offering id/i);
});

test('rejects workflows that reference an unknown offering', async () => {
  const result = await runValidator(
    {
      ...validCatalog,
      workflows: [
        {...validCatalog.workflows[0], offeringIds: ['missing-offering']},
      ],
    },
    ['sdks/cpp'],
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown offering/i);
});

test('rejects repositories outside the netft organization', async () => {
  const result = await runValidator(
    {
      ...validCatalog,
      categories: [
        {
          ...validCatalog.categories[0],
          offerings: [
            {...offering, repository: 'https://example.com/offering'},
          ],
        },
      ],
    },
    ['sdks/cpp'],
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /repository/i);
});

test('rejects an offering whose documentation route is missing', async () => {
  const result = await runValidator(validCatalog, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /documentation route/i);
});

test('rejects a malformed version', async () => {
  const catalog = structuredClone(validCatalog);
  catalog.categories[0].offerings[0].version = 'latest';
  const result = await runValidator(catalog, ['sdks/cpp']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /version/i);
});

test('rejects an unsupported platform value', async () => {
  const catalog = structuredClone(validCatalog);
  catalog.categories[0].offerings[0].platforms = ['TempleOS'];
  const result = await runValidator(catalog, ['sdks/cpp']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /platform/i);
});

test('accepts explicitly labeled development releases', async () => {
  const catalog = structuredClone(validCatalog);
  catalog.categories[0].offerings[0].releaseChannel = 'development';
  const result = await runValidator(catalog, ['sdks/cpp']);
  assert.equal(result.status, 0, result.stderr);
});

test('rejects unsupported release channels', async () => {
  const catalog = structuredClone(validCatalog);
  catalog.categories[0].offerings[0].releaseChannel = 'unknown';
  const result = await runValidator(catalog, ['sdks/cpp']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release channel/i);
});
