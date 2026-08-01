import {access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

function run(command, args) {
  const result = spawnSync(command, args, {encoding: 'utf8'});
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}

const cppRoot = path.resolve('..', 'netft-cpp');
try {
  await access(path.join(cppRoot, 'include', 'netft', 'client.hpp'));
} catch {
  console.log(
    'Skipping C++ example: sibling netft-cpp checkout is unavailable.',
  );
  run(process.env.PYTHON || 'python3', [
    '-m',
    'py_compile',
    'examples/python/read_sensor.py',
  ]);
  process.exit(0);
}

const compilerArgs = [
  '-std=c++17',
  '-fsyntax-only',
  `-I${path.join(cppRoot, 'include')}`,
  'examples/cpp/read_sensor.cpp',
];
const compiler = process.env.CXX || 'c++';
const probe = spawnSync(compiler, ['--version'], {encoding: 'utf8'});
if (probe.error?.code === 'ENOENT') {
  run('pixi', [
    'run',
    '--manifest-path',
    path.join(cppRoot, 'pixi.toml'),
    compiler,
    ...compilerArgs,
  ]);
} else {
  run(compiler, compilerArgs);
}

run(process.env.PYTHON || 'python3', [
  '-m',
  'py_compile',
  'examples/python/read_sensor.py',
]);
