import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRevalidationBaseline,
  compareRevalidationItems,
  lookupRevalidationNpis,
  monitorBaselineKey,
  monitorStorageName,
  normalizeNpis,
  validNpi,
} from "../src/lib.js";

test("validates NPI check digits and rejects invalid rosters before lookup", () => {
  assert.equal(validNpi("1003002296"), true);
  assert.equal(validNpi("1508860420"), true);
  assert.equal(validNpi("1234567890"), false);
  assert.deepEqual(normalizeNpis(["1003002296", "1003002296", "1508860420"]), ["1003002296", "1508860420"]);
  assert.throws(() => normalizeNpis(["1234567890"]), /Invalid NPIs are rejected before any paid result/);
});

test("maps dated, TBD, and not-listed NPIs into one result per NPI", async () => {
  const headers = ["npi_list", "Enrollment ID", "Organization Name", "First Name", "Last Name", "Enrollment State Code", "Provider Type Text", "Enrollment Specialty", "due_date", "adjusted_due_date"];
  const fetchImpl = async () => new Response(JSON.stringify({
    meta: {
      success: true,
      headers,
      total_rows: 2810052,
      data_file_url: "/sites/default/files/revalidation_base.csv",
      data_file_meta_data: { csvFileSHA1: "500733a401c8d8fba093d6696a2bbf0fceaf26de", csvFileModifiedTime: 1783953589 },
    },
    data: [
      ["1003002296", "O1", "Dupuis Optometry, Inc.", "", "", "CO", "Non-DME Part B", "Clinic/Group Practice", "2026-07-31", ""],
      ["1508860420", "I1", "", "Jeanne", "Martin", "SC", "Non-DME Part B", "Physician Assistant", "", ""],
    ],
  }), { status: 200, headers: { "content-type": "application/json" } });
  const result = await lookupRevalidationNpis(["1003002296", "1508860420", "1386740892"], {
    fetchImpl,
    now: () => new Date("2026-07-16T20:00:00Z"),
  });
  assert.deepEqual(result.items.map(({ npi, status, earliest_established_due_date }) => ({ npi, status, earliest_established_due_date })), [
    { npi: "1003002296", status: "date_established", earliest_established_due_date: "2026-07-31" },
    { npi: "1508860420", status: "tbd", earliest_established_due_date: null },
    { npi: "1386740892", status: "not_on_current_public_list", earliest_established_due_date: null },
  ]);
  assert.equal(result.source.total_rows, 2810052);
  assert.equal(result.items[0].enrollments[0].provider_name, "Dupuis Optometry, Inc.");
});

test("fails closed when the CMS response schema changes", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ meta: { success: true, headers: [] }, data: [] }), { status: 200 });
  await assert.rejects(() => lookupRevalidationNpis(["1003002296"], { fetchImpl }), /did not match the expected schema/);
});

test("creates a private stable roster key and classifies public-list changes", () => {
  const initial = [
    { npi: "1003002296", status: "tbd", earliest_established_due_date: null, enrollments: [{ enrollment_id: "O1" }] },
    { npi: "1508860420", status: "not_on_current_public_list", earliest_established_due_date: null, enrollments: [] },
  ];
  const baseline = buildRevalidationBaseline(initial, { data_file_sha1: "old" }, "2026-07-01T00:00:00.000Z");
  const current = [
    { npi: "1003002296", status: "date_established", earliest_established_due_date: "2026-12-31", enrollments: [{ enrollment_id: "O1" }] },
    { npi: "1508860420", status: "tbd", earliest_established_due_date: null, enrollments: [{ enrollment_id: "I1" }] },
  ];
  const compared = compareRevalidationItems(current, baseline);
  assert.equal(compared[0].change_status, "due_date_changed");
  assert.deepEqual(compared[0].changed_fields, ["status", "earliest_established_due_date"]);
  assert.equal(compared[1].change_status, "newly_listed");
  assert.equal(monitorBaselineKey(initial), monitorBaselineKey([...initial].reverse()));
  assert.match(monitorStorageName("user-123"), /^medicare-revalidation-[a-f0-9]{24}$/);
  assert.doesNotMatch(monitorStorageName("user-123"), /user-123/);
});

test("labels the first comparison run as a baseline", () => {
  const compared = compareRevalidationItems([
    { npi: "1003002296", status: "tbd", earliest_established_due_date: null, enrollments: [] },
  ], null);
  assert.equal(compared[0].change_status, "baseline");
  assert.deepEqual(compared[0].changed_fields, []);
});
