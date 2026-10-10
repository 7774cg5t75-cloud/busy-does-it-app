# V3.96 — Help customers brief BUSY before building a website

## Why this change was requested
A business owner can blame BUSY for a poor website when the original instruction lacked key facts or explained no desired outcome. BUSY should coach customers on what helps, without requiring prompt-engineering skills.

## Customer experience
- When the owner chooses **Build it by talking to BUSY** from Website Builder, Talk opens in a website-build context. Voice **does not** start automatically; the owner reads the brief guidance first.
- A compact **What should I tell BUSY about my website?** card suggests: what the business does, customers, service area, intended customer action (call, book, quote), style/colours, available images/logo/reviews and special features.
- A concrete, clearly labelled fictional gardening-business example demonstrates useful specificity. It is **never copied to real business records** or submitted automatically.
- **Let BUSY guide me step by step** prefills a truthful, non-factual request to ask about missing details and use previously confirmed business data without inventing facts. The user must tap **Ask BUSY** to submit.
- Editing an existing website gets a distinct short example suggesting exact changes and what to keep. All existing draft/preview/publication approval safeguards remain.
- General BUSY conversations have no website prompt card; launching a normal Talk session clears website mode. Existing business-creation conversations keep their own specific help.
- Website entry always clears a previous microphone auto-start nonce so a stale recording request cannot trigger on the guided page.

## Verification
The V3.96 regression suite checks placement before microphone and keyboard, correct context switching, no auto-record, example never submitted automatically, previous Talk/website preview behavior and exact release version. Production CI passed.

## Still to verify
Native iPhone: card legibility/size, typed starter insertion, voice recording only when tapped, BUSY follow-up quality, and no leakage into generic Talk. Static tests and JS bundle compilation do not substitute for this real-world acceptance.
