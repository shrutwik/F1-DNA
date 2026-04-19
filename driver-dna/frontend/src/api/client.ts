import type { ApiErrorResponse } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const toSearchParams = (query?: Record<string, string | number | boolean>) => {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export async function apiGet<T>(
  path: string,
  query?: Record<string, string | number | boolean>,
  signal?: AbortSignal
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}${toSearchParams(query)}`, {
      signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Network request failed", 0, "network_error");
  }

  if (!response.ok) {
    let errorPayload: ApiErrorResponse | undefined;
    try {
      errorPayload = (await response.json()) as ApiErrorResponse;
    } catch {
      errorPayload = undefined;
    }

    throw new ApiError(
      errorPayload?.detail ?? `Request failed with status ${response.status}`,
      response.status,
      errorPayload?.code ?? "unknown_error"
    );
  }

  return (await response.json()) as T;
}
