# B3 — minimum original-authority Quiet Light source continuation

**Procedure only; not implemented or authorised for execution.** This document adds no runtime, gateway, binding, account, SQL change or deployment. It follows the real native owner and separately approved B2 canonical business/membership setup. B2 success must be established by root's independent receipt; this document does not assume it.

Target exclusively Busy Does It AI Lab, `sbvkrvksnruiclcvclbd`, organisation `wrjfgasxtlznzfzmfrif`, Ireland `eu-west-1`. Use the actual native owner and business UUIDs from the private B1/B2 receipts; do not put those private bindings or a placeholder UUID into an executable public artifact. Owner identifier: `quiet-light-owner@busy-ai-lab.invalid`. The owner retains the password. Never request it, a JWT or any API key in chat/Codex.

## What already exists, and why there is no working Lab login URL

The existing original client is `src/staging/StagingSignInScreen.js` → `stagingAuthInspectorV3131.mjs` → `ConnectedBuilderWorkspace.js` / `connectedApplicationRuntime.mjs`. It is not an available Lab login page:

- The inspector is hard-bound to the older staging project, its two earlier fixture identities and its original canary records.
- Merely changing `EXPO_PUBLIC_BUSY_STAGING_SUPABASE_URL` does not admit the Lab or this owner. Do not relax those checks or write canary records into the Lab.
- The actual Website private entry in `supabase/functions/busy-website-publish/index.ts` additionally requires the older staging URL and its server-owned connected-builder activation. Its other consequential routes remain independently quarantined. Do not deploy that complete function or enable the staging switch to reach B3.
- The Lab-specific creative pilot is disabled before environment/identity access and accepts only a future approved model operation. It cannot sign in, initialise a business, write a profile or create the source Website.
- No currently deployed Lab Edge Function, approved local native-login runtime or owner-facing login URL has been verified.

Supabase's native password endpoint exists at **`https://sbvkrvksnruiclcvclbd.supabase.co/auth/v1/token?grant_type=password`**. This is a native API endpoint, **not** a ready human login page, an instruction to paste credentials or permission to call it now. A future approved trusted process would use the supported native SDK password sign-in and `/auth/v1/user` verification. No magic link, OTP, invitation, recovery email or Auth-table modification is required or authorised.

## Recommended smallest integration to review next

Use **one ephemeral, owner-operated trusted server process** for this exact source preparation, importing the existing original session and private Website handler. It need not listen on HTTP, deploy an Edge Function, expose a public gateway, create a new app experience or add a database authority.

This process is a proposed narrow binding, not a new builder or onboarding system. The concrete live runner/binding does **not yet exist**; do not represent the disposable test script as one. Its implementation, full import graph, exact source hash, runtime/secure binding, approved source manifest and one-shot execution plan must be reviewed before B3 execution. A separate process or deployment approval is required where applicable. The existing local rehearsal already establishes the original domain/SQL behaviour, so the remaining work is native Auth and trusted transport wiring, not new layout or AI adapter development.

Proposed responsibilities:

1. Bind an immutable private manifest to this Lab, actual B1 owner UUID, actual B2 business UUID, verified B2 receipt and the exact source operations below. No command-line or client property may replace project, actor, business, URL, operation list or approved facts.
2. Obtain the owner's native password only through an owner-controlled non-echo interactive input in the reviewed trusted runtime. It must never pass through Codex, shell command text, logs, history, screenshots or an exported environment dump. If no such approved runtime is available, stop and identify that missing binding.
3. Keep native Auth access/refresh tokens private in server memory; do not persist a session or return tokens to an application. Discard refresh tokens, enforce a bounded session and require a new deliberate sign-in after expiry. Supabase server/API credentials must be provided only through owner-controlled secure server bindings, never copied from staging or exposed to Codex/client code.
4. Perform supported native password sign-in against the exact Lab; independently call native `getUser(accessToken)` and require the exact real non-anonymous confirmed owner. The fixed email selects the intended identity but does not authorise business access.
5. Use the real bearer token for original authenticated RPCs. Before each consequential operation, independently verify current native identity and the original current owner membership/source read. Derive the actor from `getUser`, not from editable metadata or an execution request.
6. Supply the original private Website handler with two distinct trusted ports: authenticated original read/history using the native owner bearer, and service-only original commit/transition from the backend credential. The service credential remains in the trusted process; it is never a client credential. Original SQL rechecks/locks current membership and CAS independently.
7. Use the original `createConnectedBuilderSession` orchestration, review and exact readback. Do not call a service-only commit with a fabricated actor, construct JWTs, set hosted request claims, write snapshots directly, grant new DML or add a parallel persistence store.
8. Permit only this source preparation's initializer/profile/Website operations and independent readbacks. No arbitrary function name, SQL, provider/model endpoint, media path, publication, automatic future save or tool execution.
9. Bound each operation, stop on the first mismatch or uncertain acknowledgement and retain the actual safe receipt. No automatic replay, cleanup, account deletion, password reset or rollback. The original session's unknown-write state must remain authoritative.

An owner-operated trusted server process is proposed to avoid creating another hosted API merely to seed a fictional source. It still requires a suitable secure runtime and server credential binding. Neither is assumed to exist. If the owner instead chooses an existing reviewed original client/server deployment, its exact Lab-only binding must satisfy the same controls; the old staging inspector and complete publication function cannot be silently retargeted.

## Exact finite source procedure after approval

The source facts remain those in `scripts/lib/mission16-site-fixtures.mjs` and the reviewed Quiet Light packet: independent creative studio; original tagline/description; complete Brand direction, Website content and Creative review service descriptions; remote project conversations; supplied two-paragraph clarity/conversation/refinement story; image-free design; protected **Discuss your project** action; fictional `hello@quiet-light.example.invalid` contact. No live mailbox, location, portfolio, review, award, price, credential, operating history or availability is invented.

The actual installed original RPC/handler sequence is:

| Stage | Original authority | Required readback |
|---|---|---|
| Discover owner scope | `busy_connected_workspaces_v1()`, native authenticated owner | Exact B2 business and owner role |
| Initialise | `busy_connected_initialize_v1(business)`, native authenticated owner | Original snapshot exists; correct current actor/business/revision |
| Save approved profile | `busy_connected_profile_write_v1` via original session profile CAS | Exact supported profile facts/revision/hash; draft/private only |
| Create private source | Original `website_create` through `privateWebsiteDraftAction` and service-only `busy_connected_website_commit_v1` | Exact source generation, profile revision, private readback hash; Home/Services/Contact |
| Add story | Original `website_edit_design` add-text; heading Clarity comes before decoration; first supplied paragraph | Actual newly created `custom-...` section identity |
| Protect complete story | Original `website_edit_text` of that actual section body to the complete supplied two-paragraph story | Exact body and existing ownerEditedFields protection |
| Protect action | Original `website_edit_instruction`: set the hero button text to "Discuss your project" | Exact action and existing Contact destination; owner protection |
| Reopen | `busy_connected_builder_read_v1`, native authenticated owner | Exact three pages/services/story/action, image-free, Not published |
| Verify bounded history | Original `busy_connected_website_history_v1`, commit/transition through original handler/session | Current history/readback; any deliberate Undo/Redo remains separately reviewed within the bounded source procedure |
| Seal future creative source | Original service-only `busy_ai_context_v1` | Exact native actor/business/Website/profile/snapshot binding and every new source revision |

The installed profile writer does not initially expose `about`, `toneOfVoice` or `targetAudience`. Story remains in original owner-approved Website text. Supplied audience/personality are explicit approved creative preferences in the existing bounded future goal, not invented canonical profile extensions. New custom-section IDs and all actual revisions must replace the earlier offline fixture's `about`/UUID identities; regenerate input/schema/wire digests instead of pretending the old offline approval applies.

No whole-Website profile-source-CAS extension is silently installed. The existing source preparation uses supported finite legacy operations. Saving an eventual expressive model document through account persistence remains separately gated; the first real request may prepare an owner review without automatically saving the candidate.

## Exact B3 approval prerequisites

Before requesting execution, supply:

- Independently verified B1/B2 receipts and actual private identity binding; current membership, no unexpected profiles/snapshots/drafts or partial preparation.
- The exact reviewed trusted-runtime binding/import graph/hash, native Auth/no-token-leak tests and original handler/RPC allowlist; no environment switch alone confers authority.
- The exact approved source/operation manifest with actual business/owner bindings, stop conditions, bounded operation count and independent readback plan.
- The owner-controlled secure native password entry and server credential configuration method. No password/key/JWT may be sent to Codex or installed in a mobile/browser client. No staging credential is reused.
- Explicit permission for original snapshot/profile/private source-draft writes only. Original AI policy remains disabled/zero, with no tariffs, entitlements, accounts, reservations, model requests or deployed provider route.
- An uncertain-outcome procedure that inspects the current native records and original receipt without replay or destructive cleanup.

**Recommended next authorisation:** review a small B3 binding implementation and secure-runtime setup first, then approve its exact one-business source execution. This document alone is not an executable B3 packet and conveys no hosted-write, deployment, credential or spending authority.

## Existing engineering evidence and its limits

`node scripts/check-ai-lab-fictional-source.mjs` and its Unix-only `--postgres` branch already demonstrate the original source preparation, preservation, native-contract approximation, readback, Undo/Redo, denials and non-replay. Their receipts are engineering evidence, not native hosted sign-in. No additional tests or hosted calls were performed for this procedure-only document.

Reviewed original module hashes at this checkpoint:

| Original module | SHA-256 |
|---|---|
| `src/staging/connectedBuilderSession.mjs` | `0c334a26b71185f45d6578f22c71c27a495e797f6d76da9e5fe8b2edf1728d88` |
| `supabase/functions/busy-website-publish/privateDraftService.mjs` | `bdea147e4f508e3e13773d11e9e7541afdb2b00c7f4873910e402174a9fb150d` |
| `src/staging/connectedAccountRoutes.mjs` | `ae34f6bd8631f308970e454d8fac452db9b21f4b521676a11acf5a2832a02309` |
| Original fictional source `scripts/lib/mission16-site-fixtures.mjs` | `ab8f48985f3312a15de929882db6706cab48c5e81b41e7dceef1ae1808f17cbc` |

These are existing module/source hashes, not a hash for an unimplemented live runner. No new model creativity, visual improvement, release readiness or Gold Standard approval is claimed.
