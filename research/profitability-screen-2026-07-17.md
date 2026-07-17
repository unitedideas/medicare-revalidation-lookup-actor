# Medicare revalidation Actor profitability screen — 2026-07-17

## Decision

Keep and strengthen this idea for a measured marketplace test. Do not declare it profitable yet.

The Actor is the strongest current no-spend route because it already has one non-owner free user, runs inside a marketplace with built-in pay-per-event billing, requires no customer credential, and can fulfill every purchased result automatically. The owned-site and MCP routes currently have no verified external Medicare use.

## Problem value

- CMS requires periodic Medicare enrollment revalidation and says providers remain responsible for tracking their due dates.
- CMS warns that late revalidation can lead to held reimbursement or deactivated Medicare billing privileges.
- CMS publishes established due dates only six to seven months ahead, creating a recurring roster-checking job.
- Broader credentialing products currently advertise prices from $225 per application and $364 per month. Those are market-value anchors, not direct conversion evidence for this narrower tool.

Primary sources:

- https://data.cms.gov/tools/medicare-revalidation-list
- https://www.hhs.gov/guidance/document/provider-enrollment-and-certification-revalidations-renewing-your-enrollment
- https://docs.apify.com/actors/publishing/monetize/pay-per-event
- https://docs.apify.com/actors/running/schedules

Current pricing references:

- https://practiapp.com/
- https://www.credentialingnow.com/pricing

## Current evidence

- Public Actor: 2 total users, 2 total runs, 1 user in the last 30 days.
- Authenticated monetization receipt: 1 free user, 0 paying users, 2 results, $0 profit.
- Price: $0.01 per NPI result; platform usage is paid by the buyer.
- No exact dedicated revalidation competitor appeared in the first live Apify Store results for the current search, while broader CMS and NPI actors show repeat marketplace usage.

## Unit economics

Apify documents creator profit for pay-per-event actors as 80% of event revenue minus platform costs. This Actor passes platform usage to the buyer.

- 1 NPI: $0.01 revenue, approximately $0.008 creator profit.
- 20 NPIs: $0.20 revenue, approximately $0.16 creator profit.
- 100 NPIs: $1.00 revenue, approximately $0.80 creator profit.
- One 100-NPI monthly task: approximately $9.60 creator profit per year.

This is a low-ticket acquisition product, not the final revenue ceiling. Its role is to create paid marketplace proof and route larger rosters or email-alert needs to the $9-per-month Roster Watch offer.

## Product change selected

The private saved-roster comparison mode is live. The next selected change is to join the current revalidation list with the quarterly Medicare Fee-For-Service Public Provider Enrollment file in every paid result:

- the Actor keeps its exact-intent revalidation title and $0.01 result price;
- each result answers both public enrollment-file presence and revalidation timing;
- later fully funded runs classify changes in either public source;
- each source file name, revision, modification time, and row count remain attached;
- the PPEF quarterly, point-in-time, multiple-NPI, and no-live-PECOS limitations appear before the buyer interprets a no-match;
- a partial charge-limited run still never advances the private baseline.

This is selected over a generic NPI scraper because the NPI marketplace is crowded and cheaper competitors already have broader search/filter features. It is selected over a standalone exclusion-screening Actor because current Apify Store usage is weak. The combined two-source roster decision is narrower, uses the existing exact-search rank, and gives credentialing and billing teams a distinct output without adding owner spend or manual fulfillment.

Current supporting evidence:

- The official CMS PPEF page says the file is a quarterly point-in-time snapshot of actively approved Medicare billing or order-and-refer enrollments, not real-time reporting.
- CMS's PPEF methodology says it was created because outsiders lacked a way to validate whether a provider or organization was enrolled in Medicare, but also explains that only one NPI appears in the ENROLLMENT row for multiple-NPI enrollments.
- The current PPEF source contains 2,981,799 rows; the current revalidation source contains 2,810,052 rows.
- The closest Apify enrollment Actor reports two total users, one monthly active user, and 24 successful versus six failed public runs in 30 days. That is a small but recurring usage signal, not proof of profit.
- This Actor currently ranks sixth for `provider enrollment`, first for `medicare revalidation`, has two users, zero paying users, and zero profit.

Additional primary sources:

- https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/medicare-fee-for-service-public-provider-enrollment
- https://data.cms.gov/resources/fee-for-service-public-provider-enrollment-methodology
- https://apify.com/jungle_synthesizer/cms-medicare-pecos-enrollment-crawler

## Test and rejection rule

Success requires at least one authenticated non-owner paid result and automatic delivery. Repeat use is stronger evidence than a single paid lookup.

If the Actor is indexed, the comparison mode is live, and a reasonable observation window still produces no non-owner paid use, reject it as the primary route and continue to the next idea. Do not substitute owner runs, free users, page views, or marketplace visibility for revenue.
