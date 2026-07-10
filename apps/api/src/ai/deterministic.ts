import {
  ALLOWED_CRM_STATUSES,
  ALLOWED_DATA_SOURCES,
  CRM_CSV_COLUMNS,
} from "@listwright/shared";

import type { AiBatchResult, AiCrmRecord, SourceRow } from "../types.js";

const fieldHints: Record<keyof AiCrmRecord, string[]> = {
  created_at: ["created", "date", "timestamp", "added", "enquiry date"],
  name: ["name", "full name", "customer", "lead"],
  email: ["email", "mail"],
  country_code: ["country code", "dial", "isd"],
  mobile_without_country_code: ["mobile", "phone", "contact", "whatsapp", "cell"],
  company: ["company", "organization", "organisation", "builder"],
  city: ["city", "town"],
  state: ["state", "province"],
  country: ["country"],
  lead_owner: ["owner", "agent", "sales", "assigned"],
  crm_status: ["status", "stage"],
  crm_note: ["note", "remark", "comment"],
  data_source: ["source", "channel", "campaign"],
  possession_time: ["possession", "handover", "timeline"],
  description: ["description", "requirement", "message", "query"],
};

export function extractDeterministically(rows: SourceRow[], batchId: string): AiBatchResult {
  const mappingNotes = buildMappingNotes(rows, batchId);
  const records = [];
  const skippedRecords = [];

  for (const row of rows) {
    const crm = buildCrm(row);
    if (!crm.email && !crm.mobile_without_country_code) {
      skippedRecords.push({
        rowNumber: row.rowNumber,
        reason: "Missing both email and mobile",
        warnings: row.deterministicSignals.warnings,
      });
      continue;
    }

    records.push({
      rowNumber: row.rowNumber,
      crm,
      confidence: row.deterministicSignals.warnings.length > 0 ? 0.72 : 0.84,
      warnings: row.deterministicSignals.warnings,
      mappingNoteIds: mappingNotes.map((note) => note.id).filter(Boolean) as string[],
    });
  }

  return { records, skippedRecords, mappingNotes };
}

function buildCrm(row: SourceRow): AiCrmRecord {
  const raw = row.raw;
  const pick = (field: keyof AiCrmRecord) => pickByHeader(raw, fieldHints[field]) ?? "";
  const status = normalizeStatus(pick("crm_status") || row.deterministicSignals.likelyStatuses[0] || "");
  const source = normalizeSource(pick("data_source") || row.deterministicSignals.likelyDataSources[0] || "");
  const phone = row.deterministicSignals.phones[0] ?? pick("mobile_without_country_code");
  const digits = phone.replace(/\D/g, "");
  const mobile = digits.length > 10 ? digits.slice(-10) : digits;
  const countryCode = pick("country_code") || row.deterministicSignals.possibleCountryCodes[0] || "";

  return {
    created_at: pick("created_at") || row.deterministicSignals.dates[0] || "",
    name: pick("name"),
    email: row.deterministicSignals.emails[0] ?? pick("email"),
    country_code: countryCode,
    mobile_without_country_code: mobile,
    company: pick("company"),
    city: pick("city"),
    state: pick("state"),
    country: pick("country"),
    lead_owner: pick("lead_owner"),
    crm_status: status,
    crm_note: pick("crm_note"),
    data_source: source,
    possession_time: pick("possession_time"),
    description: pick("description"),
  };
}

function buildMappingNotes(rows: SourceRow[], batchId: string) {
  const headers = Object.keys(rows[0]?.raw ?? {});
  return headers.flatMap((header) => {
    const lower = header.toLowerCase();
    const target = CRM_CSV_COLUMNS.find((column) => fieldHints[column].some((hint) => lower.includes(hint)));
    if (!target) return [];
    return [{
      id: `${batchId}-${target}-${header}`.replace(/[^a-z0-9_-]/gi, "_"),
      scope: "batch" as const,
      batchId,
      sourceColumn: header,
      targetField: target,
      note: `Detected "${header}" as ${target} from column header and value patterns.`,
      confidence: 0.78,
    }];
  });
}

function pickByHeader(row: Record<string, string>, hints: string[]) {
  const entry = Object.entries(row).find(([key]) => {
    const normalized = key.toLowerCase().replace(/[_-]/g, " ");
    return hints.some((hint) => normalized.includes(hint));
  });
  return entry?.[1]?.trim();
}

function normalizeStatus(value: string) {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, "_");
  const allowed = ALLOWED_CRM_STATUSES.find((status) => status.toLowerCase() === normalized);
  return allowed ?? "";
}

function normalizeSource(value: string) {
  const normalized = value.toLowerCase().trim().replace(/[\s-]+/g, "_");
  const allowed = ALLOWED_DATA_SOURCES.find((source) => source.toLowerCase() === normalized);
  return allowed ?? "";
}
