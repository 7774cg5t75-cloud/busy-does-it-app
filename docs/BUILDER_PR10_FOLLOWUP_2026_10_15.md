# PR #10 independent follow-up review and development

Preflight: supplied Product Master V22.18 (latest available, previously fully read; sections 26, 40, 43–47 and 50–53 rechecked), current architecture and development policy. Latest numbered branch remains v3.240. PR #10 is draft, open and mergeable at remote bfd9e1228cf7cf11222b2522f17e8e78edfc7384. Follow-up local branch preserves the original tested history. No merge, publication, paid provider, deployment, live database or production action is authorised or performed.

## Review sweep: reproduced defects and fixes

The original 91-script baseline reproduced 82 passes and nine existing child-process EPERM blocks. The actual PR patch and local code were inspected, including controller transport, Studio UI, copied Edge policies, standalone handoff and Website Preview measurements.

Seven previously missed cases were reproduced as assertion failures before fixing them: (1) full navigation permutation shifts a locked module; (2) moving an unlocked neighbour shifts a locked module; (3) moving another module first shifts a locked module; (4) a header alias fails to protect header style; (5) undo inserts presentation where it was absent; (6) undo inserts explicit defaults into an empty presentation; (7) candidate approval ignores a changed signed-in owner within the same business.

Lock checks now examine every displaced module and related appearance groups, including direct moves; the direct-move path now forwards direction into that check. Client and Edge use identical policy. A bounded `restore_appearance` operation restores the exact validated pre-edit appearance shape, including absence, while rejecting changed lock metadata, unsupported fields and changes affecting locked elements. It is an extension of the original owner-approved private CAS editor, not a new mutation endpoint. Source deployment must keep the client and Edge editor versions compatible; no deployment was performed here.

Website candidates also carry the signed-in owner into immediate render/apply gating, rather than relying only on a later effect clearing state. The owner is not exported in WebView metric keys.

Ten targeted review assertions now pass, including additional attempts to remove locks or smuggle unsupported properties via restore. The historical Studio test now asserts exact full original configuration restoration rather than requiring insertion of a default imageScale; this strengthens the undo contract. Inherited Studio, V3.239 website, V3.240 intelligence, new save/session, standalone parity and native/Edge parser checks pass.
