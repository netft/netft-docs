# Automate health checks

Use stable JSON and process exit status rather than terminal wording. Command-line values override `NETFT_HOST`, `NETFT_HTTP_PORT`, `NETFT_RDT_PORT`, and `NETFT_TIMEOUT`, which override built-in defaults.

```bash
export NETFT_HOST=192.168.1.1

if netft check --duration 5s --format json >health.json; then
  printf '%s\n' 'Sensor check passed'
else
  status=$?
  printf 'Sensor check failed with exit %s\n' "$status" >&2
  exit "$status"
fi
```

Set thresholds from the deployed sensor and application, not from an example:

```bash
netft check \
  --duration 10s \
  --min-rate 500 \
  --max-loss 0.1 \
  --max-reconnects 0 \
  --format json
```

Exit 7 means an explicit acceptance criterion failed. Discovery, acquisition, device status, and output failures use separate codes, allowing automation to report the failed boundary. A warning without a configured criterion can still exit successfully, so inspect the JSON metrics when warnings matter to deployment policy.

Generate completion from the installed executable so it matches that version. Exact environment, options, output formats, and codes are in the [CLI command reference](../../references/cli/overview.mdx).
