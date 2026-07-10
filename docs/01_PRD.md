# 01 PRD: Listwright

## App Name

Listwright

## Submission Context

Submit as: Software Developer Intern

## Tagline

A reviewer-friendly AI CSV importer that turns messy lead spreadsheets into CRM-ready CRM records with local preview, validated AI mapping, traceability, retries, and exports.

## Problem

Sales and operations teams often receive CSV lead lists from different sources with inconsistent column names, mixed contact fields, messy dates, duplicate rows, unknown statuses, and extra notes. A direct import can corrupt CRM data, while manual cleanup is slow and difficult to review.

This app demonstrates a safer import workflow: users inspect a CSV locally first, explicitly confirm processing, then the backend uses deterministic validators and structured AI extraction to normalize records while preserving warnings, skipped rows, and before/after traceability.

## Target User

The primary user is a technical reviewer or hiring evaluator testing whether the candidate can build a practical AI-assisted import workflow end to end. The secondary user is a CRM operator who needs to clean lead CSV files quickly without losing visibility into what changed.

The user should be able to understand the app in one demo session without creating an account, connecting a database, or configuring an admin panel.

## Core Value Proposition

Listwright is not just an LLM wrapper. It previews files locally before any backend or AI call, uses deterministic pre-processing to identify obvious data quality issues, constrains the LLM with structured output, validates every AI result with shared Zod schemas, and makes the result auditable through confidence scores, warnings, mapping notes, skipped records, and exports.

## Core Features

### Must Have

- Upload CSV through drag and drop.
- Upload CSV through a standard file picker.
- Load a sample CSV quickly for demo review.
- Parse CSV locally in the browser for preview only.
- Avoid any backend or AI import before the user clicks Confirm Import.
- Show a responsive, scrollable CSV preview table with sticky headers.
- Display the default demo processing cap: `IMPORT_ROW_LIMIT=1000`.
- Confirm Import uploads the CSV to the Express backend.
- Express backend creates an async in-memory import job.
- Backend parses CSV and batches rows for processing.
- Deterministic pre-processing detects emails, phones, dates, possible country codes, likely statuses, likely data sources, duplicate rows, empty rows, and extra contact values.
- Backend calls OpenAI Structured Outputs for semantic extraction and column mapping.
- Shared Zod schemas define final CRM records, skipped records, mapping notes, and job responses.
- Backend owns final normalization, validation, warnings, confidence handling, skip rules, and exports.
- UI polls import job status and shows real progress.
- Results show parsed records and skipped records.
- Results show detected mappings and mapping notes.
- Results show confidence and warnings.
- Results support expandable before/after row comparison.
- Retry failed batches.
- Export CRM-ready CRM CSV.
- Export JSON with records, skipped rows, confidence, warnings, original rows, and mapping notes.
- Provide README with setup, env vars, Docker, deployment, demo flow, architecture diagram, sample CSVs, and tradeoffs.
- Provide `docs/AI_STRATEGY.md` explaining the AI pipeline and validation strategy.
- Include Docker support.

### Nice To Have

- Extra sample CSVs showing more edge cases.
- Additional frontend tests.
- Dark mode.
- Advanced virtualization polish beyond the minimum needed for large-file review.
- More polished retry UI states.

## Out Of Scope

- Authentication.
- User accounts.
- Postgres.
- Prisma.
- Persistent import history.
- Admin views.
- Billing.
- Team/workspace concepts.
- SaaS-style dashboards unrelated to the import flow.
- Background workers outside the in-memory demo architecture.
- Multi-instance job coordination.
- Editing imported records inside the app.
- Direct CRM write-back.

## User Stories

- As a reviewer, I want to load a sample CSV quickly so that I can evaluate the app without preparing my own data.
- As a reviewer, I want to preview the CSV locally before import so that I can confirm no AI/backend processing happens prematurely.
- As a CRM operator, I want the app to detect messy columns and normalize them so that I can import usable CRM records.
- As a CRM operator, I want invalid rows skipped with clear reasons so that I can understand what did not import.
- As a reviewer, I want confidence, warnings, and mapping notes so that I can assess how safely the AI was used.
- As a reviewer, I want before/after row comparison so that I can trace each transformed record back to the source row.
- As a reviewer, I want to retry failed batches so that transient AI/API failures do not force me to restart the whole import.
- As a CRM operator, I want CSV and JSON exports so that I can use cleaned CRM data and inspect import metadata.

## Success Metrics

- A reviewer can complete the full sample CSV demo flow in under 3 minutes.
- No backend or AI request is made before Confirm Import.
- The backend processes up to `IMPORT_ROW_LIMIT=1000` rows by default.
- Records missing both email and mobile are skipped.
- CRM CSV export contains exactly the required 15 columns in the required order.
- Every accepted CRM record passes shared Zod validation.
- Results show parsed records, skipped records, detected mappings, warnings, confidence, and original row traceability.
- README and `docs/AI_STRATEGY.md` clearly explain the architecture, tradeoffs, and AI safety choices.

## Acceptance Criteria

- The app starts locally with separate frontend and backend commands.
- `GET /health` returns a healthy status.
- Upload preview works without backend access.
- Confirm Import starts an async job.
- Progress updates include batch count, processed rows, imported count, skipped count, and failed batches.
- Final results can be paginated.
- Retry reprocesses failed batches only.
- CSV export excludes confidence, warnings, original row, and mapping notes.
- JSON export includes confidence, warnings, original row, and mapping notes.
- In-memory job reset behavior is documented.
