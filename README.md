# Medicare Enrollment Verification + Revalidation Due Dates

Bulk-check **1 to 100 NPIs** against two official CMS sources in one run: the quarterly Medicare Fee-For-Service Public Provider Enrollment file and the current Medicare Revalidation List. Built for credentialing, medical-billing, and provider-enrollment rosters, each source-dated result shows whether the NPI appears in the public enrollment file plus its established revalidation date, **TBD**, or not-listed status.

Save the input as an Apify task when you need the same roster again. A later fully funded run can compare with the prior baseline and label public-list changes without exposing the roster in a shared dataset or log.

## At a glance

| Decision | Contract |
|---|---|
| Roster | 1 to 100 unique, valid NPIs per run |
| Sources | Quarterly public Medicare enrollment file plus the current revalidation list, each with its source revision |
| Result | One joined row per NPI, retaining every matching record from both sources |
| Repeat checks | Private prior-run baseline with public enrollment-file and revalidation change classifications |
| Price | $0.01 per returned NPI result; Actor user pays Apify platform usage |
| Boundary | Public revalidation dates only—not live PECOS or contractor case status |

## What you get

Each dataset row includes:

- NPI and current public-list status
- public Medicare enrollment-file match, record count, and enrollment details
- earliest established due date, when present
- every matching revalidation-list enrollment ID
- provider or organization name, state, enrollment type, and specialty
- revalidation due date and adjusted due date
- lookup timestamp and both CMS source-file revisions

Results export as JSON, CSV, Excel, XML, or RSS.

## Use it from an AI agent with MCP

Connect an MCP-compatible AI client to this Actor-only Apify endpoint:

```text
https://mcp.apify.com?tools=actablesite/medicare-revalidation-lookup-actor
```

Use Apify's recommended OAuth connection. The buyer signs in to Apify and authorizes the run; no Apify token, Medicare credential, or customer secret is passed to this Actor. The connected buyer pays the same **$0.01 per returned NPI** plus Apify platform usage.

Example prompt:

```text
Check Medicare public enrollment and revalidation timing for NPIs
1003002296 and 1508860420. Return the source revisions and explain
any no-match or TBD result without treating it as live PECOS status.
```

Apify exposes the input schema and structured result fields to the agent before the run. The endpoint is for point-in-time checks and scheduled Apify tasks; it does not give the agent access to PECOS or contractor systems.

## Ready-to-run examples

- [Monthly roster comparison](https://apify.com/actablesite/medicare-revalidation-lookup-actor/examples/monthly-medicare-revalidation-roster-comparison) — compare the same NPI roster with its prior fully funded run and flag public-list changes.
- [Credentialing roster check](https://apify.com/actablesite/medicare-revalidation-lookup-actor/examples/medicare-revalidation-roster-check-for-credentialing) — check a provider roster before credentialing follow-up.
- [Medical billing revalidation dates](https://apify.com/actablesite/medicare-revalidation-lookup-actor/examples/medicare-revalidation-dates-for-medical-billing) — export public due dates and TBD records for billing operations.

Each example opens with the NPI field and result table already configured. Apify duplicates the task into the user's own account, so the user's runs and datasets remain private.

## Compare a roster with the previous run

Turn on **Compare with the previous run** when you expect to check the same roster again.

- The first fully funded run creates a baseline for that exact NPI list.
- Each later fully funded run labels every row as unchanged, newly listed, no longer listed, due-date changed, status changed, revalidation enrollment changed, or public Medicare enrollment changed.
- The baseline is stored under the Apify user who ran the Actor and is not placed in the public dataset or logs.
- A partial run never replaces the prior full baseline.
- Save the input as an Apify task and schedule it to run again for unattended comparison and run history.

Comparison uses the public CMS Medicare Revalidation List and quarterly Public Provider Enrollment file. It does not monitor PECOS submissions or contractor case status, and it does not send a separate email. Each scheduled run keeps the same per-result price.

## Price and run limit

- **$0.01 per returned NPI result**
- up to **100 unique NPIs per run**
- Apify's small synthetic start event may also apply
- platform usage is paid by the Actor user, not hidden inside the result price
- invalid NPI check digits are rejected before any paid result is created

The run's maximum-charge setting is respected. If it cannot cover the whole roster, the Actor returns only the funded portion and marks the run partial.

## Example input

```json
{
  "npis": [
    "1003002296",
    "1508860420"
  ]
}
```

## Result meanings

| Result | Meaning |
|---|---|
| Public Medicare enrollment match | The NPI appears in the current quarterly ENROLLMENT file. This is dated public evidence, not live PECOS status. |
| No public Medicare enrollment match | The NPI was not returned from the current ENROLLMENT file query. This is not conclusive for an additional NPI attached to a multiple-NPI enrollment. |
| `date_established` | At least one matching enrollment has a public due or adjusted-due date. |
| `tbd` | CMS lists the enrollment but has not established a public due date. |
| `not_on_current_public_list` | The valid NPI has no matching enrollment in the current public revalidation file. |

## Important limits

This Actor reads two public CMS files. It **does not show live PECOS submission status**, Medicare Administrative Contractor case status, receipt, acceptance, completion, complete credentialing, or current billing privileges.

A public due date is not proof that revalidation was submitted or completed. A blank date means CMS has not established one in the current public file. Use PECOS and the responsible enrollment contractor for official case status.

The Medicare enrollment file is a quarterly point-in-time extract. CMS records only one NPI in its ENROLLMENT row when an enrollment has multiple NPIs; additional NPIs are published in a separate relational file. A no-match result therefore is not conclusive for an additional NPI.

## Source and reliability

The Actor queries both official CMS datasets directly, validates their returned schemas, records each source CSV SHA-1 and modification time, and fails closed if the revalidation source revision changes during a multi-batch roster lookup.

- [Official CMS Medicare Revalidation List](https://data.cms.gov/tools/medicare-revalidation-list)
- [CMS revalidation dataset page](https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/revalidation-due-date-list)
- [CMS Medicare Fee-For-Service Public Provider Enrollment dataset](https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/medicare-fee-for-service-public-provider-enrollment)
- [CMS Public Provider Enrollment methodology](https://data.cms.gov/resources/fee-for-service-public-provider-enrollment-methodology)

## Need change alerts instead of another point-in-time lookup?

[Medicare Roster Watch](https://actablesite.com/pending-medicare-roster-watch?utm_source=apify&utm_medium=actor_readme&utm_campaign=medicare_revalidation_actor) follows public revalidation records and pending-file membership for up to 20 NPIs. It is **$9 USD per month** and sends a dated baseline plus change-only email. It still does not monitor live PECOS or contractor case status.

## For developers

The Actor requires no external API key or customer credential. Source and tests are available in the linked GitHub repository under the MIT license.
