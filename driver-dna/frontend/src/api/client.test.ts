import { afterEach, describe, expect, test, vi } from "vitest";
import { ApiError, apiGet } from "./client";

describe("apiGet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("uses fallback error message and code for non-JSON error response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("invalid json");
      }
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGet("/api/drivers", { year: 2024 })).rejects.toMatchObject({
      name: "ApiError",
      status: 502,
      code: "unknown_error",
      message: "Request failed with status 502"
    });
  });

  test("maps network rejection to network_error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("socket closed"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGet("/api/drivers", { year: 2024 })).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "network_error",
      message: "Network request failed"
    });
  });

  test("rethrows AbortError without remapping", async () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    const fetchMock = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGet("/api/drivers", { year: 2024 })).rejects.toBe(abortError);
    await expect(apiGet("/api/drivers", { year: 2024 })).rejects.not.toBeInstanceOf(ApiError);
  });
});
