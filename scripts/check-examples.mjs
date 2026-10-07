import {access, readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const allowMissing = process.argv.includes('--allow-missing');
if (process.argv.slice(2).some((arg) => arg !== '--allow-missing')) {
  throw new Error('usage: check-examples.mjs [--allow-missing]');
}
const versions = JSON.parse(
  await readFile('data/reference/versions.json', 'utf8'),
);
const cppRoot = path.resolve(
  process.env.NETFT_CPP_ROOT || '.dependencies/netft-cpp',
);
const python = process.env.PYTHON || 'python3';
function run(command, args) {
  const result = spawnSync(command, args, {encoding: 'utf8', timeout: 60000});
  if (result.status !== 0) {
    throw new Error(
      result.stderr || result.stdout || `${command} failed: ${result.error}`,
    );
  }
}

let haveCpp = true;
try {
  await access(path.join(cppRoot, 'include/netft/client.hpp'));
} catch {
  haveCpp = false;
  if (!allowMissing)
    throw new Error(
      'C++ SDK headers missing: set NETFT_CPP_ROOT or install the fixed .dependencies checkout',
    );
  console.log('Explicitly skipped C++ example: SDK headers unavailable.');
}
if (haveCpp) {
  run(process.env.CXX || 'c++', [
    '-std=c++17',
    '-fsyntax-only',
    `-I${path.join(cppRoot, 'include')}`,
    'examples/cpp/read_sensor.cpp',
  ]);
}
run(python, ['-m', 'py_compile', 'examples/python/read_sensor.py']);
const probe = spawnSync(python, ['-c', 'import pynetft'], {
  encoding: 'utf8',
  timeout: 60000,
});
if (probe.status !== 0) {
  if (!allowMissing) throw new Error(probe.stderr || 'pynetft is unavailable');
  console.log('Explicitly skipped Python import: pynetft unavailable.');
} else {
  run(python, [
    '-c',
    'import importlib.metadata, runpy, sys; assert importlib.metadata.version("pynetft") == sys.argv[1], "pynetft version mismatch"; runpy.run_path("examples/python/read_sensor.py", run_name="__docs_check__")',
    versions.components.pyNetFT.version,
  ]);
}
