# Units, frames, and bias

Correct wrench interpretation requires four independent facts: the active calibration, native units, physical axis convention, and any configured transformation. A changing graph proves none of them by itself.

## Keep scales and units paired

The sensor reports separate counts-per-force and counts-per-torque values with force and torque unit labels. Automatic HTTP discovery keeps these values together. A manual override is valid only when all four values were independently verified.

Native SDKs, CLI, and Viewer preserve device units. ROS converts to N and N·m. A native torque in N·mm and a ROS torque in N·m can describe the same load with values differing by 1000; adding an unexplained multiplier hides the configuration boundary rather than correcting it.

## Verify physical axes

Use the model-specific ATI drawing and active tool transformation. With the mechanism safe and stationary, apply a small known load along one physical direction, confirm the expected component and sign, remove it, and verify a stable return. Repeat only within documented limits.

A ROS `frame_id` labels the coordinates but does not rotate the numbers. Apply transformations explicitly in the NetBox or robotics system and document which layer owns them.

## Bias deliberately

Software bias makes the current load the new sensor zero for every client. It is not a local chart offset. Before biasing:

1. stop hazardous motion and isolate downstream control response;
2. unload or safely fixture the transducer;
3. confirm current acquisition and device status are healthy;
4. require an explicit operator action;
5. send bias once;
6. wait for fresh healthy samples and verify the new zero.

RDT provides no bias acknowledgement. A successful CLI command, Viewer action, SDK call, or ROS service response proves only that the bias and stream-restart datagrams were sent. Do not issue repeated bias commands to recover from timeout or wrong scaling.

Do not use bias to conceal saturation, mounting load, thermal drift, an incorrect calibration, wrong units, or a wrong transform. Exact enum labels and status behavior are in [Units, status, and faults](../../references/data-formats/units-status-and-faults.mdx).
