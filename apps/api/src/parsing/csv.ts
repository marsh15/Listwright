import { parse } from "csv-parse/sync";

export function parseCsvBuffer(buffer: Buffer, rowLimit: number): Record<string, string>[] {
  const parsed = parse(buffer, {
    bom: true,
    columns: true,
    relax_column_count: true,
    skip_empty_lines: false,
    trim: false,
  }) as Record<string, unknown>[];

  if (parsed.length === 0) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  return parsed.slice(0, rowLimit).map((row) => {
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const header = String(key ?? "").trim();
      if (!header) continue;
      clean[header] = String(value ?? "").replace(/\r?\n/g, " ").trim();
    }
    return clean;
  });
}
