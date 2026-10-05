'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
import { checkPermission, PermissionContext } from './permissions';

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
  assignLeaderUnit: (userId: string, unitId: number | null, roleId?: number) => boolean;
  addMember: (memberData: Omit<Member, 'id'> & { id?: string }) => Member;
  addLeader: (leaderData: {
    full_name: string;
    email: string;
    phone?: string;
    role_id: number;
    unit_id: number | null;
  }) => User;
  members: Member[];
  patrols: Patrol[];
  assignScoutPatrol: (memberId: string, patrolId: number | null) => boolean;
  scoutProgressionHistory: MemberUnitHistory[];
  getScoutAccessibleAlbums: (memberId?: string) => MediaAlbum[];
  getAlbumPhotos: (albumId: string) => MediaItem[];
  getScoutAttendanceStats: (memberId?: string) => ScoutAttendanceStats;
  getScoutSessionRecords: (memberId?: string) => ScoutSessionRecord[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string>('u0'); // Default to Admin (Me)
  const [currentMemberId, setCurrentMemberId] = useState<string>(''); // For scout authentication
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [userRoles, setUserRoles] = useState<UserRole[]>(INITIAL_USER_ROLES);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [patrols] = useState<Patrol[]>(INITIAL_PATROLS);

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('scouts_users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }
      const savedMemberId = localStorage.getItem('scouts_auth_member_id');
      if (savedMemberId && INITIAL_MEMBERS.some((m) => m.id === savedMemberId)) {
        setCurrentMemberId(savedMemberId);
        setCurrentUserId('');
      } else {
        const savedUserId = localStorage.getItem('scouts_auth_user_id');
        if (savedUserId) {
          setCurrentUserId(savedUserId);
          setCurrentMemberId('');
        }
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
    return users.find((u) => u.id === currentUserId) || INITIAL_USERS.find((u) => u.id === currentUserId) || null;
  }, [isScout, currentMember, currentUserId, users]);

  const userRoleAssignment = useMemo(() => {
    if (isScout) return null;
    return userRoles.find((ur) => ur.user_id === currentUserId) || null;
  }, [isScout, currentUserId, userRoles]);

  const currentRole = useMemo(() => {
    if (isScout) {
      return {
        id: 99,
        name: 'scout',
        description: 'Scout Member (كشاف / شبل / عضو) - Youth Scout Space & Team Archive Access',
      };
    }
    if (!userRoleAssignment) return null;
    return INITIAL_ROLES.find((r) => r.id === userRoleAssignment.role_id) || null;
  }, [isScout, userRoleAssignment]);

  const currentUnit = useMemo(() => {
    if (isScout && currentMember) {
      return INITIAL_UNITS.find((u) => u.id === currentMember.unit_id) || null;
    }
    if (!userRoleAssignment?.unit_id) return null;
    return INITIAL_UNITS.find((u) => u.id === userRoleAssignment.unit_id) || null;
  }, [isScout, currentMember, userRoleAssignment]);

  const isSuperAdmin = useMemo(() => {
    if (isScout) return false;
    return (
      currentUserId === 'u0' ||
      currentUser?.email?.toLowerCase() === 'admin@scouts.org' ||
      currentRole?.name === 'admin' ||
      userRoles.some((ur) => ur.user_id === currentUserId && ur.role_id === 1)
    );
  }, [isScout, currentUserId, currentUser, currentRole, userRoles]);

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
    // Admin has everything unlocked unconditionally
    if (isSuperAdmin) {
      return true;
    }
    if (isScout) {
      // Scout specific permissions
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
    const targetUser = INITIAL_USERS.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUserId(userId);
      setCurrentMemberId('');
      try {
        localStorage.setItem('scouts_auth_user_id', userId);
        localStorage.removeItem('scouts_auth_member_id');
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

  const loginAsMember = (memberId: string) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (targetMember) {
      setCurrentMemberId(memberId);
      setCurrentUserId('');
      try {
        localStorage.setItem('scouts_auth_member_id', memberId);
        localStorage.removeItem('scouts_auth_user_id');
      } catch {
        // ignore
      }

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
      return {
        success: false,
        error: 'كود الكشاف غير مسجل في المنظومة. تأكد من إدخال الكود الصحيح (مثال: SCT-2026-0001)',
      };
    }

    // Default PIN verification: accept '1234', or birth year, or member pin
    const birthYear = targetMember.date_of_birth.split('-')[0];
    const validPins = ['1234', targetMember.pin || '1234', birthYear];

    if (!validPins.includes(cleanPin)) {
      return {
        success: false,
        error: 'رمز المرور / سنة الميلاد غير صحيحة. جرب 1234 أو سنة ميلاد الكشاف.',
      };
    }

    loginAsMember(targetMember.id);
    return { success: true };
  };

  const login = (email: string): boolean => {
    // If entered a member code
    if (email.startsWith('SCT-') || email.startsWith('CUB-') || email.startsWith('BRW-')) {
      const res = loginAsScout(email, '1234');
      return res.success;
    }
    const user = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
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
      localStorage.removeItem('scouts_auth_user_id');
      localStorage.removeItem('scouts_auth_member_id');
    } catch {
      // ignore
    }
  };

  // Scout progression history
  const scoutProgressionHistory = useMemo<MemberUnitHistory[]>(() => {
    const targetId = currentMemberId || 'm1';
    return INITIAL_MEMBER_UNIT_HISTORY.filter((h) => h.member_id === targetId);
  }, [currentMemberId]);

  // Scoped team photo albums matching scout's yearly stages
  const getScoutAccessibleAlbums = (memberId?: string): MediaAlbum[] => {
    const targetId = memberId || currentMemberId || 'm1';
    const targetScout = members.find((m) => m.id === targetId);
    const history = INITIAL_MEMBER_UNIT_HISTORY.filter((h) => h.member_id === targetId);

    // Collect all (unit_id, year) pairs for this scout
    const allowedPairs: { unit_id: number; year: number }[] = history.map((h) => ({
      unit_id: h.unit_id,
      year: h.year,
    }));

    // Also include their current unit in 2026 if not already included
    if (targetScout && !allowedPairs.some((p) => p.unit_id === targetScout.unit_id && p.year === 2026)) {
      allowedPairs.push({ unit_id: targetScout.unit_id, year: 2026 });
    }

    // Filter albums strictly to matching unit_id and year
    return INITIAL_MEDIA_ALBUMS.filter((alb) =>
      allowedPairs.some((p) => p.unit_id === alb.unit_id && p.year === alb.year)
    ).sort((a, b) => b.year - a.year);
  };

  const getAlbumPhotos = (albumId: string): MediaItem[] => {
    return INITIAL_MEDIA_ITEMS.filter((item) => item.album_id === albumId);
  };

  // Scout attendance statistics calculation
  const getScoutAttendanceStats = (memberId?: string): ScoutAttendanceStats => {
    const targetId = memberId || currentMemberId || 'm1';
    const records = INITIAL_SCOUT_SESSION_RECORDS.filter((r) => r.member_id === targetId);

    const totalSessions = records.length > 0 ? records.length : 10;
    const presentCount = records.length > 0 ? records.filter((r) => r.status === 'present').length : 9;
    const lateCount = records.length > 0 ? records.filter((r) => r.status === 'late').length : 1;
    const excusedCount = records.length > 0 ? records.filter((r) => r.status === 'excused').length : 0;
    const absentCount = records.length > 0 ? records.filter((r) => r.status === 'absent').length : 0;

    const percentage = totalSessions > 0
      ? Math.round(((presentCount + lateCount * 0.8 + excusedCount * 0.5) / totalSessions) * 100)
      : 100;

    const honorRank: 'gold' | 'silver' | 'bronze' =
      percentage >= 90 ? 'gold' : percentage >= 75 ? 'silver' : 'bronze';

    return {
      totalSessions,
      presentCount,
      absentCount,
      excusedCount,
      lateCount,
      percentage,
      streak: 6,
      honorRank,
    };
  };

  const getScoutSessionRecords = (memberId?: string): ScoutSessionRecord[] => {
    const targetId = memberId || currentMemberId || 'm1';
    return INITIAL_SCOUT_SESSION_RECORDS.filter((r) => r.member_id === targetId);
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
    if (isSuperAdmin || currentRole?.name === 'admin' || currentRole?.name === 'group_leader') {
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
            role_id: roleId !== undefined ? roleId : 4, // Default to section_leader (role_id 4)
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

  // Add Member to System
  const addMember = (memberData: Omit<Member, 'id'> & { id?: string }): Member => {
    const newId = memberData.id || `m_${Date.now()}`;
    const newMember: Member = {
      ...memberData,
      id: newId,
      is_active: memberData.is_active !== undefined ? memberData.is_active : true,
    };

    setMembers((prev) => {
      const updated = [newMember, ...prev];
      try {
        localStorage.setItem('scouts_members', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    logAction({
      action_type: 'member_created',
      title_ar: 'إضافة عضو كشفي جديد',
      title_en: 'New Scout Member Added',
      description_ar: `تمت إضافة الكشاف (${newMember.full_name_ar}) إلى المنظومة`,
      description_en: `Scout member (${newMember.full_name_ar}) registered in the directory`,
      unit_id: newMember.unit_id,
      metadata: { member_id: newId, member_code: newMember.member_code },
    });

    return newMember;
  };

  // Add Leader to System
  const addLeader = (leaderData: {
    full_name: string;
    email: string;
    phone?: string;
    role_id: number;
    unit_id: number | null;
  }): User => {
    const newId = `u_${Date.now()}`;
    const newUser: User = {
      id: newId,
      full_name: leaderData.full_name,
      email: leaderData.email,
      phone: leaderData.phone || '',
      is_active: true,
    };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      try {
        localStorage.setItem('scouts_users', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    const newRoleAssignment: UserRole = {
      id: Date.now(),
      user_id: newId,
      role_id: leaderData.role_id,
      unit_id: leaderData.unit_id,
    };

    setUserRoles((prev) => {
      const updated = [...prev, newRoleAssignment];
      try {
        localStorage.setItem('scouts_user_roles', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    logAction({
      action_type: 'leader_team_assigned',
      title_ar: 'إضافة قائد جديد للمنظومة',
      title_en: 'New Leader Registered',
      description_ar: `تم تسجيل القائد (${newUser.full_name}) وتعيينه في الدور والفريق المخصص`,
      description_en: `Leader (${newUser.full_name}) registered and assigned role/team`,
      unit_id: leaderData.unit_id,
      metadata: { user_id: newId, role_id: leaderData.role_id },
    });

    return newUser;
  };

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

