# Busy Does It — V3.206 Intelligent Customer Follow-Up & Verified Outcomes

**Base:** green V3.205. **Status:** code and offline test sweep; no staging schema changes, Edge Function deployment, outbound notifications, real customer activity, automatic marketing, background follow-up automation or customer data migration.

## 1. A practical next-action assistant for actual Business App requests

`src/core/ownerRequestFollowUpsV3206.mjs` reviews a **bounded authenticated owner-status snapshot**, pairing recent saved enquiries and booking requests with the real chronological sender roles of stored in-app messages. It ranks:

- **Needs reply** when a signed-in customer's saved request or latest reply has no later recorded business reply within a complete snapshot.
- **Waiting** when the business already sent the most recent stored reply, avoiding repeated and unnecessary chasing.
- **Manual review** for guest web requests (no in-app recipient), and for accepted booking requests whose linked diary confirmation needs separate checking.
- **Unknown** when message history is truncated, timestamps are missing/invalid/future-dated or incomplete.
- **Done or closed** when the request is declined or closed; no automatic reopening.

It considers **newer customer replies**, not only raw unread counters, and uses elapsed activity time for simple prioritisation. Priorities are suggested review order only, not obligations, service-level guarantees or timed automations. The sample is limited to 30 owner requests and up to 150 stored message checkpoints, and partial coverage is explicitly disclosed.

The proposed reply is deliberately generic, avoids fabricated pricing/availability/quotes, and never calls a customer action, paid service or push provider.

## 2. Repair a missing owner-status evidence connection

Previously the Edge owner status included `messageCheckpoints`, `messageDeliveryOutbox` and `pushGatewayEvidence`, but `AppController.applyMiniAppsStatus` dropped these when updating state. V3.206 preserves the individually checked arrays and gateway object. This makes the existing Business App outcome/intelligence modules and the new follow-up classifier capable of using the real authenticated evidence already returned.

The owner Edge message checkpoint selection now includes `created_at`, enabling an actual saved-message ordering decision. It still excludes customer message bodies, sender IDs, email addresses, phone numbers and customer names.

## 3. Visible next step, with the owner in control

The Business App management screen now offers a simple **Busy keeps an eye on enquiries** section. It shows the number of requests that may need a reply, those waiting after a business reply and those requiring manual review. For up to three high-priority requests, the owner can open the existing conversation directly.

Within the matching conversation, **Use as an editable draft** offers a short, accurate starting point. It never automatically sends or schedules the draft. If the owner has already typed a reply, Busy asks permission before replacing their unsent text. The existing authenticated, idempotent send action still requires a separate tap.

Guest web requests never receive in-app draft suggestions because their receipt cannot receive signed-in BUSY chat. Bookings are never described as confirmed simply because a request is accepted. This is review support, not an autonomous follow-up provider.

## 4. Measured Business Brain improvements and evidence limits

The next step is grounded in:
- matched business ID and app ID;
- real database request type/status and created timestamp;
- recorded incoming versus outgoing sender roles and timestamps;
- complete-enough message history for the chosen inference;
- an owner's explicit edit/send controls.

A saved outbound message moves a request from “needs reply” to “waiting” when a new owner-status readback confirms it is the latest entry. However, **a saved message is not external delivery or proof of being read**. This work adds a reusable bounded recommendation loop, not an automatically retrained model or cross-tenant learning.

## 5. Checks and remaining milestones

`scripts/check-owner-followups-v3206.mjs` exercises unanswered enquiry, booking request, replied/waiting customer, newer inbound after outbound, closed/declined status, guest request, accepted booking without confirmed diary proof, truncated or malformed messages, time anomalies, wrong tenant/app and exact controller/source wiring. V3.206 GitHub Actions also runs the V3.205 and earlier builder regressions, staging package/risk checks and all four unsigned iOS/Android exports.

These are code and mock/source checks, **not live authenticated staging verification**. The separate staging project still needs a manually approved Business App schema installation, independently tested JWT/RLS boundaries and real synthetic end-to-end customer requests, owner inbox replies and delivery receipts before release.

**Principle:** Busy spots the next useful owner action, prepares it safely, and can later recheck the real saved result without inventing customer contact, sales or finished appointments.
