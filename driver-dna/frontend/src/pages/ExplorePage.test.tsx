import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { ExplorePage } from "./ExplorePage";
import { DriverPage } from "./DriverPage";

type FetchResponseOptions = {
  ok: boolean;
  status?: number;
  body?: unknown;
};

function createJsonResponse({
  ok,
  status = ok ? 200 : 500,
  body
}: FetchResponseOptions): Response {
  return {
    ok,
    status,
    json: async () => body
  } as Response;
}

describe("ExplorePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("loads drivers initially and again on year change", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          body: {
            year: 2024,
            cached: false,
            drivers: [{ code: "NOR", name: "L NORRIS", team: "McLaren" }]
          }
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          body: {
            year: 2023,
            cached: false,
            drivers: [{ code: "VER", name: "M VERSTAPPEN", team: "Red Bull" }]
          }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>
    );

    await screen.findByRole("option", { name: /NOR - L NORRIS/i });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/drivers?year=2024",
      expect.any(Object)
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /year/i }),
      "2023"
    );

    await screen.findByRole("option", { name: /VER - M VERSTAPPEN/i });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/drivers?year=2023",
      expect.any(Object)
    );
  });

  test("shows inline error and retries successfully", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: false,
          status: 400,
          body: { detail: "Bad season", code: "invalid_year" }
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          body: {
            year: 2024,
            cached: false,
            drivers: [{ code: "NOR", name: "L NORRIS", team: "McLaren" }]
          }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>
    );

    await screen.findByText("Bad season");
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    await screen.findByRole("option", { name: /NOR - L NORRIS/i });
  });

  test("navigates to driver route on generate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        body: {
          year: 2024,
          cached: false,
          drivers: [{ code: "NOR", name: "L NORRIS", team: "McLaren" }]
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/driver/:year/:code" element={<DriverPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole("option", { name: /NOR - L NORRIS/i });
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /driver/i }),
      "NOR"
    );
    await userEvent.click(screen.getByRole("button", { name: /generate/i }));

    await screen.findByRole("heading", { name: /NOR in 2024/i });
  });

  test("ignores stale request results during fast year switches", async () => {
    const responses: Array<(value: Response) => void> = [];
    const fetchMock = vi.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          responses.push(resolve);
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>
    );

    const yearSelect = screen.getByRole("combobox", { name: /year/i });
    await userEvent.selectOptions(yearSelect, "2023");
    await userEvent.selectOptions(yearSelect, "2022");

    responses[2](
      createJsonResponse({
        ok: true,
        body: {
          year: 2022,
          cached: false,
          drivers: [{ code: "ALO", name: "F ALONSO", team: "Alpine" }]
        }
      })
    );

    await screen.findByRole("option", { name: /ALO - F ALONSO/i });

    responses[1](
      createJsonResponse({
        ok: true,
        body: {
          year: 2023,
          cached: false,
          drivers: [{ code: "VER", name: "M VERSTAPPEN", team: "Red Bull" }]
        }
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("option", { name: /VER - M VERSTAPPEN/i })
      ).not.toBeInTheDocument();
    });
  });

  test("retry request cannot overwrite newer year data", async () => {
    const responses: Array<(value: Response) => void> = [];
    const fetchMock = vi.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          responses.push(resolve);
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>
    );

    responses[0](
      createJsonResponse({
        ok: false,
        status: 400,
        body: { detail: "Bad season", code: "invalid_year" }
      })
    );
    await screen.findByText("Bad season");

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    const yearSelect = screen.getByRole("combobox", { name: /year/i });
    await userEvent.selectOptions(yearSelect, "2023");

    responses[2](
      createJsonResponse({
        ok: true,
        body: {
          year: 2023,
          cached: false,
          drivers: [{ code: "VER", name: "M VERSTAPPEN", team: "Red Bull" }]
        }
      })
    );

    await screen.findByRole("option", { name: /VER - M VERSTAPPEN/i });

    responses[1](
      createJsonResponse({
        ok: true,
        body: {
          year: 2024,
          cached: false,
          drivers: [{ code: "NOR", name: "L NORRIS", team: "McLaren" }]
        }
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("option", { name: /NOR - L NORRIS/i })
      ).not.toBeInTheDocument();
    });
  });
});
