# Inspect and validate a sensor

Net F/T CLI 0.3.0 is the preferred tool for commissioning, bounded health checks, scripting, live observation, loss-aware recording, and explicit bias.

## Inspect and check

`info` reads identity and active calibration without opening a continuous stream:

```bash
netft info 192.168.1.1
netft info 192.168.1.1 --format json
```

Use the human form during commissioning and JSON when preserving or comparing configuration. The JSON object includes endpoint, product, calibration source and revision, both counts-per-unit values, and both units.

`check` observes a bounded stream. Configuration discovery, first sample, sustained acquisition, and acceptable status are mandatory. Optional thresholds turn deployment requirements into an exit status:

```bash
netft check 192.168.1.1 \
  --duration 10s \
  --min-rate 500 \
  --max-loss 0.1 \
  --max-reconnects 0
```

Packet loss is a warning until `--max-loss` makes it a criterion. A criterion failure exits 7. This distinction allows early commissioning without pretending every installation has the same expected rate.

For a startup probe, preserve the machine report and propagate the precise exit status:

```bash
if netft check "$NETFT_HOST" --duration 5s --format json >health.json; then
  echo "Sensor check passed"
else
  status=$?
  echo "Sensor check failed with exit ${status}" >&2
  exit "${status}"
fi
```

Do not parse human-readable wording. Branch on the process exit code and stable machine fields.

## Bias

```bash
netft bias 192.168.1.1
```

The CLI first displays the current reading and requires confirmation from a terminal. Use `--yes` only inside a separately authorized procedure that already guarantees the transducer is safely unloaded and downstream motion cannot react.

## Verify the result

Keep the JSON configuration and check report with commissioning records. Confirm identity, both scales, both units, expected RDT output rate, zero serious status, and acceptable sequence continuity before switching to another client.

Continue with [Monitor live data](./monitor-live-data.md), [Record a capture](./record-a-capture.md), or [Automate health checks](./automate-health-checks.md). Exact syntax and exit codes are in the [`info`](../../references/cli/info.mdx) and [`check`](../../references/cli/check.mdx) references.
