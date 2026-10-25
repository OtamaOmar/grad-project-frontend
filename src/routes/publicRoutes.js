import { PATHS } from "./paths";
import { lazyPage } from "./lazyPage";

export const publicRoutes = [
  { path: PATHS.landing, ...lazyPage(() => import("@/pages/public/LandingPage")) },
  { path: PATHS.login, ...lazyPage(() => import("@/pages/public/LoginPage")) },
  { path: PATHS.signUp, ...lazyPage(() => import("@/pages/public/SignUpPage")) },
  { path: PATHS.forgotPassword, ...lazyPage(() => import("@/pages/public/ForgotPasswordPage")) },
  { path: PATHS.resetPassword, ...lazyPage(() => import("@/pages/public/ResetPasswordPage")) },
];
