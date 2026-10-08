# V3.60 – Release acceptance gates

## Implemented and checked
- [x] Conversation field extraction, contradiction prompts, negation and hypothetical safeguards.
- [x] Confirmed facts remain the sole eligible source for website, Business App and social handoffs; publication approval is separate.
- [x] Private same-device draft recovery scoped to owner and business.
- [x] Authenticated creator-scoped cloud checkpoint table with RLS and revision compare-and-swap.
- [x] Manual cloud Load / Save on business-creation screen; drafts are never auto-published.
- [x] AI suggestion endpoint deployed with JWT verification, authenticated user identity and creator ownership check.
- [x] Returned AI suggestions validated against owner evidence, presented unapproved, and suppressed if the source text changes.
- [x] Server-side atomic quota of 20 AI extractions per owner/business UTC day. Clients cannot debit or reset the quota directly.
- [x] Node regression tests, CI foundation checks and Snack preview jobs on prior tested commits.

## Must pass before merging or releasing
- [ ] Sign into a real owner account, save a new conversation on iPhone, load it in a separate signed-in device, and verify exactly identical text.
- [ ] Edit the same draft on two devices; the older revision must not silently overwrite the newer one.
- [ ] Sign out, sign in as another owner, and verify another business's private draft is inaccessible (403/no rows). Repeat with a non-creator business member.
- [ ] Test AI request with real auth: verify extracted facts, source evidence, user-facing confirmation and a distinct publication permission.
- [ ] Verify that edits to the source description hide earlier AI suggestions and that failed requests retain local content.
- [ ] Exercise 20 daily AI reviews and confirm request 21 returns a limit message **without** an OpenAI call.
- [ ] Confirm no customer information, unapproved facts or transcripts enter publicly published website/app/social content.
- [ ] Check actual iPhone/iPad keyboard, voice and screen flow; check offline/reconnect behavior.
- [ ] Verify the final commit's conversation, production and Snack preview checks; review Expo-generated QR if device testing requires it.

## Boundary
The production Supabase schema and authenticated Edge Function are deployed.
The **mobile screen changes are still development-only** on `v3.60`.
This document is an acceptance checklist, **not** proof of manual device testing or release sign-off.
