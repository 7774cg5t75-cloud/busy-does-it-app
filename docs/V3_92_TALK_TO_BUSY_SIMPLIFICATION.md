# V3.92 — Talk to BUSY, simplified

## Why this sweep
The V3.91 real iPhone test produced a successful natural-language response to a spoken request after fixing native multipart audio upload. However, the Talk page placed a lengthy **Current conversation** card above the microphone and put the newest result below the typing box and six suggested commands. On Medium Display Zoom, this made both the primary microphone and BUSY's answer hard to find.

## Customer-first arrangement
1. **Talk to BUSY** header: short and in plain language; no technical or development-version brand cue.
2. **Microphone first**: same recording start/stop and upload logic as V3.91; less vertical padding and a slightly smaller target that remains comfortably tappable at 96px.
3. **Immediate result**: the newest answer, draft, question, proposed record change or multi-step plan appears directly below the microphone, before typing or historical cards. Any action that requires user approval keeps its preview and confirmation button.
4. **Type to BUSY instead**: always available after the current answer and remains fully functional.
5. **Suggested questions**: closed by default; all six existing read-only prompts remain.
6. **Earlier conversation**: closed by default; existing context turns and fresh-conversation action remain available. When no active result exists, a short excerpt of the previous assistant reply is visible.
7. **Undo**: remains available after the current answer and typing, outside the advanced fold.
8. **More details & history**: closed by default; preserves explanation of BUSY's authority limits, action audit, and past history.
9. **Safety**: a short notice sits beside the microphone; server error messages still appear directly under it; confirmation gates for customer changes and outbound publishing are unchanged.

## Acceptance on the native build
- Under **Medium Display Zoom**, Home > Talk to BUSY shows the microphone immediately without an enormous previous-conversation card.
- After a harmless spoken read-only question, the new answer appears above the typing box without extra scrolling.
- Typed mode, stop/send microphone, and speech processing still work.
- If BUSY requests approval for a record change, the preview and confirmation are clearly visible; no change is made prematurely.
- Expand each collapsed group and verify suggested questions, older conversation, and audit history can be reached; close each again.
- Check that **Undo last BUSY change** is still reachable whenever a reversible internal action exists.
- Try larger text or iPhone Display Zoom; long text should wrap rather than be clipped.

## Next engineering priority after acceptance
**Website & Business App end-to-end release verification**. Use controlled test business identities and confirm create -> preview -> owner approval -> independent public visit -> enquiry/booking request -> update -> recovery. Verify actual hosting/provider configuration before any real publication. No paid staging infrastructure or public domain changes without explicit user agreement. Automated release modelling alone does not establish end-to-end production readiness.
