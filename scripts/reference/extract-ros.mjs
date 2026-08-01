import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const descriptions = {
  sensor_ip: 'Sensor IPv4 address or host',
  sensor_port: 'RDT UDP port',
  http_port: 'Sensor HTTP configuration port',
  frame_id: 'Wrench header frame',
  wrench_topic: 'Published wrench topic',
  bias_service: 'Software-bias service',
  use_sensor_calibration: 'Discover calibration from the sensor over HTTP',
  counts_per_force: 'Counts per newton for a manual override',
  counts_per_torque: 'Counts per newton-meter for a manual override',
  publish_rate: 'Maximum publish rate; zero publishes every accepted sample',
  receive_timeout: 'Maximum seconds without a valid record',
  configuration_connect_timeout: 'HTTP connection timeout',
  configuration_timeout: 'Total HTTP configuration timeout',
  reconnect_initial_delay: 'Initial reconnect delay',
  reconnect_max_delay: 'Maximum reconnect delay',
  diagnostics_rate: 'Diagnostics publication rate',
  expected_rdt_rate: 'Expected RDT receive rate',
  rate_tolerance: 'Allowed fractional receive-rate deviation',
  publish_on_error: 'Publish standalone samples with serious device status',
  activation_timeout: 'Maximum wait for the first healthy hardware sample',
};

function scalar(value) {
  const normalized = value.trim().replace(/^['"]|['"]$/g, '');
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (normalized !== '' && Number.isFinite(Number(normalized)))
    return Number(normalized);
  return normalized;
}

function yamlLeaves(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_]\w*):\s*([^#\s].*?)\s*$/);
    if (match && !['netft_driver', 'ros__parameters'].includes(match[1])) {
      values.set(match[1], scalar(match[2]));
    }
  }
  return values;
}

function typeOf(value) {
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number')
    return Number.isInteger(value) ? 'int' : 'double';
  return 'string';
}

function parameter(name, value) {
  return {
    name,
    type: typeOf(value),
    default: value,
    description: descriptions[name] ?? name.replaceAll('_', ' '),
  };
}

export function extractRos(root, metadata) {
  const ros1 = yamlLeaves(
    readFileSync(join(root, 'config/netft_ros1.yaml'), 'utf8'),
  );
  const ros2 = yamlLeaves(
    readFileSync(join(root, 'config/netft_ros2.yaml'), 'utf8'),
  );
  for (const [name, value] of ros1) {
    if (!ros2.has(name) || ros2.get(name) !== value) {
      throw new Error(`ROS 1 and ROS 2 defaults disagree for ${name}`);
    }
  }
  const xacro = readFileSync(
    join(root, 'urdf/netft.ros2_control.xacro'),
    'utf8',
  );
  const macroParameters =
    xacro.match(/<xacro:macro[^>]+params="([^"]+)"/)?.[1] ?? '';
  const hardwareParameters = macroParameters
    .split(/\s+/)
    .filter((item) => item.includes(':='))
    .map((item) => {
      const [name, rawDefault] = item.split(':=');
      return parameter(name, scalar(rawDefault));
    });
  const pluginXml = readFileSync(
    join(root, 'netft_hardware_plugins.xml'),
    'utf8',
  );
  const pluginClass = pluginXml.match(/<class\s+[^>]*name="([^"]+)"/)?.[1];
  if (!pluginClass) throw new Error('ROS plugin class is missing');
  const stateNames = [
    ...xacro.matchAll(/<state_interface\s+name="([^"]+)"/g),
  ].map((match) => match[1]);
  const interfaces = [
    {
      id: 'wrench',
      category: 'topic',
      name: '/netft/wrench',
      type: 'geometry_msgs/WrenchStamped',
      description: 'Standalone SI wrench output',
    },
    {
      id: 'bias',
      category: 'service',
      name: '/netft/bias',
      type: 'std_srvs/Trigger',
      description: 'Standalone software bias',
    },
    {
      id: 'diagnostics',
      category: 'diagnostic',
      name: '/diagnostics',
      type: 'diagnostic_msgs/DiagnosticArray',
      description: 'Connection and measurement health',
    },
    ...stateNames.map((name) => ({
      id: `state-${name}`,
      category: 'state',
      name: `<sensor_name>/${name}`,
      type: 'double',
      description: 'ros2_control force/torque state interface',
    })),
  ];
  return {
    schemaVersion: 1,
    kind: 'ros',
    component: 'ros-netft',
    ...metadata,
    pluginClass,
    standaloneParameters: [...ros1].map(([name, value]) =>
      parameter(name, value),
    ),
    hardwareParameters,
    interfaces,
  };
}
