# 05 Backend Schema: Listwright

## Data Storage Model

This version has no database schema because jobs are stored in memory.

The backend still needs clear in-memory data models so the app can later move to Postgres/Redis without changing the product behavior.

## In-Memory Stores

### `jobsById`

Type: `Map<string, ImportJob>`

Stores all active import jobs since the current server boot.

Jobs reset on backend restart.

## Core Types

### `ImportJob`

```ts
type ImportJob = {
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
```

### `ImportBatch`

```ts
type ImportBatch = {
  id: string;
  index: number;
  status: "queued" | "processing" | "completed" | "failed";
  rowStart: number;
  rowEnd: number;
  attempts: number;
  error?: string;
  sourceRows: SourceRow[];
};
```

### `SourceRow`

```ts
type SourceRow = {
  rowNumber: number;
  raw: Record<string, string>;
  deterministicSignals: DeterministicSignals;
};
```

### `DeterministicSignals`

```ts
type DeterministicSignals = {
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
```

### `ImportedRecord`

Includes final CRM fields plus UI/export metadata.

```ts
type ImportedRecord = {
  id: string;
  rowNumber: number;
  originalRow: Record<string, string>;
  crm: CrmRecord;
  confidence: number;
  warnings: string[];
  mappingNoteIds: string[];
};
```

### `CrmRecord`

```ts
type CrmRecord = {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
};
```

### `SkippedRecord`

```ts
type SkippedRecord = {
  id: string;
  rowNumber: number;
  originalRow: Record<string, string>;
  reason: string;
  warnings: string[];
};
```

### `MappingNote`

```ts
type MappingNote = {
  id: string;
  scope: "global" | "batch";
  batchId?: string;
  sourceColumn: string;
  targetField: string;
  note: string;
  confidence?: number;
};
```

### `JobError`

```ts
type JobError = {
  batchId?: string;
  message: string;
  retryable: boolean;
  createdAt: string;
};
```

## Validation Rules

### Skip Rules

Skip only records missing both:

- email
- mobile

Rows with either email or mobile can be accepted if the final CRM record passes validation.

### Allowed Field Rules

- `crm_status` must be one of the allowed values or blank.
- `data_source` must be one of the allowed values or blank.
- `created_at` must be parseable by `new Date(created_at)` or blank.

### Contact Rules

- First email becomes primary `email`.
- First mobile becomes primary `mobile_without_country_code`.
- Extra emails and mobile numbers are appended to `crm_note`.
- Possible country codes populate `country_code` when confidently detected.

### CSV Safety Rules

- Fields must not contain unintended line breaks.
- Export formatting must safely quote fields when required.
- Backend controls export order and field set.

## Final CRM CSV Export Schema

CSV export contains only CRM fields. It must not include UI-only metadata.

Required order:

```csv
created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description
```

## JSON Export Schema

JSON export should include:

- job summary
- imported records
- skipped records
- mapping notes
- confidence
- warnings
- original rows
- export timestamp

## API Endpoints

### `GET /health`

Returns backend health.

Response:

```ts
{
  status: "ok";
  service: "listwright-api";
}
```

### `POST /api/imports`

Accepts multipart CSV upload and starts an async import job.

Request:

- Form field: `file`

Response:

```ts
{
  jobId: string;
  status: ImportJobStatus;
  rowLimit: number;
}
```

### `GET /api/imports/:jobId`

Returns job summary and progress.

### `GET /api/imports/:jobId/records?page=1&limit=100`

Returns paginated imported records.

### `GET /api/imports/:jobId/skipped?page=1&limit=100`

Returns paginated skipped records.

### `POST /api/imports/:jobId/retry`

Retries failed batches only.

### `GET /api/imports/:jobId/export.csv`

Downloads CRM-ready CSV.

### `GET /api/imports/:jobId/export.json`

Downloads audit-friendly JSON export.

## Auth Provider

None.

## Permissions

No user roles.

All in-memory jobs are accessible by job ID. This is acceptable for the reviewer demo, but production should add authentication and ownership checks.

## File Storage

No persistent file storage.

Uploaded CSV files are parsed for the import job and not stored permanently.

## Sensitive Fields

- `OPENAI_API_KEY` must be stored only as an environment variable.
- Uploaded CSV data may contain personal contact details, so production should use persistent storage carefully with retention policies.
- Demo version keeps data in memory only.

## Webhooks / Events

None.

## Production Migration Notes

If this becomes a production system:

- Store imports in Postgres.
- Store batch processing state in Redis or a queue.
- Add auth and row ownership.
- Add file retention/deletion policy.
- Add audit logs for export access.
- Add rate limits and upload size limits.
