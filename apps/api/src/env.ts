import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadRootEnv(filePath?: string) {
  const resolvedPath = findEnvFile(filePath);
  if (!resolvedPath) return;

  const lines = readFileSync(resolvedPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = unquote(trimmed.slice(separator + 1).trim());
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function findEnvFile(filePath: string | undefined) {
  const candidates = filePath
    ? [filePath]
    : [
        resolve(process.cwd(), ".env"),
        resolve(process.cwd(), "../../.env"),
      ];
  return candidates.find((candidate) => existsSync(candidate));
}

function unquote(value: string) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
