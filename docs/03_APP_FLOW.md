# 03 App Flow: Listwright

## Pages List

### `/`

Single-page importer workflow:

- Header with app name and demo-safe row limit.
- Upload area with drag/drop and file picker.
- Sample CSV quick-load buttons.
- Local CSV preview.
- Confirm Import.
- Job progress.
- Results summary.
- Parsed records table.
- Skipped records table.
- Detected mappings and mapping notes.
- Export actions.

No login, dashboard, settings, admin, or history pages.

## Navigation Type

Single-screen workflow with anchored sections or tabs for result views:

- Upload/Preview
- Progress
- Parsed Records
- Skipped Records
- Mapping Notes

On mobile, result sections can stack vertically or use compact tabs. The app should not introduce a sidebar or multi-page navigation.

## First Screen

A new visitor sees:

- App name: Listwright.
- Clear statement that CSV preview is local and no AI/backend import runs before confirmation.
- `IMPORT_ROW_LIMIT=1000` demo-safe processing note.
- Drag/drop upload area.
- File picker button.
- Sample CSV quick-load buttons.

## Auth Flow

No auth.

There are no logged-out or logged-in states. Every user lands directly on the importer.

## Core User Journey 1: Sample CSV Demo

Goal: Let a reviewer evaluate the full flow quickly.

1. Reviewer opens `/`.
2. Reviewer clicks a sample CSV quick-load button.
3. Frontend parses the sample CSV locally.
4. Preview table displays rows and columns.
5. Reviewer clicks Confirm Import.
6. Frontend uploads CSV to Express.
7. Backend starts an async import job.
8. UI polls job status.
9. UI shows progress: batch count, processed rows, imported count, skipped count, and failed batches.
10. Results show parsed records, skipped records, mapping notes, warnings, confidence, and before/after row comparison.
11. Reviewer downloads CSV or JSON export.

## Core User Journey 2: User CSV Upload

Goal: Import a custom lead CSV after preview.

1. User drags a CSV into the upload area or selects a file.
2. Frontend parses the CSV locally for preview only.
3. Preview table shows sticky headers and scrollable rows.
4. User reviews the file name, row count, columns, and sample rows.
5. User confirms import.
6. Backend enforces `IMPORT_ROW_LIMIT`.
7. Backend parses, pre-processes, batches, extracts, validates, and normalizes records.
8. User reviews final records and skipped records.
9. User exports CRM-ready CSV.

## Core User Journey 3: Retry Failed Batches

Goal: Recover from transient batch failures.

1. Import completes with status `partial_failed`.
2. Progress summary shows failed batch count.
3. User clicks Retry Failed Batches.
4. Backend requeues failed batches only.
5. UI polls updated job status.
6. Successful retry updates imported/skipped counts and result tables.
7. Remaining failed batches are still visible if retry does not resolve all failures.

## Preview States

### Empty

- No file selected.
- Upload area and sample CSV buttons are prominent.
- No backend job exists.

### File Loaded

- File name, row count, and column count are visible.
- Preview table shows local parsed CSV data.
- Confirm Import button is enabled.
- Clear copy states that no backend/AI processing has happened yet.

### Large File

- Preview remains scrollable and responsive.
- Header stays sticky.
- UI shows the default demo processing limit.
- If row count exceeds `IMPORT_ROW_LIMIT`, UI warns that only the first allowed rows will be processed.

### Invalid CSV Preview

- Show parsing error or empty-file warning.
- Keep Confirm Import disabled until a valid CSV is selected.

## Loading States

### Local Preview Parsing

- Show lightweight parsing indicator.
- Do not show backend progress.

### Uploading

- Confirm Import button shows uploading state.
- Prevent duplicate import submissions for the same active job.

### Queued

- Show job status as queued.
- Progress values can be zero while backend prepares batches.

### Processing

- Show batch count, processed rows, imported count, skipped count, and failed batches.
- Poll `GET /api/imports/:jobId`.

### Exporting

- Browser downloads from export endpoints.
- If export fails, show a recoverable error and keep results visible.

## Error States

### Backend Unavailable

- Show that preview still works locally.
- Confirm Import cannot complete until backend is reachable.

### Upload Failed

- Keep local preview.
- Let the user retry Confirm Import.

### Job Failed

- Show status `failed`.
- Show failed batch or job-level error message.
- If there are retryable failed batches, show Retry Failed Batches.

### Partial Failure

- Show status `partial_failed`.
- Display successful parsed/skipped results.
- Display failed batch count.
- Enable retry failed batches.

### Records Fetch Failed

- Keep job summary visible.
- Show retry action for records/skipped pagination.

## Modals And Overlays

Avoid required modals for the core flow.

Use inline expandable rows for before/after comparison:

- Collapsed row: normalized CRM fields, confidence, warnings count.
- Expanded row: original row JSON/table, normalized output, warnings, mapping notes reference.

## Redirects

No redirects.

The app stays on `/` for the entire workflow.

## Polling Behavior

- Start polling after `POST /api/imports` returns `jobId`.
- Poll until status is `completed`, `partial_failed`, or `failed`.
- Continue allowing result pagination after terminal statuses.
- Pause or reduce polling frequency after terminal status.

## Result Views

### Summary

- Job status.
- Total rows.
- Processed rows.
- Imported count.
- Skipped count.
- Failed batch count.
- Row limit.

### Parsed Records

- Paginated table.
- CRM fields.
- Confidence.
- Warning indicator.
- Expandable before/after comparison.

### Skipped Records

- Paginated table.
- Original row.
- Skip reason.
- Warnings.

### Mapping Notes

- Aggregated detected mappings.
- Batch/global notes.
- Confidence or warning context when available.

### Exports

- CSV export for CRM-ready records only.
- JSON export with records, skipped records, confidence, warnings, original rows, and mapping notes.
