import { PATHS } from "./paths";
import { lazyPage } from "./lazyPage";

/** Open to everyone. */
export const publicRoutes = [
  { path: PATHS.landing, ...lazyPage(() => import("@/pages/public/LandingPage")) },
];

/** Signed-out only: a signed-in user is sent to their home page. */
export const guestRoutes = [
  { path: PATHS.login, ...lazyPage(() => import("@/pages/public/LoginPage")) },
  { path: PATHS.signUp, ...lazyPage(() => import("@/pages/public/SignUpPage")) },
  { path: PATHS.forgotPassword, ...lazyPage(() => import("@/pages/public/ForgotPasswordPage")) },
  { path: PATHS.resetPassword, ...lazyPage(() => import("@/pages/public/ResetPasswordPage")) },
];
