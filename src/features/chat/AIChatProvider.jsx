import { useCallback, useMemo, useState } from "react";
import { AIChatContext } from "./AIChatContext";

export function AIChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ isOpen, openChat, closeChat, toggleChat }),
    [isOpen, openChat, closeChat, toggleChat],
  );

  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}

