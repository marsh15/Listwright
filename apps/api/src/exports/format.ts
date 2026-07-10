import { CRM_CSV_COLUMNS, type CrmRecord, type JsonExport } from "@listwright/shared";

import { summarizeJob } from "../jobs/store.js";
import type { ImportJob } from "../types.js";

export function formatCrmCsv(records: CrmRecord[]) {
  const rows = [
    CRM_CSV_COLUMNS.join(","),
    ...records.map((record) => CRM_CSV_COLUMNS.map((column) => quoteCsv(record[column])).join(",")),
  ];
  return `${rows.join("\n")}\n`;
}

export function buildJsonExport(job: ImportJob): JsonExport {
  return {
    exportedAt: new Date().toISOString(),
    job: summarizeJob(job),
    records: job.records,
    skippedRecords: job.skippedRecords,
    mappingNotes: job.mappingNotes,
  };
}

function quoteCsv(value: string) {
  const safe = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
