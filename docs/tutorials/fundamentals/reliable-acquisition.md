# Reliable acquisition

Sensor sampling, RDT packet output, host reception, application delivery, chart refresh, and disk recording are separate rates. A chart can update at 20 Hz while acquisition receives thousands of samples per second; that is presentation decimation, not necessarily packet loss. Conversely, a smooth chart can hide missing samples if it always displays only the latest value.

## Choose a delivery model

Use latest-value delivery for observation and dashboards. It prevents presentation backlog and keeps the display current, but it is not lossless. Use a bounded producer-consumer queue for recording or processing every accepted sample. The acquisition callback must never block indefinitely on slow disk or application work.

A bounded queue makes overload explicit. When it fills, stop the capture or report a defined integrity failure; silently dropping accepted rows creates a file that looks complete but is not. CLI and Viewer recorders write a partial path, drain and flush accepted rows, then atomically promote the result only after clean completion.

pyNetFT intentionally uses different semantics for interactive application delivery: when its bounded Python queue fills, it discards the oldest pending Python delivery so the consumer stays near live data. That event increments `python_queue_dropped_count`. It is suitable only when the application accepts skipped deliveries; use a loss-aware recorder when every accepted sample must be retained.

## Recovery policies

The shared native core supports two recovery policies. `Reconnect` closes the failed session after configuration, timeout, socket, serious-status, or malformed-packet-storm failures. It waits with interruptible exponential backoff, rediscovers configuration, and starts a new session. Default backoff begins at 0.25 seconds, doubles up to five seconds, and resets after valid delivery.

`FailStop` latches the first fault and requires supervisory action. It is appropriate when continuing automatically could conceal a controller-relevant failure. ros2_control uses fail-stop: fatal input writes NaN to all state interfaces and makes `read()` return `ERROR` until lifecycle recovery.

Reconnect is not equivalent to safe operation. Consumers must make acquisition state and sample freshness visible while recovery occurs. A controller should reject old or non-finite values independently of the receiver's recovery policy.

## Define acceptance criteria

Establish expected RDT rate from the NetBox Communications page's RDT Output Rate, not the ADC sampling frequency. Then define:

- minimum acceptable receive rate;
- maximum sequence loss over a chosen window;
- maximum sample age;
- tolerated reconnect count;
- accepted warning and serious status behavior;
- callback or queue overflow behavior;
- startup and shutdown timeouts.

Measure these under full system load. UDP and general-purpose operating-system scheduling do not provide hard real-time guarantees.

Separate transport, delivery, and storage evidence when setting thresholds:

| Signal                               | Indicates                                                 |
| ------------------------------------ | --------------------------------------------------------- |
| `receive_rate_hz`                    | Valid records entering the native client                  |
| `delivery_rate_hz`                   | Samples passed after configured delivery limiting         |
| `lost_count`                         | Gaps in accepted RDT sequence progression                 |
| `rate_limited_count`                 | Intentional native delivery decimation                    |
| `python_queue_dropped_count`         | Python consumer could not keep up with pending deliveries |
| Recorder overflow or `.partial` file | Capture integrity was not guaranteed                      |

A lower delivery rate is not automatically packet loss, and a zero network-loss count does not prove a slow application retained every delivered sample.

## Production validation

Commissioning should exercise normal data, cable removal, device power loss, process restart, HTTP failure, UDP timeout, serious status, disk-full behavior where recording is used, and recovery after correction. Confirm the downstream system moves to a defined safe state rather than holding the last wrench.

Re-run validation after changes to firmware, calibration, filter, transformation, RDT rate, network, operating system, core snapshot, or consumer logic. Preserve the resulting configuration and health report as part of the installation record.
