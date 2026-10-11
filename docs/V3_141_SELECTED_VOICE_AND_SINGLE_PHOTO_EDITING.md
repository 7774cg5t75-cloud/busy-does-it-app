# Busy Does It V3.141 — Voice + Touch Context and Single-Image Editing

## Customer experience

V3.141 develops the **website builder first**. An owner opens the private site preview, enables tap editing, taps the exact heading, wording, button or approved photo, and chooses **"Tell BUSY what to do with this part."** They can still use one-tap examples or type an instruction for free. A new **Speak about this part** control records a short voice instruction only after an explicit microphone tap. It sends the audio to the authenticated BUSY transcription service, then places the returned words in the editable instruction box. The owner must read and tap **Apply reviewed instruction to this part**: there is NO automatic action from the recording.

- The microphone is optional. Typing and visual controls remain available when permissions, connection or transcription fail.
- The voice flow is scoped to the actual `draftId`, selected `pageId`, `sectionId`, exact `itemId` / photo index and `generation`. A background draft change, changed page or invalid selection blocks the request before upload and after response.
- The backend receives no selected website draft or business-content payload. The new `mode=website-selection-transcript-v1` branch of `busy-command` authenticates the owner, limits the audio to 2.5 MB, uses the existing speech transcription provider and returns `{transcript, requiresReview:true, command:null, action:null}`. **It does not call the Operator action model**. The app refuses responses missing this exact contract.
- Transcription is a metered provider operation and **may incur costs**; unlike local typed controls, recording is not claimed to be free. Usage metering/billing and abuse throttling beyond the existing authenticated gateway remain a pre-release consideration. Avoid silent repeat uploads.

## Better mobile photograph controls

- When the owner taps one approved gallery photograph, **crop this photo to the top/middle/bottom** now changes only that image. Previous `section-style` controls affected all gallery images; V3.141 uses new `image-style` with the selected photo index and strict allowed values.
- An approved gallery photo can also be selected as the main website photo from the same simple editor.
- Per-photo crop preferences are preserved across relevant factual website refreshes using the asset identifier and source reference, while the earlier history allows Undo/Redo and exact photo removal/reordering remains safe.
- Both local/static ZIP HTML and the hosted Supabase website worker use the same finite approved CSS class tokens. No raw CSS, remote user-supplied image or JavaScript is accepted.

## Engineering safeguards and verification

- The microphone control is implemented in `src/screens/websiteSelectedVoice.js` with Expo Audio. It cleans up recording when the selected editor closes. It never calls `submitBusyCommand` or `executeBusyCommand`.
- The owner-authenticated cloud request is in `AppController.js`, with stable scope validation in `src/core/websiteSelectedVoiceContext.mjs`. The existing strict `websiteTapToEdit` guard handles current-page membership, field allowlist and approved photo indexing.
- The existing no-publish private draft editing contract remains mandatory. A failed or unclear transcription is never applied. An owner-approved command still uses existing field/layout handlers and Undo/Redo, not public publishing.
- `scripts/check-website-voice-selection-v3141.mjs` tests selected voice scope, stale/replayed IDs, forged fields, exact photo crops, private draft immutability, hosted/ZIP class parity, transcript-only API response structure and the UI requirement for explicit review.
- `.github/workflows/website-selected-voice-v3141.yml` runs prior website regressions, Deno type checking, Playwright mobile/tablet/desktop selection checks and unsigned iOS/Android Expo JavaScript exports. The general production workflow retains this guard.

## Honest release boundaries

Only **source code and automated checks** are part of this sweep. No authenticated live microphone-to-transcription round trip or signed iPhone/Android device has been verified. The modified `busy-command` Edge Function must be reviewed and deployed to isolated staging before the new voice route will work end-to-end. Published websites, domains, customer data and live Supabase services have not been changed.

Future website-builder sweeps should improve voice metering and quotas, genuine iPhone/Android voice/tap ergonomics, richer picture cropping and precise on-screen editing while preserving the simple default UI. The intelligent app builder remains next **after** the website builder reaches the intended standard.
