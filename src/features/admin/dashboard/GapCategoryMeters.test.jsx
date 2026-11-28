// The dashboard gap meters show a severity badge only when the gap has one.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { GapCategoryMeters } from "./GapCategoryMeters";

const renderMeters = (categories) =>
  render(
    <MemoryRouter>
      <GapCategoryMeters
        query={{
          data: {
            open_gaps: { total: categories.reduce((n, c) => n + c.open_count, 0) },
            open_gaps_by_category: categories,
          },
        }}
      />
    </MemoryRouter>,
  );

describe("GapCategoryMeters", () => {
  it("shows no raw translation key when a category has no severity", () => {
    renderMeters([{ category: "old_first_year", open_count: 3, top_severity: null }]);
    expect(screen.queryByText(/severity\./)).toBeNull();
  });

  it("shows the severity badge when there is one", () => {
    renderMeters([{ category: "old_first_year", open_count: 3, top_severity: "high" }]);
    expect(screen.getByText("High")).toBeTruthy();
  });
});
