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

Add a private saved-roster comparison mode:

- first full run creates a baseline for the exact NPI roster;
- later full runs classify newly listed, no longer listed, due-date, status, and enrollment changes;
- a partial charge-limited run never advances the baseline;
- customers can save the input as an Apify task and use Apify scheduling for unattended repeat runs;
- no live PECOS or contractor-status claim is introduced.

This uses named actor storage scoped to the running Apify user, existing pay-per-result billing, and the current CMS source. It adds no owner spend or manual fulfillment.

## Test and rejection rule

Success requires at least one authenticated non-owner paid result and automatic delivery. Repeat use is stronger evidence than a single paid lookup.

If the Actor is indexed, the comparison mode is live, and a reasonable observation window still produces no non-owner paid use, reject it as the primary route and continue to the next idea. Do not substitute owner runs, free users, page views, or marketplace visibility for revenue.
