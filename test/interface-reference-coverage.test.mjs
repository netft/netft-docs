import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

function built(route) {
  return readFileSync(`build/docs/references/${route}/index.html`, 'utf8')
    .replaceAll('<!-- -->', '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

test('every CLI command renders its synopsis and applicable options', () => {
  const manifest = JSON.parse(readFileSync('data/reference/cli.json', 'utf8'));
  const options = new Map(
    manifest.options.map((option) => [option.id, option]),
  );
  for (const command of manifest.commands) {
    const html = built(`cli/${command.id}`);
    assert.ok(
      html.includes(command.synopsis),
      `${command.id} synopsis is absent`,
    );
    for (const optionId of command.optionIds) {
      assert.ok(
        html.includes(`--${options.get(optionId).longName}`),
        `${optionId} is absent from ${command.id}`,
      );
    }
  }
});

test('ROS reference renders every parameter and state interface', () => {
  const manifest = JSON.parse(readFileSync('data/reference/ros.json', 'utf8'));
  const standalone = built('ros/standalone');
  const hardware = built('ros/ros2-control');
  for (const parameter of manifest.standaloneParameters)
    assert.ok(standalone.includes(parameter.name));
  for (const parameter of manifest.hardwareParameters)
    assert.ok(hardware.includes(parameter.name));
  for (const item of manifest.interfaces.filter(
    (value) => value.category === 'state',
  )) {
    assert.ok(hardware.includes(item.name));
  }
});
