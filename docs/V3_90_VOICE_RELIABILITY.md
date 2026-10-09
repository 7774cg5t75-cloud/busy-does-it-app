# V3.90 — Talk to BUSY voice reliability (iPhone hotfix)

## Reported problem
On a signed native iPhone preview, the user tapped Talk to BUSY, spoke, tapped the square Stop icon, and experienced no visible response.

## What the code inspection found
- The recording screen's Stop handler returned immediately whenever expo-audio's *asynchronous* recorder-state hook had not yet updated to recording.
- Even when recording stopped and the server failed, `submitBusyCommand` caught the error and put it in `busyCommandError`, but the voice card itself gave no result and the error card was further down, below text input and common commands.
- The `busy-command` Supabase Edge Function receives multipart audio and routes through transcription and Operator classification; the service is deployed, but current code inspection cannot prove the user's actual recording reached it. **No root cause for any downstream transcription failure is asserted without device evidence.**

## V3.90 changes
- The Talk screen tracks recording start/stop independently of the delayed native recorder state; duplicate start/stop transitions are blocked.
- The microphone card now shows *Preparing microphone*, *Listening*, *Sending your recording*, success or an actionable error. Server command errors are also shown alongside the microphone.
- On denied microphone permission, missing audio file or failed transcription, the screen explains the problem immediately. There are no changes to audio permission scope, Supabase auth or operator access.
- Current typed-command flow and all confirmation gates for customer records, outbound messaging and publishing are unchanged.
- A focused regression script is wired into the production CI alongside existing checks.

## Device verification (not yet completed)
1. On the installed **V3.90** native build, tap Talk to BUSY. Verify iOS microphone permission if prompted.
2. Wait for **Listening**. Say a safe read-only request, such as *What day is it?*.
3. Tap the square once. It should immediately say **Sending your recording to BUSY**. Allow the command up to 45 seconds.
4. Confirm that a visible result or a useful error appears beside the microphone.
5. If it says no recording file or gives an authentication/transcription error, record the exact message for the next fix. Do not share passwords, login tokens or unrelated personal data.
6. Retry with a typed request. If typing works but audio fails, focus diagnosis on local recording or multipart upload; if both fail, examine Operator auth and Edge service.
7. Check Medium Display Zoom and standard size; don't scroll through unrelated reports just to find the error.
8. Confirm no external post, customer message, financial action or booking change occurs from this diagnostic request.

No claims of successful real voice interaction until the above iPhone acceptance passes.
