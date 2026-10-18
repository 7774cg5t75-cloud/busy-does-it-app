# Reproducible local verification environment

This setup installs verification tools only. It does not install Expo, run a workflow, contact a customer/provider, access a hosted database or deploy. Root application and standalone dependency manifests remain unchanged.

## Fresh checkout / reusable cloud environment

Use Node **24.19.0**, npm **11.9.0** and Python **3**. The verified pins are in `scripts/testing/toolchain.json`. These are test-runtime pins, not a change to Expo's runtime contract.

From the repository root, during the environment's approved setup phase:

```sh
python3 scripts/testing/bootstrap.py --allow-network
node scripts/testing/health.mjs
```

Only `registry.npmjs.org` is needed for this tooling install. The existing `scripts/offline-tools/package-lock.json` v3 fixes all 51 installed packages with registry URLs and integrity hashes. Direct pins: `@babel/core` 7.29.7, parser 7.29.9, CommonJS and React JSX transforms 7.29.7, TypeScript transform 7.29.9. They supply the parser, module/JSX transforms and TS erasure required by the 27 Phase 8 checks. No application bundle needs these packages.

Bootstrap uses **npm ci**, `--ignore-scripts --no-audit --no-fund`, bounded fetch attempts, and never runs a root application install or changes the lock. It checks every installed lock entry's package version and exercises a real JSX/CommonJS transform. A scoped `scripts/node_modules` link gives existing CommonJS and ESM test imports access to the isolated tools; existing nonmatching directories/links are preserved and cause an explicit setup error. Runtime `node_modules` is not replaced. Repeated setup skips npm when the complete installed tree matches. Package integrity is enforced by npm at installation; version checks are not a fresh cryptographic audit of installed file contents.

For subsequent offline sessions with a prepared tree, use:

```sh
python3 scripts/testing/bootstrap.py --offline
node scripts/testing/health.mjs
python3 scripts/testing/regressions.py
```

A fresh tree can also install offline from a complete npm cache. Optional `BUSY_TEST_NPM_CACHE=/path/to/prepared/cache` chooses a setup-owned cache; it does not grant filesystem or network permissions. A missing/incomplete cache fails honestly. Do not repeatedly retry installs during feature work.

The checked-in lock, bootstrap and health command replace dependence on `/tmp/mission13-tools`, which disappeared and left the previous root symlink dangling. Temporary workspaces and npm caches are not a reusable environment guarantee.

## Regression results

The reviewed manifest `scripts/testing/regressions.json` starts with all 85 Phase 8 commands and retains which 27 were blocked. It can grow with focused tests. The runner invokes argument lists without a shell; it does not discover and run every repository script (some have live/paid purposes).

```sh
python3 scripts/testing/regressions.py --only-phase8-blocked
python3 scripts/testing/regressions.py --filter phase8
python3 scripts/testing/regressions.py --output /tmp/busy-checks.json
python3 scripts/testing/check-environment.py
node scripts/testing/syntax.mjs src/screens/appVisualSelection.js standalone/template/App.js
```

Reports record source commit, dirty-tree indicator, selection hash, timing and bounded output. They are saved atomically after each result. Passed, failed, blocked and unexecuted are distinct. Filtered checks remain explicitly unexecuted; interruption/fail-fast never marks later checks green. Missing Babel or OS permission/time limits are blocked; assertion failures and missing original application files fail. Exit 0 means selected checks passed, 1 means failures, 2 means blocked/interrupted or no matching checks. Default output is ignored `.test-artifacts/regressions.json`. Runtime mocks/inert boundaries remain documented in individual tests; none becomes hosted/native acceptance because it passes.

Python orchestrates subprocesses because this task's command sandbox returned EPERM for Node synchronous subprocess calls. This is an environment restriction, not a reason to disable security. Both Node and Python remain necessary.

## Owner-managed cloud setup and permissions

Create/select a reusable Codex development environment for this repository and branch chain. Configure its runtime image/setup to provide the exact Node/npm versions above and Python 3. Select the approved Mission 15 source branch (main does not yet contain this dependent work). Set its repository setup command to the two fresh-checkout commands above, with the checkout root as working directory. Publish/save that environment through the platform's environment configuration UI, then select it for future tasks. These repository files do **not** publish an environment or change platform settings.

Allow the npm package-manager preset or the narrow `registry.npmjs.org` host **during setup**. Keep TLS/proxy trust enabled. Use no production secrets, customer credentials or provider bindings for offline tests. If the platform supports cached environment snapshots, preserve the prepared `scripts/offline-tools/node_modules` tree and scoped link, keyed/invalidate on the lockfile hash; otherwise keep a complete npm cache and let offline bootstrap rebuild it. A successful setup health check is required before calling the environment ready.

The current managed policy allowed the registry, but the command sandbox separately required network permission for the install. Owner authorization in chat does not change that technical sandbox. Configure package preparation in the platform setup phase to avoid task-time prompts where supported; any still-required command network grant must be approved through the platform. No general network, privileged container, credential or browser-sandbox bypass is needed. Exact platform UI labels vary; no platform configuration was changed or claimed published by this PR.

## Audit / separate acceptance

- Root source requests Expo ~57.0.23, React 19.2.3, React Native 0.86.3 and Playwright 1.58.2. Runtime packages are **not installed** here. There is **no root lockfile**, so root `npm ci` is not a valid documented setup. No arbitrary Expo/RN upgrade or new runtime lock was introduced. Unsigned Expo exports/device acceptance require a separately prepared compatible runtime environment.
- Existing historical Actions workflows often use Node 22.13.0, root `npm install`, floating action tags and browser downloads. They are historical recipes, not proof of this environment or all current tests. This phase does not dispatch or rewrite them.
- Babel parses/transforms TS syntax; Node's TS erasure is not Deno type checking. Deno/Edge integration requires separate tools and acceptance. No schema execution is part of this setup.
- Optional browser tooling uses the already-approved Playwright 1.58.2 in a separate locked prefix. See the browser acceptance instructions. Installing Babel does not install browsers or make the managed Chromium sandbox compatible.
