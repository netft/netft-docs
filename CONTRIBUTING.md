# Contributing to Net F/T Documentation

Documentation corrections, accessible design improvements, tests for site behavior, and focused tooling changes are welcome. Security vulnerabilities must follow [SECURITY.md](SECURITY.md) instead of the public issue tracker.

## Development environment

Install Node.js 22 or newer, clone the repository, and enable the pinned pnpm version through Corepack:

```bash
git clone https://github.com/netft/netft-docs.git
cd netft-docs
corepack enable
corepack pnpm install --frozen-lockfile
```

Start the local development server with `corepack pnpm start`. Run the complete gate with `corepack pnpm check`. The site uses TypeScript 7 for CLI type checking with a standalone `tsconfig.json`; keep its site path mappings relative to the project root and do not reintroduce the removed `baseUrl` option.

## Content boundaries

Use this site for complete user journeys, installation, task guides, shared concepts, C++ and Python API references, CLI and ROS contracts, operations, and cross-component troubleshooting. Keep implementation internals, release mechanics, and maintainer-only procedures in the repository that owns them. Mechanical interface facts in References come from pinned source manifests; behavioral explanations must still be verified against implementation rather than copied from a README blindly.

Verify every technical claim against current code, configuration, tests, release metadata, or current ATI documentation. Do not infer support from one CI job. Public examples may use ATI's documented factory-default address, but must not include laboratory addresses, credentials, recordings, or private network details. Cite ATI hardware material with its document number and access date.

## Testing expectations

Tests should cover data contracts, validators, generated routes, links, and other observable site behavior. Human prose does not need automated tests. Do not freeze headings, button labels, disclaimers, README text, or source formatting in tests.

## Pull requests

Keep each pull request focused. Explain the reader-facing outcome, source repositories checked, validation run, and any accessibility or deployment impact.

By contributing authored content under `docs/`, you agree to license that contribution under [Creative Commons Attribution 4.0 International](LICENSE-DOCS). Contributions to code, examples, tests, configuration, scripts, and site tooling are licensed under the [Apache License 2.0](LICENSE). Do not submit third-party material unless its terms permit inclusion and its original license is preserved.

## Example dependencies

Example checks are required by default: `NETFT_CPP_ROOT` must point to SDK headers (the default is `.dependencies/netft-cpp`), and `PYTHON` must import the version of pynetft in `data/reference/versions.json`. CI obtains the fixed SDK commit and Python release explicitly. `pnpm check:examples --allow-missing` is a local opt-in for working on prose without installed dependencies; skipped checks are not passes. Imports load the Python example without invoking `main()` or contacting hardware.

## Reference provenance

`pnpm update:references -- --cpp PATH --python PATH --cli PATH --ros PATH` requires clean checkouts whose origin, HEAD, exact tag and project version match `data/reference/versions.json`. CLI extraction consumes `--schema` and also verifies executable version, commit and clean-source identity; point `NETFT_CLI_EXECUTABLE` at the matching build. Older CLI releases without this interface cannot regenerate their CLI manifest with the new extractor. Their existing published reference remains pinned to its real release commit.

To review an unreleased candidate, copy the versions file to a temporary file, set each entry's `publication` and `sourceTag` to `unreleased`, set `sourceCommit` to its exact clean checkout HEAD, and use a `sourceUrl` ending in `/tree/<commit>`. Set `NETFT_REFERENCE_VERSIONS` and `NETFT_REFERENCE_OUTPUT` to the temporary metadata file and an existing temporary directory. Review generated candidates before explicitly replacing published references; do not label candidate code as a released tag.
