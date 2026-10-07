import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';

import {extractCpp} from '../scripts/reference/extract-cpp.mjs';
import {validateCliIdentity} from '../scripts/reference/extract-cli.mjs';
import {extractPython} from '../scripts/reference/extract-python.mjs';
import {extractRos} from '../scripts/reference/extract-ros.mjs';
import {parseSourcePaths} from '../scripts/reference/update.mjs';

test('reference update requires every source checkout explicitly', () => {
  const result = spawnSync(process.execPath, ['scripts/reference/update.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--cpp PATH/);
  assert.match(result.stderr, /--python PATH/);
  assert.match(result.stderr, /--cli PATH/);
  assert.match(result.stderr, /--ros PATH/);
});

test('reference update accepts the pnpm argument separator', () => {
  const paths = parseSourcePaths([
    '--',
    '--cpp',
    './cpp',
    '--python',
    './python',
    '--cli',
    './cli',
    '--ros',
    './ros',
  ]);
  assert.ok(paths);
  assert.match(paths.cpp, /\/cpp$/);
});

test('ROS extraction requires shared defaults to agree', () => {
  const root = mkdtempSync(join(tmpdir(), 'ros-netft-reference-'));
  mkdirSync(join(root, 'config'), {recursive: true});
  mkdirSync(join(root, 'urdf'), {recursive: true});
  const defaults = 'sensor_ip: 192.168.1.1\nsensor_port: 49152\n';
  writeFileSync(join(root, 'config/netft_ros1.yaml'), defaults);
  writeFileSync(
    join(root, 'config/netft_ros2.yaml'),
    `netft_driver:\n  ros__parameters:\n    ${defaults.replaceAll('\n', '\n    ')}`,
  );
  writeFileSync(
    join(root, 'netft_hardware_plugins.xml'),
    '<class name="netft_driver/NetFTHardwareInterface" type="netft_driver::NetFTHardwareInterface"/>',
  );
  writeFileSync(
    join(root, 'urdf/netft.ros2_control.xacro'),
    `<robot><xacro:macro name="netft_ros2_control" params="sensor_ip:=192.168.1.1">
      <state_interface name="force.x"/><state_interface name="force.y"/>
      <state_interface name="force.z"/><state_interface name="torque.x"/>
      <state_interface name="torque.y"/><state_interface name="torque.z"/>
    </xacro:macro></robot>`,
  );

  const manifest = extractRos(root, {
    version: '0.3.2',
    sourceTag: '0.3.2',
    sourceUrl: 'https://github.com/netft/ros-netft/tree/0.3.2',
  });

  assert.equal(
    manifest.standaloneParameters.find((item) => item.name === 'sensor_ip')
      .default,
    '192.168.1.1',
  );
  assert.equal(manifest.pluginClass, 'netft_driver/NetFTHardwareInterface');
  assert.equal(
    manifest.interfaces.filter((item) => item.category === 'state').length,
    6,
  );
});

test('CLI extraction rejects stale, dirty and unsupported executable identities', () => {
  const metadata = {version: '0.2.1', sourceCommit: '1'.repeat(40)};
  const manifest = {
    schemaVersion: 1,
    kind: 'cli',
    component: 'netft-cli',
    ...metadata,
    sourceDirty: false,
  };
  assert.doesNotThrow(() => validateCliIdentity(manifest, metadata));
  for (const change of [
    {sourceCommit: '2'.repeat(40)},
    {sourceDirty: true},
    {version: '0.2.0'},
    {schemaVersion: 2},
  ]) {
    assert.throws(() =>
      validateCliIdentity({...manifest, ...change}, metadata),
    );
  }
});

test('Python extraction follows public exports and excludes private helpers', () => {
  const root = mkdtempSync(join(tmpdir(), 'pynetft-reference-'));
  const packageRoot = join(root, 'src/pynetft');
  mkdirSync(packageRoot, {recursive: true});
  writeFileSync(
    join(packageRoot, '__init__.py'),
    `from .client import Client\nfrom .types import Config\n__all__ = ["Client", "Config"]\n`,
  );
  writeFileSync(
    join(packageRoot, 'client.py'),
    `class _Helper: pass\nclass Client:\n    def start(self, callback=None) -> None: pass\n`,
  );
  writeFileSync(
    join(packageRoot, 'types.py'),
    `from dataclasses import dataclass\n@dataclass(frozen=True)\nclass Config:\n    sensor_host: str = "192.168.1.1"\n`,
  );

  const manifest = extractPython(root, {
    version: '2.1.0',
    sourceTag: 'v2.1.0',
    sourceUrl: 'https://github.com/netft/pyNetFT/tree/v2.1.0',
  });

  assert.deepEqual(
    manifest.symbols.map((symbol) => symbol.id),
    ['pynetft.Client', 'pynetft.Config'],
  );
  assert.equal(
    manifest.symbols.find((symbol) => symbol.id === 'pynetft.Config').fields[0]
      .default,
    "'192.168.1.1'",
  );
});

test('C++ extraction exposes public records, enums, and methods', () => {
  const root = mkdtempSync(join(tmpdir(), 'netft-cpp-reference-'));
  const include = join(root, 'include/netft');
  mkdirSync(include, {recursive: true});
  writeFileSync(
    join(include, 'client.hpp'),
    `namespace netft {
enum class State { Stopped, Streaming };
struct Config { int port{49152}; double receive_rate{}, delivery_rate{}; };
class NETFT_API Client {
public:
  using Callback = void (*)(int);
  explicit Client(Config config);
  // Stop is safe to repeat.
  void start();
  void stop() noexcept;
};
}`,
  );

  const manifest = extractCpp(root, {
    version: '0.3.3',
    sourceTag: 'v0.3.3',
    sourceUrl: 'https://github.com/netft/netft-cpp/tree/v0.3.3',
  });

  assert.deepEqual(
    manifest.symbols.map((symbol) => symbol.id),
    ['netft.Client', 'netft.Config', 'netft.State'],
  );
  assert.deepEqual(
    manifest.symbols
      .find((symbol) => symbol.id === 'netft.Client')
      .methods.map((method) => method.id),
    ['Client', 'start', 'stop'],
  );
  assert.equal(
    manifest.symbols.find((symbol) => symbol.id === 'netft.Config').fields[0]
      .default,
    '49152',
  );
  assert.deepEqual(
    manifest.symbols
      .find((symbol) => symbol.id === 'netft.Config')
      .fields.map((field) => field.name),
    ['port', 'receive_rate', 'delivery_rate'],
  );
});
