# Approval B1 — supported native Auth route for the fictional Lab owner

**Preparation only; no hosted Auth user, password, token, key or configuration was created/read by this review.** The approved foundation is on Busy Does It AI Lab `sbvkrvksnruiclcvclbd`, organisation `wrjfgasxtlznzfzmfrif`, Ireland `eu-west-1`. Current root-owned read-only verification remains authoritative for actual project state.

## Finding and smallest secure route

Use the owner's existing authenticated **Supabase Dashboard → Busy Does It AI Lab → Authentication → Users → Add user → Create new user** after separate explicit B1 approval. The current official Studio implementation has a distinct Create User form, an explicit Auto confirm user checkbox and a password field. Its source states that this form does not send a confirmation email. It is separate from Send invitation.

This route avoids introducing an Auth administration server, deploying an Edge Function, transferring a service-role key to Codex or weakening public signup settings. The existing Supabase MCP integration does not expose Auth-admin create-user, Auth-admin update-user or secure server-credential-binding operations. OAuth access to SQL/project management does not confer authority to forge an Auth session or insert Auth rows.

The supported programmatic alternative is the official server-only `supabase.auth.admin.createUser` API with `email_confirm:true`. It requires separately secured native Auth administration credentials and an approved server environment. Those bindings are not established here and are unnecessary if the owner uses Dashboard. Do not ask for a key/password/token in chat or execute undocumented Management API endpoints through a workaround.

## Exact proposed B1 action

| Field | Exact proposed value/boundary |
|---|---|
| Project | Busy Does It AI Lab, `sbvkrvksnruiclcvclbd` only |
| Organisation/region | `wrjfgasxtlznzfzmfrif` / accepted Ireland `eu-west-1` |
| New users | Exactly one native, non-anonymous email/password user |
| Laboratory identifier | `quiet-light-owner@busy-ai-lab.invalid` |
| Confirmation | Auto confirm user explicitly checked; no confirmation/invitation email |
| Password | Generated and retained privately by the owner in an approved password manager; never supplied to Codex/chat/Git/artifacts |
| Native role | Original ordinary `authenticated` Auth role; no service/admin role or privileged custom claims |
| Metadata | None required; user_metadata is never business membership/authorisation |
| Account purpose | Fictional laboratory owner; confirmation is an administrative test state, not proof of a real mailbox |
| Application records | None in B1; no business, membership, profile, draft or budget allocation |
| Other actions | No sign-up, invitation, OTP, magic link, recovery, email delivery, provider call, deployment, publication or global Auth-setting change |

Recommended owner flow after approval:

1. Open [the exact Lab Auth Users page](https://supabase.com/dashboard/project/sbvkrvksnruiclcvclbd/auth/users); independently confirm the project name/reference before opening Add user.
2. Select **Create new user**, not Send invitation. Confirm the form's no-confirmation-email notice and Auto confirm user checkbox. If that route/notice/permission differs from the reviewed source, stop and report; do not substitute signup or change Auth settings.
3. Enter only the fictional identifier above and an owner-held strong random password. Keep the password field masked and do not capture it in a screenshot, terminal command, report or chat. Leave Auto confirm user checked.
4. Submit once. Preserve a safe acknowledgement/UUID only. If the UI acknowledgement is missing or uncertain, stop; Codex should inspect the allowed native identity metadata read-only before any retry.
5. Independently read back the genuine native UUID and state. Do not supply a preselected fixture UUID. If a user with this identifier already exists unexpectedly, stop rather than overwrite, recreate, reset its password or reuse it silently.
6. Bind that real verified UUID into the separately reviewed canonical business/membership setup; regenerate its exact fused/execution hashes and submit that B2 request for approval before creating business records.

The proposed `.invalid` identifier is syntactically email-shaped and intentionally non-delivering. The reviewed native validation function performs bounded email-format validation; no hosted acceptance test was run. If the actual service rejects this reserved-domain identifier or native policy prevents creation, stop. There is no authority to substitute an external mailbox, disable validation or send an invitation.

## Permitted independent verification evidence

After separately approved creation, retrieve only the necessary synthetic identity metadata:

- actual native user UUID, exact proposed laboratory email, creation timestamp;
- `email_confirmed_at` present; ordinary `authenticated` role and audience;
- `is_anonymous=false`, no deletion, no active ban;
- one corresponding native email identity with the same user UUID/provider;
- exact project provenance and total Auth user count consistent with one approved user.

Never read/export password hashes, token strings, session refresh/access credentials, recovery/confirmation tokens, raw provider identities, other users' records or whole auth.users rows. Store only an allowlisted technical receipt. A later real native password sign-in must occur in the owner's trusted browser/application or another separately approved credential-isolated execution path. SQL `request.jwt.claim.sub` fixtures and a selected UUID do not prove hosted authentication.

Original canonical business ownership must be established by `busy_business_memberships`, not user-editable metadata or a fabricated JWT. B1 does not enable AI admission: the original policy must remain disabled with hard limit zero, and no tariff/account/operation is created.

## Fresh official evidence and limits

Reviewed on6November2026 through read-only public documentation/source access:

| Evidence | What was independently observed |
|---|---|
| [JavaScript createUser reference](https://supabase.com/docs/reference/javascript/auth-admin-createuser) | Server-only administration and supported `email_confirm:true` field |
| [Studio CreateUserModal.tsx, pinned commit396358c7](https://github.com/supabase/supabase/blob/396358c7cbccf998df72a7d225d0c7c32b73ce57/apps/studio/components/interfaces/Auth/Users/CreateUserModal.tsx) | Required project Auth-user-write permission, masked password, default/explicit auto-confirm and no-confirmation-email form notice |
| [Studio AddUserDropdown.tsx, same pinned commit](https://github.com/supabase/supabase/blob/396358c7cbccf998df72a7d225d0c7c32b73ce57/apps/studio/components/interfaces/Auth/Users/AddUserDropdown.tsx) | Separate Create new user and Send invitation choices |
| [Studio native user-create mutation, same pinned commit](https://github.com/supabase/supabase/blob/396358c7cbccf998df72a7d225d0c7c32b73ce57/apps/studio/data/auth/user-create-mutation.ts) | Project-ref-scoped platform Auth create request, explicit `email_confirm` mapping; not public signup/invite |
| [Native Auth admin.go, pinned commitbfbe078c](https://github.com/supabase/auth/blob/bfbe078ce0061e18bb4716beab63316d06efe119/internal/api/admin.go) | `adminUserCreate` creates native user/identity and audit record in one database transaction; `email_confirm` invokes native confirmation; this creation method contains no mail-send invocation |
| [Native email-format validator, same pinned Auth commit](https://github.com/supabase/auth/blob/bfbe078ce0061e18bb4716beab63316d06efe119/internal/api/mail.go) | Non-empty/length/format validation and normalisation; no reason to infer mailbox ownership |
| [Current Supabase changelog](https://supabase.com/changelog) | Latest relevant6November Flutter and4November CLI changes do not replace the Dashboard/native API route; no CLI mutation is proposed |

The requested changelog Markdown index could not be fetched because the read-only web tool rejects its content type; the current HTML changelog was inspected instead. Public Studio/Auth source is version-pinned evidence of a supported route, **not proof of the Lab's deployed Auth binary, the owner's current UI permissions, successful user creation or actual no-email hosted execution**. Those remain pre-execution/independent readback checks.

No Auth administration tool was found among all31 currently exposed Supabase MCP operations. No key-list tool, key discovery, credential read, Auth-table write, environment-variable dump or hosted Auth endpoint was used by this reviewer.

## Exact next authorisation

**Approve B1 only:** allow the owner to create the one fictional confirmed user above through the exact Lab Dashboard Create new user flow, with the password kept privately by the owner and no email sent. Permit independent allowlisted readback of its real native UUID/state. This approval would not cover canonical business/profile/Website records, Edge deployment, secret configuration, inference, spending or publication.

B2 remains a separate exact artifact decision once that genuine UUID exists. Any uncertain outcome is read-only investigation, never automatic retry, repair or deletion. Deleting an Auth user is not proposed as rollback and is not implied by an error.

This avoids more provider/onboarding infrastructure: one native owner action, one verified UUID, then the existing canonical source setup and original Studio path.
