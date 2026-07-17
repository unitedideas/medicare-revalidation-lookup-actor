# Apify Store listing review

- Reviewed source revision: `fe1b3fffa7ecce9f1acea46b146f401c3654c457`
- Reviewed build: `0.0.4`
- Public listing: https://apify.com/actablesite/medicare-revalidation-lookup-actor
- Public recurring example: https://apify.com/actablesite/medicare-revalidation-lookup-actor/examples/monthly-medicare-revalidation-roster-comparison
- Review date: 2026-07-17 America/Los_Angeles
- Category: single-offer marketplace listing
- Audience: Medicare credentialing teams, provider enrollment and RCM operators, and developers checking NPI rosters
- Primary conversion: start a paid Actor run, then save and schedule repeat runs for the same roster
- Conversion-quality metric: successful source-dated NPI results and a baseline that advances only after a fully funded comparison run, without implying live PECOS status

## Evidence classification

- Measured: the public listing showed the title, one-line product explanation, `Try for free` action, exact unit price, and recurring-comparison input on desktop and mobile. The published example showed its dedicated SEO title, comparison outcome, two-NPI roster, and configured result view. The public Actor API reported pay-per-event pricing, buyer-paid platform usage, and a primary `revalidation-result` event priced at $0.01.
- Standards: the decision path names the data source, explains the three result states, states the 100-NPI limit, and distinguishes public revalidation data from live PECOS case status.
- Observed pattern: comparable Apify data Actors lead with a specific job, a direct run action, unit pricing, structured output, and operational limits.
- Hypothesis: a narrow Medicare revalidation job, transparent per-result price, and saved-roster comparison path will convert more qualified searches and produce more repeat runs than a broader provider-data scraper promise.

## Rendered QA

### Desktop — 1265 x 712

- Pass: the listing first screen identifies the job, current CMS source, 100-NPI scope, PECOS limitation, exact price, and primary action.
- Pass: the recurring-example first screen names the roster-monitoring job, explains prior-run comparison, shows the primary action, and previews structured output.
- Pass: the README decision path moves from result value to public examples, repeat comparison, price and limits, status meanings, source reliability, and the optional monitoring handoff.
- Pass: the platform layout presents developer identity, maintenance state, categories, usage statistics, and pricing without competing calls to action.
- Pass: text, links, controls, and focusable navigation have readable contrast in Apify's dark theme.

### Mobile — 390 x 844

- Pass: the listing title, Actor slug, primary action, product explanation, PECOS limitation, and pricing all appear in the first viewport.
- Pass: the recurring-example title, creator, linked Actor, comparison promise, and primary action appear before the workflow graph.
- Pass: the title and slug wrap without horizontal clipping; the action remains full-width and prominent.
- Pass: the information hierarchy survives the single-column layout and the developer/maintenance labels remain legible.
- Non-blocking platform finding: the recurring-example workflow graph creates a horizontal scrollbar below the first-screen conversion content at 390 px. Apify owns that generated graph and layout; the title, promise, and action remain readable without horizontal scrolling.

## Decision

Design-ready for public acquisition at the reviewed revision. No blocking visual, trust, accessibility, copy, or responsive findings remain. The platform-owned mobile graph overflow is recorded above and should be rechecked if Apify changes the example layout. A source, README, pricing, input schema, example, or listing-metadata change invalidates this review and requires a fresh desktop/mobile check.
