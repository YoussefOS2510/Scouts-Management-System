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

export const USER_ID_MAP: Record<string, string> = {
  'u0': '11111111-0000-0000-0000-000000000001',
  'u1': '11111111-0000-0000-0000-000000000002',
  'u2': '11111111-0000-0000-0000-000000000003',
  'u5': '11111111-0000-0000-0000-000000000004',
  'u4': '11111111-0000-0000-0000-000000000005',
  'u11': '11111111-0000-0000-0000-000000000011',
  'u12': '11111111-0000-0000-0000-000000000012',
  'u13': '11111111-0000-0000-0000-000000000013',
  'u14': '11111111-0000-0000-0000-000000000014',
  'u3': '11111111-0000-0000-0000-000000000015',
  'u16': '11111111-0000-0000-0000-000000000016',
  'u17': '11111111-0000-0000-0000-000000000017',
  'u18': '11111111-0000-0000-0000-000000000018',
  'u19': '11111111-0000-0000-0000-000000000019',
  'u20': '11111111-0000-0000-0000-000000000020',
  'u21': '11111111-0000-0000-0000-000000000021',
  'u22': '11111111-0000-0000-0000-000000000022',
};

export function normalizeUserId(id?: string | null): string {
  if (!id) return '';
  return USER_ID_MAP[id] || id;
}

export function isSameUser(id1?: string | null, id2?: string | null): boolean {
  if (!id1 || !id2) return false;
  return normalizeUserId(id1).toLowerCase() === normalizeUserId(id2).toLowerCase();
}

/**
 * 3-Tier Hybrid Permission Resolution Algorithm matching T-SQL dbo.fn_check_leader_permission
 */
export function checkPermission(
  ctx: PermissionContext,
  permissionKey: string,
  targetUnitId?: number | null
): boolean {
  if (!ctx.userId) return false;
  const normUserId = normalizeUserId(ctx.userId);

  // Christine Nabil is strictly a scoped leader and never Super Admin
  if (
    normUserId === '11111111-0000-0000-0000-000000000018' ||
    ctx.userId === 'u18'
  ) {
    // Continue through standard granular permission evaluation
  } else if (normUserId === '11111111-0000-0000-0000-000000000001' || ctx.userId === 'u0') {
    // 1. Check Global Super Admin (admin role, u0, or admin UUID)
    return true;
  } else {
    const adminRole = ctx.roles.find((r) => r.name === 'admin');
    if (adminRole) {
      const isSuperAdmin = ctx.userRoles.some(
        (ur) => isSameUser(ur.user_id, ctx.userId) && ur.role_id === adminRole.id
      );
      if (isSuperAdmin) {
        return true;
      }
    }
  }

  const perm = ctx.permissions.find((p) => p.key === permissionKey);
  if (!perm) return false;

  // 2. Check Direct Overrides
  // Check unit-specific override first if targetUnitId is specified
  if (targetUnitId !== undefined && targetUnitId !== null) {
    const unitOverride = ctx.overrides.find(
      (ov) =>
        isSameUser(ov.user_id, ctx.userId) &&
        Number(ov.permission_id) === Number(perm.id) &&
        Number(ov.unit_id) === Number(targetUnitId)
    );
    if (unitOverride) {
      return Boolean(unitOverride.is_granted);
    }
  }

  // Check global user override (unit_id === null/undefined)
  const globalOverride = ctx.overrides.find(
    (ov) =>
      isSameUser(ov.user_id, ctx.userId) &&
      Number(ov.permission_id) === Number(perm.id) &&
      (ov.unit_id === null || ov.unit_id === undefined)
  );
  if (globalOverride) {
    return Boolean(globalOverride.is_granted);
  }

  // 3. Multi-Unit Scoping for General Capability Checks (targetUnitId === undefined/null)
  if (targetUnitId === undefined || targetUnitId === null) {
    const userAssignedUnitIds = Array.from(
      new Set(
        ctx.userRoles
          .filter(
            (ur) =>
              isSameUser(ur.user_id, ctx.userId) &&
              ur.unit_id !== null &&
              ur.unit_id !== undefined
          )
          .map((ur) => Number(ur.unit_id))
      )
    );

    if (userAssignedUnitIds.length > 0) {
      // Check if user has permission on AT LEAST ONE of their assigned units
      const hasAnyUnitAccess = userAssignedUnitIds.some((unitId) => {
        // Direct unit override takes precedence
        const unitOverride = ctx.overrides.find(
          (ov) =>
            isSameUser(ov.user_id, ctx.userId) &&
            Number(ov.permission_id) === Number(perm.id) &&
            Number(ov.unit_id) === Number(unitId)
        );
        if (unitOverride) {
          return Boolean(unitOverride.is_granted);
        }

        // Unit role fallback
        const unitRoles = ctx.userRoles.filter(
          (ur) =>
            isSameUser(ur.user_id, ctx.userId) &&
            Number(ur.unit_id) === Number(unitId)
        );
        return unitRoles.some((ur) =>
          ctx.rolePermissions.some(
            (rp) =>
              Number(rp.roleId) === Number(ur.role_id) &&
              Number(rp.permissionId) === Number(perm.id)
          )
        );
      });

      if (hasAnyUnitAccess) {
        return true;
      }
    }
  }

  // 4. Base Role Fallback (Inherited Permissions)
  const userRoleAssignments = ctx.userRoles.filter(
    (ur) =>
      isSameUser(ur.user_id, ctx.userId) &&
      (ur.unit_id === null ||
        ur.unit_id === undefined ||
        targetUnitId === undefined ||
        targetUnitId === null ||
        Number(ur.unit_id) === Number(targetUnitId))
  );

  for (const ur of userRoleAssignments) {
    const hasRolePermission = ctx.rolePermissions.some(
      (rp) =>
        Number(rp.roleId) === Number(ur.role_id) &&
        Number(rp.permissionId) === Number(perm.id)
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
  const cleanPermId = Number(permissionId);

  // 1. Look for specific unit match if targetUnitId provided
  if (targetUnitId !== null && targetUnitId !== undefined) {
    const unitMatch = ctx.overrides.find(
      (ov) =>
        isSameUser(ov.user_id, ctx.userId) &&
        Number(ov.permission_id) === cleanPermId &&
        Number(ov.unit_id) === Number(targetUnitId)
    );
    if (unitMatch) return unitMatch.is_granted ? 'granted' : 'revoked';
  }

  // 2. Look for global override (unit_id is null/undefined)
  const globalMatch = ctx.overrides.find(
    (ov) =>
      isSameUser(ov.user_id, ctx.userId) &&
      Number(ov.permission_id) === cleanPermId &&
      (ov.unit_id === null || ov.unit_id === undefined)
  );
  if (globalMatch) return globalMatch.is_granted ? 'granted' : 'revoked';

  // 3. Fallback: match any unit override for this permission
  const anyMatch = ctx.overrides.find(
    (ov) =>
      isSameUser(ov.user_id, ctx.userId) &&
      Number(ov.permission_id) === cleanPermId
  );
  if (anyMatch) return anyMatch.is_granted ? 'granted' : 'revoked';

  return 'inherited';
}
