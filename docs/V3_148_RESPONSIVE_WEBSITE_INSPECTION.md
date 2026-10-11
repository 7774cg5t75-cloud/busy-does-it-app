# V3.148 — One responsive website: desktop, tablet and phone

This extends V3.148's before-and-after editing preview while keeping the
existing V3.147 scoped editing, Undo and publish approval boundaries.

- The private Website Builder preview lets the owner choose **this device**,
  **390px phone**, **768px tablet** or **1280px desktop**. The underlying
  content and actual public website remain a single responsive website.
- The private before-and-after instruction preview can compare exactly the
  same proposed change at phone, tablet or desktop CSS viewport widths.
  Toggling previews does not apply an instruction or change a saved draft.
- Wide layouts displayed on a small iPhone are scaled down, not converted
  into a narrow phone arrangement. This overview is helpful but not a
  substitute for checking the hosted website on real desktop hardware.
- The existing measured viewport coverage always uses real DOM
  `window.innerWidth`. If a WebView ignores a requested simulated width,
  the review displays a mismatch and cannot count it as that width.
- Public sites and website ZIP exports still use `width=device-width`
  and the existing business-specific responsive CSS; no preview-only
  widths get saved or published.

Checks: `scripts/check-website-responsive-preview-v3148.mjs`
covers finite widths, spoofed/untrusted markup rejection, public-site
immutability and UI integration. A separate Chromium mobile-emulation test
`scripts/check-website-responsive-preview-browser-v3148.mjs`
verifies that all three widths actually render, that the layout switches
between stacked mobile and wide desktop hero/navigation, that there is
no sideways overflow or injected script, and that screenshots are captured.

Not a signed iOS WebView test, hosted staging test or publication approval.

## Deeper business-specific composition

The planner now distinguishes photo-rich **event-catering** businesses from
story-led cafés: when at least two real services and two approved photos exist,
the event-catering homepage leads with its service/menu and photo gallery
before the longer story. This is deterministic and based only on the business
type and verified supplied content. Without real photographs it falls back
to the previous composition. Explicit owner section-order preferences win,
and an image marked `approved:false` never counts as a design signal.
The shared native/hosted planner stays the single source of truth.

`scripts/check-website-event-layout-v3148.mjs` tests industry distinction,
photograph consent, deterministic layout, the owner override and unchanged
private input. This does not generate imaginary photographs, testimonials,
credentials, booking links or outside AI spending.
