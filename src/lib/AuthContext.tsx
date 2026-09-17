'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User, Role, Unit, AuditLogEntry, AuditActionType, UserRole, Member, Patrol } from './types';
import {
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_UNITS,
  INITIAL_USER_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_USER_OVERRIDES,
  INITIAL_AUDIT_LOGS,
  INITIAL_MEMBERS,
  INITIAL_PATROLS,
} from './data';
import { checkPermission, PermissionContext } from './permissions';

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role | null;
  currentUnit: Unit | null;
  userRoles: UserRole[];
  auditLogs: AuditLogEntry[];
  isSuperAdmin: boolean;
  login: (email: string) => boolean;
  loginAs: (userId: string) => void;
  logout: () => void;
  can: (permissionKey: string, targetUnitId?: number | null) => boolean;
  logAction: (action: {
    action_type: AuditActionType;
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    unit_id?: number | null;
    metadata?: Record<string, any>;
  }) => void;
  allUsers: User[];
  accessibleUnits: Unit[];
  assignLeaderUnit: (userId: string, unitId: number | null, roleId?: number) => boolean;
  members: Member[];
  patrols: Patrol[];
  assignScoutPatrol: (memberId: string, patrolId: number | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string>('u1'); // Default to Peter Shoukry (Admin)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [userRoles, setUserRoles] = useState<UserRole[]>(INITIAL_USER_ROLES);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [patrols] = useState<Patrol[]>(INITIAL_PATROLS);

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const savedUserId = localStorage.getItem('scouts_auth_user_id');
      if (savedUserId && INITIAL_USERS.some((u) => u.id === savedUserId)) {
        setCurrentUserId(savedUserId);
      }
      const savedLogs = localStorage.getItem('scouts_audit_logs');
      if (savedLogs) {
        setAuditLogs(JSON.parse(savedLogs));
      }
      const savedUserRoles = localStorage.getItem('scouts_user_roles');
      if (savedUserRoles) {
        setUserRoles(JSON.parse(savedUserRoles));
      }
      const savedMembers = localStorage.getItem('scouts_members');
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      }
    } catch {
      // Ignore local storage error in environments where disabled
    }
  }, []);

  const currentUser = useMemo(() => {
    return INITIAL_USERS.find((u) => u.id === currentUserId) || null;
  }, [currentUserId]);

  const userRoleAssignment = useMemo(() => {
    return userRoles.find((ur) => ur.user_id === currentUserId) || null;
  }, [currentUserId, userRoles]);

  const currentRole = useMemo(() => {
    if (!userRoleAssignment) return null;
    return INITIAL_ROLES.find((r) => r.id === userRoleAssignment.role_id) || null;
  }, [userRoleAssignment]);

  const currentUnit = useMemo(() => {
    if (!userRoleAssignment?.unit_id) return null;
    return INITIAL_UNITS.find((u) => u.id === userRoleAssignment.unit_id) || null;
  }, [userRoleAssignment]);

  const isSuperAdmin = useMemo(() => {
    return currentRole?.name === 'group_leader' && (!userRoleAssignment?.unit_id);
  }, [currentRole, userRoleAssignment]);

  const permContext = useMemo<PermissionContext>(() => {
    return {
      userId: currentUserId,
      roles: INITIAL_ROLES,
      userRoles: userRoles,
      permissions: INITIAL_PERMISSIONS,
      rolePermissions: INITIAL_ROLE_PERMISSIONS,
      overrides: INITIAL_USER_OVERRIDES,
    };
  }, [currentUserId, userRoles]);

  const can = (permissionKey: string, targetUnitId?: number | null): boolean => {
    return checkPermission(permContext, permissionKey, targetUnitId);
  };

  const loginAs = (userId: string) => {
    const targetUser = INITIAL_USERS.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUserId(userId);
      try {
        localStorage.setItem('scouts_auth_user_id', userId);
      } catch {
        // ignore
      }

      // Log login event
      logAction({
        action_type: 'user_login',
        title_ar: 'تسجيل دخول قائد للمنظومة',
        title_en: 'Leader Logged In',
        description_ar: `قام ${targetUser.full_name} بتسجيل الدخول إلى النظام`,
        description_en: `${targetUser.full_name} authenticated into the system`,
        unit_id: userRoles.find((ur) => ur.user_id === userId)?.unit_id,
      });
    }
  };

  const login = (email: string): boolean => {
    const user = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user) {
      loginAs(user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUserId('');
    try {
      localStorage.removeItem('scouts_auth_user_id');
    } catch {
      // ignore
    }
  };

  const logAction = (action: {
    action_type: AuditActionType;
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    unit_id?: number | null;
    metadata?: Record<string, any>;
  }) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      user_id: currentUser ? currentUser.id : 'anonymous',
      user_name: currentUser ? currentUser.full_name : 'Guest User',
      user_role_name: currentRole ? currentRole.description.split(' - ')[0] : 'Leader',
      unit_id: action.unit_id !== undefined ? action.unit_id : (currentUnit ? currentUnit.id : null),
      action_type: action.action_type,
      title_ar: action.title_ar,
      title_en: action.title_en,
      description_ar: action.description_ar,
      description_en: action.description_en,
      metadata: action.metadata,
      created_at: new Date().toISOString(),
    };

    setAuditLogs((prev) => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem('scouts_audit_logs', JSON.stringify(updated.slice(0, 100)));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const accessibleUnits = useMemo<Unit[]>(() => {
    if (isSuperAdmin) {
      return INITIAL_UNITS;
    }
    // Check all units assigned to this user in userRoles
    const userAssignedUnitIds = userRoles
      .filter((ur) => ur.user_id === currentUserId && ur.unit_id)
      .map((ur) => ur.unit_id as number);

    if (userAssignedUnitIds.length > 0) {
      return INITIAL_UNITS.filter((u) => userAssignedUnitIds.includes(u.id));
    }

    if (currentUnit) {
      return [currentUnit];
    }

    // Quartermaster has inventory access across units
    if (currentRole?.name === 'quartermaster') {
      return INITIAL_UNITS;
    }

    return [];
  }, [isSuperAdmin, currentUserId, currentUnit, currentRole, userRoles]);

  // Admin Leader Team Assignment
  const assignLeaderUnit = (userId: string, unitId: number | null, roleId?: number): boolean => {
    if (!isSuperAdmin && !can('users.manage_roles')) {
      return false;
    }

    const targetUser = INITIAL_USERS.find((u) => u.id === userId);
    if (!targetUser) return false;

    setUserRoles((prev) => {
      const existing = prev.find((ur) => ur.user_id === userId);
      let updated: UserRole[];
      if (existing) {
        updated = prev.map((ur) =>
          ur.user_id === userId
            ? {
                ...ur,
                unit_id: unitId,
                role_id: roleId !== undefined ? roleId : ur.role_id,
              }
            : ur
        );
      } else {
        updated = [
          ...prev,
          {
            id: Date.now(),
            user_id: userId,
            role_id: roleId !== undefined ? roleId : 3, // Default to section_leader (role_id 3)
            unit_id: unitId,
          },
        ];
      }

      try {
        localStorage.setItem('scouts_user_roles', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    const unit = unitId ? INITIAL_UNITS.find((u) => u.id === unitId) : null;
    const unitNameAr = unit ? unit.name_ar : 'نطاق عام (كامل الفوج)';
    const unitNameEn = unit ? unit.name_en : 'Global Organization Scope';

    logAction({
      action_type: 'leader_team_assigned',
      title_ar: 'تعيين قائد لفريق / مرحلة',
      title_en: 'Leader Team Assigned',
      description_ar: `قام قائد الفوج بتعيين القائد ${targetUser.full_name} إلى مرحلة: ${unitNameAr}`,
      description_en: `Leader ${targetUser.full_name} assigned to unit: ${unitNameEn}`,
      unit_id: unitId,
      metadata: { target_user_id: userId, unit_id: unitId, role_id: roleId },
    });

    return true;
  };

  // Leader Scout Patrol Assignment
  const assignScoutPatrol = (memberId: string, patrolId: number | null): boolean => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return false;

    // Security check: Must be superadmin or have access to member's unit
    const hasAccess = isSuperAdmin || accessibleUnits.some((u) => u.id === targetMember.unit_id);
    if (!hasAccess) {
      return false;
    }

    setMembers((prev) => {
      const updated = prev.map((m) =>
        m.id === memberId ? { ...m, patrol_id: patrolId } : m
      );
      try {
        localStorage.setItem('scouts_members', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    const targetPatrol = patrolId ? patrols.find((p) => p.id === patrolId) : null;
    const patrolNameAr = targetPatrol ? targetPatrol.name_ar : 'بدون طليعة';
    const patrolNameEn = targetPatrol ? targetPatrol.name_en : 'Unassigned';

    logAction({
      action_type: 'patrol_assigned',
      title_ar: 'توزيع كشاف على طليعة / سداسي',
      title_en: 'Scout Assigned to Patrol',
      description_ar: `تم تعيين الكشاف ${targetMember.full_name_ar} إلى ${patrolNameAr}`,
      description_en: `Scout ${targetMember.full_name_ar} assigned to ${patrolNameEn}`,
      unit_id: targetMember.unit_id,
      metadata: { member_id: memberId, patrol_id: patrolId },
    });

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        currentUnit,
        userRoles,
        auditLogs,
        isSuperAdmin,
        login,
        loginAs,
        logout,
        can,
        logAction,
        allUsers: INITIAL_USERS,
        accessibleUnits,
        assignLeaderUnit,
        members,
        patrols,
        assignScoutPatrol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

