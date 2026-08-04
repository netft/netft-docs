import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';

function builtFooter() {
  const html = readFileSync('build/index.html', 'utf8');
  return html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
}

function filesBelow(root) {
  return readdirSync(root, {withFileTypes: true}).flatMap((entry) => {
    const target = join(root, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

test('repository exposes separate documentation and code licenses', () => {
  assert.ok(existsSync('LICENSE-DOCS'), 'LICENSE-DOCS must exist');
  assert.match(
    readFileSync('LICENSE-DOCS', 'utf8'),
    /Attribution 4\.0 International/,
  );
  assert.match(readFileSync('LICENSE', 'utf8'), /Apache License/);
});

test('built footer presents the documentation license without repository navigation', () => {
  const footer = builtFooter();
  assert.match(footer, /href="[^"]*LICENSE-DOCS"/);
  assert.doesNotMatch(footer, /href="[^"]*\/LICENSE"/);
  assert.doesNotMatch(footer, />Documentation<|>Resources</);
});

test('production build contains a local documentation search index', () => {
  const searchData = filesBelow('build').filter((path) =>
    /search[^/]*\.json$/i.test(path),
  );
  assert.ok(searchData.length > 0, 'search JSON asset must exist');
  assert.ok(
    searchData.some((path) =>
      readFileSync(path, 'utf8').includes('/docs/references/cpp-api/client'),
    ),
    'search data must index API reference routes',
  );
});

test('production build targets the custom domain at its root path', () => {
  const html = readFileSync('build/index.html', 'utf8');
  assert.match(
    html,
    /<link[^>]+rel="canonical"[^>]+href="https:\/\/netft\.dev\/"/,
  );
  assert.match(html, /(?:href|src)="\/assets\//);
  assert.doesNotMatch(html, /(?:href|src)="\/netft-docs\//);
});

test('navbar presents an accessible GitHub organization link without a second external-link icon', () => {
  assert.ok(
    existsSync('static/img/github-mark.svg'),
    'official GitHub mark must exist',
  );
  const html = readFileSync('build/index.html', 'utf8');
  const link =
    html.match(
      /<a[^>]*href="https:\/\/github\.com\/netft"[\s\S]*?<\/a>/,
    )?.[0] ?? '';
  assert.match(link, /aria-label="Net F\/T organization on GitHub"/);
  assert.match(link, />GitHub(?:<|$)/);
  const styles = filesBelow('build').filter((path) => path.endsWith('.css'));
  assert.ok(
    styles.some((path) =>
      /\.header-github-link>svg(?:,[^{]+)*\{[^}]*display:none/.test(
        readFileSync(path, 'utf8'),
      ),
    ),
    'built CSS must suppress the framework external-link glyph',
  );
});
