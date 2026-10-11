# Busy Does It V3.146 — Universal contextual toolbar, voice and intuitive website editing

## Permanent principle
**The complexity belongs to BUSY, not to the customer.** Tap what you want to change, use one compact action toolbar, and review before accepting a private change. The same policy is deliberately independent of React/websites so it can be reused in the intelligent app builder and elsewhere in BUSY in later sweeps. This first implementation applies to the private website builder.

## Four coordinated improvements

### 1. Universal select → edit / talk / more pattern
- **Select, don't interrupt**: tapping an editable heading, text, CTA button, approved photo, or the free space in an enabled whole section adds a clear but subtle accent outline. It does not immediately open a large editing modal.
- A compact floating toolbar appears by the chosen element, with one context-aware primary action (**Replace** for a photograph, **Adjust** for a whole section, **Edit** for wording), a small microphone, and More. It is never permanently placed over the webpage. Controls use minimum 44×44 pixel hit targets with accessible text, Escape to dismiss, keyboard operation, and responsive bounds/scroll positioning.
- An explicit toolbar button is needed to open the existing native editor. Untrusted WebView messages are checked against a finite action allowlist, authenticated website draft, enabled page/section, specific gallery photo index or exact service/item ID. No selection or toolbar action itself changes a draft or publishes a webpage.
- The markup/bridge script is injected **only** into the app-owned, opt-in private WebView. Normal public output, hosted publishing and portable ZIP receive no editor markers or code.

### 2. Reuse voice rather than invent a recorder
- Tapping the toolbar mic opens the exact selected context's focused voice panel and starts the **existing** guarded Expo Audio recording flow, subject to permission.
- The microphone button is an explicit start action. Recording has a visible red state/timer, manual **Stop**, then a separate **Send for transcription** or **Discard** choice. Silence is not a stop signal. A disclosed five-minute accident limit remains.
- BUSY rechecks the exact draft/page/revision/item identity before and after authenticated transcription. The customer reviews recognized wording before an approved bounded draft edit. Voice uploads, transcription costs and daily-use limits keep the previous V3.141/V3.142 contract; the pending Edge Function/database staging work remains necessary.

### 3. Better small-screen customer experience
- The toolbar fits phone widths and repositions when the selected item is near the edge or within a tall section. Only actions that apply to the selected part are made prominent.
- For pictures, opening **Replace** immediately expands the approved-photo selector rather than making the customer open another menu; actual replacements still use the existing image and private draft guard.
- For whole sections, **Adjust** immediately shows the optional section design controls; **More** shows advanced controls without first presenting irrelevant wording fields. The same route works across headings, paragraphs, buttons, photos and sections.
- Default website preview remains static unless the customer explicitly starts editing. The final hosted preview's separate publish approval remains mandatory.

### 4. Coordinated design intelligence and business preference reuse
- The new `src/core/contextualEditingCore.mjs` centralizes element-kind and primary-action labels, finite example instructions, and safe message validation. This can be extended by an app builder later without duplicating editors or granting arbitrary runtime actions.
- The finite quick-instruction suggestions respect the current website's own page-specific preferences: previously liked compact hero headings may be suggested first, and rejected ones are not re-suggested in that panel.
- The existing V3.143–V3.145 measured layout/check → proposed alternative → before/after recheck → explicit Keep/Undo flow and owner-private feedback remain intact. This sweep does not claim a live general-purpose AI screenshot critic, and does not retrain a model from customer activity.

## Verification and release boundaries
- New core and browser tests verify reusable actions, photo/heading/section targeting, exact tenant and page scope, responsive 44px controls, keyboard input, voice and advanced routes, escape/dismiss, accidental CTA navigation prevention and the absence of public scripts.
- Existing website visual-review, screenshot comparison (mocked AI), tenant/media, section style, standalone/ZIP and iOS/Android JS regression tests run alongside the new code.
- A signed iPhone/Android build and real-world accessibility/voice usability checks are still required. No cloud/provider deployment, live customer publish, expensive AI call or domain change happens in this sweep.

## Pre-release interaction audit
- [ ] New customers discover the edit entry point without instructions.
- [ ] One tap selects; another clear tap chooses Edit/Replace, microphone or More.
- [ ] Whole sections and nested individual elements select the **correct** scope.
- [ ] The toolbar stays visible and avoids screen edges even with large text and small phones.
- [ ] Keyboard and screen-reader users can select, activate and dismiss the toolbar.
- [ ] Tapping the microphone shows active red recording and a manual red Stop; pauses never stop speech.
- [ ] No transcription request, owner data transfer, draft mutation or publishing happens without the correct approval.
- [ ] Proposed design repairs cannot silently override page-specific owner preferences or skip measured safety/Undo.
- [ ] Measure first-time success, taps needed and recovery from mistakes in genuine iPhone testing.
