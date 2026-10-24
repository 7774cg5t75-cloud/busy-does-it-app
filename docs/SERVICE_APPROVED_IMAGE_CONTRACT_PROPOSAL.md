# Service image association — prerequisite design, not an active feature

Current service rows allow only stable ID, name, description and bounded category/price/duration labels. Approved business media is selected from profile hero/gallery entries; existing product/event permissions match an approved URI and recheck it at publication. That is useful precedent, not a stable service-to-asset relationship. No schema, validator bypass or inferred gallery association is introduced here.

A separately reviewed implementation should:

1. Establish canonical stable asset IDs and explicit same-business ownership in the existing media authority. A URI is transport metadata, not durable identity. Define replacement, revocation and removal semantics first; do not silently transfer an association to a different photo at the same URL.
2. Add a finite optional service/asset reference through the existing owner-only service-edit contract, not a new request engine. Resolve both service and approved asset within the authenticated business, bind the draft revision, require original owner review/CAS and respect service/photo locks. Reject unapproved, missing, foreign or ambiguous assets. The exact inverse restores the old association only if it remains authorised; otherwise require a fresh safe review.
3. Recheck approval at publication and public projection. Project only approved public image metadata, never private storage paths or credentials. A revoked/replaced asset must fall back to an image-free card rather than select another gallery entry. Define how already published and exported copies are invalidated; static exports cannot promise immediate remote revocation without an explicit supported mechanism.
4. Use the same finite framing helper in marketplace and standalone, package its dependencies and preserve service/action/version identity. Image loading failure must leave the original text and request actions usable. No availability, checkout or appointment evidence derives from imagery.
5. Test foreign asset/service IDs, revoked approval between preview and save/publication, CAS conflicts, replacement/removal, safe inverse, public readback, export dependencies and action preservation before separately approved rollout. If canonical durable asset identity requires schema work, prepare migrations/RLS for owner review and do not install them without approval.

No approved service image capability is operational as a result of this proposal. Current text-only service cards remain the safe fallback.
