---
sidebar_position: 3
---

# Quick start

This walkthrough takes a powered ATI Net F/T system to a verified bounded reading with the CLI. It does not change persistent sensor settings and does not apply bias.

## 1. Prepare the hardware

Identify the transducer, NetBox, active calibration, cable, and power method. Mount and cable the system according to ATI documentation. Keep the mechanism stationary and safely unloaded for commissioning. Confirm power and Ethernet link indicators before diagnosing software.

ATI documents `192.168.1.1` as the factory-default static address for the systems covered here. A deployed sensor may use DHCP or another static address. Use the address currently assigned to the device; do not reset production configuration to match an example.

## 2. Connect the host

Connect the host directly or through a trusted Ethernet switch. For a sensor at `192.168.1.1`, assign the host an unused address in the same subnet, such as `192.168.1.2/24`. Never assign the sensor's address to the host.

Verify the configuration path:

```bash
ping -c 3 192.168.1.1
curl --fail --max-time 2 http://192.168.1.1/netftapi2.xml
```

Some networks block ICMP, so ping alone is not conclusive. A successful XML request confirms addressing, routing, and HTTP, but not the UDP return path used by RDT.

## 3. Stop competing clients

Normal RDT streaming is effectively single-client. Stop ATI demo software, Viewer instances, CLI monitors, SDK processes, and ROS drivers before commissioning. A later client request can redirect the stream and make the previous client appear to time out.

## 4. Inspect configuration

Install the CLI, then read device configuration without starting continuous measurement:

```bash
netft info 192.168.1.1
```

Confirm the reported product, counts per force, counts per torque, force unit, and torque unit. Do not continue if they cannot be matched to the active device calibration. In particular, do not assume all ATI systems use the same torque unit.

A representative JSON result looks like this. Product, scales, and units vary with the device and active calibration:

```json
{
  "schema_version": 1,
  "host": "192.168.1.1",
  "http_port": 80,
  "rdt_port": 49152,
  "product_name": "Ethernet Axia",
  "calibration": {
    "source": "sensor",
    "revision": 1,
    "force": {"counts_per_unit": 1000000, "unit": "N"},
    "torque": {"counts_per_unit": 1000000, "unit": "N-m"}
  }
}
```

`source: sensor` confirms that the values came from HTTP discovery rather than a caller override. Record the complete result instead of copying only the scale numbers.

For automation or a saved commissioning record:

```bash
netft info 192.168.1.1 --format json >sensor-info.json
```

## 5. Run a bounded health check

```bash
netft check 192.168.1.1 --duration 10s
```

The check requires configuration discovery, first-sample acquisition, sustained streaming, and acceptable device status. It reports receive rate, delivery rate, sequence quality, loss, reconnects, and the final sensor state.

Add acceptance criteria only after establishing the expected RDT output rate:

```bash
netft check 192.168.1.1 \
  --duration 10s \
  --min-rate 500 \
  --max-loss 0.1 \
  --max-reconnects 0
```

A failed criterion returns exit status 7. Sensor discovery, stream acquisition, device faults, and I/O failures use different codes so automation can distinguish them.

A passing JSON result contains measured evidence rather than only a Boolean:

```json
{
  "schema_version": 1,
  "result": "pass",
  "metrics": {
    "elapsed_seconds": 3.0,
    "sample_count": 5636,
    "observed_rate_hz": 1878.6,
    "lost_count": 0,
    "duplicate_count": 0,
    "out_of_order_count": 0,
    "reconnect_count": 0,
    "nonzero_status_count": 0
  }
}
```

These are illustrative measurements from one healthy session, not universal limits. Compare observed rate with the configured RDT Output Rate and retain the raw report with commissioning records.

## 6. Observe a controlled load

```bash
netft monitor 192.168.1.1 --duration 10s
```

With the mechanism safe, apply a small controlled load in one known direction. Confirm that the expected axis and sign respond according to the transducer drawing. Check that sequence advances, status remains healthy, and values return consistently when the load is removed.

`monitor` presents the newest available sample and intentionally keeps no backlog. Use `record` rather than `monitor` when every accepted sample matters.

## 7. Decide whether the reading is usable

Before integrating another interface, verify all of the following:

- identity and calibration match the hardware;
- raw counts and calibrated values change coherently;
- unit labels are correct;
- physical axes and signs are understood;
- no serious status is reported;
- sequence and receive-rate behavior meet the application's needs;
- timeout and disconnect behavior is visible to the consumer.

If HTTP succeeds but the first sample times out, check competing clients, RDT port configuration, host firewall, VPN routes, and the UDP return path. If values have an unexplained scale or unit, stop and correct configuration rather than applying a compensating multiplier.

| Observation                                 | Meaning                                           | Next action                                                         |
| ------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| `info` fails before calibration             | HTTP/configuration path is unavailable or invalid | Check address, subnet, HTTP port, route, power, and XML response    |
| `info` succeeds but no first sample arrives | Configuration works; RDT does not                 | Stop other clients and inspect UDP port, firewall, and return route |
| Samples have nonzero status                 | Transport works; device reports a condition       | Decode status and correct the hardware/device condition             |
| Loss or reconnects increase                 | Stream continuity is degraded                     | Check expected rate, cable, switch, CPU load, and stream ownership  |
| Values change with wrong scale              | Calibration or unit interpretation is wrong       | Stop consumption and verify device configuration                    |

Continue with the [sensor measurement tutorial](../tutorials/fundamentals/sensor-measurements.md) or choose the [CLI](../tutorials/cli/inspect-and-validate.md), [Viewer](../tutorials/viewer/connect-and-inspect.md), [C++](../tutorials/sdks/cpp.md), [Python](../tutorials/sdks/python.md), or [ROS](../tutorials/ros/standalone.md) path.
