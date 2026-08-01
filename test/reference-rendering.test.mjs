import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

test('built C++ Client reference exposes the declaration and stable method anchors', () => {
  const html = readFileSync(
    'build/docs/references/cpp-api/client/index.html',
    'utf8',
  );
  assert.match(html, /netft::Client/);
  assert.match(html, /void start\(SampleCallback callback\)/);
  assert.match(html, /id="start"/);
  assert.match(
    html,
    /https:\/\/github\.com\/netft\/netft-cpp\/tree\/v0\.3\.3\/include\/netft\/client\.hpp/,
  );
  assert.doesNotMatch(html, /pynetft\._native/);
});

test('reference tables preserve column meaning when reflowed on narrow screens', () => {
  const html = readFileSync(
    'build/docs/references/python-api/configuration/index.html',
    'utf8',
  );
  assert.match(html, /data-label="Name"/);
  assert.match(html, /data-label="Type"/);
  assert.match(html, /data-label="Default"/);
  assert.match(html, /data-label="Mutability"/);
});
