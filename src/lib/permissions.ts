import { Role, Permission, UserRole, UserPermissionOverride } from './types';

export interface PermissionContext {
  userId: string;
  roles: Role[];
  userRoles: UserRole[];
  permissions: Permission[];
  rolePermissions: { roleId: number; permissionId: number }[];
  overrides: UserPermissionOverride[];
}

export type PermissionOverrideState = 'inherited' | 'granted' | 'revoked';

/**
 * 3-Tier Hybrid Permission Resolution Algorithm matching check_leader_permission()
 */
export function checkPermission(
  ctx: PermissionContext,
  permissionKey: string,
  targetUnitId?: number | null
): boolean {
  const perm = ctx.permissions.find((p) => p.key === permissionKey);
  if (!perm) return false;

  // 1. Check Global Super Admin (group_leader with unit_id null)
  const groupLeaderRole = ctx.roles.find((r) => r.name === 'group_leader');
  if (groupLeaderRole) {
    const isSuperAdmin = ctx.userRoles.some(
      (ur) =>
        ur.user_id === ctx.userId &&
        ur.role_id === groupLeaderRole.id &&
        (ur.unit_id === null || ur.unit_id === undefined)
    );
    if (isSuperAdmin) {
      return true;
    }
  }

  // 2. Check Direct Overrides
  // Check unit-specific override first
  if (targetUnitId !== undefined && targetUnitId !== null) {
    const unitOverride = ctx.overrides.find(
      (ov) =>
        ov.user_id === ctx.userId &&
        ov.permission_id === perm.id &&
        ov.unit_id === targetUnitId
    );
    if (unitOverride) {
      return unitOverride.is_granted;
    }
  }

  // Check global user override (unit_id === null/undefined)
  const globalOverride = ctx.overrides.find(
    (ov) =>
      ov.user_id === ctx.userId &&
      ov.permission_id === perm.id &&
      (ov.unit_id === null || ov.unit_id === undefined)
  );
  if (globalOverride) {
    return globalOverride.is_granted;
  }

  // 3. Base Role Fallback
  const userRoleAssignments = ctx.userRoles.filter(
    (ur) =>
      ur.user_id === ctx.userId &&
      (ur.unit_id === null ||
        ur.unit_id === undefined ||
        targetUnitId === undefined ||
        targetUnitId === null ||
        ur.unit_id === targetUnitId)
  );

  for (const ur of userRoleAssignments) {
    const hasRolePermission = ctx.rolePermissions.some(
      (rp) => rp.roleId === ur.role_id && rp.permissionId === perm.id
    );
    if (hasRolePermission) {
      return true;
    }
  }

  return false;
}

/**
 * Returns whether a permission is explicitly granted, revoked, or inherited from role
 */
export function getOverrideState(
  ctx: PermissionContext,
  permissionId: number,
  targetUnitId?: number | null
): PermissionOverrideState {
  const match = ctx.overrides.find(
    (ov) =>
      ov.user_id === ctx.userId &&
      ov.permission_id === permissionId &&
      (targetUnitId ? ov.unit_id === targetUnitId : ov.unit_id === null || ov.unit_id === undefined)
  );

  if (!match) return 'inherited';
  return match.is_granted ? 'granted' : 'revoked';
}
