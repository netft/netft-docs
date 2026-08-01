---
sidebar_position: 1
---

# Introduction

Net F/T is an open-source software family for ATI Industrial Automation Ethernet force/torque systems. It covers the common path from commissioning a sensor to reading calibrated six-axis measurements in an application or robot. The software communicates with the sensor's HTTP configuration interface and ATI's RDT protocol over UDP.

An F/T sample contains three forces and three torques, ordered as `(Fx, Fy, Fz, Tx, Ty, Tz)`. The device sends signed integer counts. The active calibration supplies separate counts-per-force and counts-per-torque factors plus the selected force and torque units. Net F/T software reads that configuration before streaming and keeps raw counts, calibrated values, units, status, sequence progress, and connection health visible to the caller.

## What is included

The organization provides three kinds of interface:

| Need                       | Interface      | Use it when                                                                   |
| -------------------------- | -------------- | ----------------------------------------------------------------------------- |
| Operate a ready-made tool  | Net F/T CLI    | Commissioning, health checks, scripting, monitoring, and loss-aware recording |
| Inspect data visually      | Net F/T Viewer | Interactive charts, raw and calibrated values, bias, and CSV capture          |
| Build a native application | netft-cpp      | A C++17 application needs direct lifecycle, health, and recovery control      |
| Build a Python application | pyNetFT        | A synchronous Python application needs typed samples without NumPy            |
| Integrate a robot          | ros-netft      | ROS wrench publishing or `ros2_control` sensor hardware is required           |

The applications and integrations carry a private snapshot of the shared C++ protocol core. They do not require users to install netft-cpp separately, and they remain independently versioned. This site owns complete user workflows, cross-component concepts, and stable public API references generated from pinned component releases.

## Supported device path

The documentation covers ATI Net F/T systems that expose the NetBox HTTP configuration API and RDT measurement stream over standard Ethernet. EtherNet/IP, PROFINET, DeviceNet, CAN, EtherCAT, and serial interfaces are different integration paths and are not implemented by these tools.

ATI documentation remains authoritative for mounting, wiring, power, model-specific axes, overload limits, calibration, firmware, filters, transforms, persistent network settings, and safe handling. Net F/T is community-maintained software and is not affiliated with ATI Industrial Automation.

## Before using measurements

A changing graph is not sufficient evidence that a measurement is correct. Before data influences motion, limits, or process decisions, verify:

- the reported product and calibration match the installed transducer;
- force and torque units are understood rather than assumed;
- the physical axis directions match the transducer drawing and robot frame;
- device status is healthy and sequence progress is current;
- stale, missing, serious-status, and non-finite data are rejected;
- disconnect and recovery behavior has been tested under controlled conditions;
- an independent safety-rated stop path remains available.

Software bias changes the sensor's measurement zero for every client. It must be an explicit, authorized operation performed only when the mechanism is stationary and the transducer is unloaded or safely fixtured.

## How to use this documentation

Start with [Installation](./installation.md) to select an interface and install it. Then follow [Quick start](./quick-start.md) for the complete first-reading path. The Tutorials section explains the sensor, applications, SDKs, and ROS integrations in depth. References provide lookup tables for configuration, commands, data fields, compatibility, and troubleshooting.
