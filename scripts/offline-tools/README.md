# Optional offline verification tools

These are development tools, not app dependencies. Direct versions and transitive integrity hashes are pinned in this directory. No install scripts are needed. Preserve dependency licences (declared MIT, ISC, Apache-2.0 and CC-BY-4.0); no third-party package code is committed here.

In a disposable verification checkout with no existing `node_modules`, copy these two JSON files to a temporary directory, then run:

```
npm ci --offline --ignore-scripts --no-audit --no-fund --cache /workspace/.npm-cache --prefix /tmp/busy-offline-tools
```

The cache path is environment-specific. `--offline` must fail if a required package is unavailable; do not quietly download or change versions. For this isolated checkout only, link its `node_modules` to `/tmp/busy-offline-tools/node_modules`, or use an existing appropriately provisioned dependency installation. Never replace existing application dependencies. Exclude the temporary link from Git locally.

Run the existing test commands normally, for example `node scripts/check-app-goal-editing.mjs` and `node scripts/check-mission10-public-information.mjs`. Mission 13 also exercises actual components with `node scripts/check-mission13-customer-surfaces.mjs`. These fixtures do not render React Native or prove hosted/provider behaviour.
