# V3.151 — Bounded autonomous website design and page conversations

## Implemented in development code

### 1. A real screenshot → candidate → screenshot → comparison loop

The existing authenticated, private-hosted screenshot review service now has
an **opt-in `studio` action**, gated behind two independent server flags:

- `BUSY_WEBSITE_VISUAL_AI_ENABLED=true`
- `BUSY_WEBSITE_AUTONOMOUS_DESIGN_ENABLED=true`

It still requires a trusted HTTPS Cloudflare Browser Rendering service,
server-owned secret, an allowed AI vision model, a real workspace owner/admin
and an existing `preview_ready` deployment. **None of these flags have been
enabled by this development sweep.**

The owner explicitly chooses 1–3 passes. Each run reserves up to
**passes + 1 AI review credits** (one original screenshot critique plus one
separate screenshot comparison per attempted candidate). Actual calls are
reserved atomically before each model request and recorded with token counts.
A failed attempted model call may still use an allowance. No automatic retry.

For every pass:
1. Download the exact hosted preview HTML using a server-side service role,
   validate the embedded immutable deployment ID, and capture authentic
   original mobile/desktop screenshots with the trusted private renderer.
2. Run an AI screenshot critique with finite, validated design suggestions.
3. Stage ONE finite, allowlisted visual class change in an ephemeral private
   HTML copy. Business text, media, links, credentials, layout CSS and SEO
   metadata are copied byte-for-byte.
4. Capture NEW, full-page, signed and provenance-checked screenshots of
   the candidate at mobile and desktop sizes.
5. Submit the previous and new screenshot pairs to a separate metered AI
   comparison. Only accept a clearly returned **better on both** verdict,
   otherwise stop and keep the last safe candidate (or the original).
6. Repeat up to three times only if the time budget allows. Duplicate changes
   and unsupported tokens cannot be tried again.

Temporary private previews are removed in a `finally` block; cleanup
failures are logged for operator investigation. No screenshots or signed
preview URLs are persisted as an output. The endpoint returns only validated
design tokens, pass outcomes, usage and an owner-approval-required report.

The customer can inspect options, discard them or explicitly approve a NEW
private draft through the existing Undo stack. The public website is never
changed by a studio run. AI verdicts remain fallible and do **not** certify
accessibility, visual quality or completion.

### 2. Conversational, page-wide editing

The Website Builder retains up to six owner/Busy conversation turns in
ephemeral local state, bound to one business, page, draft and generation.
It supports clarification follow-ups and preserves explicit requests such
as keeping business colours and photographs. On a draft/page/workspace
change, conversation context is invalidated. The shared module is designed
for future reuse by the App Builder.

If the user explicitly requests paid AI interpretation, the server receives
a bounded excerpt of the dialogue plus flags for owner preferences, not the
website's full content. The server is still off by default without
`BUSY_WEBSITE_PAGE_INTENT_ENABLED=true` and a configured model.
Auth, membership and the atomic website-voice/intent daily counter remain
mandatory. AI only produces clarification or finite text instructions:
the native app independently reparses them into current, reviewable
operations. No conversation can publish or apply changes on its own.

### 3. Tests

- `scripts/check-website-design-loop-v3151.mjs`: finite HTML-token
  transformations, source protection, duplicate and invalid changes,
  screenshot provenance contract, three-pass limit, conservative rollback,
  metering/security integration and tenant scope checks.
- `scripts/check-website-conversation-v3151.mjs`: bound revisions,
  multi-turn history, preserved preferences, isolated workspaces and
  no direct command execution.
- `scripts/check-website-design-loop-browser-v3151.mjs`: Chromium
  captures **actual full-page screenshots** of the original and revised
  page on mobile/desktop. The comparison model is intentionally MOCKED
  in CI; this test does not claim paid-provider testing.
- Production CI also runs the V3.151 pure safeguards; a dedicated V3.151
  workflow runs native exports and browser checks.

## Release-readiness blockers / what remains

- No live, authenticated staging run of the server's three-pass loop.
  Verify Deno Edge Function timeout and Cloudflare rendering availability,
  AI-provider model access, quota reservation, screenshot provenance,
  CSS comparison and temporary-file cleanup.
- No real cost data. Evaluate model and rendering cost per 1/2/3-pass run,
  configure profitable caps and test concurrent requests.
- No AI-based tablet screenshot comparison in this loop yet; responsive
  mobile, tablet and desktop preview/DOM checks exist elsewhere. Extend
  the trusted screenshot contract only after testing the extra viewport.
- The model's `better` verdict is subjective. Add independently measured
  overflow, accessibility and readability regression gates to the hosted
  comparison before marketing it as an autonomous professional designer.
- App Builder can reuse the scope/turn and guarded preview/approval
  patterns but does not have the same visual-loop integration yet.
- Signed native iPhone/iPad tests, hosted website acceptance, GDPR consent
  and final publisher security audits are outstanding.

**Status: V3.151 code development and CI are separate from production
availability. Do not enable paid services silently.**
