import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

function textAt(route) {
  return readFileSync(`build/docs/references/${route}/index.html`, 'utf8')
    .replaceAll('<!-- -->', '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function cppRoute(symbol) {
  if (symbol.id === 'netft.Client') return 'cpp-api/client';
  if (symbol.category === 'enum') return 'cpp-api/enumerations';
  if (symbol.category === 'function') return 'cpp-api/functions';
  if (symbol.category === 'exception') return 'cpp-api/errors';
  if (['Sample', 'HealthSnapshot'].includes(symbol.name))
    return 'cpp-api/sample-and-health';
  return 'cpp-api/configuration';
}

function pythonRoute(symbol) {
  if (symbol.id === 'pynetft.Client') return 'python-api/client';
  if (symbol.category === 'enum') return 'python-api/enumerations';
  if (symbol.category === 'exception') return 'python-api/exceptions';
  if (['Sample', 'Health'].includes(symbol.name))
    return 'python-api/sample-and-health';
  if (['NetFT', 'Response'].includes(symbol.name)) return 'python-api/overview';
  return 'python-api/configuration';
}

for (const [filename, routeFor] of [
  ['cpp.json', cppRoute],
  ['python.json', pythonRoute],
]) {
  test(`every symbol in ${filename} is rendered by its canonical API page`, () => {
    const manifest = JSON.parse(
      readFileSync(`data/reference/${filename}`, 'utf8'),
    );
    for (const symbol of manifest.symbols) {
      const html = textAt(routeFor(symbol));
      assert.ok(
        html.includes(symbol.declaration),
        `${symbol.id} declaration is absent from ${routeFor(symbol)}`,
      );
    }
  });
}
