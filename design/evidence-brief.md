# Marketplace evidence brief

## Category and conversion

- Category: single offer in the Apify Store.
- Audience: Medicare credentialing teams, RCM and medical-billing operators, provider-network teams, and developers maintaining NPI rosters.
- Primary conversion: start a paid Actor run for 1 to 100 NPIs from the Store or an authenticated MCP client, then save and schedule the roster when repeat comparison is useful.
- Conversion-quality metric: a fully funded non-owner run that returns one joined, source-dated result per valid NPI and, when enabled, advances the private two-source comparison baseline without claiming live PECOS status.

## Decision context

- Main question: Does this NPI appear in Medicare's public enrollment file, and when is its revalidation due?
- Main anxiety: a quarterly public-file match or no-match could be mistaken for live PECOS, complete credentialing, or current billing status; compute charges could also be unclear.
- Required proof before running: both official CMS source identities and revisions, quarterly versus monthly timing, the multiple-NPI limitation, exact 100-NPI limit, one-result-per-NPI pricing unit, user-paid platform usage, and the live-PECOS limitation.

## Current demand and category evidence

- Measured product state, 2026-07-17: the public Actor has two total users, including one authenticated non-owner free user, two delivered results, zero paying users, and zero profit. This is stronger than hypothetical demand but does not prove willingness to pay.
- Measured MCP state, 2026-07-17: Apify's anonymous `fetch-actor-details` tool returns this exact Actor by ID with its description, two event prices, input schema, inferred structured output, two total users, one monthly user, and 100% public-run success. Searches for `Medicare revalidation`, `Medicare revalidation due date`, `provider enrollment`, and `Medicare` do not return it in the first ten MCP results. Direct usability exists; generic agent discovery does not.
- Measured store discovery, 2026-07-17: the Actor ranks 1 for `medicare revalidation`, 7 for `medicare`, 6 for `provider enrollment`, and 41 for `npi lookup`; it is absent from the first 100 results for `healthcare data` and `credentialing`. Exact-intent discovery works, but broader buyer discovery remains weak.
- Official operational need: CMS says providers are responsible for tracking their due dates and warns that late revalidation can lead to held reimbursement or deactivated billing privileges. CMS publishes dates only six to seven months ahead.
- Current market anchor: PractiApp lists credentialing and revalidation work from $225 per application; Credentialing Now starts at $364 per month for a broader credentialing platform. These prices validate the value of avoiding enrollment lapses, not demand for this exact actor.
- Apify unit economics: the documented pay-per-event formula is 80% of event revenue minus platform cost. This Actor passes platform usage to the buyer, so a fully paid 100-NPI run at $0.01 per result yields $1.00 revenue and approximately $0.80 creator profit.

- Measured marketplace state, 2026-07-16: `Medicare Provider & Clinician Search` reports 59 successful public runs in 30 days, 14 total users, and $0.003 per result. This supports paid demand for structured CMS provider data, not demand for revalidation specifically.
- Measured marketplace state, 2026-07-16: `CMS Medicare PECOS Provider Enrollment Scraper` reports 24 successful and 6 failed public runs in 30 days at $0.001 per record. This supports enrollment-data demand and makes fail-closed source validation a differentiator.
- Measured source state, 2026-07-17: the current PPEF ENROLLMENT file contains 2,981,799 rows and the current revalidation file contains 2,810,052 rows; live local verification returned one matching record from each source for two known NPIs.
- Official data boundary: CMS describes PPEF as a quarterly point-in-time extract, not real-time reporting, and states that additional NPIs for a multiple-NPI enrollment live in a separate relational file. The listing must not turn a no-match into a definitive not-enrolled claim.
- Measured marketplace state, 2026-07-16: `CMS Medicare Provider Scraper` reports 17 successful public runs in 30 days with a $0.005 start fee and item pricing. It is broad CMS extraction, not a dedicated revalidation roster tool.
- Observed gap: no store result found that names bulk Medicare revalidation due-date lookup as its core job.
- Same-category reference, 2026-07-17: `CMS Medicare Provider Scraper` leads with the CMS dataset, identifiers, exportable raw fields, and source URLs. It teaches source and output specificity but does not solve revalidation tracking.
- Same-category reference, 2026-07-17: `NPI Registry Scraper — 8M Healthcare Providers, DEA + License` leads with scale, filters, field count, batch lookup, and a plain unit price. It has 313 total runs and 45 users, showing the value of front-loading scope and price without proving demand for revalidation.
- Same-category reference, 2026-07-17: `NPI Registry Scraper - US Healthcare Provider Data` leads with the NPPES source, export formats, and no-key condition. It teaches low-friction task framing but remains a broad registry product.

## Direction

- First screen/listing summary: lead with the joined task, `Check public Medicare enrollment and revalidation timing for up to 100 NPIs` while preserving the exact revalidation title that currently ranks first for its narrow Store query.
- Decision path: front-load the two source roles, credentialing/billing/provider-enrollment roster jobs, exact input limit, joined result fields, repeat-comparison switch, price unit, source dates, and limits before the separate email-monitoring handoff.
- Trust: name the quarterly PPEF and current revalidation list separately; explicitly state that the Actor does not show live PECOS, complete credentialing, current billing privileges, or conclusive additional-NPI status.
- Conversion hypothesis: adding a demonstrated Actor-only MCP endpoint, buyer-authentication boundary, exact prompt, and price beside the existing Store path will improve qualified agent use without weakening the exact `medicare revalidation` Store position. Predictable per-NPI pricing and saved-roster comparison should then create repeat paid runs.
- Desktop/mobile constraint: Apify owns layout and visual system; keep headings self-contained, tables narrow, examples compact, and the input schema usable without horizontal scanning.
