import assert from 'node:assert/strict';
import {test} from 'node:test';

import {validateReferenceManifest} from '../scripts/reference/manifest.mjs';

function apiSymbol(overrides = {}) {
  return {
    id: 'netft.Client',
    name: 'Client',
    qualifiedName: 'netft::Client',
    category: 'class',
    declaration: 'class Client',
    sourcePath: 'include/netft/client.hpp',
    fields: [],
    methods: [],
    values: [],
    bases: [],
    ...overrides,
  };
}

function apiManifest(overrides = {}) {
  return {
    schemaVersion: 1,
    kind: 'cpp-api',
    component: 'netft-cpp',
    version: '0.3.3',
    sourceTag: 'v0.3.3',
    sourceCommit: '1'.repeat(40),
    sourceUrl: 'https://github.com/netft/netft-cpp/tree/v0.3.3',
    symbols: [apiSymbol()],
    ...overrides,
  };
}

test('accepts a complete public API manifest', () => {
  assert.doesNotThrow(() =>
    validateReferenceManifest(apiManifest(), 'cpp-api'),
  );
});

test('rejects duplicate API symbol identifiers', () => {
  const symbol = apiSymbol();
  assert.throws(
    () =>
      validateReferenceManifest(
        apiManifest({symbols: [symbol, {...symbol}]}),
        'cpp-api',
      ),
    /duplicate symbol id: netft\.Client/,
  );
});

test('rejects duplicate method anchors within a type', () => {
  const method = {
    id: 'start',
    name: 'start',
    signature: 'void start(SampleCallback callback)',
    returnType: 'void',
    parameters: [],
    qualifiers: [],
    throws: [],
  };
  assert.throws(
    () =>
      validateReferenceManifest(
        apiManifest({
          symbols: [apiSymbol({methods: [method, {...method}]})],
        }),
        'cpp-api',
      ),
    /duplicate method id: netft\.Client#start/,
  );
});

test('rejects private Python symbols', () => {
  const manifest = apiManifest({
    kind: 'python-api',
    component: 'pyNetFT',
    version: '2.1.0',
    sourceTag: 'v2.1.0',
    sourceUrl: 'https://github.com/netft/pyNetFT/tree/v2.1.0',
    symbols: [
      apiSymbol({
        id: 'pynetft._native.Client',
        qualifiedName: 'pynetft._native.Client',
        sourcePath: 'src/pynetft/_native.pyi',
      }),
    ],
  });
  assert.throws(
    () => validateReferenceManifest(manifest, 'python-api'),
    /private Python symbol/,
  );
});

test('rejects a CLI command that references an unknown option', () => {
  const manifest = {
    schemaVersion: 1,
    kind: 'cli',
    component: 'netft-cli',
    version: '0.2.0',
    sourceTag: 'v0.2.0',
    sourceCommit: '1'.repeat(40),
    sourceUrl: 'https://github.com/netft/netft-cli/tree/v0.2.0',
    options: [],
    commands: [
      {
        id: 'info',
        name: 'info',
        synopsis: 'netft info [HOST]',
        optionIds: ['format'],
        positionals: [],
        examples: [],
        exitStatuses: [0],
      },
    ],
    exitStatuses: [{code: 0, meaning: 'Completed'}],
  };
  assert.throws(
    () => validateReferenceManifest(manifest, 'cli'),
    /unknown option: format/,
  );
});
