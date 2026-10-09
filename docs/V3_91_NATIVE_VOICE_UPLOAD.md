# V3.91 — Native iPhone voice upload

## Observed failure
On the V3.90 signed iPhone build, tapping Stop reached the command submission path but returned a generic client-side network error: "BUSY could not reach the server. Check your internet connection and try again." It was not a confirmed connectivity issue with the user's phone. Supabase returned no relevant function-name matches in the limited log filter, which does not prove the upload did not arrive.

## Likely failure boundary
V3.90 appended a React Native URI object (uri/name/type) to FormData for an m4a recording and submitted it using React Native's default fetch. A transport failure can occur while that multipart body is serialised, before a server response. The root cause is not yet independently proven.

## V3.91 implementation
- Install Expo SDK57-compatible expo-file-system. Use an Expo File object for the existing local m4a URI.
- Verify local recording exists and contains bytes before uploading; enforce the server's 10MB limit.
- Send the unchanged authenticated multipart fields via Expo's native **expo/fetch**, which explicitly supports File / Blob FormData upload.
- Keep the existing 45-second timeout and the existing Supabase busy-command handler. No server or authorization changes and **no automatic retry** that could duplicate a command or incur additional costs.
- Show an actionable client error that distinguishes an unsaved recording from a failed upload; keep all V3.90 recording progress messages.
- Keep the legacy React Native fetch path for other calls; update Expo Go SDK54 Snack dependency separately.
- Wire script/check-voice-upload-v391.mjs into GitHub production checks.

## Acceptance before calling voice functional
1. Wait for V3.91 native EAS build to say Succeeded, then install it on the registered iPhone.
2. Ask a read-only question verbally; Stop should show sending, then a returned transcript/result or a meaningful error.
3. Type a harmless request to compare whether the server is reachable for normal JSON commands.
4. Check that no external action or paid post occurs and no repeated requests are sent automatically.
5. Test after switching from Wi-Fi to mobile data if the error persists. Do not share user login details or recordings.
6. If native upload still fails, capture the error and inspect authenticated requests and Supabase logs using a fresh time-bound, narrowly scoped diagnostic.

GitHub source tests alone cannot verify physical microphone, connectivity, transcription credit or third-party service readiness.
