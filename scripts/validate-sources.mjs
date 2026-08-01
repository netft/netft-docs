import {readFile} from 'node:fs/promises';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const failures = [];
let sources;
try {
  sources = JSON.parse(
    await readFile(option('--sources', 'data/official-sources.json'), 'utf8'),
  );
} catch (error) {
  failures.push(`sources could not be read: ${error.message}`);
}

if (!Array.isArray(sources) || sources.length === 0) {
  failures.push('sources must be a non-empty array');
} else {
  const ids = new Set();
  for (const source of sources) {
    if (ids.has(source.id)) failures.push(`duplicate source id: ${source.id}`);
    ids.add(source.id);
    for (const field of ['id', 'title', 'publisher', 'documentNumber']) {
      if (typeof source[field] !== 'string' || source[field].trim() === '') {
        failures.push(
          `${source.id ?? 'source'}: ${field} must be non-empty text`,
        );
      }
    }
    if (typeof source.url !== 'string' || !source.url.startsWith('https://')) {
      failures.push(`${source.id}: URL must use HTTPS`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessed ?? '')) {
      failures.push(`${source.id}: access date must use YYYY-MM-DD`);
    }
  }
}

if (failures.length) {
  console.error([...new Set(failures)].join('\n'));
  process.exitCode = 1;
}
