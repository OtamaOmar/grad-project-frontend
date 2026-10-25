import { ROLE_HOME } from "@/config/roles";

/**
 * Where to go after signing in: the ?redirect= path when it is a same-app path
 * (never an absolute or protocol-relative URL — open-redirect guard), else the role home.
 */
export function postLoginPath(searchParams, role) {
  const redirect = searchParams.get("redirect");
  const safe = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
  return safe ?? ROLE_HOME[role];
}
