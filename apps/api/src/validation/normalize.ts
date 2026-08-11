import {
  ALLOWED_CRM_STATUSES,
  ALLOWED_DATA_SOURCES,
  CrmRecordSchema,
  ImportedRecordSchema,
  MappingNoteSchema,
  SkippedRecordSchema,
  type CrmRecord,
  type ImportedRecord,
  type MappingNote,
  type SkippedRecord,
} from "@listwright/shared";
import { randomUUID } from "node:crypto";

import type { AiBatchResult, AiCrmRecord, SourceRow } from "../types.js";

type AllowedCrmStatus = (typeof ALLOWED_CRM_STATUSES)[number];
type AllowedDataSource = (typeof ALLOWED_DATA_SOURCES)[number];

export function normalizeBatchResult(result: AiBatchResult, rows: SourceRow[], batchId: string) {
  const rowsByNumber = new Map(rows.map((row) => [row.rowNumber, row]));
  const imported: ImportedRecord[] = [];
  const skipped: SkippedRecord[] = [];
  const mappingNoteIdBySourceId = new Map<string, string>();
  const mappingNotes = dedupeMappingNotes(result.mappingNotes.map((note, index) => {
    const sourceId = clean(note.id) || randomUUID();
    const normalizedId = `${batchId}:${index + 1}:${sourceId}`;
    if (!mappingNoteIdBySourceId.has(sourceId)) mappingNoteIdBySourceId.set(sourceId, normalizedId);

    return MappingNoteSchema.parse({
      id: normalizedId,
      scope: note.scope || "batch",
      batchId,
      sourceColumn: note.sourceColumn,
      targetField: note.targetField,
      note: note.note,
      confidence: clamp(note.confidence ?? 0.7),
    });
  }));

  const skippedRows = new Set<number>();
  for (const aiSkipped of result.skippedRecords) {
    const row = rowsByNumber.get(aiSkipped.rowNumber);
    if (!row) continue;
    const skippedRecord = SkippedRecordSchema.parse({
      id: randomUUID(),
      rowNumber: row.rowNumber,
      originalRow: row.raw,
      reason: aiSkipped.reason || "Skipped by AI extraction",
      warnings: unique([...(aiSkipped.warnings ?? []), ...row.deterministicSignals.warnings]),
    });
    skipped.push(skippedRecord);
    skippedRows.add(row.rowNumber);
  }

  for (const row of rows) {
    if (skippedRows.has(row.rowNumber)) continue;
    const aiRecord = result.records.find((record) => record.rowNumber === row.rowNumber);
    const normalized = normalizeCrm(aiRecord?.crm ?? {}, row);

    if (!normalized.email && !normalized.mobile_without_country_code) {
      skipped.push(SkippedRecordSchema.parse({
        id: randomUUID(),
        rowNumber: row.rowNumber,
        originalRow: row.raw,
        reason: "Missing both email and mobile",
        warnings: row.deterministicSignals.warnings,
      }));
      continue;
    }

    const parsed = CrmRecordSchema.safeParse(normalized);
    if (!parsed.success) {
      skipped.push(SkippedRecordSchema.parse({
        id: randomUUID(),
        rowNumber: row.rowNumber,
        originalRow: row.raw,
        reason: parsed.error.issues.map((issue) => issue.message).join("; "),
        warnings: row.deterministicSignals.warnings,
      }));
      continue;
    }

    const mappingNoteIds = aiRecord?.mappingNoteIds === undefined
      ? mappingNotes.map((note) => note.id)
      : unique(aiRecord.mappingNoteIds.map((id) => mappingNoteIdBySourceId.get(clean(id)) ?? ""));

    imported.push(ImportedRecordSchema.parse({
      id: randomUUID(),
      rowNumber: row.rowNumber,
      originalRow: row.raw,
      crm: parsed.data,
      confidence: clamp(aiRecord?.confidence ?? 0.76),
      warnings: unique([...(aiRecord?.warnings ?? []), ...row.deterministicSignals.warnings]),
      mappingNoteIds,
    }));
  }

  return { imported, skipped, mappingNotes };
}

function normalizeCrm(ai: AiCrmRecord, row: SourceRow): CrmRecord {
  const firstEmail = row.deterministicSignals.emails[0] || clean(ai.email);
  const firstPhone = row.deterministicSignals.phones[0] || clean(ai.mobile_without_country_code);
  const digits = firstPhone.replace(/\D/g, "");
  const mobile = digits.length > 10 ? digits.slice(-10) : digits;
  const extraContacts = unique([
    ...row.deterministicSignals.emails.slice(1),
    ...row.deterministicSignals.phones.slice(1),
  ]);
  const crmNote = [clean(ai.crm_note), extraContacts.length ? `Extra contacts: ${extraContacts.join(", ")}` : ""]
    .filter(Boolean)
    .join(" | ");
  const createdAt = parseableOrBlank(clean(ai.created_at) || row.deterministicSignals.dates[0] || "");

  return {
    created_at: createdAt,
    name: clean(ai.name),
    email: firstEmail,
    country_code: clean(ai.country_code) || row.deterministicSignals.possibleCountryCodes[0] || "",
    mobile_without_country_code: mobile,
    company: clean(ai.company),
    city: clean(ai.city),
    state: clean(ai.state),
    country: clean(ai.country),
    lead_owner: clean(ai.lead_owner),
    crm_status: allowedStatusOrBlank(clean(ai.crm_status)),
    crm_note: crmNote,
    data_source: allowedSourceOrBlank(clean(ai.data_source)),
    possession_time: clean(ai.possession_time),
    description: clean(ai.description),
  };
}

function clean(value: unknown) {
  return String(value ?? "").replace(/\r?\n/g, " ").trim();
}

function parseableOrBlank(value: string) {
  return value && !Number.isNaN(new Date(value).getTime()) ? value : "";
}

function allowedStatusOrBlank(value: string): AllowedCrmStatus {
  const normalized = value.toLowerCase().replace(/[\s-]+/g, "_");
  return ALLOWED_CRM_STATUSES.includes(normalized as AllowedCrmStatus) ? normalized as AllowedCrmStatus : "";
}

function allowedSourceOrBlank(value: string): AllowedDataSource {
  const normalized = value.toLowerCase().replace(/[\s-]+/g, "_");
  return ALLOWED_DATA_SOURCES.includes(normalized as AllowedDataSource) ? normalized as AllowedDataSource : "";
}

function clamp(value: number) {
  if (Number.isNaN(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function unique(values: string[]) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function dedupeMappingNotes(notes: MappingNote[]) {
  const seen = new Set<string>();
  return notes.filter((note) => {
    const key = `${note.scope}:${note.batchId}:${note.sourceColumn}:${note.targetField}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
