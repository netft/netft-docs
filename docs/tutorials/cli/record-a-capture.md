# Record a capture

Make a short verification recording before a long run. Choose a new destination and bound the capture by duration, count, or both:

```bash
netft record 192.168.1.1 --output verification.csv --duration 10s
```

The recorder preserves every accepted sample through a bounded producer-consumer queue. It refuses to replace an existing destination, writes `verification.csv.partial`, drains and flushes accepted rows, and promotes the final file only after clean completion.

After the command exits, verify that:

- the final `.csv` exists and `.partial` does not;
- the header matches the documented schema;
- the last row is complete;
- elapsed time is monotonic;
- sequence, status, raw counts, calibrated values, and units remain together;
- sample count is plausible for the duration and configured RDT rate.

Use NDJSON when downstream processing expects independently parseable records:

```bash
netft record 192.168.1.1 \
  --output measurement.ndjson \
  --count 10000
```

Interruption finalizes accepted rows and exits 130. Queue overflow or writer failure exits 8 and preserves the partial file. Do not rename a partial file and claim it satisfies the requested capture. Investigate disk space, permissions, storage latency, and the reported error before using a new path.

See the [`record` command reference](../../references/cli/record.mdx) and [CSV schemas](../../references/data-formats/csv.mdx).
