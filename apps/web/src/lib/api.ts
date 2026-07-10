export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000";

export function exportUrl(jobId: string, format: "csv" | "json") {
  return `${API_BASE_URL}/api/imports/${jobId}/export.${format}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new Error("Could not reach the import service. Check that the backend is available and allows this site.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}
