import { createHash } from "node:crypto";

export const CMS_REVALIDATION_DATASET_ID = "4c6a7709-84b0-4514-9308-4a41846f5682";
export const CMS_REVALIDATION_API = `https://data.cms.gov/data-api/v1/dataset/${CMS_REVALIDATION_DATASET_ID}/data-viewer`;
export const CMS_REVALIDATION_TOOL_URL = "https://data.cms.gov/tools/medicare-revalidation-list";
export const CMS_REVALIDATION_DATASET_URL = "https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/revalidation-due-date-list";
export const CMS_ENROLLMENT_DATASET_ID = "2457ea29-fc82-48b0-86ec-3b0755de7515";
export const CMS_ENROLLMENT_DATA_API = `https://data.cms.gov/data-api/v1/dataset/${CMS_ENROLLMENT_DATASET_ID}/data`;
export const CMS_ENROLLMENT_DATA_VIEWER = `https://data.cms.gov/data-api/v1/dataset/${CMS_ENROLLMENT_DATASET_ID}/data-viewer`;
export const CMS_ENROLLMENT_DATASET_URL = "https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/medicare-fee-for-service-public-provider-enrollment";
export const MAX_NPIS = 100;

const MONITOR_SCHEMA_VERSION = 2;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function enrollmentIds(item) {
  return (item.enrollments || []).map((entry) => entry.enrollment_id).filter(Boolean).sort();
}

function medicareEnrollmentIds(item) {
  return (item.medicare_enrollment_records || []).map((entry) => entry.enrollment_id).filter(Boolean).sort();
}

function baselineEntry(item) {
  return {
    status: item.status,
    earliest_established_due_date: item.earliest_established_due_date,
    enrollment_ids: enrollmentIds(item),
    current_public_medicare_enrollment_file_match: item.current_public_medicare_enrollment_file_match === true,
    medicare_enrollment_ids: medicareEnrollmentIds(item),
  };
}

export function monitorStorageName(userId) {
  const owner = String(userId || "local-development");
  return `medicare-revalidation-${sha256(owner).slice(0, 24)}`;
}

export function monitorBaselineKey(items) {
  const roster = items.map((item) => item.npi).sort().join(",");
  return `BASELINE_${sha256(roster).slice(0, 32).toUpperCase()}`;
}

export function buildRevalidationBaseline(items, source, checkedAt) {
  const revalidationSource = source?.revalidation || source || {};
  const medicareEnrollmentSource = source?.medicare_enrollment || {};
  return {
    schema_version: MONITOR_SCHEMA_VERSION,
    saved_at: checkedAt,
    source_data_file_sha1: revalidationSource.data_file_sha1 || null,
    medicare_enrollment_source_data_file_sha1: medicareEnrollmentSource.data_file_sha1 || null,
    entries: Object.fromEntries(items.map((item) => [item.npi, baselineEntry(item)])),
  };
}

export function compareRevalidationItems(items, previousBaseline) {
  const previousEntries = [1, MONITOR_SCHEMA_VERSION].includes(previousBaseline?.schema_version)
    ? previousBaseline.entries || {}
    : null;

  return items.map((item) => {
    const previous = previousEntries?.[item.npi] || null;
    if (!previousEntries || !previous) {
      return {
        ...item,
        change_status: "baseline",
        changed_fields: [],
        previous_status: null,
        previous_earliest_established_due_date: null,
      };
    }

    const changedFields = [];
    if (previous.status !== item.status) changedFields.push("status");
    if (previous.earliest_established_due_date !== item.earliest_established_due_date) changedFields.push("earliest_established_due_date");
    if (JSON.stringify(previous.enrollment_ids || []) !== JSON.stringify(enrollmentIds(item))) changedFields.push("enrollment_ids");
    if ((previous.current_public_medicare_enrollment_file_match === true) !== (item.current_public_medicare_enrollment_file_match === true)) changedFields.push("medicare_enrollment_match");
    if (JSON.stringify(previous.medicare_enrollment_ids || []) !== JSON.stringify(medicareEnrollmentIds(item))) changedFields.push("medicare_enrollment_ids");

    let changeStatus = "unchanged";
    if (previous.status === "not_on_current_public_list" && item.status !== "not_on_current_public_list") changeStatus = "newly_listed";
    else if (previous.status !== "not_on_current_public_list" && item.status === "not_on_current_public_list") changeStatus = "no_longer_listed";
    else if (changedFields.includes("earliest_established_due_date")) changeStatus = "due_date_changed";
    else if (changedFields.includes("status")) changeStatus = "status_changed";
    else if (changedFields.includes("enrollment_ids")) changeStatus = "enrollment_changed";
    else if (changedFields.includes("medicare_enrollment_match") || changedFields.includes("medicare_enrollment_ids")) changeStatus = "medicare_enrollment_changed";

    return {
      ...item,
      change_status: changeStatus,
      changed_fields: changedFields,
      previous_status: previous.status,
      previous_earliest_established_due_date: previous.earliest_established_due_date,
    };
  });
}

export function validNpi(value) {
  if (!/^\d{10}$/.test(value)) return false;
  const digits = `80840${value}`.split("").map(Number);
  const sum = digits.reduce((total, digit, index) => {
    if ((digits.length - index) % 2 === 0) {
      const doubled = digit * 2;
      return total + (doubled > 9 ? doubled - 9 : doubled);
    }
    return total + digit;
  }, 0);
  return sum % 10 === 0;
}

export function normalizeNpis(input) {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/[\s,;]+/)
      : [];
  const npis = [...new Set(raw.map((value) => String(value).replace(/\D/g, "")).filter(Boolean))];
  if (!npis.length) throw new Error("Enter at least one 10-digit NPI.");
  if (npis.length > MAX_NPIS) throw new Error(`Enter no more than ${MAX_NPIS} unique NPIs.`);
  const invalid = npis.filter((npi) => !validNpi(npi));
  if (invalid.length) {
    throw new Error(`Fix invalid NPI check digits before running: ${invalid.join(", ")}. Invalid NPIs are rejected before any paid result is created.`);
  }
  return npis;
}

function text(row, index, header) {
  return String(row[index[header]] ?? "").trim();
}

export async function lookupRevalidationNpis(input, options = {}) {
  const npis = normalizeNpis(input);
  const fetchImpl = options.fetchImpl || fetch;
  const records = new Map();
  let source = {
    data_file_url: null,
    data_file_sha1: null,
    data_file_modified_at: null,
    total_rows: null,
  };

  for (let start = 0; start < npis.length; start += 25) {
    const batch = npis.slice(start, start + 25);
    const query = new URLSearchParams({
      _table: "due_date_list",
      _source: "revalidation_due_date_list",
      size: "5000",
      offset: "0",
    });
    query.set("filter[roster][group][conjunction]", "OR");
    for (const [position, npi] of batch.entries()) {
      const name = `npi_${position}`;
      query.set(`filter[${name}][condition][path]`, "npi_list");
      query.set(`filter[${name}][condition][operator]`, "CONTAINS");
      query.set(`filter[${name}][condition][value]`, npi);
      query.set(`filter[${name}][condition][memberOf]`, "roster");
    }

    const response = await fetchImpl(`${CMS_REVALIDATION_API}?${query}`, {
      headers: {
        accept: "application/json",
        "user-agent": "ActableSite-Medicare-Revalidation-Apify-Actor/1.0",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`The current CMS revalidation source returned HTTP ${response.status}.`);
    const payload = await response.json();
    const headers = payload.meta?.headers || [];
    if (payload.meta?.success !== true || !Array.isArray(payload.data) || !headers.includes("npi_list") || !headers.includes("due_date")) {
      throw new Error("The current CMS revalidation response did not match the expected schema.");
    }
    const index = Object.fromEntries(headers.map((header, position) => [header, position]));

    for (const row of payload.data) {
      const npiList = text(row, index, "npi_list").split(",").map((value) => value.trim()).filter(Boolean);
      const matchingNpis = batch.filter((npi) => npiList.includes(npi));
      if (!matchingNpis.length) continue;
      const firstName = text(row, index, "First Name");
      const lastName = text(row, index, "Last Name");
      const organization = text(row, index, "Organization Name");
      const entry = {
        enrollment_id: text(row, index, "Enrollment ID"),
        provider_name: organization || [firstName, lastName].filter(Boolean).join(" "),
        state: text(row, index, "Enrollment State Code"),
        enrollment_type: text(row, index, "Provider Type Text"),
        specialty: text(row, index, "Enrollment Specialty"),
        revalidation_due_date: text(row, index, "due_date") || null,
        adjusted_due_date: text(row, index, "adjusted_due_date") || null,
      };
      for (const npi of matchingNpis) {
        const prior = records.get(npi) || [];
        if (!prior.some((candidate) => candidate.enrollment_id === entry.enrollment_id)) records.set(npi, [...prior, entry]);
      }
    }

    const modified = payload.meta?.data_file_meta_data?.csvFileModifiedTime;
    const batchSource = {
      data_file_url: payload.meta?.data_file_url ? `https://data.cms.gov${payload.meta.data_file_url}` : null,
      data_file_sha1: payload.meta?.data_file_meta_data?.csvFileSHA1 || null,
      data_file_modified_at: typeof modified === "number" ? new Date(modified * 1000).toISOString() : null,
      total_rows: typeof payload.meta?.total_rows === "number" ? payload.meta.total_rows : null,
    };
    if (source.data_file_sha1 && batchSource.data_file_sha1 !== source.data_file_sha1) {
      throw new Error("The CMS revalidation source changed during this lookup. Run it again against one source revision.");
    }
    source = batchSource;
  }

  const checkedAt = (options.now || (() => new Date()))().toISOString();
  const items = npis.map((npi) => {
    const enrollments = (records.get(npi) || []).sort((left, right) => `${left.revalidation_due_date || "9999"}:${left.enrollment_id}`.localeCompare(`${right.revalidation_due_date || "9999"}:${right.enrollment_id}`));
    const establishedDates = enrollments.flatMap((entry) => [entry.adjusted_due_date, entry.revalidation_due_date]).filter(Boolean).sort();
    return {
      npi,
      status: enrollments.length === 0 ? "not_on_current_public_list" : establishedDates.length ? "date_established" : "tbd",
      earliest_established_due_date: establishedDates[0] || null,
      enrollment_count: enrollments.length,
      enrollments,
      checked_at: checkedAt,
      source_data_file_sha1: source.data_file_sha1,
      source_data_file_modified_at: source.data_file_modified_at,
    };
  });

  return {
    checked_at: checkedAt,
    source: {
      official_tool_url: CMS_REVALIDATION_TOOL_URL,
      dataset_url: CMS_REVALIDATION_DATASET_URL,
      ...source,
    },
    items,
    limitations: [
      "A blank due date means CMS has not established a revalidation due date for that enrollment in the current public list.",
      "A public due date is not confirmation that a revalidation was submitted, received, accepted, or completed.",
      "Use PECOS and the responsible enrollment contractor for official submission and case status.",
    ],
  };
}

async function readEnrollmentMetadata(fetchImpl) {
  const response = await fetchImpl(`${CMS_ENROLLMENT_DATA_VIEWER}?size=1&offset=0`, {
    headers: {
      accept: "application/json",
      "user-agent": "ActableSite-Medicare-Revalidation-Apify-Actor/1.1",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`The current CMS enrollment source returned HTTP ${response.status}.`);
  const payload = await response.json();
  const headers = payload.meta?.headers || [];
  if (payload.meta?.success !== true || !headers.includes("NPI") || !headers.includes("ENRLMT_ID")) {
    throw new Error("The current CMS enrollment source did not match the expected schema.");
  }
  const modified = payload.meta?.data_file_meta_data?.csvFileModifiedTime;
  return {
    dataset_url: CMS_ENROLLMENT_DATASET_URL,
    data_file_url: payload.meta?.data_file_url ? `https://data.cms.gov${payload.meta.data_file_url}` : null,
    data_file_name: payload.meta?.data_file_name || null,
    data_file_sha1: payload.meta?.data_file_meta_data?.csvFileSHA1 || null,
    data_file_modified_at: typeof modified === "number" ? new Date(modified * 1000).toISOString() : null,
    total_rows: typeof payload.meta?.total_rows === "number" ? payload.meta.total_rows : null,
  };
}

export async function lookupMedicareEnrollmentNpis(input, options = {}) {
  const npis = normalizeNpis(input);
  const fetchImpl = options.fetchImpl || fetch;
  const records = new Map();
  const metadataPromise = readEnrollmentMetadata(fetchImpl);

  for (let start = 0; start < npis.length; start += 25) {
    const batch = npis.slice(start, start + 25);
    const query = new URLSearchParams({ size: "5000", offset: "0" });
    query.set("filter[roster][group][conjunction]", "OR");
    for (const [position, npi] of batch.entries()) {
      const name = `npi_${position}`;
      query.set(`filter[${name}][condition][path]`, "NPI");
      query.set(`filter[${name}][condition][operator]`, "=");
      query.set(`filter[${name}][condition][value]`, npi);
      query.set(`filter[${name}][condition][memberOf]`, "roster");
    }

    const response = await fetchImpl(`${CMS_ENROLLMENT_DATA_API}?${query}`, {
      headers: {
        accept: "application/json",
        "user-agent": "ActableSite-Medicare-Revalidation-Apify-Actor/1.1",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`The current CMS enrollment source returned HTTP ${response.status}.`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.some((row) => typeof row?.NPI !== "string" || typeof row?.ENRLMT_ID !== "string")) {
      throw new Error("The current CMS enrollment source did not match the expected schema.");
    }

    for (const row of rows) {
      const npi = String(row.NPI || "");
      if (!batch.includes(npi)) continue;
      const firstName = String(row.FIRST_NAME || "").trim();
      const middleName = String(row.MDL_NAME || "").trim();
      const lastName = String(row.LAST_NAME || "").trim();
      const organization = String(row.ORG_NAME || "").trim();
      const entry = {
        enrollment_id: String(row.ENRLMT_ID || ""),
        pecos_associate_control_id: String(row.PECOS_ASCT_CNTL_ID || ""),
        multiple_npi_flag: String(row.MULTIPLE_NPI_FLAG || "").toUpperCase() === "Y",
        provider_type_code: String(row.PROVIDER_TYPE_CD || ""),
        provider_type: String(row.PROVIDER_TYPE_DESC || ""),
        state: String(row.STATE_CD || ""),
        provider_name: organization || [firstName, middleName, lastName].filter(Boolean).join(" "),
      };
      const prior = records.get(npi) || [];
      if (!prior.some((candidate) => candidate.enrollment_id === entry.enrollment_id)) records.set(npi, [...prior, entry]);
    }
  }

  for (const entries of records.values()) {
    entries.sort((left, right) => `${left.provider_type}:${left.state}:${left.enrollment_id}`.localeCompare(`${right.provider_type}:${right.state}:${right.enrollment_id}`));
  }
  const checkedAt = (options.now || (() => new Date()))().toISOString();
  return {
    checked_at: checkedAt,
    source: await metadataPromise,
    items: npis.map((npi) => ({
      npi,
      current_public_medicare_enrollment_file_match: (records.get(npi) || []).length > 0,
      medicare_enrollment_status: (records.get(npi) || []).length > 0 ? "public_file_match" : "no_public_file_match",
      medicare_enrollment_count: (records.get(npi) || []).length,
      medicare_enrollment_records: records.get(npi) || [],
    })),
    limitations: [
      "The Medicare enrollment file is a quarterly point-in-time public extract, not live PECOS status.",
      "A match means the NPI appears in the current public ENROLLMENT file of approved billing or order-and-refer enrollments; it is not proof of complete credentialing or current billing privileges.",
      "For enrollments with multiple NPIs, CMS lists one NPI in the ENROLLMENT file and publishes additional NPIs in a separate relational file. A no-match result is not conclusive for an additional NPI.",
      "Use PECOS and the responsible enrollment contractor for consequential status decisions.",
    ],
  };
}

export async function lookupMedicareVerificationNpis(input, options = {}) {
  const [revalidation, medicareEnrollment] = await Promise.all([
    lookupRevalidationNpis(input, options),
    lookupMedicareEnrollmentNpis(input, options),
  ]);
  const enrollmentByNpi = new Map(medicareEnrollment.items.map((item) => [item.npi, item]));
  return {
    checked_at: revalidation.checked_at,
    sources: {
      revalidation: revalidation.source,
      medicare_enrollment: medicareEnrollment.source,
    },
    items: revalidation.items.map((item) => ({
      ...item,
      revalidation_enrollment_count: item.enrollment_count,
      ...enrollmentByNpi.get(item.npi),
      medicare_enrollment_source_data_file_sha1: medicareEnrollment.source.data_file_sha1,
      medicare_enrollment_source_data_file_modified_at: medicareEnrollment.source.data_file_modified_at,
    })),
    limitations: [...revalidation.limitations, ...medicareEnrollment.limitations],
  };
}
