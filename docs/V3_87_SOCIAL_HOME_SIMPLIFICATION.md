# V3.87 — Social Media Simplification + One-Tap Home Shortcut (development)

## Purpose

Make Social Media easy to discover and everyday post creation simple, while preserving every existing media, scheduling and publishing safety flow. BUSY retains its dark, voice-first design and ordinary subscribers do **not** need to hunt through Settings.

## Improvements

- **Home:** Two always-visible shortcuts for **Work & diary** and **Social Media** appear immediately below the Talk to BUSY area, **above** the daily status and recommendations. Find more work remains accessible via expanded tools and the Work tab. The four-tab bottom navigation is unchanged.
- **Social Media:** The first action is **+ Create a new post** (existing `startSocialFromPhone` flow). Immediately beneath it are real saved draft counts for **Drafts**, **Scheduled**, **Published** and a short provider connection summary.
- **Your posts:** Three accessible, selectable categories show up to three saved draft cards at a time; **See all** reveals the rest. Opening a draft continues to use the existing review screen, media, editing, cancellation, scheduling and approval rules.
- **Urgent issues remain visible:** Failed/partly published posts and provider-status refresh errors stay surfaced in a visible review panel; users are not misled by an apparently healthy empty dashboard.
- **More social media tools & details:** The original publishing-calendar queue, eligible completed-job photos, full activity history, provider-specific status, refresh controls, outcome recording and business learning diagnostics remain available via an explicit expansion control. They are not deleted or silently disabled.
- **Connection status:** Account labels reflect the actual provider connection results. A link to **Manage accounts** remains direct. "Connected" does not mean a post is approved to publish.
- **Presentation:** Compact dark summary tiles, touch-friendly post tabs and plain-English empty states. No extra permanent bottom tab.

## Behaviour, privacy and safety

The landing screen does not initiate a publish, schedule, retry, delete or external post. Provider authorisation, user approval, failed-channel-only retries, owner-scoped status, review locks and stored draft routes are unchanged. The app still refreshes publishing status on entry, as before; if that fails, an error remains visible. Social media post counts come from the **saved draft records** and should not be confused with separate cloud queue counters inside detailed reporting. Customer-approved job photo permissions remain in their original flow.

No Supabase migration, Cloudflare deployment, billing change, App Store release or live publishing activation is part of this sweep.

## Technical validation

- Branch `v3.87`; app `3.87.0`; signed iOS preview build number `7`.
- Existing security, release foundation, theme, Home, navigation and calendar regressions remain in CI.
- `scripts/check-social-simplification-v387.mjs` verifies one-tap Home navigation, saved-draft tabs, error visibility, preserved routes and approval boundaries.
- GitHub CI does **not** substitute for real iPhone use.

## iPhone acceptance checklist

1. Open Home: verify **Social Media** sits beside Work & diary underneath Talk to BUSY, without expanding extra tools.
2. Enter Social Media: **+ Create a new post** should appear first, with the three summary figures beneath.
3. Tap Drafts, Scheduled and Published; open existing posts, select a different tab, and check the View All controls with at least four records.
4. Check a disconnected provider, connected provider and refresh error; do not equate connection with permission to publish.
5. Tap **More social media tools & details** and verify scheduled queue, eligible job photos, connected-account management, outcomes, failed channels and learning metrics are still accessible.
6. Test the normal approval and retry-only-failed-channels flows without making unwanted live posts.
7. Check dark contrast, large fonts, VoiceOver labels and scroll placement on an iPhone; refine anything cut off.
8. Confirm Home, Work, Results and Settings still navigate correctly after returning from Social Media.

**V3.86 remains installed until the new signed V3.87 preview finishes and is installed.**
