# Python SDK tutorial

pyNetFT 2.1.0 is a synchronous typed Python interface to the shared native core. Supported wheels cover CPython 3.10–3.14 on Linux and macOS x86_64/ARM64 and Windows x86_64. They include curl and require no NumPy.

## Install and read

```bash
python -m pip install pynetft==2.1.0
```

```python
from pynetft import Client, Config

with Client(Config(sensor_host="192.168.1.1")) as client:
    sample = next(client.samples(timeout=1.0))
    print(sample.force, sample.force_unit.value)
    print(sample.torque, sample.torque_unit.value)
```

The context manager stops acquisition deterministically. Without it, call `stop()` before releasing callback resources or exiting. `Sample.wrench` is the six-element physical tuple; `raw_wrench` contains the signed RDT counts.

The actual lifecycle is created/stopped → connecting → streaming, with reconnect policy moving through backoff and fail-stop moving to faulted. Calling `start()` again in the same active delivery mode is idempotent; switching delivery mode during a run raises `RuntimeError`.

## Iterator or callback

`Client.samples(timeout=...)` provides blocking iterator delivery for sequential programs. A timeout raises Python's `TimeoutError`, allowing a loop to remain bounded without treating every absent sample as a terminal fault.

The constructor's `queue_size` bounds pending Python deliveries. When full, the queue drops the oldest pending item so a slow iterator receives current data without unbounded memory growth. Monitor `Health.python_queue_dropped_count`; use a dedicated recorder when every sample must be preserved.

Callback-driven applications pass `callback=` when constructing the client. Iterator and callback delivery are mutually exclusive for a run. Callbacks must return promptly; slow storage or networking belongs behind a bounded queue with explicit overflow behavior.

```python
from threading import Event

from pynetft import Client, Config, Sample

received = Event()


def consume(sample: Sample) -> None:
    print(sample.wrench)
    received.set()


with Client(Config(sensor_host="192.168.1.1"), callback=consume) as client:
    if not received.wait(timeout=1.0):
        client.raise_if_failed()
        raise TimeoutError("the sensor did not produce a sample")
```

Callbacks run serially on a dedicated Python dispatcher, not the native receive worker. If a callback raises, `wait()` or `raise_if_failed()` raises `CallbackError` with the original exception as `__cause__`.

pyNetFT deliberately exposes no asyncio-specific API. If an asynchronous application needs the sensor, bridge the synchronous client at the application boundary rather than assuming the native receiver has async semantics.

## Configuration, health, and failures

Automatic discovery supplies the active calibration and units. A complete `Calibration` override exists for independently verified fixed values; partial or guessed scales are invalid.

`Client.health()` exposes state, receive and delivery rates, sequence quality, reconnects, last error, and discovered configuration. A terminal sensor or transport fault raises `SensorFaultError` with structured fault and health information. Inspect that information before choosing restart or fail-stop behavior.

Do not branch on `last_error` text. It is diagnostic and may change. Use `ClientState`, `FaultCode`, counters, and exception types as stable machine-readable information.

Iterator stop ends iteration normally; iterator terminal faults surface when advancing `samples()`. Callback completion is observed through `wait()` or `raise_if_failed()`. `wait_for_first_sample()` returns only a Boolean and intentionally does not distinguish timeout, stop, generation change, or fault, so inspect health when it returns false.

`Client.bias()` changes the device zero. Call it only after the same unloading, motion-stop, and authorization checks required by every other interface.

## Migrating from 1.x

New code uses `Client`, `Config`, and `Sample`. Deprecated `NetFT` and `Response` compatibility interfaces remain during 2.x but should not be used for new work. The 2.x design adds explicit lifecycle ownership, typed data, sensor-discovered units, iterator/callback delivery, health, and structured failures.

Use the repository's [migration guide](https://github.com/netft/pyNetFT/blob/main/docs/migration-2.md) for exact old-to-new call and field mappings, and the [Python API reference](../../references/python-api/overview.mdx) for public symbols.
