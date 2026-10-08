# C++ SDK tutorial

netft-cpp 0.3.4 is a standalone C++17 SDK for configuration discovery, RDT acquisition, calibrated samples, health, and explicit recovery.

## Build and consume

After installing as described in [Installation](../../get-started/installation.md), consume its CMake config package:

```cmake
find_package(netft 0.3 CONFIG REQUIRED)

add_executable(read_sensor main.cpp)
target_link_libraries(read_sensor PRIVATE netft::netft)
```

Add the installation prefix to `CMAKE_PREFIX_PATH` when it is not in a standard location.

## Read samples

```cpp
#include <chrono>
#include <iostream>
#include <netft/client.hpp>

int main() {
  netft::Config config;
  config.sensor_host = "192.168.1.1";

  netft::Client client{config};
  client.start([](const netft::Sample& sample) {
    std::cout << sample.force[0] << ' '
              << netft::to_string(sample.force_unit) << '\n';
  });

  const bool received =
      client.wait_for_first_sample(std::chrono::seconds{2});
  client.stop();
  return received ? 0 : 1;
}
```

`start` owns background acquisition until `stop`. The callback runs on the delivery path and must return promptly. Move file I/O or slow processing to a bounded application queue. Stop the client before releasing resources captured by the callback.

Check startup and inspect health rather than assuming that `start()` means streaming:

```cpp
client.start(consume_sample);
if (!client.wait_for_first_sample(std::chrono::seconds{2})) {
  const auto health = client.health();
  std::cerr << "state=" << netft::to_string(health.state)
            << " fault=" << netft::to_string(health.fault_code)
            << " error=" << health.last_error << '\n';
  client.stop();
  return 1;
}
```

`latest_sample()` returns the newest delivered sample without adding another callback. Use its `received_at` or `HealthSnapshot::last_record_age` when the application needs a freshness decision.

## Configuration and units

Without an override, each session requests `netftapi2.xml` and discovers product, both scale factors, both units, and configuration revision. Reconnect performs discovery again, so a changed calibration is not silently scaled with old values. Inspect `Client::health().sensor_configuration` before enabling a controller.

A manual `netft::Calibration` override requires both counts-per-unit factors and both enum units. It is appropriate only when the exact active values are independently verified and HTTP is unavailable. It avoids discovery but does not authenticate UDP measurements.

```cpp
config.calibration_override = netft::Calibration{
    1'000'000.0,
    1'000.0,
    netft::ForceUnit::Newton,
    netft::TorqueUnit::NewtonMillimeter,
};
```

The numbers above are illustrative. Replace every value with the active calibration; never copy an override between sensors merely because the transducer model looks similar.

Samples preserve device-native units and include `raw_wrench`, calibrated force and torque, status, units, sequences, and configuration revision. Convert explicitly at the consumer boundary and retain unit metadata with recorded data.

## Health and recovery

Default `RecoveryPolicy::Reconnect` closes a failed session, waits with bounded exponential backoff, rediscovers configuration, and reconnects. `RecoveryPolicy::FailStop` latches the first fault and moves the client to Faulted. Inspect `fault_code()` and `health()` before deciding whether to start another session.

Duplicates, out-of-order records, stalled sequences, and unconfirmed backward sequences are not delivered. Gaps, rates, callback exceptions, reconnects, status, and last error remain visible in `HealthSnapshot`.

Callback exceptions are counted. Under reconnect policy they are non-fatal; under fail-stop they become callback faults. Application code must still reject stale samples and define safe behavior while no valid delivery occurs.

`Client` is non-copyable and non-movable. Destruction normally stops synchronously. A callback must not destroy the client and then continue accessing it; shutdown initiated from the callback cannot join its own worker and therefore defers final reclamation.

## Fault handling checklist

| Fault code               | Typical boundary                          | Application response                                   |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------ |
| `SensorConfiguration`    | HTTP, response validation, or calibration | Do not stream with guessed scaling                     |
| `Timeout`                | No valid record before receive timeout    | Mark data stale and inspect network/ownership          |
| `Socket`                 | UDP setup or I/O                          | Inspect interface, route, port, and host resources     |
| `SeriousStatus`          | Device reports a serious condition        | Stop using the wrench and correct the device condition |
| `FtStall` / `FtBackward` | Measurement sequence is not credible      | Reject delivery and inspect sensor/restart behavior    |
| `MalformedStorm`         | Repeated invalid records                  | Treat the network input as unusable                    |
| `Callback`               | Consumer threw under fail-stop            | Correct application code before restart                |

Use the [C++ API reference](../../references/cpp-api/overview.mdx) for complete public declarations and lifecycle contracts.
