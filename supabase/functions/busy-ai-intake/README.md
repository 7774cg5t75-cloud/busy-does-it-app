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
- optional `OPENAI_INTAKE_MODEL` — defaults to `gpt-6-luna`

The prototype caller is checked against the project's Supabase publishable key. Publishable keys are client-safe identifiers, not secrets. Before production this must be replaced with real BUSY user authentication and abuse/rate controls.

## Mobile preview configuration

The app reads:

- `EXPO_PUBLIC_BUSY_AI_URL` — the full deployed Edge Function URL, for example `https://<project>.supabase.co/functions/v1/busy-ai-intake`
- `EXPO_PUBLIC_BUSY_AI_TOKEN` — the project's Supabase publishable key

The publish script can inject these values into generated Snack previews, and the V3.2 prototype also has the current project URL and publishable key as safe client-side fallbacks. Before production, replace publishable-key-only gating with real BUSY user authentication and server-side rate limits.

## Trust rules

The AI does not get final authority. The Edge Function independently forces `safeToAutoFile=false` unless critical identity/contact/service confidence is High, the overall extraction is High, no thread warnings exist, the screenshot order is not Low-confidence, and the batch contains only one conversation. The mobile app then applies its existing customer-match, lifecycle, duplicate and conflict rules on top.
