import { Navigate, useLocation } from "react-router";
import { PATHS } from "@/routes/paths";

/**
 * Forgot and Reset Password are now unified into a single page at PATHS.forgotPassword.
 * Any traffic to /reset-password is automatically forwarded to /forgot-password preserving query tokens.
 */
export default function ResetPasswordPage() {
  const location = useLocation();
  return <Navigate to={{ pathname: PATHS.forgotPassword, search: location.search }} replace />;
}
