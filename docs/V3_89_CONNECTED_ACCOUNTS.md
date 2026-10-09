# V3.89 — Simpler Connected Accounts

## Goal
Show whether a real service is connected without making subscribers read implementation details. Keep the existing authentication, provider authorisation, account-selection and controlled publishing functionality intact.

## Everyday customer view
- Signed-in BUSY account is shown as a short status rather than a technical session report. Sign-in and password recovery remain available when signed out.
- Real Facebook & Instagram and Google Business provider states are read from the existing server-returned connection objects. States are **Connected**, **Not connected**, **Choose an account**, **Needs attention**, **Checking…** or **Setup required**; these are not guesses based on a local toggle.
- Genuine provider Connect actions remain available only when configured. Choose-page/location steps and error messages remain visible. **Manage connection** reveals additional provider details, API verification and Disconnect where available.
- **Refresh connection status** and **Open Social Media** are accessible without opening technical sections.
- **Other services & demos** starts closed. Prototype switches are explicitly labelled **Try demo** / **Clear demo**, and no longer pretend to connect a real inbox, calendar, CRM, invoicing or advertising provider.
- **Advanced connection details** starts closed. It contains the original owner verification diagnostics, publishing status and controlled live test switch, Google developer setup/approval guidance, OAuth information, and the original safety explanation. We do not remove or alter provider tokens or backend functions.
- The phone display must stay readable with Standard, Medium Display Zoom, maximum zoom, larger text and long account names.

## Safety
No change to Supabase credentials, publisher workflows, provider OAuth routes, approval rules, permissions, database migrations, subscriber billing or hosted websites. Real connection status is sourced from `socialPublishingStatus.connections`. No public posting or provider authorisation begins when the screen merely opens; it refreshes status as before. Publishing controls retain their existing confirmation flow.

## Acceptance
1. Confirm V3.89 opens with provider status and does not show developer diagnostics by default.
2. Verify connected Meta still displays the saved page, while unconfigured Google is clearly not connected.
3. Try Manage connection, then Hide account details, without disconnecting a working connection.
4. Check that selecting demos never claims a live connection.
5. Open and close Advanced connection details; the publishing test switch and safety details must remain accessible.
6. Check sign-out and a separate business sign-in (without publishing anything).
7. Test all of these at Medium Display Zoom and larger font sizes, including long account names and errors.
8. Don't equate this interface change with production readiness or Google approval.

App version: 3.89.0, iOS build number 9. Native iPhone acceptance required before marking complete.
