import { useContext } from "react";
import { ToastContext } from "@/components/ui/toast/ToastContext";

/** @returns {{ success(msg: string): void, error(msg: string): void, info(msg: string): void }} */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
