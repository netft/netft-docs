# ROS standalone driver

ros-netft 0.3.3 provides a standalone wrench driver for current ROS 2 distributions and legacy source support for ROS 1 Noetic. The ROS package name is `netft_driver`.

## Support and installation

ROS 2 Lyrical, Kilted, and Jazzy are supported; Humble is compatibility support; Rolling is the development target. ROS 1 Noetic is end-of-life, source-only legacy support. The standalone driver is available on all of them, while `ros2_control` is ROS 2 only.

Build ROS 2 from a workspace as shown in [Installation](../../get-started/installation.md). Stop all other RDT clients before launching.

## Launch and verify ROS 2

```bash
ros2 launch netft_driver netft.launch.py \
  sensor_ip:=192.168.1.1 \
  sensor_port:=49152
ros2 topic echo --once /netft/wrench
ros2 topic echo --once /diagnostics
```

For a bounded endpoint check without starting a ROS graph:

```bash
ros2 run netft_driver netft_check \
  --host 192.168.1.1 \
  --duration 5
```

The default wrench topic is `/netft/wrench` with `geometry_msgs/WrenchStamped`. Force is published in N and torque in N·m regardless of the device-native units. RDT records contain no acquisition timestamp, so the driver stamps the record with the ROS clock immediately after accepting a complete sample. ROS 2 wrench traffic uses SensorDataQoS; diagnostics are reliable.

The installed YAML provides a complete baseline:

```yaml
netft:
  ros__parameters:
    sensor_ip: 192.168.1.1
    sensor_port: 49152
    http_port: 80
    use_sensor_calibration: true
    frame_id: netft_link
    wrench_topic: /netft/wrench
    bias_service: /netft/bias
    publish_rate: 0.0
    receive_timeout: 0.1
    configuration_connect_timeout: 0.5
    configuration_timeout: 1.0
    reconnect_initial_delay: 0.25
    reconnect_max_delay: 5.0
    diagnostics_rate: 1.0
    expected_rdt_rate: 2000.0
    rate_tolerance: 0.2
    publish_on_error: false
```

Use launch arguments for endpoint changes and a copied YAML for deployment-specific topics, frames, rates, and thresholds. Keep `use_sensor_calibration=true` unless a verified SI override is required.

Validate three boundaries:

```bash
ros2 node info /netft
ros2 topic hz /netft/wrench
ros2 topic echo --once /diagnostics
```

`topic hz` measures publication rate, which can differ from sensor receive rate when `publish_rate` limits output. Diagnostics compare receive rate with `expected_rdt_rate`; derive that expectation from the NetBox RDT Output Rate.

## Diagnostics and errors

`/diagnostics` reports configuration, connection, device status, sequence quality, rates, and recovery. Status zero is healthy and `0x80010000` is a monitor warning. Other nonzero device status is serious. The node withholds serious records from the wrench topic unless `publish_on_error=true`.

The standalone driver uses reconnect recovery. Configuration, timeout, socket, serious-status, and malformed-stream faults close the session, wait with exponential backoff, rediscover calibration, and reconnect. Consumers still need freshness checks: a ROS topic retaining the last observed wrench does not make it current.

When embedding the node in a larger graph, remap topics and services or use a namespace rather than running several instances with identical absolute names. Each physical sensor still needs exclusive RDT ownership.

## Bias

```bash
ros2 service call /netft/bias std_srvs/srv/Trigger '{}'
```

RDT does not acknowledge the bias command. A successful service response means the bias and stream-restart datagrams were sent. Verify that healthy wrench data and diagnostics resume before using the measurement.

## ROS 1 Noetic

```bash
source /opt/ros/noetic/setup.bash
mkdir -p ~/netft_ws/src
git clone --branch 0.3.3 https://github.com/netft/ros-netft.git \
  ~/netft_ws/src/netft_driver
cd ~/netft_ws
rosdep update --include-eol-distros
rosdep install --from-paths src --ignore-src -r -y
catkin_make
source devel/setup.bash
roslaunch netft_driver netft.launch sensor_ip:=192.168.1.1
```

Verify with `rostopic echo -n 1 /netft/wrench` and `/diagnostics`. ROS 1 uses the same N/N·m data semantics and standalone recovery model, but does not provide the `ros2_control` plugin. Isolate the EOL host and plan migration.

The [standalone interface reference](../../references/ros/standalone.mdx) lists exact topics, services, parameters, QoS, and units.
