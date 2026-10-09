# V3.83 — Dark Home & Voice-First Simplicity (development)

## Scope

This sweep changes the **ordinary business Home screen**, not the founder-only
platform reporting API. It keeps the existing light styling on detailed business
screens for now while introducing a high-contrast near-black Home, muted dark
panels, legible off-white text and BUSY blue actions.

- Hide the verbose development badge **on Home only** (still visible on other
  development screens); no production-readiness claim.
- Place **Talk to BUSY** and the typed alternative first, with the same review
  and approval safeguards as before.
- Show real confirmed bookings for the coming seven days, plus whether a
  business action needs review.
- Show one recommended next move, when available, without silently sending,
  publishing, booking or paying.
- Keep Work and finding more work one tap away.
- Move feature centres, business memory, website tools, social tools, and
  secondary recommendations under a reversible **Explore BUSY's other tools**
  expander. These routes are not removed.
- Preserve distinct platform founder reporting behind existing authenticated,
  server-side role checks; do not add it as a subscriber Home shortcut.
- Retain the previous theme on all non-Home screens until those pages have
  their own contrast and accessibility pass.

## Technical notes

- Version: `3.83.0`; iOS `buildNumber=3`; Android `versionCode=3`.
- Expo SDK, dependencies, backend services, subscription controls and provider
  connections are unchanged.
- `Shell` and `BottomNav` accept an opt-in dark prop, with the native safe
  area/status bar also dark only on Home.
- A pre-existing syntax error in `check-founder-operations.mjs`, present in
  V3.82, was fixed so CI regression checks can run again.
- `scripts/check-dark-home-v383.mjs` is wired into the production workflow.

## Native acceptance checklist (outstanding)

1. Produce a **new** V3.83 signed iOS preview build. The installed V3.82 binary
   does not automatically receive these code changes: EAS Update is not yet
   configured for this app.
2. On the iPhone, confirm Home uses the dark palette without clipping,
   unreadable contrast or excessive scroll; confirm navigation to Work, Results
   and Settings is intact and uses the existing light layout.
3. Test microphone permissions, Talk to BUSY, and the typed fallback; confirm
   external actions still require the existing approval flow.
4. Test zero bookings and nonzero bookings, empty and populated inbox, and
   best-move suggestions; check real customer data and business isolation.
5. Expand/collapse extra tools and verify website, social, diary and customer
   routes. Verify the protected Founder Operations area is not available to a
   regular subscribed user.
6. Review touch target sizes and accessibility with VoiceOver/dynamic type.
   If needed, refine the Home layout in a follow-up sweep.

**No customer-facing App Store release, automatic website deployment, billing
change, or production service activation is performed by this sweep.**
