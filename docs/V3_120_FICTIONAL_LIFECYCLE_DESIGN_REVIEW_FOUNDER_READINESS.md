# V3.120 — offline customer lifecycle and clearer founder priorities

## Real customer-facing improvement
The Website Builder's main Continue action now uses exactly the same read-only, evidence-backed next step that customers see in the status card. An outdated hosted preview can no longer be launched through that action; customers must prepare the new version first. In-progress jobs route to status rather than creating another publishing attempt. Publication requires the existing separate exact-hosted-preview owner approval.

## Fictional end-to-end development rehearsal
A new deterministic, side-effect-free lifecycle test starts from a fictional business's draft, creates a synthetic immutable hosted preview, requires owner approval of exactly its content revision, records a synthetic deployment, verifies that same revision in a synthetic delivery observation, then makes an updated draft and rehearses owner-approved rollback. It explicitly fails closed on cross-tenant events, changed hashes, missing approval, false HTTPS checks, replayed wrong deployment IDs, cloud access or paid calls.

This tests authorization and sequencing contracts, not actual Supabase deployment, provider wiring, production access or DNS. Even a successful synthetic delivery is returned with liveWebsiteVerified=false and publishedToInternet=false.

## Usability and measured website review
A new read-only, vendor-free design feedback helper translates actual browser-review regressions (tappability, contrast, headings, navigation, form labelling and readability) into simple potential fixes. It does not edit the website, publish, certify visual beauty or claim conversions.

GitHub's Chromium run renders five distinct fictional businesses (gardening, exterior cleaning, catering, beauty and accounting) on phone and desktop and checks actual text, headings, main actions, internal link targets and overflow. It retains screenshots as short-lived CI artifacts. Existing quality and accessibility negative controls also run.

## Founder work reduction
The Founder Operations screen now adds one read-only safe preparation step: verify a stale/unknown report, inspect recorded failures, or complete the deny-by-default local/sandbox pilot checklist before any rehearsal. It cannot send alerts, repair a customer's service, buy a domain or pay providers. The seven-gate pilot checklist and 11-gate Global-Ready release checklist remain unapproved by default.

## Release boundary
Source changes are verified with GitHub Actions and an Expo iOS JavaScript export, not a signed native build. No customer pilot, live website, external AI vision provider, registrar purchase, production database migration, global learning, service account connection or DNS change is activated. Release still requires a real authorised staging environment, privacy checks, supplier integrations, independent owner approval and end-to-end live evidence.
