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

### Phase 23 — named Babel plugin resolution

The reviewed regression runner now gives only its child checks `NODE_PATH=<repository>/scripts/offline-tools/node_modules`. Some inherited checks pass Babel plugin names as strings; Babel resolves those relative to the working directory, which could fail despite a healthy pinned prefix when an earlier session's shell export was absent. The runner supplies this test-only lookup explicitly and records it in its evidence JSON. No global shell configuration, runtime dependency, download or Codex platform permission is changed. Prefer explicit `requireTools` plugin objects in new checks. Offline bootstrap and health commands remain unchanged.

## 24 October 2026 — restored disposable PostgreSQL17 cache

The approved runtime was restored at `/workspace/pg17-disposable`, outside public Git. Server/client packages are **17.11-0+deb13u1**, from the signed Debian trixie index at `https://deb.debian.org/debian`. Complete package URLs were resolved with APT before download; SHA-256 values matched both the signed index and the retained Phase59 evidence:

- `https://deb.debian.org/debian/pool/main/p/postgresql-17/postgresql-17_17.11-0%2bdeb13u1_amd64.deb` — `d2ce1ddffafa783f9acda4c92c86fc21e8288bff3782d739294f14fa797d7886`.
- `https://deb.debian.org/debian/pool/main/p/postgresql-17/postgresql-client-17_17.11-0%2bdeb13u1_amd64.deb` — `9d8558f8dd57c8e92e218a20698383575d53742ca3f9e7c2b7fe5f246d5216ae`.

APT configuration/lists/cache are isolated below that directory, using the existing Debian archive keyring and signed verification. Packages were extracted with `dpkg-deb`, without system installation, service changes or maintainer-script execution. No additional dependencies were installed; local library resolution was checked. Retain/reverify the cache rather than downloading executable replacements from arbitrary sources. A new environment may not preserve these files; verify availability and hashes again.

`root/usr/lib/postgresql/17/bin` holds the tools; `data` and the mode0700 `socket` directory are dedicated to fictional fixtures. The initialized cluster uses local trust only inside that restricted directory, rejects host authentication, and starts with `listen_addresses=''` and `unix_socket_permissions=0700`. No TCP listener or hosted connection is needed. In this session the normal sandbox denied Unix-socket binding; per-command additional network permission allowed that local socket. Do not work around this by enabling TCP or changing sandbox/security policy. Stop the cluster after testing; this mission's final stop exited0.

Use the original `phase66_postgres.py` chain with the private exact provisioning definitions supplied outside Git, followed by `account_work_postgres.py` against the same disposable database and a fresh successful baseline report. See `docs/sql-proposals/account-work/README.md`. Real local PostgreSQL locks, privileges, transactions and denials are tested; the synthetic UID fixture does not establish genuine Supabase JWT/PostgREST enforcement. No hosted staging or production action is implied.
