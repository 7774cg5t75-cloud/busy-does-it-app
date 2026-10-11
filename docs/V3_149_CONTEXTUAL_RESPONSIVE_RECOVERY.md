# V3.149 — Coordinated Website Builder intelligence sweep

## Shipped in source code (development stage)
1. **Selected-element instructions:** V3.147's deterministic atomic selected editor now
   accepts up to five bounded, explicit steps. There is still no unreviewed AI
   execution and one Undo covers a successful group.
2. **Named page-wide changes:** the new `websitePageInstructions.mjs` plans exact
   named-section operations on the current page. A customer can request, for example,
   `move the services section up; make the hero heading smaller on phones;
   give the about section more space`. Both preview and Apply revalidate the
   active owner draft and revision. Any unsupported/failed step aborts all steps.
   The customer must explicitly preview and approve; this feature currently
   accepts **typed** page-wide instructions, not free-ranging voice conversations.
3. **Responsive manual control:** independent section heading and gallery photo sizes
   at phone (<601px) and desktop (>=960px) widths. Tablet remains the
   responsive default. Settings use finite enums, shared `designSystem`
   breakpoints, the existing private domain layout operation and Undo stack.
   No custom CSS may be injected. Both hosted renderer and ZIP/concept renderer
   emit identical validated section classes.
4. **Visual review:** V3.148's actual CSS viewport checks can be compared as phone,
   tablet and desktop findings. This flags differences and missing evidence; it
   is **not** a new AI vision model or proof of aesthetic appeal. The existing
   opt-in screenshot/review pipeline is unchanged and still needs provider and
   hosted staging acceptance.
5. **Recovery:** customers can explicitly save one in-session private design
   checkpoint, see a two-step confirmation before restoring it, and restore to a
   new draft revision with one Undo. Restore does not touch live deployment.
   The checkpoint is **not durable backup** and disappears when the app session
   ends or the account signs out.
6. **Reuse for the App Builder:** the new page planner reuses existing
   transaction preparation and approval paths instead of duplicating them;
   generic transaction/preview patterns can later be extracted for the App
   Builder. **No App Builder feature is claimed to have shipped in V3.149.**

## Test and deployment boundaries
Dedicated regression tests cover owner/draft/page selection, stale revisions,
multi-step rollback, proof of no-save previews, invalid styling values,
cross-device DOM evidence, recovery confirmation/reset and parser safety.
Production foundation and V3.149 CI rerun prior website/voice/toolbar tests,
real Chromium rendering (including device-scoped CSS) and unsigned native JS
exports on both platforms. CI success does not verify signed native devices.

No customer website was published. Before launch: authenticated staging,
hosted site review, real iPhone/iPad/desktop acceptance, consented screenshot
AI testing, provider usage controls, and comprehensive device QA are required.
