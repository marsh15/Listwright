import assert from "node:assert/strict";
import { test } from "node:test";

import { ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES, CRM_CSV_COLUMNS, type CrmRecord, type ImportedRecord } from "@listwright/shared";

import { getHealthResponse, paginate, parseCorsOrigin } from "./app.js";
import { formatCrmCsv } from "./exports/format.js";
import { extractDeterministically } from "./ai/deterministic.js";
import { processBatches, startJobProcessing } from "./jobs/processor.js";
import { updateCounts } from "./jobs/store.js";
import { parseCsvBuffer } from "./parsing/csv.js";
import { chunkRows, preprocessRows } from "./parsing/preprocess.js";
import { normalizeBatchResult } from "./validation/normalize.js";
import type { ImportBatch, ImportJob, SourceRow } from "./types.js";

test("health route exposes the Listwright API identity", async () => {
  assert.deepEqual(getHealthResponse(), {
    status: "ok",
    service: "listwright-api",
  });
});

test("CORS normalizes configured frontend origins with trailing slashes", () => {
  assert.deepEqual(
    parseCorsOrigin("https://listwright-web.vercel.app/, https://preview.example.com/"),
    ["https://listwright-web.vercel.app", "https://preview.example.com"],
  );
});

test("CSV parsing enforces the row limit and keeps parseable rows", () => {
  const rows = parseCsvBuffer(Buffer.from("name,email\nA,a@example.com\nB,b@example.com\n"), 1);

  assert.deepEqual(rows, [{ name: "A", email: "a@example.com" }]);
});

test("CSV parsing rejects files with no data rows", () => {
  assert.throws(
    () => parseCsvBuffer(Buffer.from("name,email\n"), 100),
    /at least one data row/,
  );
});

test("pagination clamps invalid input and caps large limits", () => {
  const page = paginate([1, 2, 3], "0", "999");

  assert.deepEqual(page.pagination, { page: 1, limit: 200, total: 3, totalPages: 1 });
  assert.deepEqual(page.items, [1, 2, 3]);
});

test("normalization skips rows missing both email and mobile", () => {
  const [row] = preprocessRows([{ name: "No Contact", notes: "Needs manual lookup" }]);
  assert.ok(row);

  const result = normalizeBatchResult({ records: [], skippedRecords: [], mappingNotes: [] }, [row], "batch-1");

  assert.equal(result.imported.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.skipped[0]?.reason, "Missing both email and mobile");
});

test("normalization appends extra contacts to crm_note and validates final CRM output", () => {
  const [row] = preprocessRows([{
    name: "Priya Rao",
    contact: "priya@example.com, p.rao@example.com, +91 98765 43210, +91 91234 56789",
  }]);
  assert.ok(row);

  const result = normalizeBatchResult({
    records: [{
      rowNumber: row.rowNumber,
      crm: { name: "Priya Rao", crm_note: "VIP lead" },
      confidence: 0.9,
      warnings: [],
      mappingNoteIds: [],
    }],
    skippedRecords: [],
    mappingNotes: [],
  }, [row], "batch-1");

  assert.equal(result.imported.length, 1);
  assert.equal(result.imported[0]?.crm.email, "priya@example.com");
  assert.equal(result.imported[0]?.crm.mobile_without_country_code, "9876543210");
  assert.match(result.imported[0]?.crm.crm_note ?? "", /VIP lead/);
  assert.match(result.imported[0]?.crm.crm_note ?? "", /p\.rao@example\.com/);
  assert.match(result.imported[0]?.crm.crm_note ?? "", /9123456789/);
});

test("normalization uses the GrowEasy status and source allowlists", () => {
  assert.deepEqual(ALLOWED_CRM_STATUSES, ["", "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE"]);
  assert.deepEqual(ALLOWED_DATA_SOURCES, ["", "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"]);

  const [row] = preprocessRows([{ email: "lead@example.com", status: "new", source: "website" }]);
  assert.ok(row);
  const result = normalizeBatchResult({ records: [], skippedRecords: [], mappingNotes: [] }, [row], "batch-allowlist");

  assert.equal(result.imported[0]?.crm.crm_status, "");
  assert.equal(result.imported[0]?.crm.data_source, "");
});

test("deterministic extraction maps messy aliases and records mapping evidence", () => {
  const [row] = preprocessRows([{
    "Lead Name": "Aarav Mehta",
    "Email Address": "aarav@example.com",
    "WhatsApp Contact": "+91 98765 43210",
    "Enquiry Date": "2026-06-23",
  }]);
  assert.ok(row);

  const result = extractDeterministically([row], "batch-aliases");

  assert.equal(result.records[0]?.crm.name, "Aarav Mehta");
  assert.equal(result.records[0]?.crm.email, "aarav@example.com");
  assert.equal(result.records[0]?.crm.mobile_without_country_code, "9876543210");
  assert.equal(result.records[0]?.crm.created_at, "2026-06-23");
  assert.ok(result.mappingNotes.some((note) => note.sourceColumn === "WhatsApp Contact" && note.targetField === "mobile_without_country_code"));
});

test("CSV export preserves the exact CRM column order and escapes values", () => {
  const record = emptyCrmRecord({
    name: "Asha, Shah",
    email: "asha@example.com",
    crm_note: "Line one\nLine two",
  });

  const csv = formatCrmCsv([record]);
  const [header, data] = csv.trimEnd().split("\n");

  assert.equal(header, CRM_CSV_COLUMNS.join(","));
  assert.match(data ?? "", /"Asha, Shah"/);
  assert.match(data ?? "", /Line one Line two/);
});

test("retry processing only reprocesses failed batches and keeps completed records", async () => {
  const completedRow = makeSourceRow(2, { name: "Completed", email: "done@example.com" });
  const retryRow = makeSourceRow(3, { name: "Retry", email: "retry@example.com" });
  const existing = makeImportedRecord(completedRow, emptyCrmRecord({ name: "Completed", email: "done@example.com" }));
  const completedBatch = makeBatch("batch-complete", "completed", [completedRow]);
  const failedBatch = makeBatch("batch-failed", "failed", [retryRow]);
  const job = makeJob([completedBatch, failedBatch], [existing]);
  updateCounts(job);

  failedBatch.status = "queued";
  startJobProcessing(job, [failedBatch]);
  await waitFor(() => job.status === "completed");

  assert.equal(job.records.length, 2);
  assert.deepEqual(job.records.map((record) => record.crm.email).sort(), ["done@example.com", "retry@example.com"]);
});

test("wide CSV imports use small AI batches", () => {
  const rows = Array.from({ length: 40 }, (_, index) => makeSourceRow(index + 2, {
    email: `lead-${index}@example.com`,
  }));

  assert.deepEqual(chunkRows(rows).map((batch) => batch.length), Array(8).fill(5));
});

test("a timed-out small batch stays retryable while later AI batches continue", async () => {
  const rows = Array.from({ length: 10 }, (_, index) => makeSourceRow(index + 2, {
    name: `Lead ${index}`,
    email: `lead-${index}@example.com`,
  }));
  const batches = createTestBatches(chunkRows(rows));
  const job = makeJob(batches, []);
  const attemptedBatchIds: string[] = [];

  await processBatches(job, batches, async (batchRows, batchId) => {
    attemptedBatchIds.push(batchId);
    if (batchId === batches[0]?.id) {
      const timeout = new Error("The operation was aborted due to timeout");
      timeout.name = "TimeoutError";
      throw timeout;
    }
    return extractDeterministically(batchRows, batchId);
  });

  assert.deepEqual(attemptedBatchIds, batches.map((batch) => batch.id));
  assert.equal(job.status, "partial_failed");
  assert.equal(job.failedBatches, 1);
  assert.equal(job.completedBatches, 1);
  assert.equal(job.importedCount, 5);
  assert.equal(job.errors[0]?.retryable, true);

  const failed = batches.filter((batch) => batch.status === "failed");
  for (const batch of failed) batch.status = "queued";
  updateCounts(job);
  await processBatches(job, failed, (batchRows, batchId) => Promise.resolve(extractDeterministically(batchRows, batchId)));

  assert.equal(job.status, "completed");
  assert.equal(job.failedBatches, 0);
  assert.equal(job.importedCount, 10);
});

test("progress counts rows attempted by failed batches", () => {
  const failedRow = makeSourceRow(2, { name: "Failed", email: "failed@example.com" });
  const failedBatch = makeBatch("batch-failed-only", "failed", [failedRow]);
  const job = makeJob([failedBatch], []);

  updateCounts(job);

  assert.equal(job.processedRows, 1);
  assert.equal(job.status, "failed");
});

async function waitFor(predicate: () => boolean) {
  const start = Date.now();
  while (!predicate()) {
    assert.ok(Date.now() - start < 1000, "Timed out waiting for job processing");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function emptyCrmRecord(overrides: Partial<CrmRecord> = {}): CrmRecord {
  return {
    created_at: "",
    name: "",
    email: "",
    country_code: "",
    mobile_without_country_code: "",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "",
    crm_note: "",
    data_source: "",
    possession_time: "",
    description: "",
    ...overrides,
  };
}

function makeSourceRow(rowNumber: number, raw: Record<string, string>): SourceRow {
  const [row] = preprocessRows([raw]);
  assert.ok(row);
  return { ...row, rowNumber };
}

function makeBatch(id: string, status: ImportBatch["status"], sourceRows: SourceRow[]): ImportBatch {
  return {
    id,
    index: 0,
    status,
    rowStart: sourceRows[0]?.rowNumber ?? 0,
    rowEnd: sourceRows[sourceRows.length - 1]?.rowNumber ?? 0,
    attempts: status === "completed" ? 1 : 0,
    sourceRows,
  };
}

function createTestBatches(chunks: SourceRow[][]) {
  return chunks.map((sourceRows, index) => makeBatch(`batch-${index + 1}`, "queued", sourceRows));
}

function makeImportedRecord(row: SourceRow, crm: CrmRecord): ImportedRecord {
  return {
    id: `record-${row.rowNumber}`,
    rowNumber: row.rowNumber,
    originalRow: row.raw,
    crm,
    confidence: 0.9,
    warnings: [],
    mappingNoteIds: [],
  };
}

function makeJob(batches: ImportBatch[], records: ImportedRecord[]): ImportJob {
  const now = new Date().toISOString();
  return {
    id: "job-1",
    status: "partial_failed",
    createdAt: now,
    updatedAt: now,
    fileName: "sample.csv",
    rowLimit: 1000,
    totalRows: batches.reduce((sum, batch) => sum + batch.sourceRows.length, 0),
    processedRows: 0,
    importedCount: 0,
    skippedCount: 0,
    batchCount: batches.length,
    completedBatches: 0,
    failedBatches: 0,
    errors: [],
    batches,
    records,
    skippedRecords: [],
    mappingNotes: [],
  };
}
