// Which error kind an error becomes, and what the in-page error box offers for it.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "@/services/ApiError";
import { ErrorState } from "./ErrorState";
import { errorKindOf } from "./errorKinds";

const apiError = (status, code = "SOME_CODE", message = "Reason from the server.") =>
  new ApiError({ status, code, message });

describe("errorKindOf", () => {
  it.each([
    [0, "offline"],
    [400, "badRequest"],
    [409, "badRequest"],
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "notFound"],
    [429, "tooMany"],
    [500, "server"],
    [503, "server"],
  ])("status %i is %s", (status, kind) => {
    expect(errorKindOf(apiError(status))).toBe(kind);
  });

  it("treats an error without a status as a page crash", () => {
    expect(errorKindOf(new TypeError("x is undefined"))).toBe("crash");
    expect(errorKindOf(undefined)).toBe("crash");
  });
});

describe("ErrorState", () => {
  it("shows the server's own reason for a 4xx error and no retry", () => {
    render(<ErrorState error={apiError(400)} onRetry={() => {}} />);
    expect(screen.getByText("Reason from the server.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("offers a retry for a server error and calls it", () => {
    const onRetry = vi.fn();
    render(<ErrorState error={apiError(500)} onRetry={onRetry} />);
    expect(screen.getByText("The server couldn't finish this")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("explains a lost connection instead of showing the raw network message", () => {
    render(
      <ErrorState
        error={new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Failed to fetch" })}
      />,
    );
    expect(screen.getByText("Can't reach ACOPS")).toBeTruthy();
    expect(screen.queryByText("Failed to fetch")).toBeNull();
  });
});
