import { z } from "zod";

import { ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES, IMPORT_JOB_STATUSES } from "./constants.js";

export const CsvSafeStringSchema = z.string().transform((value) => value.replace(/\r?\n/g, " ").trim());

export const ParseableDateOrBlankSchema = CsvSafeStringSchema.refine(
  (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
  "created_at must be blank or parseable by new Date(created_at)",
);

export const CrmRecordSchema = z.object({
  created_at: ParseableDateOrBlankSchema,
  name: CsvSafeStringSchema,
  email: CsvSafeStringSchema,
  country_code: CsvSafeStringSchema,
  mobile_without_country_code: CsvSafeStringSchema,
  company: CsvSafeStringSchema,
  city: CsvSafeStringSchema,
  state: CsvSafeStringSchema,
  country: CsvSafeStringSchema,
  lead_owner: CsvSafeStringSchema,
  crm_status: z.enum(ALLOWED_CRM_STATUSES),
  crm_note: CsvSafeStringSchema,
  data_source: z.enum(ALLOWED_DATA_SOURCES),
  possession_time: CsvSafeStringSchema,
  description: CsvSafeStringSchema,
});

const originalRowSchema = z.record(CsvSafeStringSchema);

export const MappingNoteSchema = z.object({
  id: CsvSafeStringSchema,
  scope: z.enum(["global", "batch"]),
  batchId: CsvSafeStringSchema.optional(),
  sourceColumn: CsvSafeStringSchema,
  targetField: CsvSafeStringSchema,
  note: CsvSafeStringSchema,
  confidence: z.number().min(0).max(1).optional(),
});

export const ImportedRecordSchema = z.object({
  id: CsvSafeStringSchema,
  rowNumber: z.number().int().positive(),
  originalRow: originalRowSchema,
  crm: CrmRecordSchema,
  confidence: z.number().min(0).max(1),
  warnings: z.array(CsvSafeStringSchema),
  mappingNoteIds: z.array(CsvSafeStringSchema),
});

export const SkippedRecordSchema = z.object({
  id: CsvSafeStringSchema,
  rowNumber: z.number().int().positive(),
  originalRow: originalRowSchema,
  reason: CsvSafeStringSchema,
  warnings: z.array(CsvSafeStringSchema),
});

export const JobErrorSchema = z.object({
  batchId: CsvSafeStringSchema.optional(),
  message: CsvSafeStringSchema,
  retryable: z.boolean(),
  createdAt: ParseableDateOrBlankSchema,
});

export const ImportJobSummarySchema = z.object({
  id: CsvSafeStringSchema,
  status: z.enum(IMPORT_JOB_STATUSES),
  createdAt: ParseableDateOrBlankSchema,
  updatedAt: ParseableDateOrBlankSchema,
  fileName: CsvSafeStringSchema,
  rowLimit: z.number().int().positive(),
  totalRows: z.number().int().nonnegative(),
  processedRows: z.number().int().nonnegative(),
  importedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  batchCount: z.number().int().nonnegative(),
  completedBatches: z.number().int().nonnegative(),
  failedBatches: z.number().int().nonnegative(),
  errors: z.array(JobErrorSchema),
  mappingNotes: z.array(MappingNoteSchema),
});

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const ImportedRecordsPageSchema = z.object({
  job: ImportJobSummarySchema,
  pagination: PaginationSchema,
  records: z.array(ImportedRecordSchema),
});

export const SkippedRecordsPageSchema = z.object({
  job: ImportJobSummarySchema,
  pagination: PaginationSchema,
  records: z.array(SkippedRecordSchema),
});

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("listwright-api"),
});

export const CreateImportResponseSchema = z.object({
  jobId: CsvSafeStringSchema,
  status: z.enum(IMPORT_JOB_STATUSES),
  rowLimit: z.number().int().positive(),
});

export const ImportJobResponseSchema = z.object({
  job: ImportJobSummarySchema,
});

export const JsonExportSchema = z.object({
  exportedAt: ParseableDateOrBlankSchema,
  job: ImportJobSummarySchema,
  records: z.array(ImportedRecordSchema),
  skippedRecords: z.array(SkippedRecordSchema),
  mappingNotes: z.array(MappingNoteSchema),
});

export const CsvExportMetadataSchema = z.object({
  fileName: CsvSafeStringSchema,
  columns: z.array(CsvSafeStringSchema),
  recordCount: z.number().int().nonnegative(),
});

export type CrmRecord = z.infer<typeof CrmRecordSchema>;
export type MappingNote = z.infer<typeof MappingNoteSchema>;
export type ImportedRecord = z.infer<typeof ImportedRecordSchema>;
export type SkippedRecord = z.infer<typeof SkippedRecordSchema>;
export type JobError = z.infer<typeof JobErrorSchema>;
export type ImportJobSummary = z.infer<typeof ImportJobSummarySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ImportedRecordsPage = z.infer<typeof ImportedRecordsPageSchema>;
export type SkippedRecordsPage = z.infer<typeof SkippedRecordsPageSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type CreateImportResponse = z.infer<typeof CreateImportResponseSchema>;
export type ImportJobResponse = z.infer<typeof ImportJobResponseSchema>;
export type JsonExport = z.infer<typeof JsonExportSchema>;
export type CsvExportMetadata = z.infer<typeof CsvExportMetadataSchema>;
