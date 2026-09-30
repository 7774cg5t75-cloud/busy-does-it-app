# BUSY AI Intake backend

This folder contains the secure server-side half of V3.2's AI Intake Brain.

## What it does

`busy-ai-intake` accepts the screenshots deliberately selected in Quick Capture and sends them to OpenAI's Responses API for vision analysis. It returns structured JSON matching the V3.2 mobile app contract:

- reconstructed screenshot order
- duplicate/overlap count
- one or more conversation/customer threads
- deduplicated conversation text
- lifecycle stage
- structured customer/work fields
- field-by-field confidence
- warnings and a conservative automation flag

The OpenAI API key exists only in the server environment. It is never bundled into Expo/Snack.

## Required server secrets

- `OPENAI_API_KEY`
- `BUSY_DEMO_TOKEN` — prototype gate; useful for development but **not** a substitute for real per-user authentication in production
- optional `OPENAI_INTAKE_MODEL` — defaults to `gpt-6-luna`

## Mobile preview configuration

The app reads:

- `EXPO_PUBLIC_BUSY_AI_URL` — the full deployed Edge Function URL, for example `https://<project>.supabase.co/functions/v1/busy-ai-intake`
- `EXPO_PUBLIC_BUSY_AI_TOKEN` — must match `BUSY_DEMO_TOKEN`

The publish script injects these values into the generated Snack preview from GitHub Actions environment variables/secrets. The demo token is therefore **client-visible** by design and should only be used while prototyping. Before production, replace it with real BUSY user authentication and server-side rate limits.

## Trust rules

The AI does not get final authority. The Edge Function independently forces `safeToAutoFile=false` unless critical identity/contact/service confidence is High, the overall extraction is High, no thread warnings exist, the screenshot order is not Low-confidence, and the batch contains only one conversation. The mobile app then applies its existing customer-match, lifecycle, duplicate and conflict rules on top.
