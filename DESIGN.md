---
name: Listwright
description: Reviewer-friendly AI CSV importer for auditable CRM lead cleanup.
colors:
  canvas: "#F7F8FA"
  surface: "#FFFFFF"
  ink: "#171A1F"
  muted-ink: "#5D6675"
  border: "#DDE2EA"
  primary: "#2563EB"
  primary-hover: "#1D4ED8"
  success: "#15803D"
  warning: "#B45309"
  error: "#B91C1C"
  info: "#0369A1"
typography:
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
  heading:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  table:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0"
rounded:
  sm: "6px"
  md: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    typography: "{typography.body}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Listwright

## 1. Overview

**Creative North Star: "The Import Workbench"**

Listwright should feel like a precise operational workbench for reviewing messy data. The system is light, quiet, and evidence-first: upload controls, local preview, confirmation boundaries, progress, records, skipped rows, mappings, and exports are arranged so the user always knows what has happened and what is still pending.

The visual system rejects SaaS marketing, decorative analytics dashboards, generic AI wrapper theatrics, and admin-shell sprawl. The interface should never compete with the CSV data. Density is allowed when it improves review speed, but every dense region must have readable type, stable spacing, semantic headers, and clear actions.

**Key Characteristics:**
- Restrained light UI with one primary blue action color.
- Compact, readable tables with sticky headers and horizontal scrolling.
- Functional panels, not decorative card sections.
- Status color paired with text, icons, or shapes.
- Minimal motion used only for state feedback.

## 2. Colors

The palette is restrained and operational: neutral surfaces carry most of the interface, while blue appears only for primary actions, focus, and current selection.

### Primary
- **Review Blue**: Primary action color for Confirm Import, selected tabs, focused interactive states, and the main action path.
- **Review Blue Hover**: Hover and active treatment for primary actions.

### Neutral
- **Cool Canvas**: Page background for the single-screen workflow.
- **White Surface**: Upload, preview, progress, and results panels.
- **Primary Ink**: Main text, table content, and important counts.
- **Secondary Ink**: Metadata, helper copy, timestamps, and secondary labels.
- **Soft Border**: Table dividers, panel outlines, inputs, and inactive segmented controls.

### Tertiary
- **Success Green**: Completed import, valid records, positive empty states.
- **Warning Amber**: Row-limit notices, warnings, partial failures, mapping caveats.
- **Error Red**: Failed jobs, invalid CSV preview, failed exports, unrecoverable batch errors.
- **Info Blue**: Local-preview guarantees, backend validation notes, and in-memory job reset notices.

### Named Rules
**The Evidence Color Rule.** Color supplements status but never carries it alone. Every success, warning, error, and info state needs a text label or icon in addition to color.

**The One Action Color Rule.** Blue is for the primary path and selected state. Do not use it as decoration.

## 3. Typography

**Display Font:** system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
**Body Font:** system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
**Label/Mono Font:** system sans for labels; native mono only for raw row JSON, CSV field names, and schema-like values.

**Character:** The type should feel utilitarian, sharp, and reviewer-fast. The hierarchy is compact on purpose, with no marketing-scale hero type.

### Hierarchy
- **Display** (700, 28 to 32px, 1.2): Page title only.
- **Headline** (650, 18 to 22px, 1.3): Major workflow sections such as Preview, Progress, and Results.
- **Title** (600, 15 to 16px, 1.35): Panel titles, tab labels, table group headings.
- **Body** (400, 14 to 16px, 1.5): Explanatory copy, status descriptions, and form helper text.
- **Table** (400, 13 to 14px, 1.45): CSV preview, parsed records, skipped rows, and mapping rows.
- **Label** (600, 12 to 13px, 1.3): Metadata labels, counts, chips, and compact controls.

### Named Rules
**The No Hero Type Rule.** This is a tool, not a landing page. Keep headings concise, fixed-size, and small enough to leave the workflow visible in the first viewport.

## 4. Elevation

The system is flat by default. Depth comes from surface contrast, borders, sticky table headers, and clear grouping rather than shadow. Use shadows only for temporary overlays or active drag states, and keep blur small.

### Shadow Vocabulary
- **Drag Active** (`box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16)`): Dropzone focus, drag-over, or keyboard focus emphasis.
- **Overlay Low** (`box-shadow: 0 8px 24px rgba(23, 26, 31, 0.12)`): Rare popover or confirmation surfaces if an inline pattern cannot work.

### Named Rules
**The Flat Review Rule.** Panels are separated with borders and background, not decorative shadow stacks.

## 5. Components

### Buttons
- **Shape:** Compact rectangular controls with gently rounded corners (6px).
- **Primary:** Review Blue background, white text, 10px vertical and 16px horizontal padding. Use for Confirm Import and other single best next actions.
- **Hover / Focus:** Darker blue on hover. Focus uses a visible 3px blue ring with offset.
- **Secondary:** White background, Primary Ink text, Soft Border outline. Use for sample CSV loading, retry, exports, and pagination.
- **Disabled:** Muted text, subdued border, and no hover movement.

### Chips
- **Style:** Small bordered labels for warnings, confidence, status, and row metadata.
- **State:** Pair each chip with text that names the state, for example "Warning: duplicate row" instead of a color-only dot.

### Cards / Containers
- **Corner Style:** Functional panels use an 8px radius.
- **Background:** White Surface on Cool Canvas.
- **Shadow Strategy:** Flat at rest, following the Flat Review Rule.
- **Border:** 1px Soft Border.
- **Internal Padding:** 16px for compact panels, 24px for larger results regions.

### Inputs / Fields
- **Style:** White background, 1px Soft Border, 6px radius, readable 14 to 15px text.
- **Focus:** Review Blue border plus visible focus ring.
- **Error / Disabled:** Error Red text with an explicit message. Disabled controls must remain legible.

### Navigation
- **Style:** Single-screen workflow with top header and tabs or segmented controls for results.
- **Default / Hover / Active:** Inactive tabs use neutral text and border. Active tabs use Review Blue plus a text label.
- **Mobile:** Stack upload, preview, progress, and results vertically. Result tabs may become a horizontally scrollable segmented row.

### Tables
- **Style:** Dense, semantic tables with sticky headers, horizontal scrolling, and stable row height.
- **Preview:** Local-only CSV preview must show file name, row count, column count, and a clear confirmation boundary.
- **Results:** Parsed and skipped tables need pagination, warning labels, confidence text, and accessible expand/collapse controls.

## 6. Do's and Don'ts

### Do:
- **Do** keep the upload workflow, sample CSV actions, local preview guarantee, and row limit visible in the first viewport.
- **Do** use thin neutral borders for panels, tables, inputs, and secondary buttons.
- **Do** keep tables compact but readable, with sticky headers and horizontal scrolling instead of squeezed columns.
- **Do** show no-backend and no-AI-before-confirmation copy near the preview and Confirm Import action.
- **Do** pair status color with text, icons, or shapes.
- **Do** respect reduced motion and keep transitions between 150ms and 250ms.

### Don't:
- **Don't** make a SaaS marketing page.
- **Don't** use decorative analytics dashboards, generic AI wrapper visuals, oversized heroes, card-grid storytelling, or visual clutter.
- **Don't** add sidebar navigation, admin views, dashboard charts unrelated to import progress, authentication, workspaces, billing, CRM write-back, or persistent import history.
- **Don't** make dark mode part of v1.
- **Don't** hide the local preview when backend or AI processing begins.
- **Don't** rely on color alone for failed, skipped, warning, success, or info states.
