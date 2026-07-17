# Medicare Revalidation Due Date Lookup

Check **1 to 100 NPIs** against the current public CMS Medicare Revalidation List. Get one source-dated result per NPI: established due date, **TBD**, or not present on the current public list.

## What you get

Each dataset row includes:

- NPI and current public-list status
- earliest established due date, when present
- every matching Medicare enrollment ID
- provider or organization name, state, enrollment type, and specialty
- revalidation due date and adjusted due date
- lookup timestamp and CMS source-file revision

Results export as JSON, CSV, Excel, XML, or RSS.

## Ready-to-run examples

- [Credentialing roster check](https://apify.com/actablesite/medicare-revalidation-lookup-actor/examples/medicare-revalidation-roster-check-for-credentialing) — check a provider roster before credentialing follow-up.
- [Medical billing revalidation dates](https://apify.com/actablesite/medicare-revalidation-lookup-actor/examples/medicare-revalidation-dates-for-medical-billing) — export public due dates and TBD records for billing operations.

Each example opens with the NPI field and result table already configured. Apify duplicates the task into the user's own account, so the user's runs and datasets remain private.

## Compare a roster with the previous run

Turn on **Compare with the previous run** when you expect to check the same roster again.

- The first fully funded run creates a baseline for that exact NPI list.
- Each later fully funded run labels every row as unchanged, newly listed, no longer listed, due-date changed, status changed, or enrollment changed.
- The baseline is stored under the Apify user who ran the Actor and is not placed in the public dataset or logs.
- A partial run never replaces the prior full baseline.
- Save the input as an Apify task and schedule it to run again for unattended comparison and run history.

Comparison uses only the public CMS Medicare Revalidation List. It does not monitor PECOS submissions or contractor case status, and it does not send a separate email. Each scheduled run keeps the same per-result price.

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

## Status meanings

| Status | Meaning |
|---|---|
| `date_established` | At least one matching enrollment has a public due or adjusted-due date. |
| `tbd` | CMS lists the enrollment but has not established a public due date. |
| `not_on_current_public_list` | The valid NPI has no matching enrollment in the current public revalidation file. |

## Important limits

This Actor reads the public CMS Medicare Revalidation List. It **does not show live PECOS submission status**, Medicare Administrative Contractor case status, receipt, acceptance, completion, approval, enrollment, or billing privileges.

A public due date is not proof that revalidation was submitted or completed. A blank date means CMS has not established one in the current public file. Use PECOS and the responsible enrollment contractor for official case status.

## Source and reliability

The Actor queries the official CMS dataset directly, validates the returned schema, records the source CSV SHA-1 and modification time, and fails closed if the source revision changes during a multi-batch roster lookup.

- [Official CMS Medicare Revalidation List](https://data.cms.gov/tools/medicare-revalidation-list)
- [CMS dataset page](https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/revalidation-due-date-list)

## Need change alerts instead of another point-in-time lookup?

[Medicare Roster Watch](https://actablesite.com/pending-medicare-roster-watch?utm_source=apify&utm_medium=actor_readme&utm_campaign=medicare_revalidation_actor) follows public revalidation records and pending-file membership for up to 20 NPIs. It is **$9 USD per month** and sends a dated baseline plus change-only email. It still does not monitor live PECOS or contractor case status.

## For developers

The Actor requires no external API key or customer credential. Source and tests are available in the linked GitHub repository under the MIT license.
