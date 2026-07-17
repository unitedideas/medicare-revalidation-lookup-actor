# Marketplace evidence brief

## Category and conversion

- Category: single offer in the Apify Store.
- Audience: Medicare credentialing teams, RCM and medical-billing operators, provider-network teams, and developers maintaining NPI rosters.
- Primary conversion: start a paid Actor run for 1 to 100 NPIs, then save and schedule the roster when repeat comparison is useful.
- Conversion-quality metric: a fully funded run that returns one current, source-dated result per valid NPI and, when enabled, advances the private comparison baseline without claiming live PECOS status.

## Decision context

- Main question: Which roster NPIs have a public CMS revalidation date, which are still TBD, and which are absent from the current list?
- Main anxiety: the output could be stale, confused with submission status, or expensive because of hidden compute charges.
- Required proof before running: official CMS source identity and revision, exact 100-NPI limit, one-result-per-NPI pricing unit, user-paid platform usage, and the PECOS limitation.

## Current demand and category evidence

- Measured product state, 2026-07-17: the public Actor has two total users, including one authenticated non-owner free user, two delivered results, zero paying users, and zero profit. This is stronger than hypothetical demand but does not prove willingness to pay.
- Measured store discovery, 2026-07-17: the Actor ranks 1 for `medicare revalidation`, 7 for `medicare`, 6 for `provider enrollment`, and 41 for `npi lookup`; it is absent from the first 100 results for `healthcare data` and `credentialing`. Exact-intent discovery works, but broader buyer discovery remains weak.
- Official operational need: CMS says providers are responsible for tracking their due dates and warns that late revalidation can lead to held reimbursement or deactivated billing privileges. CMS publishes dates only six to seven months ahead.
- Current market anchor: PractiApp lists credentialing and revalidation work from $225 per application; Credentialing Now starts at $364 per month for a broader credentialing platform. These prices validate the value of avoiding enrollment lapses, not demand for this exact actor.
- Apify unit economics: the documented pay-per-event formula is 80% of event revenue minus platform cost. This Actor passes platform usage to the buyer, so a fully paid 100-NPI run at $0.01 per result yields $1.00 revenue and approximately $0.80 creator profit.

- Measured marketplace state, 2026-07-16: `Medicare Provider & Clinician Search` reports 59 successful public runs in 30 days, 14 total users, and $0.003 per result. This supports paid demand for structured CMS provider data, not demand for revalidation specifically.
- Measured marketplace state, 2026-07-16: `CMS Medicare PECOS Provider Enrollment Scraper` reports 24 successful and 6 failed public runs in 30 days at $0.001 per record. This supports enrollment-data demand and makes fail-closed source validation a differentiator.
- Measured marketplace state, 2026-07-16: `CMS Medicare Provider Scraper` reports 17 successful public runs in 30 days with a $0.005 start fee and item pricing. It is broad CMS extraction, not a dedicated revalidation roster tool.
- Observed gap: no store result found that names bulk Medicare revalidation due-date lookup as its core job.
- Same-category reference, 2026-07-17: `CMS Medicare Provider Scraper` leads with the CMS dataset, identifiers, exportable raw fields, and source URLs. It teaches source and output specificity but does not solve revalidation tracking.
- Same-category reference, 2026-07-17: `NPI Registry Scraper — 8M Healthcare Providers, DEA + License` leads with scale, filters, field count, batch lookup, and a plain unit price. It has 313 total runs and 45 users, showing the value of front-loading scope and price without proving demand for revalidation.
- Same-category reference, 2026-07-17: `NPI Registry Scraper - US Healthcare Provider Data` leads with the NPPES source, export formats, and no-key condition. It teaches low-friction task framing but remains a broad registry product.

## Direction

- First screen/listing summary: lead with the task, `Check up to 100 NPIs against the current public CMS Medicare Revalidation List`.
- Decision path: front-load the credentialing, billing, and provider-enrollment roster jobs; exact input limit, result fields, repeat-comparison switch, price unit, source date, and limits must precede the separate email-monitoring handoff.
- Trust: use only current CMS public-list claims; explicitly state that the Actor does not show live PECOS submission or contractor case status.
- Conversion hypothesis: preserving exact revalidation language while adding provider-enrollment, credentialing, billing, and NPI-roster terms will expand qualified discovery without weakening the narrow job; predictable per-NPI pricing and a saved-roster comparison path should then create repeat paid runs.
- Desktop/mobile constraint: Apify owns layout and visual system; keep headings self-contained, tables narrow, examples compact, and the input schema usable without horizontal scanning.
