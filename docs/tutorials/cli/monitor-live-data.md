# Monitor live data

Use `monitor` after configuration and a bounded check pass. Stop every other RDT client, keep the mechanism safe, and choose a finite first observation:

```bash
netft monitor 192.168.1.1 --duration 10s --rate 20
```

Interactive output shows the newest sample. X, Y, and Z force values precede X, Y, and Z torque values. Compare raw counts, scaled values, unit labels, status, sequences, receive rate, and continuity counters rather than looking only at the wrench.

`--rate` controls presentation, not sensor acquisition. A 20 Hz table can represent a stream received near 2 kHz because monitor intentionally keeps only the newest value. This avoids display backlog but is not lossless recording.

With the system stationary, apply one small controlled load in a known direction. Verify the expected axis and sign against the transducer drawing, confirm status remains healthy, and remove the load. A frame label or application name does not rotate the values.

For a pipeline that consumes individual live records, use NDJSON:

```bash
netft monitor 192.168.1.1 --duration 10s --format ndjson --rate 50
```

Read stdout as data and stderr as diagnostics. Do not parse the human table. If every accepted sample matters, use [Record a capture](./record-a-capture.md) instead. See the [`monitor` command reference](../../references/cli/monitor.mdx) for exact options.
