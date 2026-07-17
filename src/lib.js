export const CMS_REVALIDATION_DATASET_ID = "4c6a7709-84b0-4514-9308-4a41846f5682";
export const CMS_REVALIDATION_API = `https://data.cms.gov/data-api/v1/dataset/${CMS_REVALIDATION_DATASET_ID}/data-viewer`;
export const CMS_REVALIDATION_TOOL_URL = "https://data.cms.gov/tools/medicare-revalidation-list";
export const CMS_REVALIDATION_DATASET_URL = "https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/revalidation-due-date-list";
export const MAX_NPIS = 100;

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
