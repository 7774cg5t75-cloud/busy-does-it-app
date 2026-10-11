# V3.156 — First app-specific mic and customer-approved section ordering

## Scope completed as development code
- Business owners can reorder any currently enabled, supported Business App
  module ONE position at a time. Before a move, the App Builder renders an
  unsaved proposed customer view, with explicit **Keep in PRIVATE app** and
  **Discard** actions.
- `appSectionOrder.mjs` is the same finite module permutation logic in both
  client and trusted mini-app Edge Function. The `move_section` action is
  in the owner/admin write permissions, validates the original private app
  id and draft revision, atomically compares the revision when saving, and
  changes NO private customer facts, payment settings, requests or public
  versions. Published versions remain untouched.
- The same navigation order is consumed by `MiniAppSurface` in the marketplace
  builder, `appRuntimeScreenSchema` for future standalone packaging, and the
  strict projection from the live public Business App version. This closes
  a major gap where editing a section's order in one route might not affect
  the other.
- App Builder now offers **Talk to BUSY about this selected part**. The
  existing reliable Expo recorder supports explicit Record, Stop, review
  recording, Send for transcription and discard. Closing the selector
  disposes of unsent audio. A transcript becomes EDITABLE local text;
  the owner must still tap Preview and Keep, and unsupported instructions
  are rejected by the finite design parser.
- New `app-selection-transcript-v1` route on `busy-command` validates
  app id, business id, owner/admin membership, authenticated user and
  exact current private draft revision before reserving voice usage.
  Uses a NEW service-role-only UTC-day quota limited to 12 app
  transcriptions per owner/business. Neither usage database nor return value
  contains audio, private customer data, commands, or a publish action.
  Requested content sent to the model is audio for transcription only.
  No AI model is allowed to apply an edit through the audio endpoint.

## Checks
`scripts/check-app-voice-layout-v3156.mjs` checks one-step reversal,
unsupported and disabled layout moves, matching live/standalone navigation,
owner/business voice quota, exact revision and no-auto-edit response contract.
The dedicated workflow also runs legacy app and website regressions, edge
TypeScript/React Native syntax checks, and separate **unsigned iOS and Android
JavaScript exports** for both BUSY and the independent fictional-business
customer app project.

## Still not yet demonstrated
- App voice **live**: deploy the SQL migration and function update to
  authenticated staging, verify paid transcription quota, permission
  denials, Stop/discard and iPhone/iPad behaviour, owner revision changes
  during upload and realistic audio sizes. Automated tests never charged
  the AI provider or recorded microphone input.
- Voice-to-design works only for the CURRENT selected header, spacing or
  navigation element; it is not yet an unconstrained AI app programmer,
  module-content editor or always-listening wake word.
- Section editing is one-step ordering with reversal by a deliberate new
  move. Full multi-step Undo/Redo, explicit drag-and-drop and richer app
  section/text/service editing still need planned implementation.
- Real business booking/enquiry staging end-to-end, safe receipts, signed
  standalone customer binaries, app store accounts and deployment, verified
  premium subscription billing, costs and maintenance, and real devices
  are required before customer release.

No customer website/app published, no billing provider changed, no
Supabase migration deployed and no external store account used in this sweep.
