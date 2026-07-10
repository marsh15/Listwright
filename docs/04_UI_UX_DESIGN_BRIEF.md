# 04 UI/UX Design Brief: Listwright

## Aesthetic

Design a practical reviewer tool, not a marketing landing page.

The interface should feel quiet, sharp, and operational: fast to scan, easy to trust, and built around evidence. The first viewport should immediately show the upload workflow, sample quick-load actions, and the local-preview-before-confirmation guarantee.

Avoid decorative SaaS dashboards, oversized hero sections, generic card grids, or visual clutter that distracts from the import flow.

## Visual Direction

- Clean utility interface.
- Light mode only for v1.
- Dense but readable tables.
- Clear progress indicators.
- Minimal color, used meaningfully for status and warnings.
- Strong table ergonomics with sticky headers and horizontal scrolling.
- Compact panels for upload, progress, and results.

## Color Palette

- Background: `#F7F8FA`
- Surface: `#FFFFFF`
- Primary text: `#171A1F`
- Secondary text: `#5D6675`
- Border: `#DDE2EA`
- Primary action: `#2563EB`
- Primary action hover: `#1D4ED8`
- Success: `#15803D`
- Warning: `#B45309`
- Error: `#B91C1C`
- Info: `#0369A1`

Use color as a status supplement, not the only indicator.

## Typography

- Font family: system sans-serif stack.
- Optional mono font for raw row JSON, CSV field names, and API/schema-like labels.
- Headings should be concise and smaller than marketing hero type.
- Tables should use compact, legible body text.
- Button labels should not wrap awkwardly.

Suggested scale:

- Page title: 28-32px.
- Section headings: 18-22px.
- Body: 14-16px.
- Table cells: 13-14px.
- Metadata labels: 12-13px.

## Component Style

- Border radius: 6-8px.
- Borders: thin neutral borders for panels, tables, inputs, and buttons.
- Shadows: very subtle or none.
- Cards: only for functional panels, not decorative page sections.
- Tables:
  - Sticky header.
  - Horizontal scroll.
  - Compact rows.
  - Stable row height.
  - Expand/collapse control per row.
- Buttons:
  - Primary for Confirm Import.
  - Secondary for sample CSVs, retry, exports.
  - Disabled states must be obvious.
- Status indicators:
  - Text label plus icon or shape.
  - Do not rely on color alone.

## Layout

### Desktop

Recommended structure:

1. Top app header with app name, submission label, and row limit.
2. Upload and sample CSV controls.
3. Local preview table.
4. Confirm Import action area.
5. Progress panel.
6. Results area with tabs or segmented controls.
7. Parsed/skipped/mapping/export views.

Use a max-width content container around `1200px` to `1440px`, while allowing tables to scroll horizontally inside their region.

### Mobile

- Stack upload, preview, progress, and results vertically.
- Tables should scroll horizontally instead of cramming columns.
- Keep Confirm Import visible after preview.
- Result tabs may become a segmented scroll row.

## Key UI Patterns

- Drag/drop upload zone with file picker fallback.
- Sample CSV quick-load buttons.
- Local preview warning/confirmation copy.
- Sticky-header preview table.
- Progress summary with counts:
  - batches
  - processed rows
  - imported count
  - skipped count
  - failed batches
- Results tabs:
  - Parsed
  - Skipped
  - Mapping Notes
  - Exports
- Expandable before/after rows.
- Warning chips with accessible text.
- Confidence display as a number/label, not only a color.
- Pagination controls for parsed and skipped records.

## Required Visible Copy

The interface should clearly communicate:

- No AI/backend import happens before Confirm Import.
- `IMPORT_ROW_LIMIT=1000` by default.
- Preview is local and for review only.
- Backend validates AI output before accepting records.
- In-memory jobs reset on backend restart.

## Empty States

### No File Selected

Show upload dropzone, file picker, and sample buttons.

### No Parsed Records

Show that no valid CRM records were imported and direct the user to skipped records.

### No Skipped Records

Show a positive empty state: all processable rows produced CRM records.

### No Mapping Notes

Show that no special mapping notes were returned.

## Accessibility

- Keyboard accessible file picker and buttons.
- Focus-visible styles for all controls.
- Sufficient color contrast.
- Table headers must be semantic.
- Progress updates should be announced politely where practical.
- Do not use color alone for failed/skipped/warning states.
- Use readable labels for expand/collapse buttons.
- Ensure touch targets are at least 40px high on mobile.

## Motion

Use minimal motion:

- Dropzone hover/focus state.
- Progress changes can animate subtly.
- Expand/collapse rows can transition quickly.

Respect `prefers-reduced-motion`.

## Design Non-Goals

- No hero marketing page.
- No decorative illustration requirement.
- No dark mode in P0/P1.
- No sidebar/admin shell.
- No dashboard charts unless directly tied to import progress.
