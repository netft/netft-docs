# ros2_control integration

The ROS 2 plugin `netft_driver/NetFTHardwareInterface` presents an ATI Net F/T as a sensor hardware component. It performs UDP I/O on a receiver thread and transfers complete samples through `realtime_tools::RealtimeBuffer`, keeping socket operations outside the controller-manager update loop. This design is control-loop-friendly but does not make UDP or the host hard real-time.

![The ROS driver routes the private protocol core to either a standalone ROS node or a ros2_control hardware plugin.](/img/ros-integration.svg)

## Add the hardware

Include the installed macro in the robot description managed by the existing controller manager:

```xml
<xacro:include filename="$(find netft_driver)/urdf/netft.ros2_control.xacro"/>
<xacro:netft_ros2_control
  name="wrist_netft_hardware"
  sensor_name="wrist_ft"
  sensor_ip="192.168.1.1"
  sensor_port="49152"
  http_port="80"
  use_sensor_calibration="true"
  receive_timeout="0.1"
  configuration_connect_timeout="0.5"
  configuration_timeout="1.0"
  activation_timeout="2.0"/>
```

Endpoint, calibration, configuration timeout, and activation values belong to the generated hardware element. The component exports exactly:

```text
wrist_ft/force.x
wrist_ft/force.y
wrist_ft/force.z
wrist_ft/torque.x
wrist_ft/torque.y
wrist_ft/torque.z
```

## Add the broadcaster

```yaml
controller_manager:
  ros__parameters:
    update_rate: 200
    wrist_ft_broadcaster:
      type: force_torque_sensor_broadcaster/ForceTorqueSensorBroadcaster

wrist_ft_broadcaster:
  ros__parameters:
    sensor_name: wrist_ft
    frame_id: wrist_ft_link
```

Spawn it through the robot's existing controller manager:

```bash
ros2 run controller_manager spawner wrist_ft_broadcaster \
  --controller-manager /controller_manager \
  --param-file /path/to/controllers.yaml
```

The repository's launch file is a minimal single-sensor example. A production robot should embed the Xacro in its existing description rather than start a second controller manager.

The installed example uses a 200 Hz controller-manager update rate. Choose a production rate based on the complete controller system; increasing it does not increase the sensor's RDT output rate.

Verify registration before enabling a controller that consumes the wrench:

```bash
ros2 control list_hardware_components
ros2 control list_hardware_interfaces
ros2 control list_controllers
ros2 topic echo --once /diagnostics
```

Confirm the component is active, all six state interfaces are available, the broadcaster is active, diagnostics are healthy, and broadcaster output uses the intended frame.

## Activation and bias

Activation waits for the first healthy sample up to `activation_timeout`. Each plugin instance owns its socket, receiver, realtime buffer, diagnostics, and bias service. Distinct sensor names isolate interfaces and services; names that are not ROS-valid tokens are encoded injectively to avoid collisions.

Automatic discovery converts the active device units to N and N·m before state export. When `use_sensor_calibration=false`, `counts_per_force` is counts/N and `counts_per_torque` is counts/N·m. Do not enter native N·mm scaling into the latter without converting it.

Call the instance service only while active:

```bash
ros2 service call /wrist_ft/bias std_srvs/srv/Trigger '{}'
```

After sending bias and restarting streaming, the plugin requires fresh healthy data before its receive timeout. Failure becomes a latched fault.

## Fail-stop and lifecycle recovery

The plugin deliberately does not reconnect while active. A fatal configuration, device, transport, timeout, measurement-sequence, or malformed-storm fault latches the first cause, publishes persistent ERROR diagnostics, writes NaN to all six state interfaces, and makes `read()` return `ERROR`.

Inspect diagnostics, correct the underlying cause, then transition the hardware through the applicable recovery states:

```bash
ros2 control list_hardware_components
ros2 control set_hardware_component_state wrist_netft_hardware inactive
ros2 control set_hardware_component_state wrist_netft_hardware unconfigured
ros2 control set_hardware_component_state wrist_netft_hardware inactive
ros2 control set_hardware_component_state wrist_netft_hardware active
```

The fault clears during configure, not deactivate or cleanup. Skip transitions that do not apply if the controller manager already moved the component.

Controllers must reject NaN and stale input. On Humble, controller manager does not consistently deactivate affected controllers after a hardware read error, so independent controller validation or a system-level safety monitor is mandatory. This plugin does not replace the robot's safety system.
