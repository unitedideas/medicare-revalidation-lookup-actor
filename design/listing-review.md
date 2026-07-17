# Apify Store listing review

- Reviewed source revision: `a67426ba5f8ce99cc7baa008b1a4f89c19f7a67e`
- Reviewed build: `0.0.8`
- Public listing: https://apify.com/actablesite/medicare-revalidation-lookup-actor
- Public recurring example: https://apify.com/actablesite/medicare-revalidation-lookup-actor/examples/monthly-medicare-revalidation-roster-comparison
- Review date: 2026-07-17 America/Los_Angeles
- Category: paid product / single-offer marketplace listing
- Audience: Medicare credentialing teams, provider enrollment and RCM operators, and developers checking NPI rosters
- Primary conversion: start a paid Actor run from the Store or an authenticated Apify MCP client, then save and schedule repeat runs for the same roster
- Conversion-quality metric: successful joined enrollment and revalidation results, visible source revisions, and a baseline that advances only after a fully funded comparison run, without implying live PECOS status or treating an additional-NPI no-match as conclusive

## Evidence classification

- Measured: build `0.0.8` completed from the reviewed source revision and became the public `latest` build. The public Actor API exposes the MCP-ready listing description, pay-per-event pricing, buyer-paid platform usage, and a primary `revalidation-result` event priced at $0.01. Apify's anonymous MCP `fetch-actor-details` tool resolves the exact Actor with its schema and structured output; running the Actor-only MCP endpoint correctly requires buyer authentication. Earlier owner verification returned two joined rows and exactly two delivered results, but there is still no non-owner paid result.
- Standards: the decision path names both CMS sources, explains enrollment and revalidation result states, states the 100-NPI limit, distinguishes public data from live PECOS case status, and warns that a no-match is inconclusive for an additional NPI on a multiple-NPI enrollment.
- Observed pattern: comparable Apify data Actors lead with a specific job, a direct run action, unit pricing, structured output, and operational limits.
- Hypothesis: preserving the exact revalidation search title while adding joined public-enrollment evidence, transparent per-result pricing, a direct authenticated MCP path, and a saved-roster comparison path will convert more qualified searches and produce more repeat runs than a broader provider-data scraper promise.

## Rendered QA

### Desktop — 1440 x 1000

- Pass: the listing first screen identifies the job, both CMS sources, 100-NPI scope, PECOS limitation, exact price, primary action, and authenticated Apify MCP availability.
- Pass: the README decision path moves from joined result value to the direct MCP endpoint, buyer-authentication and charge boundary, public examples, repeat comparison, price and limits, result meanings, source reliability, and the optional monitoring handoff.
- Pass: the platform layout presents developer identity, maintenance state, categories, usage statistics, and pricing without competing calls to action.
- Pass: text, links, controls, and focusable navigation have readable contrast in Apify's dark theme.

### Mobile — 390 x 844

- Pass: the listing title, Actor slug, primary action, joined-source product explanation, authenticated MCP path, PECOS limitation, and pricing all appear in the first viewport.
- Pass: the title and slug wrap without horizontal clipping; the action remains full-width and prominent.
- Pass: the information hierarchy survives the single-column layout and the developer/maintenance labels remain legible.
- Pass: measured document width equals the 390 px viewport, with no horizontal overflow.

Render evidence: `design/renders/apify-medicare-revalidation-store-desktop.png`, `design/renders/apify-medicare-revalidation-store-mobile.png`, and `design/renders/apify-medicare-revalidation-store-full.png`.

## Decision

Design-ready for public acquisition at build `0.0.8` and source `a67426ba5f8ce99cc7baa008b1a4f89c19f7a67e`. No blocking visual, trust, accessibility, copy, or responsive findings remain. Generic MCP search still does not surface the Actor in its first ten results, so the listing makes only the verified direct-endpoint claim. A source, README, pricing, input schema, example, or listing-metadata change invalidates this review and requires a fresh desktop/mobile check.
