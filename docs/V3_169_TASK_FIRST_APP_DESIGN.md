# V3.169 — Task-First Customer App Design (development)

Branch: `v3.169`, branched from `v3.168`. Scope: private Business App Studio, no live release.

## Why
Visual suggestions are not useful if a customer cannot reach their intended task. V3.169 uses the **actual, enabled public-app modules** rather than an industry label alone. It does not infer any customer behaviour or turn a visually attractive app into a claim of bookings or revenue.

## Added

- **Six explicit customer goals** in `src/core/appCustomerTaskDesign.mjs`: request booking, send enquiry, find services, browse photos, find offers, inspect loyalty rewards.
- **Honest readiness audit:** for each goal, report whether its module is actually enabled, where it sits in current navigation, and any known review gaps. Contact-only is explicitly a limited fallback, not a proven tracked-enquiry workflow. A booking request is *not* a confirmed diary appointment.
- **Purpose-first layout suggestion:** only for an already enabled module, BUSY can propose placing the selected customer task directly after the business About section (or at the front if About is not first). Modules remain enabled/disabled exactly as before; all remaining sections retain their relative order.
- **Private comparison and Undo:** the suggestion is fed into the existing `proposeCoordinatedAppChanges` `navigation` operation. In the real Studio, owner sees original versus proposed customer surfaces, then explicitly chooses to approve or discard. Existing draft-revision concurrency checks and Undo remain in force.
- **Simpler UI:** a collapsed *Help customers find what they need* entry point avoids showing six actions until requested. This is in App Studio, not a new busy Home-screen widget.
- **Measured claims remain constrained:** original and proposed can be evaluated under deterministic responsive rules at 320/390/820 logical points, but the navigation position is only a static proxy. No real-user task completion, conversion gain, screen-reader compatibility, screenshot quality or app-store acceptance is implied.
- **Customer-data boundary:** engine reads only the owner-controlled public config; its output omits private customer records. It creates no bookings, enquiries, payments, background jobs, server writes, provider charges or automatically published changes. The same draft config is still used for marketplace and standalone apps.
- **Regression and packaging:** `scripts/check-app-customer-tasks-v3169.mjs` checks missing modules, valid and fallback paths, preserved data/config, no fabricated confirmation, safe exact navigation plans, no-op, Undo and Studio wiring. `.github/workflows/app-customer-tasks-v3169.yml` adds this script to V3.168 and earlier regressions, plus Busy and independent standalone iOS/Android Expo exports.

## Development versus release evidence

GitHub source and workflow being present do **not** prove that Actions or physical-device tests passed. Before sign-off:
1. Verify the complete V3.169 CI workflow is green, including all old tests and all four Expo exports.
2. Test on a private app with and without each enabled module. Ensure all six task choices and preview controls function on actual iPhone/iPad, including larger text and dark UI.
3. Verify the exact original-versus-proposed navigation and real private save/Undo, including a deliberately stale draft-revision conflict.
4. Verify marketplace and standalone rendered navigation independently.
5. Use isolated staging to submit real enquiries and booking requests, then check owner follow-up, status, linked diary booking and separate confirmation. Never equate an accepted request with a confirmed appointment.
6. Do not mark task success, conversion improvements, accessibility compliance or app-store submission verified without corresponding real-world evidence.

No Supabase schema migration, provider deployment, Cloudflare DNS change, public app change or AI bill is made by this sweep.
