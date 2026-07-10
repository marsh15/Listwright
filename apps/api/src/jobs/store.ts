import type { ImportJob } from "../types.js";

export const jobsById = new Map<string, ImportJob>();

export function summarizeJob(job: ImportJob) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    fileName: job.fileName,
    rowLimit: job.rowLimit,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    importedCount: job.importedCount,
    skippedCount: job.skippedCount,
    batchCount: job.batchCount,
    completedBatches: job.completedBatches,
    failedBatches: job.failedBatches,
    errors: job.errors,
    mappingNotes: job.mappingNotes,
  };
}

export function updateCounts(job: ImportJob) {
  job.completedBatches = job.batches.filter((batch) => batch.status === "completed").length;
  job.failedBatches = job.batches.filter((batch) => batch.status === "failed").length;
  job.processedRows = job.batches
    .filter((batch) => batch.status === "completed" || batch.status === "failed")
    .reduce((sum, batch) => sum + batch.sourceRows.length, 0);
  job.importedCount = job.records.length;
  job.skippedCount = job.skippedRecords.length;
  job.updatedAt = new Date().toISOString();

  if (job.completedBatches === job.batchCount && job.failedBatches === 0) {
    job.status = "completed";
  } else if (job.completedBatches + job.failedBatches === job.batchCount && job.failedBatches > 0) {
    job.status = job.completedBatches > 0 ? "partial_failed" : "failed";
  } else if (job.status !== "queued") {
    job.status = "processing";
  }
}
