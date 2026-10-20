# Company-domain launch status

Updated October 19, 2026.

## Released for review

- Vercel team: test11-689b; project: edti (prj_byUI2GTnYmG3e3UFsxVZkqK5paSj).
- Ready deployment: dpl_FcVX8B5P2jKzkqQ848TL34T2GmgA.
- Review address: https://edti.vercel.app.
- Source: reviewed local files uploaded through the Vercel API; based on Git bd10702 plus uncommitted approved changes. These new changes have not been pushed to GitHub. Reconcile the repository before subsequent Git-driven releases.
- Previous production deployment for rollback: dpl_4vLeik6xJQwx2vxbLZjRLfvwMweK.
- Build: node scripts/build-launch.mjs; output public/.

Eight standalone HTML pages preserve the shared approved layout. Each has a title, description, canonical, and social metadata. Navigation uses clean paths. A sitemap and robots file are generated. Old /podcast, /general-8, /newsletter, and /contact-3 addresses have permanent redirects; /events, /about, and /higher-education-series remain available. Previously shared hash links still resolve.

The unapproved partner-testimonial carousel is omitted from the published build, not deleted from the design source. No new legal page was published; the revised privacy policy and business confirmations remain separate work.

## Verified

- Nine automated tests passed for analytics consent, page output, guest-wall preservation, and redirects.
- Browser checks passed at 1440px and 390px for all eight pages, with no horizontal overflow or JavaScript exceptions. External requests were blocked in the structural browser checks; these checks do not certify every remote image or feed.
- Hosted checks returned 200 for all eight pages, sitemap, robots, and analytics asset; correct individual metadata was present.
- All four legacy redirects returned 308 to the intended destination.
- Hosted form API rejected an incomplete inquiry with 400. No real email was sent in this release test. Sharon confirmed receipt of an earlier test; the API implementation was not changed in this batch.
- Required email setting names are configured for production. RESEND_FROM_EMAIL is not configured for previews; do not mistake that preview difference for a production failure. Secret values were not decrypted.

## Domain switch pending

edtechinsiders.org still serves the Wix site. Neither the apex nor www has been attached to this Vercel project. Wix domain management requires user sign-in. Do not claim the company domain has switched.

Observed DNS before any changes (reconfirm in Wix and capture the full zone before editing):

- Nameservers: ns2.wixdns.net and ns3.wixdns.net.
- Apex A records: 185.230.63.171, 185.230.63.186, 185.230.63.107.
- www CNAME: cdn3.wixdns.net.

Before cutover: reconcile the source repository; add and verify www and apex on the existing Vercel project; obtain current domain-specific DNS instructions; preserve Google Workspace MX, SPF, DKIM, DMARC, verification records, and all unrelated DNS entries; change only website records. Keep Wix and the original DNS values available for rollback. Canonical preference is www, matching the existing public site's addresses.

After cutover: verify HTTPS for both hosts, apex-to-www forwarding, old URL redirects, production form delivery with a coordinated test, and analytics with consent. Submit the new sitemap in the team's Search Console account and preserve existing Wix analytics exports if available. These post-cutover tasks are not yet complete.

## Follow-up

Sharon or Ben can confirm sponsor/attendee information sharing. Retention practices, provider-account transfer arrangements, privacy request ownership/address, and applicable privacy requirements remain unconfirmed. Publishing the website is not a certification of compliance. Newsletter freshness, events syncing, and final case-study/testimonial content remain their existing QA workstreams.
