# Busy Does It — V3.152 Website Builder completion and App Builder handover

## Status (11 October 2026)

**Major feature-development phase: transitioning to the App Builder.** This is not a
claim that the Website Builder is ready for paying customers or certified
against real live provider infrastructure.

The significant Website Builder components built across V3.147–V3.152 now
cover business-specific generation, site and multi-page management, universal
selected-element editing, user-controlled page-wide instructions, transcript
review, opt-in conversational interpretation, separate phone and desktop
appearance settings, private browser previews, bounded screenshot-based
design alternatives, an opt-in autonomous review loop, recovery, versioned
hosting architecture, owner-approved publishing and source export.

V3.152 adds strict reusable private builder revision + design-only integrity
guards. The same safe boundary is used when creating a private AI website
alternative, interpreting exact page instructions, and at the **final Keep**
action before changing the owner's draft. It prevents AI presentation
suggestions from altering identity, navigation, SEO content, sections,
photographs, customer facts, public status, hosting metadata, or arbitrary CSS.
The owner still explicitly chooses what to save; any legitimate website
content change uses a separate, authorised editing route.

The final V3.152 integration suite actually creates **two** distinct business
website drafts, attempts multi-step editing and private recovery, prepares
AI-derived alternatives, renders the original/edited/candidate designs in
Chromium at 390, 768 and 1440 CSS pixels, checks for overflow and unwanted
scripts, and proves that a local preview cannot count as a published HTTPS
website. Existing V3.151 server and visual AI boundary tests remain covered.

Tablet can also be selected in the app's AI studio comparison preview.
That is a **responsive preview, not a separately AI-scored screenshot**.

## Verified development foundations vs remaining release work

| Domain | Development coverage | Remaining real-world proof |
|---|---|---|
| Business design intelligence | Deterministic business-family choices and supported owner content | Quality judgment on a range of real customer briefs |
| Editing and conversations | Scoped finite edits, transcription only, bounded conversation and review-before-Keep | Real signed-device voice and multi-turn end-to-end experience |
| Responsive website | Phone/tablet/desktop private checks, Chromium screenshots, finite overrides | Actual iPhone/iPad/desktop browsers and hosted delivery |
| Autonomous AI design | Authenticated, consented, limited, metered server code; private candidates; fresh mobile/desktop screenshot comparisons | Enable and prove real model/renderer provider, authenticated staging, cost, timeouts, cleanup and independent quality gates |
| Recovery | Draft Undo/Redo and one temporary in-session recovery point | Persistence requirements and backup/restore drills in staging |
| Publishing | Immutable hosted-preview architecture, exact revision checks and owner approval | DNS/HTTPS health verification, RLS, storage, rollback and publish acceptance |
| Privacy, billing, global architecture | Restrictions and preparatory foundations | Legal/compliance/credit pricing audit, localization, real scalability |

**Hard stops:** no production release, live provider enrolment, paid AI review,
real customer site publication, auth staging or signed native device build is
authorised by the development CI. Those must have separately sourced evidence
and explicit owner approval. Cloud provider limits and real costs are not yet
verified.

### Concrete pre-release acceptance checklist

1. Staging with a disposable Supabase workspace, migrations, service-role
   verification, isolated fictional businesses, RLS and expired-session checks.
2. Signed iPhone/iPad testing; end-to-end microphone record/Stop/transcribe,
   keyboard, tablet/desktop previews and Undo/Redo recovery.
3. Real trusted renderer and AI comparison at 390/1440: identity, exact hash,
   monthly reservation under concurrent calls, fail-closed feature flags,
   screenshot cleanup and real model billing.
4. Website generator evaluation using at least multiple different categories,
   real approved images, English/localization paths, SEO, accessibility
   (including contrast, semantics and keyboard navigation) and contact forms.
5. Publish approval, one-label customer subdomains, real HTTPS verification,
   content version rollback, ownership/export and non-renewal behavior.
6. Privacy/data protection, credit allowances, usage monitoring, founder alerts
   and resilience under expected traffic.
7. Founder checks release sign-off with independent evidence.

## App Builder handover: what to reuse in V3.153

### Reusable, implemented foundations

- **Revision/integrity:** `src/core/privateBuilderBoundary.mjs` now guards
  both website layouts and the future mini-app model. It refuses stale
  drafts and changes to non-presentation fields.
- **Business profile:** `src/domain/miniApps.js` already maps approved
  Brand Brain business information and suggested app modules into an app
  profile; do not request duplicate onboarding.
- **Exact immutable preview:** `src/core/businessAppPreviewProof.mjs`
  already blocks stale or ambiguous Business App versions and claims no
  publishing permission.
- **Reusable approach rather than copying website-only code:** finite
  capability catalogs, selected component context, manual-start/Stop
  microphone, transcript review, clarification context, one Undo for a
  deliberate group, private candidate comparison and owner consent for paid
  AI actions. Extract generic portions as needed without binding an App
  Builder screen directly to website-specific field/section IDs.
- **Existing backend and UI:** `supabase/functions/busy-mini-apps/index.ts`,
  `src/screens/miniApps.js` and mini-app request/guest endpoints provide a
  starting point. Verify the real implemented feature set before asserting
  that all module types or public marketplace actions are live.

### V3.153 recommended priorities

1. Make the customer's App Builder journey simple: business brief → choose
   supported modules → private app preview → tap or talk to change →
   customer approval. Keep the dark-themed, uncomplicated presentation.
2. Put a finite app screen/component schema behind the builder rather than
   claiming arbitrary app code can be safely generated.
3. Reuse safe editing and conversation infrastructure with **app-specific**
   permissions (e.g., booking requests must not become confirmed bookings
   without the relevant safeguards).
4. Build responsive app preview, versioning, Undo/recovery and honest
   device/platform distinctions.
5. Design the in-Busy business marketplace path as a **future product
   capability**. Do not conflate an embedded business micro-app with a
   separately distributed App Store app.

**Decision:** stop major Website Builder feature expansion after the V3.152
development checks, preserve its testing/bug-fix backlog, move the main
development effort to the App Builder. Reopen large Website Builder
development only for a proven customer-impacting gap or critical defect.
