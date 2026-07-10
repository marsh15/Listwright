# AI Strategy

Listwright uses AI for semantic mapping, not as the source of truth. The backend treats model output as untrusted and validates every final record before it appears in the UI or exports.

## 1. Local Preview Boundary

The frontend parses CSV files locally with PapaParse only for preview. It does not call the backend or the AI service until the user clicks **Confirm import**.

## 2. Deterministic Preprocessing

After confirmation, the Express API parses the uploaded CSV and applies deterministic analysis before any AI step:

- email detection
- phone detection
- date hints
- possible country codes
- likely CRM statuses
- likely data sources
- duplicate rows
- empty rows
- extra contact values

These signals are attached to each source row and become evidence for mapping, warnings, and final normalization.

## 3. Structured LLM Mapping

When `OPENAI_API_KEY` is present, the backend sends each batch to OpenAI with a strict structured output schema containing only:

- `records`
- `skippedRecords`
- `mappingNotes`

Mapping notes are batch-level or global. The prompt explicitly includes allowed CRM statuses, allowed data sources, final CRM columns, skip rules, raw rows, and deterministic signals.

When no API key is present, the backend uses the deterministic extractor so reviewers can still run the whole workflow locally.

AI batches are limited to five rows to keep structured requests bounded. A timed-out batch remains visibly failed and retryable; retrying resends only those small failed batches, while successful AI results remain intact.

## 4. Backend Normalization

The backend normalizes model-shaped records after extraction:

- CSV fields are trimmed and line breaks are removed.
- Invalid `crm_status` and `data_source` values become blank.
- Invalid `created_at` values become blank.
- The first detected email becomes primary.
- The first detected mobile becomes primary.
- Extra emails and mobiles are appended to `crm_note`.
- Possible country codes fill `country_code` when detected.

## 5. Zod Validation

Final CRM records must pass shared Zod schemas from `@listwright/shared`. LLM output is never accepted directly. Invalid records are converted into skipped records with reasons and warnings.

## 6. Skip Rules

Rows are skipped only when both email and mobile are missing. Rows with either email or mobile can be imported if the normalized CRM record passes validation.

## 7. Traceability

Each imported record stores:

- normalized CRM fields
- original source row
- confidence
- warnings
- mapping note references

The UI uses this to show before/after comparison without polluting the CRM CSV export.

## 8. Exports

CSV export contains only the exact Listwright CRM columns. JSON export contains job metadata, records, skipped records, mapping notes, original rows, warnings, and confidence.

## Known Limitations

- Jobs are in memory and reset on backend restart.
- Deployed demos should use one backend instance.
- The deterministic fallback keeps imports reviewable without credentials, but it is less semantically flexible than model extraction.
- Batches are processed in-process, not through a durable queue.
- Advanced frontend virtualization is intentionally limited for v1.
