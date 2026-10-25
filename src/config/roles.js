/**
 * Roles on app_user.role (docs/api-contract.md).
 * "admin" is not in the Phase 1 contract yet; admin pages run on mock data only.
 */
export const ROLES = Object.freeze({
  ADMIN: "admin",
  COORDINATOR: "coordinator",
  STUDENT: "student",
  ADVISOR: "advisor",
});

export const ROLE_HOME = Object.freeze({
  [ROLES.ADMIN]: "/admin",
  [ROLES.COORDINATOR]: "/coordinator",
  [ROLES.STUDENT]: "/student",
  [ROLES.ADVISOR]: "/advisor",
});
