# Optional real-browser acceptance — preparation, not execution

No Chromium launch or screenshot capture was performed in Phase 9. The existing managed IPC/sandbox limitation was not retried. `browser.py --prepare-only` successfully generated the fictional first-party fixture and source/revision hashes without importing Playwright or opening a browser.

Use an approved **non-root**, isolated local development machine/runner with normal user-namespace/setuid Chromium sandbox support. Provide Node 24.19.0, npm 11.9.0 and Python 3, and preinstalled compatible OS browser libraries. Keep production credentials, customer data and provider accounts out of this runner. Prefer a prepared environment with application egress denied during capture. Do not disable Chromium's sandbox, add capabilities/privileged mode or bypass the platform restrictions to make the current workspace work.

Optional setup (network needed only for packages and the browser download):

```sh
npm ci --prefix scripts/browser-tools --ignore-scripts --no-audit --no-fund
node scripts/browser-tools/node_modules/playwright/cli.js install chromium
```

The separate lock pins the already-used Playwright 1.58.2 / playwright-core 1.58.2 (Apache-2.0); optional macOS fsevents is MIT. Lifecycle scripts are disabled. This does not install browsers automatically, install Expo or modify runtime dependencies. No `npx` fallback or unpinned download is used. Download access needs the actual Microsoft Playwright browser CDN hosts used by that pinned release; inspect the supported install's requested URL and allow only the required hosts through the platform setup policy. Do not assume the npm-only allowlist permits browser archives. OS libraries must be prepared by the runner owner; this PR runs no sudo/apt operation.

Once prepared, with capture network restricted and no secrets:

```sh
python3 scripts/testing/browser.py --prepare-only
python3 scripts/testing/browser.py --capture --output /tmp/busy-browser-evidence
```

The wrapper supplies only a bounded environment (PATH, temporary HOME/TMPDIR, locale, browser cache selector and evidence identifiers). It does not inherit application credentials/proxy/provider settings. `chromiumSandbox: true` is explicit: Playwright's Chromium default otherwise disables sandboxing. There is no fallback to an unsandboxed launch. Startup errors report blocked; failures after startup report failed. Context routes abort all fixture requests; fixtures use embedded first-party code, no remote website inputs. Browser internal networking is not claimed blocked by routing alone: enforce egress at the compatible runner boundary when strict isolation is required.

Prepared capture coverage:

- 390×844 phone, 768×1024 tablet, 1440×900 desktop.
- Original first-party renderer, tap-selection bridge, deliberate keyboard movement and original layout operation readback; real screenshots and DOM geometry before/after supported source changes.
- Actual pointer-down plus synthetic cancellation; no move message after cancellation.
- Bounded quality measurements reuse the existing first-party inspector, including solid-background contrast, overflow/readability/clipping indicators and explicit unknown image/gradient contrast. Geometry and screenshots are not aesthetic evaluation.
- Source commit, dirty-tree indicator/diff hash, exact fictional HTML hash, draft/generation/source key and screenshot hashes in the report. Fixture hash binds actual input even when source is dirty; it is not a signed-release attestation.

This prepared runner is not yet browser-executed or device-accepted. Physical finger drag/autoscroll, native touch gestures, OS restart recovery, assistive technology and hosted persistence remain separate acceptance. The runner tests the original selection/movement policies and renderer, not a full Expo/owner save UI. The existing inert gesture/component suites cover additional logic but are not physical-device proof.

A disabled proposal is retained at `docs/proposals/mission15-browser.yml.proposed`, outside `.github/workflows`. It cannot register or execute as an Actions workflow. Before any activation, the owner must review exact source/action pins, runner compatibility, browser download policy and available free usage, then separately authorize registration and a manual run. This PR does not copy it into an active directory, approve billing or dispatch it. Local prepared execution is preferable when it avoids additional GitHub compute/artifact charges.
