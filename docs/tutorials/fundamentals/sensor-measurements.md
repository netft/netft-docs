# Sensor measurements

An ATI force/torque sample describes a wrench with six ordered components: `(Fx, Fy, Fz, Tx, Ty, Tz)`. Force and torque use the coordinate system defined by the transducer drawing and any transformation configured in the device. Net F/T software preserves that order; it cannot infer how the transducer was mounted or rotate data merely because an application assigns a frame name.

## Raw counts and calibrated values

RDT records contain six signed integer counts. The active calibration provides two independent scale factors:

```text
force = force_count / counts_per_force
torque = torque_count / counts_per_torque
```

The HTTP configuration interface also reports force and torque unit labels. Supported device labels include lbf, N, klbf, kN, and kgf for force, and lbf-in, lbf-ft, N-m, N-mm, kgf-cm, and kN-m for torque.

Automatic configuration discovery is the default throughout the Net F/T software family. It avoids the common error of treating one sensor's calibration as an ATI-wide default. A manual override is valid only when HTTP discovery is unavailable and both scales and both units were independently verified. Partial overrides are rejected by the native core.

Native applications preserve device-selected units. ROS publishes `geometry_msgs/Wrench` in N and N·m and therefore converts from the discovered native units. This means a native SDK value in N·mm and a ROS torque value in N·m can describe the same load with numerically different values.

## Samples and health

A delivered native sample includes raw counts, calibrated force and torque, unit labels, device status, sequence information, and a configuration revision. A health snapshot adds state, rates, gaps, duplicates, reconnects, last error, and the active discovered configuration.

Treat health as part of the measurement. A consumer must not continue using the last wrench indefinitely after acquisition stops. Define a maximum sample age, reject serious device status and non-finite values, and expose loss or recovery state according to the risk of the application.

Status `0x00000000` is healthy. The ROS driver treats `0x80010000` as a monitor-condition warning and decodes other nonzero status bits as serious device errors. Observation tools may continue displaying health while withholding bad measurements; a controller path should move to its defined safe behavior.

Use the fields together rather than treating any one number as proof of validity:

| Evidence                           | What it establishes                            | What it does not establish                      |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Product and discovered calibration | Which scaling and units were applied           | Correct mounting or active physical tool        |
| Advancing F/T sequence             | The device is producing new measurements       | That every UDP record arrived                   |
| RDT gaps and loss counter          | Host-observed transport continuity             | Absolute sensor accuracy                        |
| Zero status                        | No reported device condition in that record    | Freshness after later disconnect                |
| Receive timestamp or age           | Host-observed recency                          | Sensor-side acquisition wall time               |
| Configuration revision             | Which discovered calibration scaled the sample | That a revision is interchangeable with another |

For recordings, retain raw counts, scaled values, units, both sequences, status, configuration revision, and a host timestamp. A six-number wrench alone is insufficient for later integrity or calibration analysis.

## Axis verification

Use the drawing for the installed transducer to identify positive directions. During commissioning:

1. make the mechanism safe and stationary;
2. observe the unloaded wrench and status;
3. apply a small known load along one physical axis;
4. confirm the expected component and sign change;
5. remove the load and confirm a stable return;
6. repeat only within documented limits.

Do not infer axis directions from a generic diagram. In ROS, `frame_id` states which frame describes the numbers but does not transform them. Apply transforms explicitly in the device or robotics system and document where that transformation occurs.

## Bias

Bias tells the device to make the present load the new zero. It changes subsequent output for every client; it is not a local display offset. Before biasing, stop hazardous motion, unload or fixture the transducer, prevent downstream controllers from reacting to the step change, inspect current status, and require operator confirmation.

After bias, wait for fresh healthy data and recheck all axes. Do not use bias to conceal unexplained mounting load, saturation, wrong calibration, wrong units, thermal drift, or an incorrect transformation.
