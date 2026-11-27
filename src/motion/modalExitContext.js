import { createContext } from "react";

/** Set by <ModalSlot> while its dialog is closing; Dialog/Drawer call it when the exit ends. */
export const ModalExitContext = createContext(null);
