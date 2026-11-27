import { useState } from "react";
import { ModalExitContext } from "./modalExitContext";

/**
 * Keeps a conditionally rendered dialog mounted long enough to animate out.
 *
 *   {dialog && <UserFormDialog open user={dialog.user} />}
 * becomes
 *   <ModalSlot value={dialog}>
 *     {(d, open) => <UserFormDialog open={open} user={d.user} />}
 *   </ModalSlot>
 *
 * While `value` is set, children get it with open=true. When it clears, children get
 * the last value with open=false; the Dialog plays its exit and then unmounts the slot.
 */
export function ModalSlot({ value, children }) {
  const [held, setHeld] = useState(value || null);
  if (value && value !== held) setHeld(value);
  if (!held) return null;

  return (
    <ModalExitContext.Provider value={value ? null : () => setHeld(null)}>
      {children(value || held, Boolean(value))}
    </ModalExitContext.Provider>
  );
}
