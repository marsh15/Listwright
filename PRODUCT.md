# Product

## Register

product

## Users

The primary user is a technical reviewer or hiring evaluator assessing whether the project demonstrates a practical AI-assisted import workflow end to end. They need to complete a credible demo in one sitting without account setup, database provisioning, or admin configuration.

The secondary user is a CRM operator cleaning messy lead CSV files from varied sources. They need to inspect input data, confirm when processing begins, understand what changed, review skipped rows, and export CRM-ready CRM records.

## Product Purpose

Listwright turns inconsistent lead spreadsheets into normalized CRM records through a deliberately auditable workflow. It previews CSV files locally before any backend or AI processing, waits for explicit confirmation, then combines deterministic validation with structured AI extraction.

Success means a reviewer can load a sample file, confirm import, watch progress, inspect parsed and skipped records, trace before-and-after transformations, retry failed batches, and export CSV or JSON results in under three minutes. The product must make the safety boundaries clear: AI output is constrained, validated, and never accepted without backend normalization.

## Brand Personality

Quiet, sharp, operational.

The interface should feel like a reviewer-friendly utility built around evidence. It should be easy to scan, resistant to accidental imports, and calm under messy data. The voice should be direct and specific, favoring proof and status over persuasion.

## Anti-references

This should not look or behave like a SaaS marketing page, decorative analytics dashboard, admin suite, or generic AI wrapper. Avoid oversized heroes, card-grid storytelling, visual clutter, sidebar navigation, dashboard charts unrelated to the import job, dark-mode-first styling, and any UI that hides when backend or AI processing begins.

Do not introduce out-of-scope product patterns such as authentication, workspaces, billing, persistent import history, CRM write-back, or multi-page admin navigation.

## Design Principles

1. Make the import boundary unmistakable.
   The user should always know when a file is only being previewed locally and when backend or AI processing has actually started.

2. Lead with evidence.
   Show row counts, detected mappings, warnings, confidence, skipped reasons, progress counts, and before/after traceability close to the action they explain.

3. Keep the workflow reviewer-fast.
   The sample CSV path should let someone understand the whole system quickly without preparing data or reading docs first.

4. Treat AI as reviewed output, not authority.
   The interface should reinforce that deterministic preprocessing, shared schemas, backend normalization, and explicit validation own the final result.

5. Prefer operational clarity over presentation polish.
   Dense tables, clear states, stable controls, and readable labels matter more than decoration or brand theatrics.

## Accessibility & Inclusion

Target WCAG 2.2 AA where practical for the v1 demo. File selection, sample loading, import confirmation, retry, pagination, exports, tabs, and expandable rows must be keyboard accessible with visible focus states.

Do not rely on color alone for failed, skipped, warning, success, or info states. Use text labels plus icons or shapes where status appears. Tables need semantic headers, readable compact text, horizontal scrolling on small screens, and touch targets of at least 40px on mobile. Progress updates should be announced politely where practical, and motion should respect `prefers-reduced-motion`.
