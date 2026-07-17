# Apify Store listing review

- Reviewed source revision: `6bf7c620ea585dd4a034eb6d7ac462965ebdc6a0`
- Reviewed build: `0.0.2`
- Public listing: https://apify.com/actablesite/medicare-revalidation-lookup-actor
- Review date: 2026-07-16 America/Los_Angeles
- Category: single-offer marketplace listing
- Audience: Medicare credentialing teams, provider enrollment operators, and developers checking NPI rosters
- Primary conversion: start a paid Actor run
- Conversion-quality metric: successful source-dated NPI results without implying live PECOS status

## Evidence classification

- Measured: the public listing showed the title, one-line product explanation, `Try for free` action, and pricing on desktop and mobile; the public Actor API reported pay-per-event pricing, buyer-paid platform usage, and a primary `revalidation-result` event priced at $0.01.
- Standards: the decision path names the data source, explains the three result states, states the 100-NPI limit, and distinguishes public revalidation data from live PECOS case status.
- Observed pattern: comparable Apify data Actors lead with a specific job, a direct run action, unit pricing, structured output, and operational limits.
- Hypothesis: a narrow Medicare revalidation job and transparent per-result price will convert more qualified searches than a broader provider-data scraper promise.

## Rendered QA

### Desktop — 1712 x 899

- Pass: the first screen identifies the job, current CMS source, 100-NPI scope, PECOS limitation, price, and primary action.
- Pass: the README decision path moves from result value to price and limits, status meanings, source reliability, and the optional monitoring handoff.
- Pass: the platform layout presents developer identity, maintenance state, categories, usage statistics, and pricing without competing calls to action.
- Pass: text, links, controls, and focusable navigation have readable contrast in Apify's dark theme.

### Mobile — 390 x 844

- Pass: title, Actor slug, primary action, product explanation, PECOS limitation, and pricing all appear in the first viewport.
- Pass: the title and slug wrap without horizontal clipping; the action remains full-width and prominent.
- Pass: the information hierarchy survives the single-column layout and the developer/maintenance labels remain legible.

## Decision

Design-ready for public acquisition at the reviewed revision. No blocking visual, trust, accessibility, copy, or responsive findings remain. A source, README, pricing, or listing-metadata change invalidates this review and requires a fresh desktop/mobile check.
