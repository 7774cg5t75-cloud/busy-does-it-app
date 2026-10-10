# V3.97 — Preview again, without publishing

## Feedback from iPhone
The real hosted website now renders inside BUSY, but returning to the editable preview leaves a customer-facing button labelled "Prepare / publish website". This made reopening the existing private hosted preview feel impossible, and blurred the distinction between viewing and launching.

## UX fix
- Website Builder reopens the current immutable hosted preview directly. The recommended review action goes to the actual hosted website instead of forcing the customer through Website Management.
- The editable "Website preview" screen shows **View hosted website again** at both the start and end when a hosted version exists. A draft without a hosted version instead offers **Prepare private hosted preview**.
- When the draft has been edited since the last hosted version, the page explains that the existing preview is older and provides an **Prepare preview with my latest changes** route.
- Publication stays a separate secondary **Website Management & Go Live** choice. The misleading "Prepare / publish website" label has been removed.
- The native hosted viewer returns to the screen the customer entered from: editable preview, builder or website management. Repeated visits always request a freshly authorised signed private URL and never grant publication.
- Hide the developer-facing generated source status from the customer’s editor preview. Detailed diagnostics remain available in Website Management's advanced section.

## Safeguards
- The existing signed private HTML preview is restricted to the authenticated business's exact deployment.
- Viewing does not publish, charge, connect a domain or alter the deployment. Go Live still requires a separate exact-preview review confirmation and publication approval.

## Test plan
The V3.97 navigation regression verifies both main entry points, consistent back labels, explicit old-preview warning, preserved signed HTML checks and separate publication gate. Full repository checks must pass, followed by Expo native JavaScript compilation and iPhone acceptance.

**iPhone acceptance:** open hosted site, back to editable preview, reopen hosted site, back, edit draft, reopen old preview with warning, prepare updated preview, compare. Stop before Go Live. Confirm no accidental publication and no loss of the preview button.
