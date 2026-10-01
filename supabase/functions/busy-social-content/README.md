# BUSY Social Content Edge Function

Server-side image understanding for V3.3's Social Media Centre.

The function accepts only photos explicitly selected by the owner, uses the existing server-side `OPENAI_API_KEY`, and returns a strict structured result containing:

- likely content story (including a before/after pair when genuinely supported)
- detected service
- privacy warnings
- three distinct organic caption options
- suggested Facebook / Instagram / Google Business destinations

The function deliberately avoids customer names, addresses, phone numbers, registration plates and invented claims in captions. The mobile app still owns the approval boundary: generation never means publishing.
