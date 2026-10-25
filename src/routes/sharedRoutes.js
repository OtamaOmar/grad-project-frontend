import { PATHS } from "./paths";
import { lazyPage } from "./lazyPage";

/** Pages every signed-in role can open. They render inside the current user's shell. */
export const sharedRoutes = [
  { path: PATHS.notifications, ...lazyPage(() => import("@/pages/shared/NotificationsPage")) },
  { path: PATHS.help, ...lazyPage(() => import("@/pages/shared/HelpPage")) },
  { path: PATHS.profile, ...lazyPage(() => import("@/pages/shared/ProfilePage")) },
];
