'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import {
  User,
  Role,
  Unit,
  AuditLogEntry,
  AuditActionType,
  UserRole,
  Member,
  Patrol,
  MemberUnitHistory,
  MediaAlbum,
  MediaItem,
  ScoutAttendanceStats,
  Permission,
  UserPermissionOverride,
} from './types';
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
  INITIAL_MEMBER_UNIT_HISTORY,
  INITIAL_MEDIA_ALBUMS,
  INITIAL_MEDIA_ITEMS,
  INITIAL_SCOUT_SESSION_RECORDS,
  ScoutSessionRecord,
} from './data';
import { checkPermission, PermissionContext, isSameUser, normalizeUserId } from './permissions';

interface AuthContextType {
  currentUser: User | null;
  currentMember: Member | null;
  currentRole: Role | null;
  currentUnit: Unit | null;
  isScout: boolean;
  userRoles: UserRole[];
  auditLogs: AuditLogEntry[];
  isSuperAdmin: boolean;
  login: (email: string) => boolean;
  loginAs: (userId: string) => void;
  loginAsScout: (memberCode: string, pin: string) => { success: boolean; error?: string };
  loginAsMember: (memberId: string) => void;
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
  assignLeaderUnit: (userId: string, unitId: number | null | number[], roleId?: number) => boolean;
  assignLeaderUnits: (userId: string, unitIds: number[], roleId?: number) => boolean;
  addMember: (memberData: Omit<Member, 'id'> & { id?: string }) => Member;
  addLeader: (leaderData: {
    full_name: string;
    email: string;
    phone?: string;
    role_id: number;
    unit_id?: number | null;
    unit_ids?: number[];
  }) => User;
  members: Member[];
  patrols: Patrol[];
  assignScoutPatrol: (memberId: string, patrolId: number | null) => boolean;
  scoutProgressionHistory: MemberUnitHistory[];
  getScoutAccessibleAlbums: (memberId?: string) => MediaAlbum[];
  getAlbumPhotos: (albumId: string) => MediaItem[];
  getScoutAttendanceStats: (memberId?: string) => ScoutAttendanceStats;
  getScoutSessionRecords: (memberId?: string) => ScoutSessionRecord[];
  // Permissions & Database state
  overrides: UserPermissionOverride[];
  permissions: Permission[];
  roles: Role[];
  rolePermissions: { roleId: number; permissionId: number }[];
  isDbConnected: boolean;
  isLoadingPermissions: boolean;
  isPermissionsLoaded: boolean;
  updatePermissionOverride: (
    userId: string,
    permissionIds: number[],
    unitId: number | null | (number | null)[],
    isGranted: boolean
  ) => Promise<boolean>;
  resetPermissionOverrides: (
    userId: string,
    permissionIds?: number[],
    unitId?: number | null | (number | null)[]
  ) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage Cache Keys for Instant Leader Permissions (Zero-flicker loading)
const CACHE_KEY_RBAC = 'scouts_cached_rbac_v2';
const CACHE_KEY_MEMBERS = 'scouts_cached_members_v2';

interface CachedRbacState {
  users: User[];
  userRoles: UserRole[];
  overrides: UserPermissionOverride[];
  permissions: Permission[];
  roles: Role[];
  rolePermissions: { roleId: number; permissionId: number }[];
  timestamp: number;
}

function getRbacCache(): CachedRbacState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY_RBAC);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.userRoles)) {
        return parsed;
      }
    }
    // Fallback to legacy keys if present
    const legacyRoles = localStorage.getItem('scouts_user_roles');
    const legacyOverrides = localStorage.getItem('scouts_user_overrides');
    if (legacyRoles) {
      return {
        users: [],
        userRoles: JSON.parse(legacyRoles),
        overrides: legacyOverrides ? JSON.parse(legacyOverrides) : [],
        permissions: INITIAL_PERMISSIONS,
        roles: INITIAL_ROLES,
        rolePermissions: INITIAL_ROLE_PERMISSIONS,
        timestamp: Date.now(),
      };
    }
  } catch {}
  return null;
}

function saveRbacCache(data: Partial<CachedRbacState>) {
  if (typeof window === 'undefined') return;
  try {
    const current = getRbacCache() || {
      users: [],
      userRoles: [],
      overrides: [],
      permissions: INITIAL_PERMISSIONS,
      roles: INITIAL_ROLES,
      rolePermissions: INITIAL_ROLE_PERMISSIONS,
      timestamp: Date.now(),
    };
    const next: CachedRbacState = {
      users: data.users ?? current.users,
      userRoles: data.userRoles ?? current.userRoles,
      overrides: data.overrides ?? current.overrides,
      permissions: data.permissions ?? current.permissions,
      roles: data.roles ?? current.roles,
      rolePermissions: data.rolePermissions ?? current.rolePermissions,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY_RBAC, JSON.stringify(next));
    if (data.userRoles) localStorage.setItem('scouts_user_roles', JSON.stringify(data.userRoles));
    if (data.overrides) localStorage.setItem('scouts_user_overrides', JSON.stringify(data.overrides));
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronously initialize current active identity from localStorage on first tick
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'u0';
    try {
      const isLoggedOut = localStorage.getItem('scouts_auth_logged_out') === 'true';
      if (isLoggedOut) return '';
      const savedMemberId = localStorage.getItem('scouts_auth_member_id');
      if (savedMemberId) return '';
      const savedUserId = localStorage.getItem('scouts_auth_user_id');
      if (savedUserId) return savedUserId;
    } catch {}
    return 'u0';
  });

  const [currentMemberId, setCurrentMemberId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const isLoggedOut = localStorage.getItem('scouts_auth_logged_out') === 'true';
      if (isLoggedOut) return '';
      const savedMemberId = localStorage.getItem('scouts_auth_member_id');
      if (savedMemberId) return savedMemberId;
    } catch {}
    return '';
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Synchronously initialize cached RBAC so permissions are present on Frame 0
  const [users, setUsers] = useState<User[]>(() => {
    const cached = getRbacCache();
    return cached?.users?.length ? cached.users : [];
  });
  const [userRoles, setUserRoles] = useState<UserRole[]>(() => {
    const cached = getRbacCache();
    return cached?.userRoles?.length ? cached.userRoles : [];
  });
  const [overrides, setOverrides] = useState<UserPermissionOverride[]>(() => {
    const cached = getRbacCache();
    return cached?.overrides?.length ? cached.overrides : [];
  });
  const [permissions, setPermissions] = useState<Permission[]>(() => {
    const cached = getRbacCache();
    return cached?.permissions?.length ? cached.permissions : INITIAL_PERMISSIONS;
  });
  const [roles, setRoles] = useState<Role[]>(() => {
    const cached = getRbacCache();
    return cached?.roles?.length ? cached.roles : INITIAL_ROLES;
  });
  const [rolePermissions, setRolePermissions] = useState<{ roleId: number; permissionId: number }[]>(() => {
    const cached = getRbacCache();
    return cached?.rolePermissions?.length ? cached.rolePermissions : INITIAL_ROLE_PERMISSIONS;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CACHE_KEY_MEMBERS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [patrols, setPatrols] = useState<Patrol[]>([]);

  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState<boolean>(() => {
    const cached = getRbacCache();
    return !(cached && cached.userRoles && cached.userRoles.length > 0);
  });
  const [isPermissionsLoaded, setIsPermissionsLoaded] = useState<boolean>(() => {
    const cached = getRbacCache();
    return Boolean(cached && cached.userRoles && cached.userRoles.length > 0);
  });

  // Fetch live state from Microsoft SQL Server (ScoutsDB)
  const refreshPermissions = useCallback(async () => {
    try {
      // 1. Fetch live RBAC & Users
      const res = await fetch('/api/permissions', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsDbConnected(true);
          const nextUsers = Array.isArray(data.users) ? data.users : [];
          const nextUserRoles = Array.isArray(data.userRoles) ? data.userRoles : [];
          const nextOverrides = Array.isArray(data.overrides) ? data.overrides : [];
          const nextPermissions = Array.isArray(data.permissions) ? data.permissions : INITIAL_PERMISSIONS;
          const nextRoles = Array.isArray(data.roles) ? data.roles : INITIAL_ROLES;
          const nextRolePermissions = Array.isArray(data.rolePermissions) ? data.rolePermissions : INITIAL_ROLE_PERMISSIONS;

          setUsers(nextUsers);
          setUserRoles(nextUserRoles);
          setOverrides(nextOverrides);
          setPermissions(nextPermissions);
          setRoles(nextRoles);
          setRolePermissions(nextRolePermissions);

          saveRbacCache({
            users: nextUsers,
            userRoles: nextUserRoles,
            overrides: nextOverrides,
            permissions: nextPermissions,
            roles: nextRoles,
            rolePermissions: nextRolePermissions,
          });

          setIsLoadingPermissions(false);
          setIsPermissionsLoaded(true);
        }
      }

      // 2. Fetch live Members & Patrols
      const memRes = await fetch('/api/members', { cache: 'no-store' });
      if (memRes.ok) {
        const memData = await memRes.json();
        if (memData.success) {
          if (Array.isArray(memData.members)) {
            setMembers(memData.members);
            try {
              localStorage.setItem(CACHE_KEY_MEMBERS, JSON.stringify(memData.members));
            } catch {}
          }
          if (Array.isArray(memData.patrols)) setPatrols(memData.patrols);
        }
      }

      // 3. Fetch live Audit Logs
      const auditRes = await fetch('/api/audit-logs?limit=50', { cache: 'no-store' });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        if (auditData.success && Array.isArray(auditData.logs)) {
          setAuditLogs(auditData.logs);
        }
      }
    } catch (err) {
      console.warn('Could not connect to ScoutsDB API routes:', err);
      setIsDbConnected(false);
      setIsLoadingPermissions(false);
    }
  }, []);

  // Initialize auth session state from localStorage and fetch live DB on mount
  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const isScout = useMemo(() => Boolean(currentMemberId), [currentMemberId]);

  const currentMember = useMemo(() => {
    if (!currentMemberId) return null;
    return members.find((m) => m.id === currentMemberId) || null;
  }, [currentMemberId, members]);

  const currentUser = useMemo(() => {
    if (isScout && currentMember) {
      return {
        id: currentMember.id,
        email: currentMember.member_code,
        full_name: currentMember.full_name_ar,
        phone: currentMember.member_phone,
        is_active: currentMember.is_active,
      };
    }
    if (!currentUserId) return null;
    return (
      users.find((u) => isSameUser(u.id, currentUserId) || u.email === currentUserId) ||
      INITIAL_USERS.find((u) => isSameUser(u.id, currentUserId) || u.email === currentUserId) ||
      null
    );
  }, [isScout, currentMember, currentUserId, users]);

  const userRoleAssignment = useMemo(() => {
    if (isScout || !currentUserId) return null;
    return userRoles.find((ur) => isSameUser(ur.user_id, currentUserId)) || null;
  }, [isScout, currentUserId, userRoles]);

  const currentRole = useMemo(() => {
    if (isScout) {
      return {
        id: 99,
        name: 'scout',
        description: 'Scout Member (كشاف / شبل / عضو) - Youth Scout Space & Team Archive Access',
      };
    }
    if (!currentUserId || !userRoleAssignment) return null;
    return roles.find((r) => r.id === userRoleAssignment.role_id) || INITIAL_ROLES.find((r) => r.id === userRoleAssignment.role_id) || null;
  }, [isScout, currentUserId, userRoleAssignment, roles]);

  const currentUnit = useMemo(() => {
    if (isScout && currentMember) {
      return INITIAL_UNITS.find((u) => u.id === currentMember.unit_id) || null;
    }
    if (!userRoleAssignment?.unit_id) return null;
    return INITIAL_UNITS.find((u) => u.id === userRoleAssignment.unit_id) || null;
  }, [isScout, currentMember, userRoleAssignment]);

  const isSuperAdmin = useMemo(() => {
    if (isScout || !currentUserId) return false;
    const normId = normalizeUserId(currentUserId);
    // Christine Nabil is strictly a scoped leader and never Super Admin
    if (
      currentUserId === 'u18' ||
      normId === '11111111-0000-0000-0000-000000000018' ||
      currentUser?.email?.toLowerCase() === 'christine.nabil@scouts.org'
    ) {
      return false;
    }
    return (
      currentUserId === 'u0' ||
      normId === '11111111-0000-0000-0000-000000000001' ||
      currentUser?.email?.toLowerCase() === 'admin@scouts.org' ||
      currentRole?.name === 'admin' ||
      userRoles.some((ur) => isSameUser(ur.user_id, currentUserId) && ur.role_id === 1)
    );
  }, [isScout, currentUserId, currentUser, currentRole, userRoles]);

  // Dynamic Permission Engine Context connected to live database overrides
  const permContext = useMemo<PermissionContext>(() => {
    return {
      userId: currentUserId,
      roles: roles.length > 0 ? roles : INITIAL_ROLES,
      userRoles,
      permissions: permissions.length > 0 ? permissions : INITIAL_PERMISSIONS,
      rolePermissions: rolePermissions.length > 0 ? rolePermissions : INITIAL_ROLE_PERMISSIONS,
      overrides,
    };
  }, [currentUserId, userRoles, overrides, roles, permissions, rolePermissions]);

  const can = (permissionKey: string, targetUnitId?: number | null): boolean => {
    if (!currentUserId && !isScout) {
      return false;
    }
    // Admin has everything unlocked unconditionally
    if (isSuperAdmin) {
      return true;
    }
    if (isScout) {
      if (
        permissionKey === 'scout.portal.view' ||
        permissionKey === 'scout.attendance.view_self' ||
        permissionKey === 'scout.media.view_team_history'
      ) {
        return true;
      }
      return false;
    }
    return checkPermission(permContext, permissionKey, targetUnitId);
  };

  const loginAs = (userId: string) => {
    const targetUser =
      users.find((u) => isSameUser(u.id, userId) || u.id === userId || u.email === userId) ||
      INITIAL_USERS.find((u) => isSameUser(u.id, userId) || u.id === userId || u.email === userId);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      setCurrentMemberId('');
      try {
        localStorage.removeItem('scouts_auth_logged_out');
        localStorage.setItem('scouts_auth_user_id', targetUser.id);
        localStorage.removeItem('scouts_auth_member_id');
      } catch {}

      logAction({
        action_type: 'user_login',
        title_ar: 'تسجيل دخول قائد للمنظومة',
        title_en: 'Leader Logged In',
        description_ar: `قام ${targetUser.full_name} بتسجيل الدخول إلى النظام`,
        description_en: `${targetUser.full_name} authenticated into the system`,
        unit_id: userRoles.find((ur) => isSameUser(ur.user_id, targetUser.id))?.unit_id,
      });
    }
  };

  const loginAsMember = (memberId: string) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (targetMember) {
      setCurrentMemberId(memberId);
      setCurrentUserId('');
      try {
        localStorage.removeItem('scouts_auth_logged_out');
        localStorage.setItem('scouts_auth_member_id', memberId);
        localStorage.removeItem('scouts_auth_user_id');
      } catch {}

      logAction({
        action_type: 'user_login',
        title_ar: 'تسجيل دخول كشاف / شبل',
        title_en: 'Scout Logged In',
        description_ar: `قام الكشاف ${targetMember.full_name_ar} (${targetMember.member_code}) بتسجيل الدخول`,
        description_en: `Scout ${targetMember.full_name_ar} authenticated into Scout Space`,
        unit_id: targetMember.unit_id,
      });
    }
  };

  const loginAsScout = (memberCode: string, pin: string): { success: boolean; error?: string } => {
    const cleanCode = memberCode.trim().toUpperCase();
    const cleanPin = pin.trim();

    const targetMember = members.find(
      (m) => m.member_code.toUpperCase() === cleanCode
    );

    if (!targetMember) {
      return { success: false, error: 'كود الكشاف غير مسجل بالمنظومة (Invalid Scout Code)' };
    }

    if (cleanPin !== '1234') {
      return { success: false, error: 'رمز الدخول السري غير صحيح (Invalid PIN)' };
    }

    loginAsMember(targetMember.id);
    return { success: true };
  };

  const login = (email: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.startsWith('sct-') || cleanEmail.includes('100') || cleanEmail.includes('200')) {
      const res = loginAsScout(email, '1234');
      return res.success;
    }

    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user) {
      loginAs(user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUserId('');
    setCurrentMemberId('');
    try {
      localStorage.setItem('scouts_auth_logged_out', 'true');
      localStorage.removeItem('scouts_auth_user_id');
      localStorage.removeItem('scouts_auth_member_id');
    } catch {}
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
    const newLog: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: currentUserId || 'system',
      user_name: currentUser?.full_name || 'System User',
      unit_id: action.unit_id || null,
      unit_name: action.unit_id ? INITIAL_UNITS.find((u) => u.id === action.unit_id)?.name_ar : undefined,
      action_type: action.action_type,
      title_ar: action.title_ar,
      title_en: action.title_en,
      description_ar: action.description_ar,
      description_en: action.description_en,
      metadata: action.metadata,
      timestamp: new Date().toISOString(),
    };

    setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]);

    // Live persistence to Microsoft SQL Server
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        unitId: action.unit_id,
        actionType: action.action_type,
        titleAr: action.title_ar,
        titleEn: action.title_en,
        descriptionAr: action.description_ar,
        descriptionEn: action.description_en,
        metadata: action.metadata,
      }),
    }).catch((e) => console.warn('Audit log write error:', e));
  };

  const accessibleUnits = useMemo(() => {
    if (!currentUserId && !isScout) {
      return [];
    }
    if (isSuperAdmin) {
      return INITIAL_UNITS;
    }
    if (isScout && currentMember) {
      return INITIAL_UNITS.filter((u) => u.id === currentMember.unit_id);
    }
    const myRoleUnits = userRoles.filter((ur) => isSameUser(ur.user_id, currentUserId));
    if (myRoleUnits.some((ur) => ur.unit_id === null || ur.unit_id === undefined)) {
      return INITIAL_UNITS;
    }
    const unitIds = myRoleUnits.map((ur) => ur.unit_id);
    return INITIAL_UNITS.filter((u) => unitIds.includes(u.id));
  }, [isSuperAdmin, isScout, currentMember, userRoles, currentUserId]);

  // Update Permission Override with live Database persistence (supports single unit or array of units)
  const updatePermissionOverride = async (
    userId: string,
    permissionIds: number[],
    unitId: number | null | (number | null)[],
    isGranted: boolean
  ): Promise<boolean> => {
    const normId = normalizeUserId(userId);
    const unitIdsList: (number | null)[] = Array.isArray(unitId) ? unitId : [unitId];
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'override',
          userId: normId,
          permissionIds,
          unitIds: unitIdsList,
          unitId: unitIdsList[0] ?? null,
          isGranted,
        }),
      });
      const data = await res.json();
      if (data.success && data.overrides) {
        setOverrides(data.overrides);
        saveRbacCache({ overrides: data.overrides });
        return true;
      }
    } catch (err) {
      console.error('Failed to save override to database:', err);
    }

    // Local optimistic update
    setOverrides((prev) => {
      const cleanPermIds = permissionIds.map(Number);
      let next = [...prev];
      for (const targetUId of unitIdsList) {
        const cleanUnitId = targetUId !== null && targetUId !== undefined ? Number(targetUId) : null;
        next = next.filter(
          (ov) =>
            !(
              isSameUser(ov.user_id, userId) &&
              cleanPermIds.includes(Number(ov.permission_id)) &&
              (cleanUnitId !== null ? Number(ov.unit_id) === cleanUnitId : ov.unit_id === null || ov.unit_id === undefined)
            )
        );
        cleanPermIds.forEach((pId, idx) => {
          next.push({
            id: Date.now() + idx + Math.floor(Math.random() * 1000),
            user_id: normId,
            permission_id: pId,
            unit_id: cleanUnitId,
            is_granted: isGranted,
          });
        });
      }
      saveRbacCache({ overrides: next });
      return next;
    });
    return true;
  };

  // Reset Permission Overrides with live Database persistence (supports single unit or array of units)
  const resetPermissionOverrides = async (
    userId: string,
    permissionIds?: number[],
    unitId?: number | null | (number | null)[]
  ): Promise<boolean> => {
    const normId = normalizeUserId(userId);
    const unitIdsList = unitId !== undefined ? (Array.isArray(unitId) ? unitId : [unitId]) : undefined;
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          permissionIds && permissionIds.length > 0
            ? { action: 'reset_module', userId: normId, permissionIds, unitIds: unitIdsList, unitId: unitIdsList?.[0] ?? null }
            : { action: 'reset_all', userId: normId }
        ),
      });
      const data = await res.json();
      if (data.success && data.overrides) {
        setOverrides(data.overrides);
        saveRbacCache({ overrides: data.overrides });
        return true;
      }
    } catch (err) {
      console.error('Failed to reset overrides in database:', err);
    }

    // Local fallback
    setOverrides((prev) => {
      let filtered: UserPermissionOverride[];
      if (permissionIds && permissionIds.length > 0) {
        const cleanPermIds = permissionIds.map(Number);
        const unitsToDelete = unitIdsList || [null];
        filtered = prev.filter((ov) => {
          if (!isSameUser(ov.user_id, userId)) return true;
          if (!cleanPermIds.includes(Number(ov.permission_id))) return true;
          const ovUnitId = ov.unit_id !== null && ov.unit_id !== undefined ? Number(ov.unit_id) : null;
          return !unitsToDelete.some((delUId) => (delUId !== null && delUId !== undefined ? Number(delUId) === ovUnitId : ovUnitId === null));
        });
      } else {
        filtered = prev.filter((ov) => !isSameUser(ov.user_id, userId));
      }
      saveRbacCache({ overrides: filtered });
      return filtered;
    });
    return true;
  };

  // Assign Leader Units & Role with live Database persistence
  const assignLeaderUnits = (userId: string, unitIds: number[], roleId?: number): boolean => {
    const targetUser =
      users.find((u) => isSameUser(u.id, userId)) ||
      INITIAL_USERS.find((u) => isSameUser(u.id, userId));
    if (!targetUser) return false;

    const existing = userRoles.find((ur) => isSameUser(ur.user_id, userId));
    const effectiveRoleId = roleId !== undefined ? roleId : (existing?.role_id ?? 4);

    // Save to Database
    const normId = normalizeUserId(userId);
    fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assign_roles',
        userId: normId,
        unitIds,
        roleId: effectiveRoleId,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.userRoles) {
          setUserRoles(data.userRoles);
          saveRbacCache({ userRoles: data.userRoles });
        }
      })
      .catch((e) => console.error('Database role assignment error:', e));

    // Optimistically update local state
    setUserRoles((prev) => {
      const otherUserRoles = prev.filter((ur) => !isSameUser(ur.user_id, userId));
      let newRoles: UserRole[] = [];
      if (unitIds.length === 0) {
        newRoles = [
          {
            id: Date.now(),
            user_id: targetUser.id,
            role_id: effectiveRoleId,
            unit_id: null,
          },
        ];
      } else {
        newRoles = unitIds.map((uId, idx) => ({
          id: Date.now() + idx,
          user_id: targetUser.id,
          role_id: effectiveRoleId,
          unit_id: uId,
        }));
      }
      const updated = [...otherUserRoles, ...newRoles];
      saveRbacCache({ userRoles: updated });
      return updated;
    });

    const assignedUnitsObjs = unitIds
      .map((id) => INITIAL_UNITS.find((u) => u.id === id))
      .filter(Boolean);
    const unitNamesAr = assignedUnitsObjs.length > 0
      ? assignedUnitsObjs.map((u) => u!.name_ar).join('، ')
      : 'نطاق عام (كامل الفوج)';
    const unitNamesEn = assignedUnitsObjs.length > 0
      ? assignedUnitsObjs.map((u) => u!.name_en).join(', ')
      : 'Global Troop Scope';

    logAction({
      action_type: 'leader_team_assigned',
      title_ar: 'تعيين قائد لفرق ومراحل',
      title_en: 'Leader Teams Assigned',
      description_ar: `قام قائد الفوج بتعيين القائد ${targetUser.full_name} إلى: ${unitNamesAr}`,
      description_en: `Leader ${targetUser.full_name} assigned to teams: ${unitNamesEn}`,
      unit_id: unitIds[0] || null,
      metadata: { target_user_id: userId, unit_ids: unitIds, role_id: roleId },
    });

    return true;
  };

  const assignLeaderUnit = (userId: string, unitId: number | null | number[], roleId?: number): boolean => {
    if (Array.isArray(unitId)) {
      return assignLeaderUnits(userId, unitId, roleId);
    }
    return assignLeaderUnits(userId, unitId === null ? [] : [unitId], roleId);
  };

  const assignScoutPatrol = (memberId: string, patrolId: number | null): boolean => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return false;

    const hasAccess = isSuperAdmin || accessibleUnits.some((u) => u.id === targetMember.unit_id);
    if (!hasAccess) {
      return false;
    }

    // Optimistically update local state
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, patrol_id: patrolId } : m))
    );

    // Persist to Microsoft SQL Server
    fetch('/api/members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assign_patrol',
        memberId,
        patrolId,
      }),
    }).catch((e) => console.error('Failed to assign scout patrol in DB:', e));

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

  const addMember = (memberData: Omit<Member, 'id'> & { id?: string }): Member => {
    const tempId = memberData.id || `m_${Date.now()}`;
    const newMember: Member = {
      ...memberData,
      id: tempId,
      is_active: memberData.is_active !== undefined ? memberData.is_active : true,
    };

    setMembers((prev) => [newMember, ...prev]);

    // Persist to Microsoft SQL Server
    fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.member) {
          setMembers((prev) => prev.map((m) => (m.id === tempId ? data.member : m)));
        }
      })
      .catch((e) => console.error('Failed to add member in DB:', e));

    logAction({
      action_type: 'member_created',
      title_ar: 'إضافة عضو كشفي جديد',
      title_en: 'New Scout Member Added',
      description_ar: `تمت إضافة الكشاف (${newMember.full_name_ar}) إلى المنظومة`,
      description_en: `Scout member (${newMember.full_name_ar}) registered in the directory`,
      unit_id: newMember.unit_id,
      metadata: { member_id: tempId, member_code: newMember.member_code },
    });

    return newMember;
  };

  const addLeader = (leaderData: {
    full_name: string;
    email: string;
    phone?: string;
    role_id: number;
    unit_id?: number | null;
    unit_ids?: number[];
  }): User => {
    const newId = `u_${Date.now()}`;
    const newUser: User = {
      id: newId,
      full_name: leaderData.full_name,
      email: leaderData.email,
      phone: leaderData.phone || '',
      is_active: true,
    };

    // Save to database
    fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_leader',
        full_name: leaderData.full_name,
        email: leaderData.email,
        phone: leaderData.phone,
        role_id: leaderData.role_id,
        unit_ids: leaderData.unit_ids || (leaderData.unit_id ? [leaderData.unit_id] : []),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          if (data.users) setUsers(data.users);
          if (data.userRoles) {
            setUserRoles(data.userRoles);
            saveRbacCache({ users: data.users, userRoles: data.userRoles });
          }
        }
      })
      .catch((e) => console.error('Database leader creation error:', e));

    setUsers((prev) => [...prev, newUser]);

    const targetUnitIds: number[] = leaderData.unit_ids
      ? leaderData.unit_ids
      : leaderData.unit_id !== null && leaderData.unit_id !== undefined
      ? [leaderData.unit_id]
      : [];

    let newRoleAssignments: UserRole[] = [];
    if (targetUnitIds.length === 0) {
      newRoleAssignments = [
        {
          id: Date.now(),
          user_id: newId,
          role_id: leaderData.role_id,
          unit_id: null,
        },
      ];
    } else {
      newRoleAssignments = targetUnitIds.map((uId, idx) => ({
        id: Date.now() + idx,
        user_id: newId,
        role_id: leaderData.role_id,
        unit_id: uId,
      }));
    }

    setUserRoles((prev) => [...prev, ...newRoleAssignments]);

    logAction({
      action_type: 'leader_created',
      title_ar: 'إضافة قائد جديد للمنظومة',
      title_en: 'New Leader Registered',
      description_ar: `تم تسجيل القائد (${newUser.full_name}) وتعيينه في الدور والفرق المخصصة`,
      description_en: `Leader (${newUser.full_name}) registered and assigned role/teams`,
      unit_id: targetUnitIds[0] || null,
      metadata: { user_id: newId, role_id: leaderData.role_id, unit_ids: targetUnitIds },
    });

    return newUser;
  };


  const scoutProgressionHistory = useMemo(() => {
    if (!currentMemberId) return [];
    return INITIAL_MEMBER_UNIT_HISTORY.filter((h) => h.member_id === currentMemberId);
  }, [currentMemberId]);

  const getScoutAccessibleAlbums = useCallback(
    (memberId?: string): MediaAlbum[] => {
      const targetId = memberId || currentMemberId;
      if (!targetId) return [];

      const targetMem = members.find((m) => m.id === targetId);
      if (!targetMem) return [];

      const history = INITIAL_MEMBER_UNIT_HISTORY.filter((h) => h.member_id === targetId);
      const allowedUnitYears = history.map((h) => ({ unit_id: h.unit_id, year: h.year }));
      allowedUnitYears.push({ unit_id: targetMem.unit_id, year: 2026 });

      return INITIAL_MEDIA_ALBUMS.filter((album) =>
        allowedUnitYears.some((uy) => uy.unit_id === album.unit_id && uy.year === album.year)
      );
    },
    [currentMemberId, members]
  );

  const getAlbumPhotos = useCallback((albumId: string): MediaItem[] => {
    return INITIAL_MEDIA_ITEMS.filter((item) => item.album_id === albumId);
  }, []);

  const getScoutAttendanceStats = useCallback(
    (memberId?: string): ScoutAttendanceStats => {
      const targetId = memberId || currentMemberId;
      if (!targetId) {
        return {
          totalSessions: 24,
          presentCount: 22,
          excusedCount: 1,
          absentCount: 1,
          lateCount: 0,
          percentage: 92,
          streak: 6,
          honorRank: 'gold',
        };
      }
      return {
        totalSessions: 26,
        presentCount: 24,
        excusedCount: 1,
        absentCount: 1,
        lateCount: 0,
        percentage: 92.3,
        streak: 7,
        honorRank: 'gold',
      };
    },
    [currentMemberId]
  );

  const getScoutSessionRecords = useCallback(
    (memberId?: string): ScoutSessionRecord[] => {
      const targetId = memberId || currentMemberId;
      if (!targetId) return INITIAL_SCOUT_SESSION_RECORDS;
      return INITIAL_SCOUT_SESSION_RECORDS.filter((r) => r.member_id === targetId || r.member_id === 'm1');
    },
    [currentMemberId]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentMember,
        currentRole,
        currentUnit,
        isScout,
        userRoles,
        auditLogs,
        isSuperAdmin,
        login,
        loginAs,
        loginAsScout,
        loginAsMember,
        logout,
        can,
        logAction,
        allUsers: users,
        accessibleUnits,
        assignLeaderUnit,
        assignLeaderUnits,
        addMember,
        addLeader,
        members,
        patrols,
        assignScoutPatrol,
        scoutProgressionHistory,
        getScoutAccessibleAlbums,
        getAlbumPhotos,
        getScoutAttendanceStats,
        getScoutSessionRecords,
        overrides,
        permissions,
        roles,
        rolePermissions,
        isDbConnected,
        isLoadingPermissions,
        isPermissionsLoaded,
        updatePermissionOverride,
        resetPermissionOverrides,
        refreshPermissions,
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
