import type {
  ImportedRecord,
  JobError,
  MappingNote,
  SkippedRecord,
} from "@listwright/shared";

export type DeterministicSignals = {
  emails: string[];
  phones: string[];
  possibleCountryCodes: string[];
  dates: string[];
  likelyStatuses: string[];
  likelyDataSources: string[];
  isDuplicate: boolean;
  isEmpty: boolean;
  extraContactValues: string[];
  warnings: string[];
};

export type SourceRow = {
  rowNumber: number;
  raw: Record<string, string>;
  deterministicSignals: DeterministicSignals;
};

export type ImportBatch = {
  id: string;
  index: number;
  status: "queued" | "processing" | "completed" | "failed";
  rowStart: number;
  rowEnd: number;
  attempts: number;
  error?: string;
  sourceRows: SourceRow[];
};

export type ImportJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "partial_failed" | "failed";
  createdAt: string;
  updatedAt: string;
  fileName: string;
  rowLimit: number;
  totalRows: number;
  processedRows: number;
  importedCount: number;
  skippedCount: number;
  batchCount: number;
  completedBatches: number;
  failedBatches: number;
  errors: JobError[];
  batches: ImportBatch[];
  records: ImportedRecord[];
  skippedRecords: SkippedRecord[];
  mappingNotes: MappingNote[];
};

export type AiCrmRecord = {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: string;
  crm_note?: string;
  data_source?: string;
  possession_time?: string;
  description?: string;
};

export type AiRecord = {
  rowNumber: number;
  crm: AiCrmRecord;
  confidence?: number;
  warnings?: string[];
  mappingNoteIds?: string[];
};

export type AiSkippedRecord = {
  rowNumber: number;
  reason: string;
  warnings?: string[];
};

export type AiMappingNote = {
  id?: string;
  scope?: "global" | "batch";
  batchId?: string;
  sourceColumn: string;
  targetField: string;
  note: string;
  confidence?: number;
};

export type AiBatchResult = {
  records: AiRecord[];
  skippedRecords: AiSkippedRecord[];
  mappingNotes: AiMappingNote[];
};
