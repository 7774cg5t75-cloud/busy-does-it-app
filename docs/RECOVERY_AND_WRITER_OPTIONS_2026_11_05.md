# Recovery and writer-window decision — 5 November 2026

Read-only investigation plus a small independent, locally tested Website conversation change. **No backup/export/restore, hosted SQL, service suspension, credential change, project creation, deployment, provider request or spend has been performed.** Existing conditional Approval A remains restricted to pnjdlogwegnqbsfpcofw and the exact f790872f4e3177f47bb617eff24a2940b629979a installation proposal. Its SHA256 cdb1303f705a5768e098297699392317d0db8913b759d2f3f773ff0b29c93b91 and retaining-rollback SHA256743e57d170b92bd54f89294bd8ceac74e0308bc3ba1e60f41da8ab3f4ddad7cf are unchanged; fuses remain intact. Rollback execution is not approved.

## Concrete writer discovery

Read-only GitHub enumeration found three connected repositories: the Busy app, Slow-roast-website-, and private masters. Private master contents were not searched. Both code repositories report no code-search index, explaining why an empty/incomplete code search was not evidence of absence. The app default main branch is old; inspection therefore included the actual development worktree and paginated branch metadata.

A specific source was found on `site/secure-contact-waitlist-20261101`, commit **60329024c3f6b3318c194758c429a03564ded3a2**:

* `sites/busy-headquarters/functions/api/early-access.js` calls the original waitlist insert/pending-refresh helper.
* `functions/api/confirm.js` PATCHes confirmed status, confirmation/update timestamps and token fields. Confirmation GET does not perform confirmation; POST does.
* `_shared.js` targets `/rest/v1/busy_marketing_waitlist` using server-only `SUPABASE_URL` / `SUPABASE_SECRET_KEY` bindings and the existing shared readiness gate, including `MARKETING_FORMS_ENABLED`.
* The schema proposal at `sites/busy-headquarters/schema/marketing_waitlist.sql` closely matches the observed table/sequence contract.

[Exact source](https://github.com/7774cg5t75-cloud/busy-does-it-app/tree/60329024c3f6b3318c194758c429a03564ded3a2/sites/busy-headquarters). GitHub check metadata confirms a successful **Cloudflare Pages** deployment of that commit to **busydoesit-preview**, completed2November18:41:48UTC, deployment26d5f27c-7aeb-4a76-8634-b15f0aec8777. It lists a commit-specific preview and the site-copy-and-colour-refresh alias. This proves that version was deployed; it does **not** prove it is the current production deployment or that its actual Supabase binding is pnjdlogwegnqbsfpcofw.

The missing narrow access is Cloudflare Pages read-only deployment/environment/binding metadata for this project: current deployment/source, environment, **non-secret SUPABASE_URL**, readiness flag values and secret binding names/types only. No secret values should be read. No Cloudflare account connector/outbound identity is configured here. The GitHub connector rejects its deployments endpoint; commit checks provide the deployment evidence above. No live form, confirmation link or mailer was invoked.

The connected Slow-roast website's script references a different Supabase project; it contains no waitlist target. This is not evidence that all other external writers are absent. No production project was accessed.

## Actual database write paths

Catalogue-only checks, with no customer/Auth records read:

| Path | Actual capability and consequence |
|---|---|
| PostgREST service-role callers | Waitlist INSERT/UPDATE and sequence USAGE/nextval; also TRUNCATE on both preserved tables. No direct canary INSERT/UPDATE/DELETE |
| postgres and provider supabase_admin | Privileged SQL can modify both tables and sequence; coordinate human/admin jobs, not just web forms |
| Auth admin deletion | Canary owner_id references auth.users ON DELETE CASCADE. Auth-service/admin user deletion can remove canary rows without a direct canary write grant |
| authenticator / supabase_realtime_admin | May assume service_role. This identifies a capability path, not evidence that Realtime is actually writing |
| anon / authenticated | No INSERT/UPDATE/DELETE/TRUNCATE or sequence writes on either target |
| Existing canary client code | Canary requests are GET; the repository also retains manual canary setup/seed SQL, not a deployed write service |

No deployed Edge Functions, user triggers on either table, public routines referencing either target, or pg_cron/pg_net extensions were found. The four retained edge-log events in the inspected5November window were not classified as the waitlist/canary REST routes; logs do not provide a complete inventory of key holders or direct SQL clients. They cannot prove no writer exists. Log queries returned aggregated metadata only: no headers, JWT/signature values, IPs, request bodies, customer fields or raw SQL statements.

## Least-disruptive quiet window, if retaining current staging

First confirm the live Pages deployment and its actual target, then inventory any other holders/jobs for that staging database. Do not revoke shared credentials or alter table ACLs as a workaround: that changes the reviewed baseline and can interrupt unrelated services.

A separately approved **W** action should use the existing forms maintenance gate on only the environments pointing to this staging project, preserve its exact original values, and pause any associated retry/cleanup/import jobs. The shared MARKETING_FORMS_ENABLED gate also affects contact handling; disclose that impact. Changing Pages bindings may require a reviewed redeployment before they take effect. Do not pretend an edited Dashboard variable necessarily updates an already deployed version. A gate/redeployment is not covered by Approval A and has not been done.

Also establish a moratorium on target-table SQL/sequence operations and deletion of referenced Auth users. Do not shut down managed Supabase services. Drain already admitted work; an idle moment is insufficient. The exact operator/service list, effective deployment version, start/end conditions and return-to-original settings must be reviewed before W. Reopening must restore only the explicitly approved prior legitimate state, never set a previously off flag to1.

Keep writers frozen from the final recovery point through the approved installation and independent verification. A backup taken before new writes resume is not a current-state copy for a later installation. The original5second lock timeout/120second statement timeout and AccessExclusive table locks remain defence in depth, not a substitute for controlling external sequence calls. Any guard error/contention means stop; rollback is still separately approved. After success or a safely aborted attempt, restore the specifically approved services/settings and check health without a real signup, email or confirmation. Do not reset sequences or replay uncertain submissions.

## Recovery choices and costs

The owner has confirmed there is **no approved private backup machine/environment**. The current Codex workspace, GitHub and unapproved storage must not receive database records. Therefore no logical export or actual-data restore rehearsal is permitted here.

| Choice | Practical requirements | Cost position | Assessment |
|---|---|---|---|
| Existing Supabase daily physical backup | Existing Pro plan verified through organization metadata; owner observed daily backups with Restore. Establish writers first, coordinate freeze around a newly completed managed backup, verify eligible backup/current-state coverage and procedure, remain frozen until installation accepted | Daily backups included in existing Pro plan; no additional backup purchase proposed | Keeps records within the existing provider. Still blocked by live binding/writer inventory and independently accessible backup metadata; scheduled time/completion cannot be guaranteed from the last timestamp. Window could exceed the short install itself |
| Existing PITR, if already enabled | Read-only verification of actual earliest/latest eligible recovery points and coverage; coordinated freeze | Existing entitlement/configuration unknown | Can be useful if already present; do not assume enabled or activate it |
| Newly enabled PITR | Separate spending/configuration approval and eligible compute | Published7day add-on about$100/month ($0.137/hour), plus at least Small compute; current compute/extra charges unverified | Disproportionate merely to unblock one£0.10 fictional experiment; not recommended as the default |
| Private PG17 logical recovery set | Explicitly approved private destination, securely bound DB connection, dependency-complete data/schema/sequence/owner/RLS/ACL/default/event-hook capture, encrypted storage and actual isolated restore/validation | No infrastructure quote established; operator/tooling/storage requirements remain | Not available now because no private destination is approved. Not satisfied by schema-only output, archive listing, checksum alone or mocked Auth rows |
| A new **empty** fictional pilot project | Separate project/cost approval, native Postgres17 verification, original fresh foundation reviewed for the new target, fictional Auth/business/source under its own approval, disabled deployment and later exact inference approval | In the existing Pro organization, published Micro$0.01344/hour (about$10/month), before taxes/other usage; additional compute not covered by Spend Cap. Shared$10organization credit is not a new credit per project. Exact account quote not yet obtained | Safest operational route for the fictional AI experiment: existing waitlist/canary, unknown writers and customer recovery remain untouched |
| Empty project in an approved Free organization | Free quota and organization choice must be verified; no mixing a Free project into this Pro organization | Potential$0 infrastructure if eligible; not verified. Free plan has different backup/pausing limits | Check eligibility before assuming free availability. Do not create an organization/project or transfer existing projects |

Official sources checked5November: [backups and PITR](https://supabase.com/docs/guides/platform/backups), [compute rates](https://supabase.com/docs/guides/platform/manage-your-usage/compute), [billing/free quota](https://supabase.com/docs/guides/platform/billing-faq), [dump defaults](https://supabase.com/docs/reference/cli/supabase-db-dump), [supported restore guidance](https://supabase.com/docs/guides/self-hosting/restore-from-platform). These are published rates, not a final account-specific creation quote or an all-in GBP quote. A new project's infrastructure cost is separate from the proposed£0.10 inference ceiling.

### Why a logical dump needs deliberate scope

The canary's genuine auth.users dependency must be retained or explicitly covered by a supported native recovery procedure. A public-schema-only dump plus fabricated Auth IDs does not establish recovery of real identity relationships. Supabase's CLI defaults omit data/custom roles and exclude managed schemas such as Auth/Storage; raw full pg_dump can include provider internals/Vault and fail when restored on plain PG17. Neither blind command is an adequate validated backup.

If a private environment is approved later, first fix the exact supported preservation-recovery scope and dependencies without exposing records. Capture data, identity sequence state, constraints, policies, ACLs/owners, role definitions without role passwords, default privileges, relevant extension versions, and the global RLS event trigger—not just tables. Explicitly exclude server/API credentials and unneeded secret stores. Privately restore the actual recovery set into a compatible, network-isolated PG17 environment with no Auth service, mailer, cron or provider execution; fail on every restore error. Compare private row/sequence fingerprints and full metadata, validate FK relationships and owner/foreign/anonymous permissions, and return only non-sensitive pass/fail evidence. Do not claim restorable until that succeeds. Exact commands and a recovery execution procedure need review once destination and supported scope are known. No current export/restore approval is inferred.

## Recommendation and next separate approvals

For the AI comparison, prefer a **new empty project containing fictional data only**, checking Free eligibility first or obtaining an exact quote for a short-lived Micro project in the selected existing organization. It must be a fresh project, **not a clone, backup restore, data-copy branch or migration of current staging records**. This is the same original canonical foundation and controller in an isolated test target, not a parallel production business/AI architecture.

No creation or spending is currently approved. Select the organization and obtain its actual creation quote before presenting exact creation/cost/retention/cleanup approval (current documentation says paid projects cannot be paused in place on Pro; no pause-based cost cap is promised). A new target requires narrowly reviewed server-only target binding, new foundation artifact/approval, native fictional identities/source revisions and new approval digests. Existing Approval A for pnjdlogwegnqbsfpcofw does not transfer. The existing API secret must not be read/exported/copied; any future new-target binding is an owner-controlled separate step. Publication, deployment, tools, retries, saves and paid inference remain off. Do not activate anything based on a successful project creation.

If the owner instead chooses the current staging installation, the next access needed is specifically read-only Cloudflare Pages deployment/binding metadata and backup/recovery inventory; then review W and the fresh managed-backup window. Existing A can proceed only when its original conditions are actually satisfied. No rollback execution has been approved.

## Independent Website progress

A local source-only change lets the existing finite menu refinement accept **“Please make our menu easier to find.”** and **“Can you make our menu easier to find?”**. It prepares the identical original protected review/operation plan, retains prior owner CTA/wording and refuses compound publication, pricing and messaging requests and missing menus. No new interpreter engine, styling, family, publication or automatic save was added. The original approved SQL files are unchanged.

Local checks passed: actual creative execution bootstrap with synthetic transports; source-grounded creative comparison; original guided three-business/component save/readback journey tests; syntax of the3changed files; diff whitespace checks. No database restoration or real provider activity occurred. No new browser run/full498regression is claimed for this local patch, and no aesthetic improvement is claimed: rendered plan output is unchanged. Previous f790 screenshots/CI remain evidence for that exact reviewed installation source, not a certification of this new patch. Three design-reference candidates and zero approved Gold Standards remain unchanged.
