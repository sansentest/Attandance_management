/**
 * Role-based access control and class-scoping utilities.
 * All permission checks fail closed by default.
 */

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  TEACHER: 'teacher',
  MONITOR: 'monitor',
});

export const TEACHER_ALLOWED_PAGES = new Set([
  'dashboard',
  'student_attendance',
  'student_tracking',
  'invitation-letters',
]);

export const ADMIN_PANEL_ROLES = new Set([ROLES.ADMIN, ROLES.TEACHER]);

/**
 * Normalizes a role identifier to lowercase trimmed form.
 */
export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export function isSuperAdmin(userOrSession) {
  return normalizeRole(userOrSession?.role) === ROLES.ADMIN;
}

export function isTeacher(userOrSession) {
  return normalizeRole(userOrSession?.role) === ROLES.TEACHER;
}

export function isMonitor(userOrSession) {
  return normalizeRole(userOrSession?.role) === ROLES.MONITOR;
}

export function canAccessAdminPanel(userOrSession) {
  return ADMIN_PANEL_ROLES.has(normalizeRole(userOrSession?.role));
}

export function requiresAssignedClass(role) {
  const normalized = normalizeRole(role);
  return normalized === ROLES.TEACHER || normalized === ROLES.MONITOR;
}

/**
 * Strips placeholder class values ('-', 'ALL') so unassigned teachers fail closed.
 */
export function normalizeClassName(cls) {
  const cleaned = String(cls || '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '__NONE__' || cleaned.toUpperCase() === 'ALL') {
    return '';
  }
  return cleaned;
}

export function normalizeClassKey(cls) {
  return normalizeClassName(cls).replace(/\s+/g, '').toLowerCase();
}

export function getAssignedClass(userOrSession) {
  return normalizeClassName(userOrSession?.className ?? userOrSession?.class ?? '');
}

/**
 * Returns the class filter scope for dashboard/data queries:
 * - '' for Super Admin (full school access)
 * - assigned class name for Teacher
 * - '__NONE__' if Teacher has no assigned class (fail closed)
 */
export function getTeacherScopeClass(session) {
  if (!isTeacher(session)) return '';
  return getAssignedClass(session) || '__NONE__';
}

export function matchesAssignedClass(recordClass, assignedClass) {
  const targetKey = normalizeClassKey(assignedClass);
  const recordKey = normalizeClassKey(recordClass);
  if (!targetKey || !recordKey) return false;
  return recordKey === targetKey;
}

/**
 * Filters a record array to the active teacher's assigned class.
 * Super Admins receive the unfiltered array; unassigned teachers receive [].
 */
export function filterByTeacherScope(items, session, getClass = (item) => item?.class) {
  if (!Array.isArray(items)) return [];
  if (!isTeacher(session)) return items;
  const assignedClass = getAssignedClass(session);
  if (!assignedClass) return [];
  return items.filter((item) => matchesAssignedClass(getClass(item), assignedClass));
}

/**
 * Checks whether the session is permitted to open a given AdminLayout page.
 */
export function isPageAllowedForSession(session, pageId) {
  if (isSuperAdmin(session)) return true;
  if (isTeacher(session)) return TEACHER_ALLOWED_PAGES.has(pageId);
  return false;
}

/**
 * Produces an isolated localStorage cache key so teacher browsers never read
 * stale school-wide admin caches from another session.
 */
export function getScopedDashboardCacheKey(scopeClass = '') {
  if (scopeClass === '__NONE__') return 'school_dashboard_cache_unassigned';
  const key = normalizeClassKey(scopeClass);
  return key ? `school_dashboard_cache_${key}` : 'school_dashboard_cache';
}

export function formatRoleLabel(role, variant = 'full') {
  const normalized = normalizeRole(role);
  if (normalized === ROLES.ADMIN) {
    return variant === 'short' ? 'អ្នកគ្រប់គ្រង' : 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin)';
  }
  if (normalized === ROLES.TEACHER) {
    return variant === 'short' ? 'គ្រូបន្ទុកថ្នាក់' : 'គ្រូបន្ទុកថ្នាក់ (Teacher)';
  }
  if (normalized === ROLES.MONITOR) {
    return variant === 'short' ? 'ប្រធានថ្នាក់' : 'ប្រធានថ្នាក់ (Monitor)';
  }
  return variant === 'short' ? 'អ្នកប្រើប្រាស់' : (role || 'អ្នកប្រើប្រាស់');
}

