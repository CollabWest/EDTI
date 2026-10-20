# Edtech Insiders analytics

GA4 measurement ID: `G-FMB2NVFD51`  
Web stream: Edtech Insiders, `https://edtechinsiders.org`  
Stream ID: `16161003276`

## Status

Implemented and tested locally on October 19, 2026. Google settings were configured the same day in account Edtech Insiders Site (`412499805`), property Edtech Insiders (`559596981`). Not deployed or verified with live website traffic yet.

## Completed Google configuration

- Enhanced measurement is off, confirmed in the production web stream. The site's custom page and action tracking will supply the intended events without automatic history/form/outbound-link tracking alongside it.
- `generate_lead` is registered as a key event using the Create with code option. It counts once per event and has no default monetary value. No URL-based or automatic form-submit rule was created.
- Optional Google Analytics emails were declined for Alex's signed-in account, with the user's approval.

## Before production deployment

1. Keep Enhanced measurement off while using this custom integration. This avoids duplicate browser-history page views, automatic form interactions, and automatic collection of outbound URLs containing signup email addresses.
2. Preserve `generate_lead` as the inquiry key event. It represents a partnership inquiry only after the server confirms success. Do not use automatic `form_submit` as the inquiry conversion.
3. Review the site's privacy disclosures and ensure the team has appropriate GA account access. The consent banner is not a substitute for a complete privacy policy or legal review.

## After production deployment

- Verify on `edtechinsiders.org` or `www.edtechinsiders.org`: essential-only sends no Google Analytics requests; allowing analytics loads the tag; changing pages sends one page view per navigation.
- Check Realtime for those page views and a consented successful test partnership inquiry. Coordinate the test with Sharon; do not manufacture a submission without approval.
- Check that withdrawal stops subsequent events. Check newsletter, Insiders Plus, podcast, Market Map, and registration clicks.
- Confirm the report labels distinguish outbound clicks from completed subscriptions, payments, or event registrations. Those completions happen on other websites and are not measured here.
- Export any Wix historical reports needed for comparison. They do not become GA4 history automatically.

## Collection safeguards

- No Google tag is loaded before opt-in. A visitor can choose Essential only or Allow analytics, and reopen Cookie settings in the footer. Choices expire after 180 days.
- Collection is restricted to HTTPS on the two production `.org` hostnames. Local previews, `edti.vercel.app`, and other domains do not send data to this property, even after opt-in. Revisit the allowlist if the primary domain later changes to `.ai`.
- Advertising storage, advertising personalization, and Google Signals are disabled in this integration.
- Names, email addresses, company fields, inquiry messages, and complete outbound URLs are not sent by the custom event handlers. Page addresses drop arbitrary query parameters; only screened UTM attribution values are retained. Never place personal information in campaign names.

## Tracked actions

| Event | Meaning |
| --- | --- |
| `page_view` | Current page, including hash navigation and the standalone Higher Education Series page |
| `partnership_cta_click` | Click to Partnerships or the inquiry form |
| `form_start` | First interaction with a partnership form after consent |
| `generate_lead` | Partnership API confirms the inquiry succeeded; honeypot submissions excluded |
| `newsletter_signup_click` | Newsletter signup handoff, not a completed subscription |
| `plus_signup_click` | Insiders Plus signup handoff, not a completed membership |
| `podcast_click` / `podcast_play` | Listening link or first play of a native audio element |
| `event_registration_click` | Register-now handoff, not completed registration |
| `market_map_click` | Click to the external Market Map website |
| `higher_ed_series_click` | Click to the Higher Education Series page |
| `contact_email_click` | Email-link click, without the email address |

The browser code is in `assets/analytics.js`; regression tests are in `tests/analytics.test.cjs`. Third-party embedded players are not instrumented internally.
