# Reviewed dependency remediation and installation

The application remains on Expo SDK57 / React Native0.86.3. No Expo downgrade or native dependency upgrade is made. Version-qualified overrides are limited to the actual original Expo introducers recorded in `security/dependency-policy.json`: CLI57.0.32, config57.0.10, config-plugins57.0.11, fingerprint0.20.14 and Metro config57.0.13. Their actual schema, config, glob and ignore-pattern callers and unsigned Hermes exports were exercised on Node22.13.0 and24.19.0 before accepting the scoped major changes.

Fixed locked library floors: Zod4.6.6, glob14.0.2, minimatch11.0.1 (glob also resolves11.0.3). Required new glob/minimatch transitives come from verified npm tarballs; no unrelated application SDK dependency is changed. `npm ci --ignore-scripts` remains mandatory. The mirrored capture lock must match the root; it must not silently reinstall old vulnerable tooling or undo prior security fixes.

Approved local installation:

```
npm ci --ignore-scripts
node scripts/apply-tooling-security-patches.mjs
node scripts/check-dependency-security.mjs
```

Use `npm start` / `node scripts/run-expo-safe.mjs start` for localhost-only development, and `node scripts/run-expo-safe.mjs export --platform ios` for approved unsigned exports. The launcher verifies exact installed/locked fixed versions and applies the reviewed deepmerge backport before Expo config loads. It does not authorise native signing, EAS, distribution, hosting or provider operations. Direct unguarded Expo commands are not the reviewed installation/launch path.

**Deepmerge remains an upstream advisory, not a clean npm audit.** Latest published4.3.1 still permits returned-object prototype poisoning through a target-owned `__proto__`. A small compatible backport drops that key on both merge inputs in the package's three shipped JavaScript artifacts. Hashes, package version/topology and actual main entry are checked; unknown bytes or layouts fail closed. Ordinary merge/array/Symbol and actual Expo config behaviour are tested. CJS and UMD runtime entry points are exercised; the raw source entry has a build-only dependency and is byte-verified rather than misrepresented as a supported standalone runtime entry. Reinstallation must reapply the patch; no version is renamed to evade audit matching.

The backport is explicit and local, with no postinstall network hook or custom crypto. It does not make arbitrary plugins or untrusted project configuration safe to execute. Only reviewed, lock-installed code/config is supported. A maintained replacement such as deepmerge-ts8.0.2 has a different export/customisation API; replacing Expo's declared dependency would require a broader adapter/fork migration. No unvalidated alias substitution is made. Remove the backport/overrides only after a genuine upstream fix and fresh compatibility/security acceptance.

Reachability: npm labels these libraries production-transitive because Expo declares its CLI/config dependencies. That is not proof they execute in the mobile application. Original iOS source maps for Owner Preview and isolated staging exclude all four libraries. Zod is used by the CLI's DevTools/MCP schemas; the examined schemas do not use the advisory's constrained-collection maximum. Glob and minimatch serve config/native paths/fingerprint/ignore patterns, where untrusted project trees/patterns would be a risk. Deepmerge serves config/plugin option changes; its library counterexample is reproduced and blocked. Developer tools stay on localhost; no unreviewed project/plugin execution, hosted activation or runtime provider access is authorised.

`.github/workflows/dependency-remediation.yml` is a standard public-runner, read-only, secret-free evidence job: immutable actions, bounded jobs, ignore-script installs, raw registry audits, actual caller tests, source maps and unsigned exports. It retains audit exit codes/findings and permits only the explicitly backported advisory; unexpected advisory families fail review. No advisory is suppressed by level or excluded from the report. Offline verification/browser-tool locks are also audited; no native capture or external customer action is dispatched by this workflow.

The dormant native capture harness receives current security tooling/overrides and records original/instrumented package, policy and lock hashes. Different dependency declarations fail rather than pretending a current toolchain is byte-identical to an old source. Its request-only trigger and unsigned simulator safeguards are unchanged. This mission does not run it.
