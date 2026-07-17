import { Actor, log } from "apify";
import { lookupRevalidationNpis } from "./lib.js";

await Actor.init();

try {
  const input = await Actor.getInput() || {};
  const result = await lookupRevalidationNpis(input.npis);
  const pricing = Actor.getChargingManager().getPricingInfo();
  const chargeResult = pricing.isPayPerEvent
    ? await Actor.pushData(result.items, "revalidation-result")
    : (await Actor.pushData(result.items), null);
  const recordsReturned = pricing.isPayPerEvent
    ? Number(chargeResult?.chargedCount ?? result.items.length)
    : result.items.length;
  const partial = recordsReturned < result.items.length;

  const output = {
    ok: !partial,
    status: partial ? "partial_charge_limit" : "delivered",
    requested_npis: result.items.length,
    records_returned: recordsReturned,
    dataset_id: process.env.APIFY_DEFAULT_DATASET_ID || "default",
    export_formats: ["json", "csv", "xlsx", "xml", "rss"],
    checked_at: result.checked_at,
    source: result.source,
    charge_event: pricing.isPayPerEvent ? "revalidation-result" : null,
    limitations: result.limitations,
    optional_monitoring: {
      product: "Medicare Roster Watch",
      price: "$9 USD per month",
      scope: "up to 20 NPIs",
      delivery: "dated baseline and change-only email",
      url: "https://actablesite.com/pending-medicare-roster-watch?utm_source=apify&utm_medium=actor_output&utm_campaign=medicare_revalidation_actor",
      note: "This optional monitor follows public CMS list changes. It does not monitor live PECOS or contractor case status.",
    },
  };
  await Actor.setValue("OUTPUT", output);

  if (partial) {
    log.warning("The run charge limit allowed only part of the requested roster", {
      requested: result.items.length,
      returned: recordsReturned,
    });
    await Actor.exit(`Delivered ${recordsReturned} of ${result.items.length} requested NPI results within the run charge limit.`);
  }

  log.info("Medicare revalidation results delivered", {
    records: recordsReturned,
    dated: result.items.filter((item) => item.status === "date_established").length,
    tbd: result.items.filter((item) => item.status === "tbd").length,
    notListed: result.items.filter((item) => item.status === "not_on_current_public_list").length,
    sourceSha1: result.source.data_file_sha1,
  });
  await Actor.exit(`Delivered ${recordsReturned} current CMS revalidation result${recordsReturned === 1 ? "" : "s"}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : "The CMS revalidation lookup could not be completed.";
  log.error(message);
  await Actor.fail(message);
}
