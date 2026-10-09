# V3.88 — Create a post straight from Home

The Home screen has a prominent blue **+ Create a post** button immediately below **Talk to BUSY** and before **Type to BUSY instead**. It invokes the *existing* `startSocialFromPhone` flow: reset the post composer, open the photo-based social post creator, and allow editing/review before publishing. No new public publishing or scheduling actions are introduced.

The existing **Social Media** shortcut remains in Home's Quick access area for drafts, scheduled posts, published posts and account connections. **Work & diary** remains beside it. This is intentionally different from simply opening the Social Media dashboard.

## Verify on iPhone

1. From Home, find the blue **+ Create a post** button under Talk to BUSY without scrolling to the Quick access panel.
2. Tap it; confirm the photo-based post creator opens, not a live publishing action.
3. Return to Home, then tap **Social Media** under Quick access; confirm the draft/scheduled/published tabs.
4. Create and save a draft, navigate away, reopen it and confirm approvals and provider-specific controls remain as before.
5. Test at larger iOS text sizes and ensure the primary CTA is legible and not clipped.

App version `3.88.0`, signed iOS preview build number `8`. CI script: `scripts/check-direct-home-post-v388.mjs`. The iPhone build must still be installed to validate the UI. This is not an App Store submission.
