/**
 * Shared API client for the unified backend envelope.
 *
 * Every backend endpoint returns `{ data, error }` (plus optional `code` and
 * `pagination`) and signals failure with the HTTP status code:
 *
 *   success 2xx  -> { data: <payload>, error: null }
 *   list    2xx  -> { data: [...], error: null, pagination: {...} }
 *   failure 4xx/5xx -> { data: null, error: "message", code: "CODE" }
 *
 * Use these helpers instead of calling `fetch` + parsing by hand, so every
 * call site unwraps the envelope the same way and surfaces errors identically.
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Envelope<T> {
  data: T;
  error: string | null;
  code?: string;
  pagination?: Pagination;
}

/** Thrown when the backend responds with a non-2xx status. Carries the server message, status and code. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<Envelope<T>> {
  const response = await fetch(url, init);

  let body: Partial<Envelope<T>> | null = null;
  try {
    body = await response.json();
  } catch {
    // No / non-JSON body (e.g. empty response) — leave body null.
  }

  if (!response.ok) {
    throw new ApiError(
      body?.error || `เกิดข้อผิดพลาด (${response.status})`,
      response.status,
      body?.code,
    );
  }

  return (body ?? { data: null as T, error: null }) as Envelope<T>;
}

/** GET/mutation returning the unwrapped `data` payload. Throws {@link ApiError} on failure. */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  return (await request<T>(url, init)).data;
}

/** GET returning both rows and pagination (for paginated list endpoints). */
export async function apiFetchPage<T>(
  url: string,
  init?: RequestInit,
): Promise<{ data: T; pagination?: Pagination }> {
  const envelope = await request<T>(url, init);
  return { data: envelope.data, pagination: envelope.pagination };
}

interface SendOptions {
  headers?: Record<string, string>;
}

/** JSON body mutation (POST/PATCH/PUT/DELETE). Returns unwrapped `data`; throws {@link ApiError} on failure. */
export function apiSend<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
  options: SendOptions = {},
): Promise<T> {
  return apiFetch<T>(url, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
