import { useEffect, useRef } from "react";
import { ExplainPanel } from "@/features/explain/ExplainPanel";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/utils/cn";

export function AIChatSidebar({ role }) {
  const { isOpen, closeChat } = useAIChat();
  const sidebarRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeChat]);

  // Prevent background scrolling while open on small screens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-50 transition-[visibility] duration-300",
        isOpen ? "pointer-events-auto visible" : "pointer-events-none invisible delay-300",
      )}
    >
      {/* Dimmed Backdrop */}
      <div
        onClick={closeChat}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-inverse-surface/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Slide-over Chat Sidebar Panel */}
      <aside
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI Chat"
        className={cn(
          "absolute inset-y-0 end-0 flex h-full w-full max-w-[24rem] sm:max-w-[26rem] flex-col border-s border-outline-variant bg-surface-container-lowest text-on-surface shadow-overlay",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full",
        )}
      >
        <ExplainPanel role={role} onClose={closeChat} />
      </aside>
    </div>
  );
}
