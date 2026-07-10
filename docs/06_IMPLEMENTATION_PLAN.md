# 06 Implementation Plan: Listwright

## Priority Rules

Build P0 first, then P1. Cut P2 if time is tight.

Do not add auth, Postgres, Prisma, full import history, admin views, or other SaaS features.

## Phase 1: Project Setup

Goal: Create a minimal monorepo with frontend, backend, shared schemas, sample data, docs, and Docker support.

Tasks:

- Create root workspace package.
- Add `apps/web` Next.js TypeScript app.
- Add `apps/api` Express TypeScript app.
- Add `packages/shared` for Zod schemas and constants.
- Add `.env.example`.
- Add sample CSV files.
- Add Dockerfiles and Docker Compose.
- Add README skeleton.

Done Criteria:

- Frontend and backend can run separately in local development.
- Shared package can be imported by both apps.
- README lists required env vars and startup commands.

## Phase 2: Shared Contracts And Validation

Goal: Lock data contracts before implementing API/UI behavior.

Tasks:

- Define allowed `crm_status` values.
- Define allowed `data_source` values.
- Define CRM CSV column order.
- Define Zod schema for `CrmRecord`.
- Define Zod schema for `ImportedRecord`.
- Define Zod schema for `SkippedRecord`.
- Define Zod schema for `MappingNote`.
- Define Zod schema for job summary and paginated responses.
- Add helper validation for parseable `created_at`.

Done Criteria:

- Invalid CRM status/data source values fail validation unless blank.
- Invalid `created_at` fails validation unless blank.
- Shared schemas represent API responses used by frontend and backend.

## Phase 3: Backend API Foundation

Goal: Implement Express routes and in-memory job lifecycle.

Tasks:

- Add `GET /health`.
- Add `POST /api/imports`.
- Add in-memory `jobsById` store.
- Add import job statuses:
  - `queued`
  - `processing`
  - `completed`
  - `partial_failed`
  - `failed`
- Add job summary route.
- Add records pagination route.
- Add skipped records pagination route.
- Add retry endpoint.
- Add CSV export route.
- Add JSON export route.
- Add CORS config.
- Add row limit config with default `IMPORT_ROW_LIMIT=1000`.

Done Criteria:

- API returns stable JSON contracts.
- A CSV upload creates a job ID.
- Job status can be polled.
- Missing job IDs return useful 404 errors.

## Phase 4: CSV Parsing And Deterministic Pre-Processing

Goal: Prepare rows before AI extraction and catch deterministic data quality signals.

Tasks:

- Parse CSV on backend using a structured parser.
- Normalize headers.
- Trim field values.
- Enforce row limit.
- Detect empty rows.
- Detect duplicate rows.
- Detect emails.
- Detect phone numbers.
- Detect possible country codes.
- Detect dates.
- Detect likely CRM statuses.
- Detect likely data sources.
- Detect extra contact values.
- Produce deterministic warnings.
- Split source rows into batches.

Done Criteria:

- Backend can process messy CSV rows without AI.
- Deterministic signals are attached to source rows.
- Row limit is enforced and visible in job summary.
- Empty rows and duplicates are warned or skipped according to final validation rules.

## Phase 5: OpenAI Structured Extraction

Goal: Use OpenAI for semantic mapping while keeping output constrained and reviewable.

Tasks:

- Add OpenAI client.
- Define structured output schema with:
  - `records`
  - `skippedRecords`
  - `mappingNotes`
- Create batch prompt using:
  - raw rows
  - deterministic signals
  - allowed statuses
  - allowed data sources
  - final CRM field list
  - skip rules
- Process batches asynchronously.
- Track batch attempts and failures.
- Aggregate mapping notes globally or by batch.
- Mark transient AI/API failures as retryable.

Done Criteria:

- AI output conforms to structured schema.
- Mapping notes are generated without requiring one note per row.
- Failed batches do not erase successful batch results.
- Job progress updates as each batch completes or fails.

## Phase 6: Backend Normalization, Validation, And Exports

Goal: Treat AI output as untrusted and produce final CRM-ready data.

Tasks:

- Normalize AI records on backend.
- Apply contact rules:
  - first email primary
  - first mobile primary
  - extras into `crm_note`
- Apply skip rule: skip only if both email and mobile are missing.
- Validate final records with shared Zod schemas.
- Convert invalid final records into skipped records or failed batch warnings.
- Sanitize CSV fields.
- Generate exact CRM CSV export columns.
- Generate JSON export with metadata.

Done Criteria:

- Every imported record passes shared Zod validation.
- CSV export contains exactly the required 15 columns.
- UI-only metadata is excluded from CSV export.
- JSON export includes confidence, warnings, original rows, and mapping notes.

## Phase 7: Frontend Upload And Local Preview

Goal: Build the reviewer-safe first screen and local preview behavior.

Tasks:

- Add drag/drop upload zone.
- Add file picker.
- Add sample CSV quick-load buttons.
- Parse CSV locally with PapaParse.
- Show file name, row count, column count, and preview rows.
- Add responsive scrollable preview table.
- Add sticky preview header.
- Show `IMPORT_ROW_LIMIT=1000` clearly.
- Disable Confirm Import until a valid CSV is selected.
- Ensure no backend or AI call happens before Confirm Import.

Done Criteria:

- Local preview works with uploaded and sample CSV files.
- Network calls do not happen during preview.
- Confirm Import is the first import-triggering action.

## Phase 8: Frontend Import Progress

Goal: Connect Confirm Import to backend job progress.

Tasks:

- Upload selected CSV to `POST /api/imports`.
- Store current `jobId`.
- Poll `GET /api/imports/:jobId`.
- Render statuses:
  - queued
  - processing
  - completed
  - partial_failed
  - failed
- Show batch count.
- Show processed rows.
- Show imported count.
- Show skipped count.
- Show failed batches.
- Handle backend errors without losing local preview.

Done Criteria:

- UI shows real backend progress.
- Terminal job statuses stop active polling.
- Partial failures are visible and recoverable.

## Phase 9: Frontend Results, Retry, And Exports

Goal: Build the full review surface after import.

Tasks:

- Fetch paginated parsed records.
- Fetch paginated skipped records.
- Show parsed records table.
- Show skipped records table.
- Show detected mappings and mapping notes.
- Show confidence.
- Show warnings.
- Add expandable before/after row comparison.
- Add Retry Failed Batches button.
- Add CSV export link.
- Add JSON export link.

Done Criteria:

- Reviewer can inspect accepted and skipped rows.
- Reviewer can trace normalized values back to original rows.
- Retry endpoint can be triggered from UI.
- CSV and JSON downloads work.

## Phase 10: Documentation

Goal: Make the project easy to review, run, and assess.

Tasks:

- Complete README with:
  - setup
  - env vars
  - Docker
  - deployment
  - demo flow
  - architecture diagram
  - sample CSVs
  - tradeoffs
- README must explicitly say:
  - no AI/backend import happens before user confirmation
  - LLM output is treated as untrusted and validated with shared Zod schemas
  - in-memory jobs reset on server restart
  - production would use Postgres/Redis
  - use one backend instance on Render/Railway because jobs are in memory
- Add `docs/AI_STRATEGY.md`.
- Explain deterministic pre-processing, LLM mapping, structured output, Zod validation, normalization, skip rules, exports, and limitations.

Done Criteria:

- A reviewer can run the app from README alone.
- AI safety and validation strategy are explicit.
- Deployment tradeoffs are documented.

## Phase 11: Verification And Polish

Goal: Confirm the implementation meets the locked plan without adding scope.

Tasks:

- Run TypeScript checks.
- Run backend smoke checks.
- Run frontend build.
- Test sample CSV flow.
- Test custom CSV upload.
- Test skipped rows.
- Test failed batch retry behavior.
- Test CSV export column order.
- Test JSON export metadata.
- Test responsive preview/results tables.

Done Criteria:

- P0 is complete.
- P1 is complete unless explicitly cut.
- No P2 work blocks submission.
- No out-of-scope SaaS features are added.

## P0 Checklist

- Next.js upload.
- Local CSV preview.
- Confirm import.
- Express upload API.
- CSV parsing.
- OpenAI batch extraction.
- Zod validation.
- Parsed records table.
- Skipped records table.
- Hosted frontend.
- Hosted backend.
- README.

## P1 Checklist

- Detected column mappings.
- Confidence and warnings.
- Before/after row expansion.
- Real batch progress.
- Retry failed batches.
- CSV/JSON export.
- Sample CSV quick-load buttons.
- `docs/AI_STRATEGY.md`.
- Docker.

## P2 Checklist

Cut first if time is tight:

- Frontend tests.
- Dark mode.
- Advanced virtualization polish.
- Retry UI polish.
- Extra sample CSVs.

## Final Done Criteria

The final submission can be pitched as:

> A reviewer-friendly AI CSV importer that previews locally, processes only after confirmation, uses deterministic validators plus structured LLM mapping, validates every AI output, shows mapping confidence and warnings, handles skipped records, supports retries, and exports CRM-ready CRM data.
