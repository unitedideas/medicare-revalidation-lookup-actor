import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRevalidationBaseline,
  compareRevalidationItems,
  lookupMedicareEnrollmentNpis,
  lookupMedicareVerificationNpis,
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

test("joins quarterly public Medicare enrollment evidence with current revalidation results", async () => {
  const revalidationHeaders = ["npi_list", "Enrollment ID", "Organization Name", "First Name", "Last Name", "Enrollment State Code", "Provider Type Text", "Enrollment Specialty", "due_date", "adjusted_due_date"];
  const fetchImpl = async (url) => {
    const target = String(url);
    if (target.includes("2457ea29-fc82-48b0-86ec-3b0755de7515/data-viewer")) {
      return new Response(JSON.stringify({
        meta: {
          success: true,
          headers: ["NPI", "ENRLMT_ID"],
          total_rows: 2981799,
          data_file_name: "PPEF_Enrollment_Extract_2026.04.01.csv",
          data_file_url: "/ppef.csv",
          data_file_meta_data: { csvFileSHA1: "c554e1e329dcb7d9a0da1bb21b57c65e06abbeea", csvFileModifiedTime: 1778528968 },
        },
      }), { status: 200 });
    }
    if (target.includes("2457ea29-fc82-48b0-86ec-3b0755de7515/data?")) {
      return new Response(JSON.stringify([
        { NPI: "1003002296", ENRLMT_ID: "O1", PECOS_ASCT_CNTL_ID: "PAC1", MULTIPLE_NPI_FLAG: "N", PROVIDER_TYPE_CD: "16", PROVIDER_TYPE_DESC: "PART B SUPPLIER - CLINIC/GROUP PRACTICE", STATE_CD: "CO", ORG_NAME: "DUPUIS OPTOMETRY, INC." },
      ]), { status: 200 });
    }
    return new Response(JSON.stringify({
      meta: {
        success: true,
        headers: revalidationHeaders,
        total_rows: 2810052,
        data_file_url: "/revalidation_base.csv",
        data_file_meta_data: { csvFileSHA1: "500733a401c8d8fba093d6696a2bbf0fceaf26de", csvFileModifiedTime: 1783953589 },
      },
      data: [["1003002296", "O1", "Dupuis Optometry, Inc.", "", "", "CO", "Non-DME Part B", "Clinic/Group Practice", "2026-07-31", ""]],
    }), { status: 200 });
  };

  const enrollment = await lookupMedicareEnrollmentNpis(["1003002296", "1386740892"], { fetchImpl, now: () => new Date("2026-07-17T12:00:00Z") });
  assert.equal(enrollment.source.total_rows, 2981799);
  assert.equal(enrollment.items[0].current_public_medicare_enrollment_file_match, true);
  assert.equal(enrollment.items[0].medicare_enrollment_records[0].pecos_associate_control_id, "PAC1");
  assert.equal(enrollment.items[1].current_public_medicare_enrollment_file_match, false);

  const combined = await lookupMedicareVerificationNpis(["1003002296", "1386740892"], { fetchImpl, now: () => new Date("2026-07-17T12:00:00Z") });
  assert.equal(combined.sources.medicare_enrollment.data_file_sha1, "c554e1e329dcb7d9a0da1bb21b57c65e06abbeea");
  assert.equal(combined.sources.revalidation.data_file_sha1, "500733a401c8d8fba093d6696a2bbf0fceaf26de");
  assert.equal(combined.items[0].status, "date_established");
  assert.equal(combined.items[0].current_public_medicare_enrollment_file_match, true);
  assert.equal(combined.items[1].status, "not_on_current_public_list");
  assert.match(combined.limitations.join(" "), /additional NPI/);
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

test("classifies a quarterly Medicare enrollment-file change", () => {
  const initial = [{
    npi: "1003002296",
    status: "date_established",
    earliest_established_due_date: "2026-07-31",
    enrollments: [{ enrollment_id: "R1" }],
    current_public_medicare_enrollment_file_match: false,
    medicare_enrollment_records: [],
  }];
  const baseline = buildRevalidationBaseline(initial, {
    revalidation: { data_file_sha1: "revalidation" },
    medicare_enrollment: { data_file_sha1: "enrollment-old" },
  }, "2026-04-01T00:00:00.000Z");
  const current = [{
    ...initial[0],
    current_public_medicare_enrollment_file_match: true,
    medicare_enrollment_records: [{ enrollment_id: "M1" }],
  }];
  const compared = compareRevalidationItems(current, baseline);
  assert.equal(compared[0].change_status, "medicare_enrollment_changed");
  assert.deepEqual(compared[0].changed_fields, ["medicare_enrollment_match", "medicare_enrollment_ids"]);
});
