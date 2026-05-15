/**
 * Normalizes role strings from login/register or profile API.
 * Legacy API may still send `superadmin`; app uses `director`.
 */
export function normalizeLmsRole(value) {
  const r = String(value ?? "")
    .trim()
    .toLowerCase();
  if (r === "instructor" || r === "teacher") return "instructor";
  if (
    r === "director" ||
    r === "superadmin" ||
    r === "admin" ||
    r === "super_admin"
  ) {
    return "director";
  }
  return "student";
}

/**
 * Default route after successful login/register (and when blocking /login while authenticated).
 */
export function getHomePathForRole(role) {
  const r = normalizeLmsRole(role);
  if (r === "director") return "/admin";
  if (r === "instructor") return "/instructor";
  return "/student";
}
