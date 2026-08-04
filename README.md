# Net F/T Documentation

[![CI](https://github.com/netft/netft-docs/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/netft/netft-docs/actions/workflows/ci.yml)

This repository builds the canonical Net F/T user documentation at
[netft.dev](https://netft.dev). It covers sensor preparation, first connection,
the C++ and Python SDKs, the CLI, the desktop viewer, ROS and `ros2_control`,
API references, production operation, and troubleshooting.

Component repositories own their source, releases, migrations, and development
instructions. Shared user guides and references belong here.

## Local development

Install Node.js 22 or newer, enable Corepack, and run:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm start
```

Run the complete local validation gate with:

```bash
corepack pnpm check
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for content boundaries and pull-request
guidance.

## License

Authored documentation under `docs/` is licensed under
[Creative Commons Attribution 4.0 International](LICENSE-DOCS). Code, examples,
tests, configuration, scripts, and site tooling are licensed under the
[Apache License 2.0](LICENSE). Third-party material remains subject to its
original terms.
