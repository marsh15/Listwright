import cors from "cors";
import express from "express";
import multer from "multer";
import { DEFAULT_IMPORT_ROW_LIMIT, HealthResponseSchema } from "@listwright/shared";
import { randomUUID } from "node:crypto";

import { buildJsonExport, formatCrmCsv } from "./exports/format.js";
import { createBatches, startJobProcessing } from "./jobs/processor.js";
import { jobsById, summarizeJob, updateCounts } from "./jobs/store.js";
import { parseCsvBuffer } from "./parsing/csv.js";
import { chunkRows, preprocessRows } from "./parsing/preprocess.js";
import type { ImportJob } from "./types.js";

export type CreateAppOptions = {
  rowLimit?: number;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, fields: 2, files: 1 },
  });
  const configuredRowLimit = options.rowLimit ?? Number(process.env.IMPORT_ROW_LIMIT ?? DEFAULT_IMPORT_ROW_LIMIT);
  const rowLimit = Number.isInteger(configuredRowLimit) && configuredRowLimit > 0
    ? Math.min(configuredRowLimit, DEFAULT_IMPORT_ROW_LIMIT)
    : DEFAULT_IMPORT_ROW_LIMIT;

  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? "http://localhost:3000",
  }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json(getHealthResponse());
  });

  app.post("/api/imports", upload.single("file"), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Upload a CSV file in multipart field `file`." });
      return;
    }

    const fileName = req.file.originalname || "upload.csv";
    if (!fileName.toLowerCase().endsWith(".csv")) {
      res.status(415).json({ error: "Only .csv files are supported." });
      return;
    }

    try {
      const rows = parseCsvBuffer(req.file.buffer, rowLimit);
      const sourceRows = preprocessRows(rows);
      const batches = createBatches(chunkRows(sourceRows));
      const now = new Date().toISOString();
      const job: ImportJob = {
        id: randomUUID(),
        status: "queued",
        createdAt: now,
        updatedAt: now,
        fileName: fileName.replace(/[\r\n"\\/]/g, "_").slice(0, 180),
        rowLimit,
        totalRows: sourceRows.length,
        processedRows: 0,
        importedCount: 0,
        skippedCount: 0,
        batchCount: batches.length,
        completedBatches: 0,
        failedBatches: 0,
        errors: rows.length >= rowLimit ? [{
          message: `Demo-safe row limit applied: only the first ${rowLimit} rows were processed.`,
          retryable: false,
          createdAt: now,
        }] : [],
        batches,
        records: [],
        skippedRecords: [],
        mappingNotes: [],
      };

      jobsById.set(job.id, job);
      startJobProcessing(job);
      res.status(202).json({ jobId: job.id, status: job.status, rowLimit });
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV parsing failed";
      res.status(400).json({ error: message });
    }
  });

  app.get("/api/imports/:jobId", (req, res) => {
    const job = getJob(req.params.jobId, res);
    if (!job) return;
    res.json({ job: summarizeJob(job) });
  });

  app.get("/api/imports/:jobId/records", (req, res) => {
    const job = getJob(req.params.jobId, res);
    if (!job) return;
    const page = paginate(job.records, req.query.page, req.query.limit);
    res.json({ job: summarizeJob(job), pagination: page.pagination, records: page.items });
  });

  app.get("/api/imports/:jobId/skipped", (req, res) => {
    const job = getJob(req.params.jobId, res);
    if (!job) return;
    const page = paginate(job.skippedRecords, req.query.page, req.query.limit);
    res.json({ job: summarizeJob(job), pagination: page.pagination, records: page.items });
  });

  app.post("/api/imports/:jobId/retry", (req, res) => {
    const job = getJob(req.params.jobId, res);
    if (!job) return;
    const failed = job.batches.filter((batch) => batch.status === "failed");
    if (failed.length === 0) {
      res.json({ job: summarizeJob(job), retriedBatches: 0 });
      return;
    }

    for (const batch of failed) batch.status = "queued";
    updateCounts(job);
    startJobProcessing(job, failed);
    res.status(202).json({ job: summarizeJob(job), retriedBatches: failed.length });
  });

  app.get("/api/imports/:jobId/export.csv", (req, res) => {
    const job = getJob(req.params.jobId, res);
    if (!job) return;
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", `attachment; filename="${job.fileName.replace(/\.csv$/i, "")}-listwright.csv"`);
    res.send(formatCrmCsv(job.records.map((record) => record.crm)));
  });

  app.get("/api/imports/:jobId/export.json", (req, res) => {
    const job = getJob(req.params.jobId, res);
    if (!job) return;
    res.header("Content-Disposition", `attachment; filename="${job.fileName.replace(/\.csv$/i, "")}-listwright.json"`);
    res.json(buildJsonExport(job));
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "CSV files must be 5 MB or smaller."
        : "Upload one CSV file only.";
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: "The import service could not process this request." });
  });

  return app;
}

export function getHealthResponse() {
  return HealthResponseSchema.parse({
    status: "ok",
    service: "listwright-api",
  });
}

export function getJob(jobId: string | undefined, res: express.Response) {
  const job = jobId ? jobsById.get(jobId) : undefined;
  if (!job) {
    res.status(404).json({ error: "Import job not found. In-memory jobs reset on server restart." });
    return undefined;
  }
  return job;
}

export function paginate<T>(items: T[], pageValue: unknown, limitValue: unknown) {
  const page = Math.max(1, Number(pageValue ?? 1) || 1);
  const limit = Math.min(200, Math.max(1, Number(limitValue ?? 100) || 100));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  };
}
