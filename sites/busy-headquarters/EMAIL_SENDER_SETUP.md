# Busy Does It — dedicated automated email sender (DNS VERIFIED 1 November 2026)
Created in Resend EU region: notify.busydoesit.co.uk. Resend independently verified all four records and reports Sending: enabled, Receiving: disabled. This is a send-only subdomain; the existing Namecheap inbox remains hello@busydoesit.co.uk. Do not touch its root-domain MX, SPF, or DKIM records.

## Required Cloudflare records (at busydoesit.co.uk zone)

1. TXT / name `resend._domainkey.notify` / content:
`p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDmAQ1+4ouUXMsuDK7ohahBXpx/w754+cmzNPJTOnP3l0sd/5qtv0mK6B3fsUs4jKRl2hntcAe241wwsqRBY9jaX8f1eovumhwb48CaZ5jMnAhCVNObOX5aQr49JqS5LNh6GIGsfRH0Qua7iNea3OodyyCX89SNLWXmj/fqQiOUrQIDAQAB`
2. MX / name `send.notify` / priority 10 / mail server `feedback-smtp.eu-west-1.amazonses.com`
3. TXT / name `send.notify` / content `v=spf1 include:amazonses.com ~all`
4. CNAME / name `rsend.notify` / destination `send.forge.rmta.net` (DNS only, not proxied).

Set TTL Auto. Copy and verify exact records in Resend before deploying. Resend may update required records; the account dashboard is authoritative. DNS verified in Resend. Do not enable automatic website forms until service secrets, data retention, rate limits, legal notice, owner approval and end-to-end delivery tests are complete.

Expected sender after verification: `Busy Does It <updates@notify.busydoesit.co.uk>`.
Recipient for contact notifications: `hello@busydoesit.co.uk`, mailbox hosted at Namecheap.

*Remaining operator-only configuration*: bind Resend API key and Supabase service-role key as server-only Cloudflare Pages secrets; site Turnstile key/secret, rate-limit KV, host allowlist and public origin; strict Cloudflare WAF limits. Do not share secrets in chat/screenshots or put them in Git.

*Operational*: Draft UK privacy text must be approved, live messaging must be delivery-tested, and suppression / erasure handling must be established. Form switches are OFF by default, and real signups should not be claimed active yet.
