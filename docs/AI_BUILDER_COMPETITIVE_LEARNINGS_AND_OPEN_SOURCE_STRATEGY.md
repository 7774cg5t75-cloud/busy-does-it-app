# Busy Does It — AI Builder Competitive Learnings & Open-Source Integration Strategy

**Recorded:** 14 October 2026  
**Status:** Permanent product and engineering direction; research and future architecture, **not a claim of implemented or production-ready features**.  
**Scope:** Universal Website Builder, Business App Builder (marketplace mini-apps and standalone apps), Business Brain, Brand DNA, customer experience and automated quality.  
**Parent policy:** [../ARCHITECTURE.md](../ARCHITECTURE.md).

## North star and permanent policy

> You tell Busy what needs doing. Busy does it — properly, with evidence the job is finished.

Build professional websites and apps for **any legitimate industry** from plain-language owner intent, using reusable real capabilities rather than restrictive industry templates. Owner sees exceptional simplicity; Busy handles the complicated planning, design, implementation, verification and maintenance.

**Preserve and extend prior investment.** Prefer, in order: (1) reuse and improve existing Busy modules; (2) integrate appropriately licensed, audited, maintained third-party components through narrow adapters where they fill a real gap; (3) build a new component only if necessary; (4) replace existing functionality only after measured proof of better quality, reliability, portability, accessibility and total ownership cost. Avoid duplicate editing engines, business records, workflow engines, incompatible schemas and uncontrolled rewriting.

Treat competitor capabilities as **product design references, not permission to copy proprietary code, UX assets, graphics or protected content**. Evaluate both engineering feasibility and user benefit.

## Competitive ideas to learn from (not claims of verified real-world performance)

| Reference | Valuable product pattern | Busy adaptation |
|---|---|---|
| Wix Harmony / Aria | AI generation and natural-language editing of selected elements and custom widgets | A selected-element toolbar with mic/typed request; contextual edits, custom interactive components and owner-reviewed previews |
| Squarespace Blueprint AI | Coherent, tailored initial website design with sparse business facts | Professional distinctive multi-page first drafts grounded in actual business facts and approved assets |
| Framer Wireframer / Workshop | Responsive composition and custom components | Broader layout families, richer structure, responsive intelligent component assembly |
| Adalo / Ada | App screens connected to data, auth, workflows and native distribution | Functional customer journeys and dependable iOS/Android delivery, not mere app mock-ups |
| Lovable | Full-stack creation, portability and pre-publication safety checks | Structured backend generation, versioned source/export and security gates with owner control |
| Replit Agent | Executable app/browser testing and recoverable checkpoints | Safe automatic checks, screenshot review, private-draft repairs and rollback |
| Base44 | App generation with backend, database, auth and security rules | Reusable server-owned capabilities with tenant-scoped data and security verification |
| Shopify Sidekick | Creation of practical business-management mini-apps | Owner/internal apps (inventory, CRM, reporting, workflow) as well as customer-facing apps |
| 10Web | Assisted reconstruction/redesign from existing websites | Owner-authorized content/site import, redesign and SEO-preserving migration |
| Glide | Building apps from existing structured data | CSV/spreadsheet and approved data-source intake with mapping and validation |

Validate individual product claims from current official documentation before depending on any specific API; comparison is directional, not an endorsement or assertion of parity.

## Permanent builder capabilities to pursue

1. **Universal intent-to-capability planning:** Interpret broad or unusual business requests; combine reusable capability contracts (bookings, calendars, deposits, payments, service requests, e-commerce, uploads, membership, tickets, loyalty, internal tools, etc.). Classify each as **available and independently verified**, **configured but unverified**, **guarded**, or **not yet implemented**. Do not invent working functionality. Expand the existing 27-contract V3.210 catalogue instead of building a competing planner.
2. **Distinctive multi-screen design:** Generate diverse business-appropriate site/app structures; use real approved assets and Brand DNA; evaluate desktop, tablet and mobile responsive screenshots, accessibility, legibility, customer journeys and changes against the original. No universal fixed template or ungrounded claim of conversion improvement.
3. **Element and page-wide AI editing:** Selected element highlight + compact mic/typed toolbar, intuitive start/stop recording, consistent interaction across images, sections, buttons, text, pages and app screens. AI understands context, dependencies, brand and target scope. Private previews, granular review, version freshness, undo/redo and owner-controlled publication remain mandatory.
4. **Custom components and functionality:** Compose existing safe components first; where a request exceeds existing parts, plan versioned custom components and their actual dependencies. Sandboxed rendering, accessibility, security review, performance checks and server-owned capabilities required. A visual widget does not imply an authenticated live booking or payment system.
5. **True full-stack app completion:** Connect app screens to authorized business data, authentication, guest safety, notifications, reliable enquiries/booking requests, independently confirmed appointments, payments and provider integrations. Preserve marketplace mini-app **and** optional standalone export/publishing tracks. Clearly expose required third-party accounts, approval, store fees and external charges.
6. **Verified autonomous quality:** Reuse Playwright and existing build/test infrastructure for real browser journeys, keyboard/touch and mobile viewports, responsive screenshots, link and form checks, performance, accessibility, security, tenant isolation, failure/retry and rollback. Test outcomes at the authoritative server/provider boundary. Only safely repair private changes; request owner approval for consequential changes. Never equate simulated tests with real deployment or real provider delivery.
7. **Customer-owned migration and export:** Owner-authorized URL-based site import and approved CSV/structured data ingestion; preserve attribution/content rights, consent and privacy. Plan redirects, indexing, domain ownership, durable content/asset portability and clear limits for dynamic export. No copied competitor website without permission.
8. **After-build operations and continuous learning:** A website/app should connect to the Business Brain, Get More Customers, Get Paid, CRM, content and calendars. Capture verified outcomes and feedback; respect business isolation, consent and privacy, evaluate measured changes and suggest owner-approved improvements. No assertion of model self-retraining from normal usage.
9. **Business simplicity and commercial fairness:** Make the first usable result exceptionally easy; default to one clear next action with optional deeper detail. Show costs and credit usage before paid operations; preserve owner ownership, transparent third-party charges and portability.

## Open-source candidates — evaluate, do not install unreviewed

### Puck — https://github.com/puckeditor/puck
- **License:** MIT for the open-source core (verify exact version, NOTICE and dependencies before adoption).
- **Fit:** A modular visual editor for existing React **web** components, which can take registered blocks, structured props and page data. Potential for an embedded hosted Website Builder editor while Busy remains the design authority.
- **Advantages to trial:** custom Busy sections rendered as editable components, controlled fields, structured data, responsive viewport preview, extensibility.
- **Limitation:** This is not a drop-in native React Native/Expo screen editor or automatic server/backend app generator.

### GrapesJS — https://github.com/GrapesJS/grapesjs
- **License:** BSD 3-Clause for the open-source framework (verify exact package, plugins and any commercial Studio SDK terms separately).
- **Fit:** Flexible browser-based drag-and-drop HTML/component/styling editor, block ecosystem and styling controls.
- **Advantages to trial:** layout freedom, reusable blocks, component/asset editing, deeper visual controls.
- **Limitation:** HTML/CSS-oriented document model may be harder to preserve alongside Busy's own versioned semantic website schema and controlled renderer. Sanitize content and harden any iframe/HTML boundary.

**Selection policy:** First measure whether an open-source tool solves an actual gap in Busy's current editor. Compare **Puck vs GrapesJS vs continuing the current editor**. Evaluate proof-of-concept support for Busy-owned blocks and Brand DNA, iPhone/iPad touch and voice, hosted/web view in Expo, import/export round trips, deterministic undo/versioning, security, maintenance cost, accessibility, performance and project size. A clean spike should not modify the production renderer or publishing contract.

### Integration boundary (recommended approach)

```
Owner voice or typed intent + selection
                 |
     Busy Business Brain + Brand DNA
                 |
 Existing universal builder and capability contracts
                 |
  Owner-reviewed private versioned design schema
             /          \
    Hosted visual     Native app editor
    editor adapter    and runtime (existing)
  (Puck/GrapesJS?)           |
             \          /
       Existing approval / undo
                 |
  Existing website and app publishing services
                 |
  Independent browser/server/provider verification
```

- Treat third-party editors as **replaceable presentation/editing adapters**. They must not become a second system of record or control business membership, tenant auth, publication, credits, payment, or provider actions.
- Keep Busy-owned versioned semantic page/component IDs, approved business facts, owner overrides, Brand DNA, undo history, source revisions and publication gates authoritative.
- Translate adapter edits via an allowlisted, validated command layer; scope to tenant and draft; reject stale revisions and untrusted HTML/scripts/assets; apply policies server-side.
- No untrusted generated JavaScript executes with owner/customer account privileges. Introduce server-backed business functionality only through reviewed capabilities and proper authorization.
- Check component/dependency licenses, version pinning, provenance, update/security policy, bundle/performance and long-term export/ownership before integrating.

## Sequenced development plan

**Track A — Existing systems first:** Map current builder editor, sections, renderers, app modules, 27 capability contracts and revision/approval controls; identify *measured missing features*. Do not duplicate core systems.

**Track B — Cheap isolated editor comparison:** Prototype a limited editor with a handful of existing Busy components in a separate demo/sandbox. Compare Puck, GrapesJS and existing approach on touch/voice, responsive preview, round-trip fidelity, security, regression footprint, licence obligations and maintainability. Adopt only upon positive evidence.

**Track C — Bigger design and editing sweep:** Distinctive multi-page designs, responsive screenshots, custom element planning, unified selected-element voice editing and safe owner review/undo, gradually connecting a successful editor adapter only if selected.

**Track D — Make capabilities real:** Extend actual backend/service modules for complex customer journeys, shared Website/App data, bookings/enquiries, domain/migration and distribution. Enforce explicit "planned vs working vs verified" states.

**Track E — Autonomous testing and growth:** Playwright browser journey checks, security/accessibility/visual scoring, controlled repair, owner-approved publication and verified outcomes flowing back into the Business Brain and marketing recommendations.

**Release dependency:** The V3.219–V3.222 staging/CI findings take precedence over claiming new live functionality. Stage foundational schema **only after separately approved isolated-staging review**, real backup/restore and authenticated two-tenant RLS tests. Keep no unauthorized migrations, provider spending or production publication. No feature is declared fully delivered based solely on source tests or an attractive preview.

## Adoption decision checklist

- Does the candidate address an observable customer/editor problem that existing Busy code cannot efficiently handle?
- Can it integrate as an adapter without replacing Business Brain, Brand DNA, builder contracts or source-of-truth business data?
- Do we have licence compliance, maintained dependencies, safe sandbox boundaries, accessible/mobile touch UX and privacy protections?
- Do real side-by-side tests prove stronger results, simpler operation and lower lifetime cost?
- Are owner approvals, reliable undo, exports, test evidence and rollback at least as strong as before?
- Does this improve the practical outcome, not simply add feature count or a sophisticated-looking technology stack?

**Guiding principle:** Build fast. Build properly. Reuse intelligently. Improve continuously. New tooling should accelerate Busy's vision, never erase the valuable work already built.
