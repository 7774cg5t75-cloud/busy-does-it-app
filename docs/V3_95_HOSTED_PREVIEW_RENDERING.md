# V3.95 — Render the actual private hosted website

## Real-world iPhone bug
A user opened a private hosted website preview from Website Management and Safari displayed literal text beginning with `<!doctype html>` on a black background.

## Confirmed cause
Supabase Storage intentionally returns uploaded HTML as `text/plain` for security, even when the object has `text/html` upload metadata. The app previously passed a signed private Storage URL to `Linking.openURL`, expecting Safari to render it. This delivery route does not support rendered HTML.

## Fix
- The existing tenant-authorised `preview_url` operation still issues a time-limited signed Storage URL. No server secrets are embedded in the app.
- BUSY now downloads the immutable stored HTML as text and checks the deployment marker, expected Supabase origin, private Storage bucket, signed token, and exact deployment path before showing it.
- A dedicated native WebView uses the saved HTML as its source, **not the URL**, with JavaScript, DOM storage and arbitrary external navigation disabled.
- Internal page navigation accepts only exact pages listed in the original signed deployment manifest. The app fetches the allowed signed page and renders it in place. No external website is opened automatically.
- The fact the exact hosted preview was successfully opened persists across navigation back to Website Management. **Go Live still requires an additional explicit owner-review confirmation and a separate publication approval.**
- Private previews are not published customer websites. Do not treat a prepared deployment or an old healthy flag as proof of public HTTPS delivery.

## Tests
- HTML/content checks cover correct deployment ID and untrusted/fake HTML rejection.
- Navigation checks reject HTTP, external domains, fake subdomains, wrong bucket, wrong deployment, unsigned URLs, scripts, traversal, unknown page links.
- Regression checks confirm native viewer registration, disabled browser scripts, exact approval controls and no direct Safari preview hand-off.
- CI and iOS JavaScript export must pass; actual screenshot and navigation behavior remain to be accepted on the registered iPhone.

## Remaining scope
- This fixes the private preview experience in the mobile app. It does **not** claim that a real public site is hosted on a verified Cloudflare address. That remains subject to verified hosting and explicit owner approval.
- Native module addition requires an updated signed iPhone binary; updating only the JavaScript bundle in the old app is insufficient.
- Review the long-lived page/asset signed URLs issued by the worker in a later security sweep and implement shorter lifetimes / explicit refresh when viable.
