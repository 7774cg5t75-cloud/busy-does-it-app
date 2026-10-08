# V3.66 — BUSY Operator 3.0: voice/text growth-project continuation

## Implemented on the V3.66 development branch

- `src/domain/growthOperatorBridge.mjs` is a deterministic *read-only* intent boundary. It recognises explicit saved-growth-project requests, named confirmed services, and scoped follow-ups including "open that project" and "show me the website wording".
- The existing `Talk to BUSY` screen and voice service remain in place. Typed growth-project queries are answered from authenticated, RLS-filtered checkpoints without another AI inference call. Spoken growth-project requests pass through the existing BUSY server-side audio transcription; *the returned transcript* is matched against verified saved growth projects before any normal Operator action routing. No new microphone permission or separate third-party speech subscription.
- `src/app/AppController.js` fetches only the signed-in creator's current business growth checkpoints using `listGrowthProjects` and builds a read-only `buildGrowthCommandCentre` snapshot. It does not write, publish, schedule or delete anything.
- The follow-up referent lives **only in memory** and stores the selected service plus the current owner/business scope. It is reset for a new conversation, on sign-out and when account/business changes. Async responses are ignored if the account/business or newer request changes before data comes back.
- `continue` and `open` commands can navigate to the Business Creation workspace, preselecting the confirmed service. A saved cloud project must still be explicitly loaded by its owner; this **does not** automatically replace unpublished wording or claim the website, Business App or social channel is live.
- "Show me the website wording" navigates to the existing owner-only growth workspace for review; **it does not recite private draft text** from a voice request or give AI authority to publish.
- Spoken or typed "publish", "delete", "launch now" and similar commands inside a project context are explicitly refused in this bridge. The regular Operator and publisher guards remain in place for other existing intents.
- Errors and unavailable cloud state are shown as "cannot verify"; no success, publication or performance state is fabricated.

## Limitations / future follow-up

- Spoken project requests still require the pre-existing audio transcription and command inference service, which may incur AI cost and may fail before returning a transcript. Typed project-only requests bypass that inference.
- The parser is intentionally narrow; complex indirect or ambiguous spoken references fall back to normal Operator processing or ask for a specific service. This is not unrestricted autonomous reasoning.
- The per-conversation project focus is not persisted across app relaunches. This protects private context and avoids stale assumptions.
- Only saved growth projects appear (bounded to 25 recent checkpoints), not a unified dashboard of every customer, diary event or provider publishing receipt.
- No independent real-time verification of public website/app/social publishing has been added. A private-editor handoff is **not** proof that a publication succeeded.
- A real signed-in iPhone and iPad session must validate the audio permission, owner change, navigation, cloud outage, keyboard, foreground/background interruptions and App Store build before release.
- No new database migration, Edge Function deployment, service role, account setup or additional cloud plan is needed for this code sweep.

## Test suite

`node scripts/check-growth-operator.mjs` covers direct named-project questions, "open that project" contextual follow-ups, channel-specific review, multi-project ambiguity, unrecognised commands, forbidden publish/delete/launch, stale confirmed facts, changed tenants and in-memory scope, cloud unavailable behaviour, and wiring into both existing Talk-to-BUSY input methods. Earlier V3.62–V3.65 tests run alongside it in `.github/workflows/check-growth-operator.yml`.

## Real-device acceptance checklist

- [ ] In a verified signed-in account with an actual saved project, say "Where are we with carpet cleaning?" and confirm private review progress is correct.
- [ ] Say "Open that project"; check BUSY opens the correct confirmed service without automatically replacing private text.
- [ ] Return and say "Show me the website wording"; check BUSY navigates to the private editor and explicitly asks the owner to load saved wording if needed.
- [ ] Say "Publish that now" and verify it neither posts online nor bypasses the editor's normal final approval.
- [ ] Switch businesses or accounts during a cloud request; old account data/context must never be shown in the new business.
- [ ] Disconnect internet and ask about a project; verify BUSY says the private state cannot be checked.
- [ ] Confirm everyday customer and calendar voice commands still use the existing Operator pipeline.
- [ ] Test multiple project names in a single utterance; should ask for a specific service.
- [ ] Confirm Snack preview and signed native iOS device behaviour separately. Expo Snack publishing alone does not establish production readiness.
