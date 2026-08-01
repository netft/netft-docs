# Troubleshooting

Diagnose the boundary that fails before changing calibration, repeatedly biasing, or restarting everything. Those actions can hide evidence and alter downstream behavior.

## Configuration cannot be read

1. Confirm NetBox power and Ethernet link.
2. Verify the host address, prefix, and route to the sensor.
3. Request `http://<sensor-ip>/netftapi2.xml` with a short timeout.
4. Check the configured HTTP port and any proxy or VPN route.
5. Connect directly or use ATI's discovery utility if the address is unknown.

A failed ping alone is inconclusive because ICMP may be blocked. A failed HTTP request points to power, addressing, routing, firewall, or the configuration service—not RDT parsing.

## HTTP works but no samples arrive

Stop every other RDT client. Confirm the configured RDT port, host firewall UDP return path, and selected local interface. Remove VPNs or ambiguous routes temporarily. Run a bounded CLI check rather than an indefinite monitor.

```bash
netft info SENSOR --format json
netft check SENSOR --duration 5s --format json
```

If the first command passes and the second exits 4, focus on RDT ownership and UDP rather than changing HTTP configuration.

Normal RDT has one stream owner. If another client recently started, it may have redirected replies. This is the most important distinction when configuration remains reachable but an existing stream suddenly times out.

## Repeated timeout or reconnect

Inspect receive rate, sequence gaps, device status, reconnect counter, and last error. Check power, cable, switch congestion, Wi-Fi bridges, NIC power saving, CPU saturation, and whether expected rate matches the NetBox RDT Output Rate.

Do not confuse ADC sample frequency with RDT output rate. If a session reconnects after a serious device status, correct the device condition rather than increasing timeouts.

## Wrong magnitude or units

Read the active device configuration again. Confirm selected calibration, counts per force, counts per torque, force unit, and torque unit. Reconnect so automatic discovery obtains the current values.

Native SDKs preserve device units; ROS converts to N and N·m. A factor-of-1000 torque difference often indicates comparison of N·mm with N·m. Do not add an unexplained multiplier to compensate.

Compare the configuration report with one live sample and, in ROS, with the published SI value. Keep raw count, scale, unit, and converted result together so the exact failing transformation is visible.

## Wrong axis or sign

Use the drawing for the installed transducer and inspect configured tool transformations. Confirm mounting orientation and the coordinate frame assigned by the application. A ROS `frame_id` labels data; it does not rotate it.

## Stale or frozen data

Check acquisition state, sequence progress, sample age, and device status. Viewer Pause intentionally freezes values while health continues. Outside an intentional pause, a consumer must not treat the last delivered wrench as current after timeout or disconnect.

## ROS wrench is absent

Inspect `/diagnostics`, confirm `wrench_topic`, QoS compatibility, and serious-status filtering. Verify that another client does not own the stream. The standalone node withholds serious-status records unless `publish_on_error=true`.

## ros2_control interfaces are NaN

NaN means the fail-stop plugin latched a fatal fault. Read the persistent ERROR diagnostic, correct the configuration, transport, timeout, sequence, malformed-stream, or device cause, then run the lifecycle recovery sequence. Do not repeatedly activate without resolving the first cause.

```bash
ros2 control list_hardware_components
ros2 topic echo --once /diagnostics
ros2 control list_hardware_interfaces
```

## Bias appears unsuccessful

RDT provides no bias acknowledgement. A successful command or service response proves only that datagrams were sent. Wait for fresh healthy samples, verify the new zero, and inspect timeout/status diagnostics. Do not issue repeated bias commands as recovery.

## A recording leaves `.partial`

The capture did not complete verified promotion. Preserve the file, inspect complete rows, and check interruption, queue overflow, writer error, disk space, permissions, or removable-media stability. Start a new capture at a new destination. A manually renamed partial file is not proof of completeness.

## Escalation information

When reporting a problem, include software and sensor versions, platform, sanitized configuration, command or launch invocation, exact error, health/diagnostic output, expected RDT rate, whether other clients were stopped, and the smallest safe reproduction. Remove private addresses, credentials, recordings, and facility information.
