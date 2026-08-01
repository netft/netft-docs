# Net F/T Documentation

[![CI](https://github.com/netft/netft-docs/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/netft/netft-docs/actions/workflows/ci.yml)
[![Deploy](https://github.com/netft/netft-docs/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/netft/netft-docs/actions/workflows/deploy.yml)

The canonical user documentation for the [Net F/T organization](https://github.com/netft). It covers ATI Net F/T preparation, first connection, applications, complete C++ and Python API references, ROS and `ros2_control`, production operation, and troubleshooting. Component repositories continue to own source, releases, migrations, and implementation details.

## Local development

Install Node.js 22 or newer, enable Corepack, and run:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm start
```

Run the complete local gate with:

```bash
corepack pnpm check
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for content boundaries and pull-request guidance.

## License

Authored documentation under `docs/` is licensed under [Creative Commons Attribution 4.0 International](LICENSE-DOCS). Code, examples, tests, configuration, scripts, and site tooling are licensed under the [Apache License 2.0](LICENSE). Third-party material remains subject to its original terms.
