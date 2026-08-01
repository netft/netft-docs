import {readFileSync} from 'node:fs';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function unique(items, key, label) {
  const seen = new Set();
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) throw new Error(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function validateMetadata(manifest, expectedKind) {
  requireObject(manifest, 'manifest');
  if (manifest.schemaVersion !== 1)
    throw new Error('unsupported schema version');
  if (manifest.kind !== expectedKind) {
    throw new Error(
      `expected ${expectedKind} manifest, received ${manifest.kind}`,
    );
  }
  for (const field of ['component', 'version', 'sourceTag', 'sourceUrl']) {
    requireString(manifest[field], field);
  }
  if (!manifest.sourceUrl.startsWith('https://github.com/netft/')) {
    throw new Error('sourceUrl must refer to the netft organization');
  }
}

function validateApi(manifest) {
  if (!Array.isArray(manifest.symbols))
    throw new TypeError('symbols must be an array');
  unique(manifest.symbols, (symbol) => symbol.id, 'symbol id');
  for (const symbol of manifest.symbols) {
    for (const field of [
      'id',
      'name',
      'qualifiedName',
      'category',
      'declaration',
      'sourcePath',
    ]) {
      requireString(symbol[field], `symbol.${field}`);
    }
    if (
      manifest.kind === 'cpp-api' &&
      !symbol.sourcePath.startsWith('include/netft/')
    ) {
      throw new Error(`C++ symbol is outside include/netft: ${symbol.id}`);
    }
    if (
      manifest.kind === 'python-api' &&
      (symbol.id.includes('._native') ||
        symbol.qualifiedName.includes('._native'))
    ) {
      throw new Error(`private Python symbol: ${symbol.id}`);
    }
    for (const field of ['fields', 'methods', 'values', 'bases']) {
      if (!Array.isArray(symbol[field]))
        throw new TypeError(`${symbol.id}.${field} must be an array`);
    }
    unique(
      symbol.methods,
      (method) => `${symbol.id}#${method.id}`,
      'method id',
    );
  }
}

function validateCli(manifest) {
  if (!Array.isArray(manifest.options) || !Array.isArray(manifest.commands)) {
    throw new TypeError('CLI options and commands must be arrays');
  }
  unique(manifest.options, (option) => option.id, 'option id');
  unique(manifest.commands, (command) => command.id, 'command id');
  const optionIds = new Set(manifest.options.map((option) => option.id));
  for (const command of manifest.commands) {
    for (const optionId of command.optionIds ?? []) {
      if (!optionIds.has(optionId))
        throw new Error(`unknown option: ${optionId}`);
    }
  }
}

function validateRos(manifest) {
  for (const field of [
    'standaloneParameters',
    'hardwareParameters',
    'interfaces',
  ]) {
    if (!Array.isArray(manifest[field]))
      throw new TypeError(`${field} must be an array`);
  }
  const allowed = new Set(['topic', 'service', 'state', 'diagnostic']);
  for (const item of manifest.interfaces) {
    if (!allowed.has(item.category))
      throw new Error(`invalid ROS interface category: ${item.category}`);
  }
}

export function validateReferenceManifest(manifest, expectedKind) {
  validateMetadata(manifest, expectedKind);
  if (expectedKind === 'cpp-api' || expectedKind === 'python-api')
    validateApi(manifest);
  else if (expectedKind === 'cli') validateCli(manifest);
  else if (expectedKind === 'ros') validateRos(manifest);
  else throw new Error(`unknown manifest kind: ${expectedKind}`);
  return manifest;
}

export function loadReferenceManifest(file, expectedKind) {
  return validateReferenceManifest(
    JSON.parse(readFileSync(file, 'utf8')),
    expectedKind,
  );
}
