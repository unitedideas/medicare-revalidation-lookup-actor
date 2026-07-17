import { Actor, log } from "apify";
import {
  buildRevalidationBaseline,
  compareRevalidationItems,
  lookupMedicareVerificationNpis,
  monitorBaselineKey,
  monitorStorageName,
} from "./lib.js";

await Actor.init();

try {
  const input = await Actor.getInput() || {};
  const result = await lookupMedicareVerificationNpis(input.npis);
  const compareWithPrevious = input.compareWithPrevious === true;
  let baselineStore = null;
  let baselineKey = null;
  let previousBaseline = null;
  let deliveredItems = result.items;

  if (compareWithPrevious) {
    baselineStore = await Actor.openKeyValueStore(monitorStorageName(process.env.APIFY_USER_ID));
    baselineKey = monitorBaselineKey(result.items);
    previousBaseline = await baselineStore.getValue(baselineKey);
    deliveredItems = compareRevalidationItems(result.items, previousBaseline);
  }

  const chargingManager = Actor.getChargingManager();
  const pricing = chargingManager.getPricingInfo();
  const deliveryPlan = pricing.isPayPerEvent
    ? chargingManager.calculatePushDataLimits({
      items: deliveredItems,
      eventName: "revalidation-result",
      isDefaultDataset: true,
    })
    : { limitedItems: deliveredItems };
  if (pricing.isPayPerEvent) {
    await Actor.pushData(deliveredItems, "revalidation-result");
  } else {
    await Actor.pushData(deliveredItems);
  }
  const recordsReturned = deliveryPlan.limitedItems.length;
  const partial = recordsReturned < deliveredItems.length;
  const changedItems = deliveredItems.filter((item) => !["baseline", "unchanged"].includes(item.change_status));

  if (compareWithPrevious && !partial) {
    await baselineStore.setValue(
      baselineKey,
      buildRevalidationBaseline(result.items, result.sources, result.checked_at),
    );
  }

  const output = {
    ok: !partial,
    status: partial ? "partial_charge_limit" : "delivered",
    requested_npis: result.items.length,
    records_returned: recordsReturned,
    dataset_id: process.env.APIFY_DEFAULT_DATASET_ID || "default",
    export_formats: ["json", "csv", "xlsx", "xml", "rss"],
    checked_at: result.checked_at,
    sources: result.sources,
    charge_event: pricing.isPayPerEvent ? "revalidation-result" : null,
    limitations: result.limitations,
    comparison: {
      enabled: compareWithPrevious,
      baseline_created: compareWithPrevious && !previousBaseline && !partial,
      baseline_updated: compareWithPrevious && !partial,
      changes_detected: compareWithPrevious ? changedItems.length : null,
      unchanged_records: compareWithPrevious
        ? deliveredItems.filter((item) => item.change_status === "unchanged").length
        : null,
      storage_scope: compareWithPrevious ? "this Apify user and exact NPI roster" : null,
      next_step: compareWithPrevious
        ? "Save this input as an Apify task and schedule it to run again. Later full runs compare against the prior full run automatically."
        : "Turn on Compare with the previous run to create a reusable roster baseline.",
      note: "Comparison covers changes in the public CMS Medicare Revalidation List and quarterly Public Provider Enrollment file. It does not monitor live PECOS or contractor case status.",
    },
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
    comparisonEnabled: compareWithPrevious,
    changesDetected: compareWithPrevious ? changedItems.length : null,
    dated: result.items.filter((item) => item.status === "date_established").length,
    tbd: result.items.filter((item) => item.status === "tbd").length,
    notListed: result.items.filter((item) => item.status === "not_on_current_public_list").length,
    revalidationSourceSha1: result.sources.revalidation.data_file_sha1,
    medicareEnrollmentSourceSha1: result.sources.medicare_enrollment.data_file_sha1,
  });
  await Actor.exit(`Delivered ${recordsReturned} Medicare enrollment and revalidation result${recordsReturned === 1 ? "" : "s"}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : "The CMS revalidation lookup could not be completed.";
  log.error(message);
  await Actor.fail(message);
}
