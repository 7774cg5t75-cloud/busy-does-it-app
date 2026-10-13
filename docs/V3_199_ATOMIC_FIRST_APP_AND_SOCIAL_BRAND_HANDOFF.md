# Busy Does It — V3.199: Verified First-App Creation & Brand-Aware Content

**Base:** verified V3.198 (latest head included automated Snack preview). **No live production changes, external marketing sends, app signing, paid AI calls or publishing in this development sweep.**

## 1. Database-atomic FIRST private Business App (major reliability change)

- Previously first creation used `ensureApp` followed by an `update`. The database already enforced `UNIQUE (business_id, app_key)`, but an interleaved second caller could read the newly created row and update it. V3.197's preflight guard and V3.198's status reconciliation helped, but neither fully eliminated that overwrite race.
- New migration `20261013081000_v3199_atomic_first_private_app.sql` defines the service-role-only `busy_create_first_mini_app_draft_v3199` RPC. It validates authenticated owner/admin membership again in SQL, locks the `busy_businesses` tenant row, checks the existing main app, and atomically inserts an unpublished initial private app *with its complete reviewed configuration*. A race returns `created:false`, never permission to overwrite another app. It does not insert publication versions or enqueue any external action.
- The first-app `build_draft` Edge action now uses the RPC **only when `expectedNoExistingApp=true`**. This requires the migration to be present in the target environment; it deliberately fails closed if unavailable, instead of silently reverting to the vulnerable path. Existing app refreshes still use the old trusted route.
- The owner's existing first-app UI continues to reconcile authenticated owner status after ambiguous responses. Appearance adaptation remains a second, separately revision-checked private edit. This is **not** falsely described as one complete website-to-app transaction.
- The SQL is **committed but not deployed**. Before enabling this behaviour in a real staging or production environment, apply the migration in a controlled staging database, test concurrency from two authenticated sessions, inspect permissions, and run rollback/regression checks. An unsigned JS export cannot prove SQL works in live Postgres.

## 2. Brand DNA enters the real Social Media creator

- New `socialBrandHandoffV3199.mjs` uses current same-tenant website/app Brand DNA and the factual copy prepared by V3.198, and rechecks source IDs, revisions, tenant, copy and brand colour at approval time.
- The actual Social Creator now offers **Prepare my branded caption**. The owner sees and chooses the wording, with a specific warning before replacing any edited caption, and can edit the result. For the no-AI route, existing creator requires selected photos before it can save a private draft. The existing `saveGeneratedSocialDraft` and `SocialDraftReview` workflows are reused; **no API provider call, scheduling or publication** is caused by selecting the branded wording.
- Brand conflicts, missing source pair and stale revisions are blocked. The app does not automatically import photos, client records, customer testimonials, calendar availability, reviews, or private contacts. This is not a text-only live posting implementation; some social networks need attached media.

## 3. Useful next-step decisions after app creation

- `firstAppNextStepV3199.mjs` reads only the current same-tenant private app and makes a low-pressure explainable suggestion: finish website-to-app branding if missing, review a genuinely enabled industry customer action, or configure one if none exists.
- App Builder shows this with a genuine read-only server refresh action. No hidden module enablement, auto-publication, booking confirmation or unsupported feature promise.

## 4. Verification

Dedicated workflow `builders-major-v3199.yml` runs the new strict test and prior V3.198/V3.197/V3.196/... regression suites, source syntax check, pinned dependency install, and four unsigned iOS/Android exports (Busy and standalone prototype).

**Limitations:** The checked-in SQL migration needs *authenticated isolated staging execution* before the atomicity claim can be demonstrated under concurrent clients. End-to-end booking, provider publishing and real-device conversion remain separate pre-release tests. The new Brand DNA path generates owner-reviewed caption text, not a whole image/video/advert campaign.

**North star:** Give Busy a useful, context-aware action that she can do properly, with verifiable state and owner approval, rather than impressive-looking unsupported features.
