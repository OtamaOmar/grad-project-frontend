import { useContext } from "react";
import { ThemeContext } from "@/features/preferences/ThemeContext";

/** @returns {{ theme: "light"|"dark"|"system", resolvedTheme: "light"|"dark", setTheme: Function, toggleTheme: Function }} */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
