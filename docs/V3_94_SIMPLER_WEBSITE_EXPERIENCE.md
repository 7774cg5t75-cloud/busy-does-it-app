# V3.94 — Customer-first website experience

## The issue observed on iPhone
The website builder/management route exposed hundreds of lines of launch, DNS, Cloudflare, subscription, worker-queue, lead capture and performance diagnostics to ordinary customers. On a mobile screen this created a very long, technical journey; forms could hold the iOS keyboard open as the user scrolled.

## Changed in V3.94
- Website Builder: a short, understandable summary; direct next step, voice-first creation/editing, draft preview; structure, SEO and generated artefacts are now opened under “More website settings.”
- Website Management: a short summary of what is actually ready, a preview-first route, preserved explicit review-and-approve Go Live controls, and clear separation of recorded publication from independently verified public HTTPS availability.
- Optional custom-domain setup, private customer enquiries and the manual lead form have their own expansion controls. Technical hosting, diagnostics, provider costs, version history and automatic-recovery details start collapsed. They remain available rather than being removed.
- When switching between sections, dismiss the keyboard so old form focus does not obscure the next task.
- No new external hosting credentials or DNS changes, customer site publication, billing subscriptions or customer communications were triggered by this version.

## Release safety
- Exact hosted preview must be opened and explicitly reviewed before the existing customer Go Live approval can be invoked.
- An existing public deployment record does not become verified merely because a previous health flag says 'healthy'. The independent V3.93 checks still control verified state.
- The business's ability to review its own enquiries remains tenant-isolated on the server. Collapsing forms is a display improvement, not a substitute for authorisation.

## Evidence and next checks
- Production foundation, release and regression tests pass, including V3.94 UI disclosure/approval static checks and V3.93 delivery truth tests.
- A native iOS preview build must be completed and checked on a registered iPhone. Automated checks do not prove the final visual layout or keyboard interactions.
- Follow-up UX work: relocate founder-only infrastructure monitoring out of customer website journeys, shorten dense diagnostic language further, and carry out genuine hosted-website and business-app end-to-end acceptance checks with owner consent before any real public deployment.
