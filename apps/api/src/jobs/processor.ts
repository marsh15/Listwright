import { randomUUID } from "node:crypto";

import { extractBatch } from "../ai/openai.js";
import { normalizeBatchResult } from "../validation/normalize.js";
import { updateCounts } from "./store.js";
import type { ImportBatch, ImportJob, SourceRow } from "../types.js";

export function createBatches(chunks: SourceRow[][]): ImportBatch[] {
  return chunks.map((sourceRows, index) => ({
    id: randomUUID(),
    index,
    status: "queued",
    rowStart: sourceRows[0]?.rowNumber ?? 0,
    rowEnd: sourceRows[sourceRows.length - 1]?.rowNumber ?? 0,
    attempts: 0,
    sourceRows,
  }));
}

export function startJobProcessing(job: ImportJob, batches = job.batches) {
  queueMicrotask(() => {
    void processBatches(job, batches);
  });
}

async function processBatches(job: ImportJob, batches: ImportBatch[]) {
  job.status = "processing";
  updateCounts(job);

  for (const batch of batches) {
    batch.status = "processing";
    batch.attempts += 1;
    delete batch.error;
    updateCounts(job);

    try {
      const aiResult = await extractBatch(batch.sourceRows, batch.id);
      const normalized = normalizeBatchResult(aiResult, batch.sourceRows, batch.id);
      job.records.push(...normalized.imported);
      job.skippedRecords.push(...normalized.skipped);
      job.mappingNotes.push(...normalized.mappingNotes);
      batch.status = "completed";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown batch failure";
      batch.status = "failed";
      batch.error = message;
      job.errors.push({
        batchId: batch.id,
        message,
        retryable: true,
        createdAt: new Date().toISOString(),
      });
    }

    updateCounts(job);
  }
}
