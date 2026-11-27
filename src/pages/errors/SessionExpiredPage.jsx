import { useEffect } from "react";
import { StatusPage } from "@/components/common/StatusPage";
import { useAuth } from "@/hooks/useAuth";

/** Shown when a session ends inside the app. Clears what the browser kept about the user. */
export default function SessionExpiredPage() {
  const { clearSession } = useAuth();
  useEffect(() => {
    clearSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <StatusPage kind="unauthorized" standalone />;
}
