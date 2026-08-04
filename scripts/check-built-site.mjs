import {access, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const buildRoot = path.resolve(option('--build-root', 'build'));
const routesPath = option('--routes', 'data/site-routes.json');
const baseUrl = option('--base-url', '/');
const failures = [];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await htmlFiles(target)));
    } else if (entry.name.endsWith('.html')) {
      files.push(target);
    }
  }
  return files;
}

function outputPath(pathname) {
  const relative = pathname.slice(baseUrl.length);
  if (relative === '' || relative.endsWith('/')) {
    return path.join(buildRoot, relative, 'index.html');
  }
  if (path.extname(relative) === '') {
    return path.join(buildRoot, relative, 'index.html');
  }
  return path.join(buildRoot, relative);
}

const routes = JSON.parse(await readFile(routesPath, 'utf8'));
for (const route of routes) {
  const relative = route === '' ? 'index.html' : path.join(route, 'index.html');
  if (!(await exists(path.join(buildRoot, relative)))) {
    failures.push(`missing route: ${route || '/'}`);
  }
}

for (const htmlFile of await htmlFiles(buildRoot)) {
  const sourceRelative = path
    .relative(buildRoot, htmlFile)
    .split(path.sep)
    .join('/');
  const sourceRoute = sourceRelative.endsWith('/index.html')
    ? sourceRelative.slice(0, -'index.html'.length)
    : sourceRelative;
  const sourceUrl = new URL(sourceRoute, `https://example.test${baseUrl}`);
  const contents = await readFile(htmlFile, 'utf8');
  const hrefPattern = /\shref=["']([^"']+)["']/g;

  for (const match of contents.matchAll(hrefPattern)) {
    const href = match[1];
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) {
      continue;
    }

    const target = new URL(href, sourceUrl);
    if (target.origin !== sourceUrl.origin) {
      continue;
    }
    if (!target.pathname.startsWith(baseUrl)) {
      failures.push(`broken internal link in ${sourceRelative}: ${href}`);
      continue;
    }
    if (!(await exists(outputPath(decodeURIComponent(target.pathname))))) {
      failures.push(`broken internal link in ${sourceRelative}: ${href}`);
    }
  }
}

if (failures.length > 0) {
  console.error([...new Set(failures)].join('\n'));
  process.exitCode = 1;
}
