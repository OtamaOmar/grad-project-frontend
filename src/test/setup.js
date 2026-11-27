import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@/i18n";

// jsdom has no matchMedia; the theme provider asks it for the system colour scheme.
window.matchMedia ??= () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});

afterEach(() => cleanup());
