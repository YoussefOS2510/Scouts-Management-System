import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Unit,
  Patrol,
  User,
  Role,
  UserRole,
  Permission,
  RolePermission,
  UserPermissionOverride,
  Member,
  AttendanceStatus,
  AttendanceSession,
  AuditLogEntry,
  MediaAlbum,
  MediaItem,
  Language,
} from '../types';
import {
  UNITS,
  INITIAL_PATROLS,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  INITIAL_USERS,
  INITIAL_USER_ROLES,
  INITIAL_MEMBERS,
  INITIAL_EVENTS,
  INITIAL_MEDIA_ALBUMS,
  INITIAL_MEDIA_ITEMS,
} from '../data/seed';
import { LIGHT_SCOUT_THEME, DARK_SCOUT_THEME, ScoutThemeColors } from '../theme/scoutTheme';

export type ActiveMobileTab = 'units' | 'attendance' | 'members' | 'admin' | 'scout';

export interface CapabilityModule {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  permissions: string[];
}

export const CAPABILITY_MODULES: CapabilityModule[] = [
  {
    id: 'attendance_ops',
    titleAr: 'إدارة الغياب والتمام والاجتماعات',
    titleEn: 'Attendance, Roll-Call & Events',
    descAr: 'إنشاء الاجتماعات، تسجيل الحضور والغياب، وعرض تنبيهات الغياب (التمام)',
    descEn: 'Create meetings/camps, record attendance, and view Tamam absence alerts',
    permissions: ['attendance:view', 'attendance:record', 'event:create', 'event:delete', 'tamam:view'],
  },
  {
    id: 'members_ops',
    titleAr: 'إدارة بيانات الأفراد (الكشافين)',
    titleEn: 'Scout Roster & Member Data',
    descAr: 'عرض وتعديل بيانات الأفراد، إضافة كشافين جدد، وتصدير السجلات',
    descEn: 'View and edit member profiles, add new scouts, and export rosters',
    permissions: ['member:view', 'member:create', 'member:edit', 'member:delete'],
  },
  {
    id: 'patrols_ops',
    titleAr: 'إدارة الطلائع والسداسيات والرهوط',
    titleEn: 'Patrols, Sixes & Crews Management',
    descAr: 'توزيع الكشافين على الطلائع أو السداسيات وتعيين العرفاء والرواد',
    descEn: 'Assign scouts to patrols/sixes and designate patrol leaders',
    permissions: ['unit:manage_patrols'],
  },
  {
    id: 'media_ops',
    titleAr: 'الإعلام والصور والألبومات',
    titleEn: 'Media & Photo Albums',
    descAr: 'إنشاء ألبومات الصور ورفع صور الاجتماعات والمعسكرات',
    descEn: 'Create photo albums and upload meeting/camp photos',
    permissions: ['media:view', 'media:upload', 'media:manage_albums'],
  },
  {
    id: 'admin_ops',
    titleAr: 'صلاحيات القائد العام (الإدارة العليا)',
    titleEn: 'Executive & Permissions Admin',
    descAr: 'إدارة القادة، توزيع الصلاحيات، وعرض الإحصائيات الشاملة للفرقة',
    descEn: 'Manage leaders, assign permissions, and view group-wide analytics',
    permissions: ['unit:view_all', 'admin:manage_roles', 'admin:manage_overrides', 'analytics:view_executive'],
  },
];

interface MobileAppContextValue {
  // Theme & Language
  lang: Language;
  setLang: (lang: Language) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  theme: ScoutThemeColors;
  isRTL: boolean;

  // Navigation
  activeTab: ActiveMobileTab;
  setActiveTab: (tab: ActiveMobileTab) => void;
  selectedUnitId: string;
  setSelectedUnitId: (unitId: string) => void;

  // Backend Connection
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => Promise<void>;
  dbConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  refreshFromBackend: () => Promise<void>;

  // Auth & RBAC
  isAuthenticated: boolean;
  portalMode: 'leader' | 'scout';
  currentUser: User;
  activeScoutMember: Member | null;
  loginAsLeader: (emailOrId: string) => boolean;
  loginAsScout: (scoutCodeOrName: string, unitId?: string) => Promise<boolean>;
  logout: () => void;
  switchRolePreset: (userId: string) => void;
  can: (permissionKey: string, unitId?: string) => boolean;

  // Data Entities
  units: Unit[];
  accessibleUnits: Unit[];
  patrols: Patrol[];
  users: User[];
  roles: Role[];
  userRoles: UserRole[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  userOverrides: UserPermissionOverride[];
  members: Member[];
  events: AttendanceSession[];
  auditLogs: AuditLogEntry[];
  mediaAlbums: MediaAlbum[];
  mediaItems: MediaItem[];

  // Actions
  addMember: (member: Omit<Member, 'id' | 'scout_code'>) => Promise<Member>;
  updateMember: (memberId: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  assignScoutPatrol: (memberId: string, patrolId?: string, patrolRole?: Member['patrol_role']) => Promise<void>;
  batchAssignScoutPatrol: (memberIds: string[], patrolId?: string) => Promise<void>;

  addPatrol: (patrol: Omit<Patrol, 'id'>) => Promise<void>;
  updatePatrol: (patrolId: string, updates: Partial<Patrol>) => Promise<void>;
  deletePatrol: (patrolId: string) => Promise<void>;

  createEvent: (event: Omit<AttendanceSession, 'id' | 'records' | 'created_by'>) => Promise<AttendanceSession>;
  deleteEvent: (eventId: string) => Promise<void>;
  saveAttendance: (eventId: string, records: Record<string, AttendanceStatus>, notes?: Record<string, string>) => Promise<void>;

  toggleCapabilityModule: (userId: string, moduleId: string, enable: boolean) => Promise<void>;
  hasCapabilityModule: (userId: string, moduleId: string) => boolean;
  assignLeaderUnits: (userId: string, roleId: string, unitIds: string[], isGlobal: boolean) => Promise<void>;
  addLeader: (leader: { full_name_ar: string; full_name_en: string; email: string; phone: string; title_ar: string; title_en: string; role_id: string; unit_ids: string[]; is_global: boolean }) => Promise<void>;
  deleteLeader: (userId: string) => Promise<void>;

  // Toast feedback
  toastMessage: { text: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'warning') => void;
}

const DEFAULT_API_URLS = Platform.select({
  web: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  android: ['http://10.0.2.2:3000', 'http://192.168.1.10:3000', 'http://localhost:3000'],
  ios: ['http://localhost:3000', 'http://192.168.1.10:3000'],
  default: ['http://localhost:3000', 'http://192.168.1.10:3000'],
});

const STORAGE_KEYS = {
  API_URL: '@smsr_api_base_url',
  LANG: '@smsr_lang',
  DARK: '@smsr_dark_mode',
  USER_ID: '@smsr_current_user_id',
};

const MobileAppContext = createContext<MobileAppContextValue | undefined>(undefined);

export const MobileAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('ar');
  const [isDark, setIsDarkState] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveMobileTab>('units');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('1');

  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_API_URLS[0]);
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [portalMode, setPortalMode] = useState<'leader' | 'scout'>('leader');
  const [currentUserId, setCurrentUserId] = useState<string>('usr-1');
  const [activeScoutId, setActiveScoutId] = useState<string | null>(null);

  const [units, setUnits] = useState<Unit[]>(UNITS);
  const [patrols, setPatrols] = useState<Patrol[]>(INITIAL_PATROLS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roles] = useState<Role[]>(ROLES);
  const [userRoles, setUserRoles] = useState<UserRole[]>(INITIAL_USER_ROLES);
  const [permissions] = useState<Permission[]>(PERMISSIONS);
  const [rolePermissions] = useState<RolePermission[]>(ROLE_PERMISSIONS);
  const [userOverrides, setUserOverrides] = useState<UserPermissionOverride[]>([]);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [events, setEvents] = useState<AttendanceSession[]>(INITIAL_EVENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-init-1',
      actor_id: 'usr-1',
      actor_name_ar: 'ق. أندرو سمير',
      actor_name_en: 'Ldr. Andrew Samir',
      action_type: 'attendance:record',
      target_label_ar: 'حفظ سجل حضور: الاجتماع الأسبوعي - مهارات الحبال (أشبال أولاد)',
      target_label_en: 'Saved attendance: Weekly Meeting - Pioneering & Knots (Cubs Boys)',
      unit_id: 'u-cubs-boys',
      created_at: '2026-10-30 18:15',
    },
    {
      id: 'log-init-2',
      actor_id: 'usr-2',
      actor_name_ar: 'ق. مينا عادل',
      actor_name_en: 'Ldr. Mina Adel',
      action_type: 'unit:manage_patrols',
      target_label_ar: 'تسكين سداسي الأسود وتعيين السادوس يوسف ماجد',
      target_label_en: 'Assigned Lions Six and appointed Sixer Youssef Maged',
      unit_id: 'u-cubs-boys',
      created_at: '2026-10-29 20:40',
    },
  ]);
  const [mediaAlbums] = useState<MediaAlbum[]>(INITIAL_MEDIA_ALBUMS);
  const [mediaItems] = useState<MediaItem[]>(INITIAL_MEDIA_ITEMS);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  }, []);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || users[0],
    [users, currentUserId]
  );

  const activeScoutMember = useMemo(
    () => members.find((m) => m.id === activeScoutId) || members[0] || null,
    [members, activeScoutId]
  );

  const appendAuditLog = useCallback(
    (action_type: string, target_label_ar: string, target_label_en: string, unit_id?: string) => {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const entry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actor_id: currentUser.id,
        actor_name_ar: currentUser.full_name_ar,
        actor_name_en: currentUser.full_name_en,
        action_type,
        target_label_ar,
        target_label_en,
        unit_id,
        created_at: timestamp,
      };
      setAuditLogs((prev) => [entry, ...prev]);

      if (dbConnected) {
        fetch(`${apiBaseUrl}/api/audit-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {});
      }
    },
    [currentUser, dbConnected, apiBaseUrl]
  );

  // Sync from PostgreSQL API
  const syncWithUrl = useCallback(async (candidateUrl: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const [membersRes, patrolsRes, attendanceRes, permsRes, logsRes] = await Promise.all([
        fetch(`${candidateUrl}/api/members`, { signal: controller.signal }),
        fetch(`${candidateUrl}/api/patrols`, { signal: controller.signal }),
        fetch(`${candidateUrl}/api/attendance`, { signal: controller.signal }),
        fetch(`${candidateUrl}/api/permissions`, { signal: controller.signal }),
        fetch(`${candidateUrl}/api/audit-logs`, { signal: controller.signal }).catch(() => null),
      ]);

      clearTimeout(timeoutId);

      if (!membersRes.ok) return false;

      const membersData = await membersRes.json();
      if (membersData.members?.length > 0) {
        const normalizedMembers: Member[] = membersData.members.map((m: any) => ({
          id: String(m.id),
          scout_code: m.scout_code || m.member_code || `SMSR-${String(m.id).slice(0, 4)}`,
          full_name_ar: m.full_name_ar || '',
          full_name_en: m.full_name_en || m.full_name_ar || '',
          unit_id: String(m.unit_id || '1'),
          patrol_id: m.patrol_id ? String(m.patrol_id) : undefined,
          patrol_role: m.patrol_role || 'member',
          phone_personal: m.phone_personal || m.member_phone || '',
          phone_guardian: m.phone_guardian || m.father_phone || m.mother_phone || '',
          dob: m.dob || m.date_of_birth || '2014-01-01',
          school_or_university: m.school_or_university || m.school_or_college || '',
          address: m.address || m.address_ar || 'الرحاب',
          medical_notes: m.medical_notes || m.notes || 'لا يوجد',
          attendance_rate: typeof m.attendance_rate === 'number' ? m.attendance_rate : 88,
          unexcused_absences_count: typeof m.unexcused_absences_count === 'number' ? m.unexcused_absences_count : 0,
          consecutive_absences: typeof m.consecutive_absences === 'number' ? m.consecutive_absences : 0,
          has_missing_data: Boolean(m.has_missing_data),
          missing_fields: Array.isArray(m.missing_fields)
            ? m.missing_fields
            : typeof m.missing_fields === 'string' && m.missing_fields
            ? m.missing_fields.split(',')
            : [],
          join_year: m.join_year || 2023,
        }));
        setMembers(normalizedMembers);
      }

      if (patrolsRes.ok) {
        const patrolsData = await patrolsRes.json();
        const rawPatrols = patrolsData.patrols || membersData.patrols || [];
        if (rawPatrols.length > 0) {
          const normalizedPatrols: Patrol[] = rawPatrols.map((p: any) => {
            const uid = String(p.unit_id || '1');
            const subType =
              Number(uid) >= 1 && Number(uid) <= 4
                ? 'six'
                : Number(uid) === 11
                ? 'crew'
                : 'patrol';
            return {
              id: String(p.id),
              unit_id: uid,
              name_ar: p.name_ar || '',
              name_en: p.name_en || p.name_ar || '',
              subdivision_type: p.subdivision_type || subType,
              emblem_icon: p.emblem_icon || (subType === 'six' ? '🦁' : subType === 'crew' ? '🔥' : '🦅'),
            };
          });
          setPatrols(normalizedPatrols);
        }
      }

      if (attendanceRes.ok) {
        const attData = await attendanceRes.json();
        const rawSessions = attData.events || attData.sessions || [];
        if (rawSessions.length > 0) {
          const normalizedEvents: AttendanceSession[] = rawSessions.map((s: any) => ({
            id: String(s.id),
            unit_id: String(s.unit_id || '1'),
            title_ar: s.title_ar || s.session_title || 'اجتماع كشفي أسبوعي',
            title_en: s.title_en || s.session_title || 'Weekly Scout Meeting',
            date: s.date || s.session_date || '2026-11-07',
            event_type: s.event_type || 'weekly_meeting',
            created_by: String(s.created_by || s.recorded_by || 'usr-1'),
            records: s.records || {},
            notes: typeof s.notes === 'object' && s.notes !== null ? s.notes : {},
          }));
          setEvents(normalizedEvents);
        }
      }

      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs?.length > 0) {
          const normalizedLogs: AuditLogEntry[] = logsData.logs.map((l: any) => ({
            id: String(l.id),
            actor_id: String(l.actor_id || l.user_id || 'usr-1'),
            actor_name_ar: l.actor_name_ar || l.user_name || 'قائد كشفي',
            actor_name_en: l.actor_name_en || l.user_name || 'Scout Leader',
            action_type: l.action_type || 'action',
            target_label_ar: l.target_label_ar || l.title_ar || l.description_ar || '',
            target_label_en: l.target_label_en || l.title_en || l.description_en || '',
            unit_id: l.unit_id ? String(l.unit_id) : undefined,
            created_at: l.created_at || l.timestamp || '',
          }));
          setAuditLogs(normalizedLogs);
        }
      }

      setApiBaseUrlState(candidateUrl);
      setDbConnected(true);
      const now = new Date();
      setLastSyncedAt(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshFromBackend = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Try current apiBaseUrl first, then fallback list
      const candidates = Array.from(new Set([apiBaseUrl, ...DEFAULT_API_URLS]));
      let connected = false;
      for (const url of candidates) {
        const ok = await syncWithUrl(url);
        if (ok) {
          connected = true;
          break;
        }
      }
      if (!connected) {
        setDbConnected(false);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [apiBaseUrl, syncWithUrl]);

  // Load saved preferences & initial backend sync
  useEffect(() => {
    (async () => {
      try {
        const [savedUrl, savedLang, savedDark, savedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.API_URL),
          AsyncStorage.getItem(STORAGE_KEYS.LANG),
          AsyncStorage.getItem(STORAGE_KEYS.DARK),
          AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
        ]);
        if (savedLang === 'ar' || savedLang === 'en') setLangState(savedLang);
        if (savedDark !== null) setIsDarkState(savedDark === 'true');
        if (savedUser) setCurrentUserId(savedUser);

        const initialUrl = savedUrl || DEFAULT_API_URLS[0];
        setApiBaseUrlState(initialUrl);

        setIsSyncing(true);
        const candidates = Array.from(new Set([initialUrl, ...DEFAULT_API_URLS]));
        for (const url of candidates) {
          const ok = await syncWithUrl(url);
          if (ok) break;
        }
      } catch {
        // Ignore storage errors
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [syncWithUrl]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    AsyncStorage.setItem(STORAGE_KEYS.LANG, newLang).catch(() => {});
  }, []);

  const setIsDark = useCallback((dark: boolean) => {
    setIsDarkState(dark);
    AsyncStorage.setItem(STORAGE_KEYS.DARK, String(dark)).catch(() => {});
  }, []);

  const setApiBaseUrl = useCallback(
    async (url: string) => {
      const cleaned = url.trim().replace(/\/+$/, '');
      setApiBaseUrlState(cleaned);
      await AsyncStorage.setItem(STORAGE_KEYS.API_URL, cleaned).catch(() => {});
      setIsSyncing(true);
      const ok = await syncWithUrl(cleaned);
      setIsSyncing(false);
      if (ok) {
        showToast(
          lang === 'ar' ? 'تم الاتصال بقاعدة البيانات بنجاح' : 'Connected to live database!',
          'success'
        );
      } else {
        setDbConnected(false);
        showToast(
          lang === 'ar'
            ? 'تعذر الاتصال بالخادم، يعمل التطبيق بالبيانات المحلية'
            : 'Could not reach server; running with local state',
          'warning'
        );
      }
    },
    [syncWithUrl, showToast, lang]
  );

  // RBAC Engine
  const can = useCallback(
    (permissionKey: string, unitId?: string): boolean => {
      if (portalMode === 'scout') return false;
      const perm = permissions.find((p) => p.key === permissionKey);
      if (!perm) return false;

      // 1. Check explicit user overrides
      const overrides = userOverrides.filter(
        (o) =>
          o.user_id === currentUser.id &&
          o.permission_id === perm.id &&
          (!o.unit_id || o.unit_id === unitId)
      );
      if (overrides.some((o) => o.grant_type === 'deny')) return false;
      if (overrides.some((o) => o.grant_type === 'allow')) return true;

      // 2. Check assigned roles
      const myRoles = userRoles.filter((ur) => ur.user_id === currentUser.id);
      for (const ur of myRoles) {
        const hasPermInRole = rolePermissions.some(
          (rp) => rp.role_id === ur.role_id && rp.permission_id === perm.id
        );
        if (!hasPermInRole) continue;
        if (ur.is_global) return true;
        if (!unitId) return true;
        if (ur.unit_id === unitId) return true;
      }
      return false;
    },
    [portalMode, permissions, userOverrides, currentUser.id, userRoles, rolePermissions]
  );

  const accessibleUnits = useMemo(() => {
    if (can('unit:view_all')) return units;
    const myUnitIds = new Set(
      userRoles.filter((ur) => ur.user_id === currentUser.id && ur.unit_id).map((ur) => ur.unit_id!)
    );
    const filtered = units.filter((u) => myUnitIds.has(u.id));
    return filtered.length > 0 ? filtered : units;
  }, [can, units, userRoles, currentUser.id]);

  // Keep selectedUnitId valid within accessibleUnits
  useEffect(() => {
    if (accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(accessibleUnits[0].id);
    }
  }, [accessibleUnits, selectedUnitId]);

  // Auth Methods
  const loginAsLeader = useCallback(
    (emailOrId: string): boolean => {
      const normalized = emailOrId.trim().toLowerCase();
      const found =
        users.find((u) => u.id === emailOrId || u.email.toLowerCase() === normalized) || users[0];
      if (!found) return false;
      setCurrentUserId(found.id);
      setPortalMode('leader');
      setIsAuthenticated(true);
      setActiveTab('units');
      AsyncStorage.setItem(STORAGE_KEYS.USER_ID, found.id).catch(() => {});
      showToast(
        lang === 'ar'
          ? `مرحباً بك يا ${found.full_name_ar}`
          : `Welcome back, ${found.full_name_en}`,
        'success'
      );
      return true;
    },
    [users, showToast, lang]
  );

  const loginAsScout = useCallback(
    async (scoutCodeOrName: string, unitId?: string): Promise<boolean> => {
      const q = scoutCodeOrName.trim().toLowerCase();
      let matched = members.find(
        (m) =>
          m.id.toLowerCase() === q ||
          (m.scout_code && m.scout_code.toLowerCase() === q) ||
          m.full_name_ar.includes(q) ||
          m.full_name_en.toLowerCase().includes(q)
      );

      if (!matched && unitId) {
        matched = members.find((m) => m.unit_id === unitId);
      }
      if (!matched && members.length > 0) {
        matched = members[0];
      }
      if (!matched) return false;

      setActiveScoutId(matched.id);
      setPortalMode('scout');
      setIsAuthenticated(true);
      setActiveTab('scout');
      showToast(
        lang === 'ar'
          ? `أهلاً بك في مساحة الكشاف: ${matched.full_name_ar}`
          : `Welcome to Scout Space: ${matched.full_name_en}`,
        'success'
      );
      return true;
    },
    [members, showToast, lang]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const switchRolePreset = useCallback(
    (userId: string) => {
      const found = users.find((u) => u.id === userId);
      if (!found) return;
      setCurrentUserId(found.id);
      setPortalMode('leader');
      setIsAuthenticated(true);
      AsyncStorage.setItem(STORAGE_KEYS.USER_ID, found.id).catch(() => {});
      showToast(
        lang === 'ar'
          ? `تم التبديل إلى حساب: ${found.full_name_ar}`
          : `Switched persona to: ${found.full_name_en}`,
        'info'
      );
    },
    [users, showToast, lang]
  );

  // Member Actions
  const addMember = useCallback(
    async (newMemberData: Omit<Member, 'id' | 'scout_code'>): Promise<Member> => {
      const id = `m-${Date.now()}`;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const scout_code = `SMSR-${randomNum}`;
      const member: Member = { ...newMemberData, id, scout_code };

      setMembers((prev) => [member, ...prev]);
      appendAuditLog(
        'member:create',
        `إضافة كشاف جديد: ${member.full_name_ar} (${scout_code})`,
        `Added new scout: ${member.full_name_en} (${scout_code})`,
        member.unit_id
      );

      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(member),
          });
        } catch {
          // Handled optimistically
        }
      }
      showToast(
        lang === 'ar' ? `تم تسجيل ${member.full_name_ar} بنجاح` : `Added ${member.full_name_en}`,
        'success'
      );
      return member;
    },
    [appendAuditLog, dbConnected, apiBaseUrl, showToast, lang]
  );

  const updateMember = useCallback(
    async (memberId: string, updates: Partial<Member>) => {
      let updatedMember: Member | undefined;
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id !== memberId) return m;
          const merged = { ...m, ...updates };
          const stillMissing =
            !merged.phone_guardian?.trim() ||
            !merged.dob?.trim() ||
            !merged.school_or_university?.trim();
          updatedMember = {
            ...merged,
            has_missing_data: stillMissing,
            missing_fields: stillMissing ? merged.missing_fields : [],
          };
          return updatedMember;
        })
      );

      if (updatedMember) {
        appendAuditLog(
          'member:edit',
          `تحديث بيانات الكشاف: ${updatedMember.full_name_ar}`,
          `Updated scout profile: ${updatedMember.full_name_en}`,
          updatedMember.unit_id
        );
      }

      if (dbConnected && updatedMember) {
        try {
          await fetch(`${apiBaseUrl}/api/members`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...updatedMember,
              action: 'update_member',
              id: memberId,
            }),
          });
        } catch {
          // Optimistic update preserved
        }
      }
      showToast(
        lang === 'ar' ? 'تم حفظ التعديلات بنجاح' : 'Member profile updated',
        'success'
      );
    },
    [appendAuditLog, dbConnected, apiBaseUrl, showToast, lang]
  );

  const deleteMember = useCallback(
    async (memberId: string) => {
      const target = members.find((m) => m.id === memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      if (target) {
        appendAuditLog(
          'member:delete',
          `حذف سجل الكشاف: ${target.full_name_ar}`,
          `Deleted member record: ${target.full_name_en}`,
          target.unit_id
        );
      }
      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/members?id=${encodeURIComponent(memberId)}`, {
            method: 'DELETE',
          });
        } catch {}
      }
      showToast(lang === 'ar' ? 'تم حذف السجل' : 'Member removed', 'info');
    },
    [members, appendAuditLog, dbConnected, apiBaseUrl, showToast, lang]
  );

  const assignScoutPatrol = useCallback(
    async (memberId: string, patrolId?: string, patrolRole: Member['patrol_role'] = 'member') => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, patrol_id: patrolId, patrol_role: patrolRole } : m
        )
      );
      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/members`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'assign_patrol',
              member_id: memberId,
              patrol_id: patrolId || null,
              patrol_role: patrolRole,
            }),
          });
        } catch {}
      }
      showToast(
        lang === 'ar' ? 'تم تحديث تسكين الكشاف' : 'Updated patrol assignment',
        'success'
      );
    },
    [dbConnected, apiBaseUrl, showToast, lang]
  );

  const batchAssignScoutPatrol = useCallback(
    async (memberIds: string[], patrolId?: string) => {
      const idSet = new Set(memberIds);
      setMembers((prev) =>
        prev.map((m) =>
          idSet.has(m.id) ? { ...m, patrol_id: patrolId, patrol_role: 'member' } : m
        )
      );
      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/members`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'batch_assign_patrol',
              member_ids: memberIds,
              patrol_id: patrolId || null,
            }),
          });
        } catch {}
      }
      showToast(
        lang === 'ar'
          ? `تم تسكين ${memberIds.length} كشافين بنجاح`
          : `Assigned ${memberIds.length} scouts to patrol`,
        'success'
      );
    },
    [dbConnected, apiBaseUrl, showToast, lang]
  );

  // Patrol Actions
  const addPatrol = useCallback(
    async (patrolData: Omit<Patrol, 'id'>) => {
      const newPatrol: Patrol = { ...patrolData, id: `p-${Date.now()}` };
      setPatrols((prev) => [...prev, newPatrol]);
      appendAuditLog(
        'unit:manage_patrols',
        `إنشاء ${newPatrol.name_ar}`,
        `Created ${newPatrol.name_en}`,
        newPatrol.unit_id
      );
      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/patrols`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPatrol),
          });
        } catch {}
      }
      showToast(
        lang === 'ar' ? `تم إنشاء ${newPatrol.name_ar}` : `Created ${newPatrol.name_en}`,
        'success'
      );
    },
    [appendAuditLog, dbConnected, apiBaseUrl, showToast, lang]
  );

  const updatePatrol = useCallback(
    async (patrolId: string, updates: Partial<Patrol>) => {
      setPatrols((prev) => prev.map((p) => (p.id === patrolId ? { ...p, ...updates } : p)));
      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/patrols`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: patrolId, ...updates }),
          });
        } catch {}
      }
    },
    [dbConnected, apiBaseUrl]
  );

  const deletePatrol = useCallback(
    async (patrolId: string) => {
      const target = patrols.find((p) => p.id === patrolId);
      setPatrols((prev) => prev.filter((p) => p.id !== patrolId));
      setMembers((prev) =>
        prev.map((m) =>
          m.patrol_id === patrolId ? { ...m, patrol_id: undefined, patrol_role: 'member' } : m
        )
      );
      if (target) {
        appendAuditLog(
          'unit:manage_patrols',
          `حذف ${target.name_ar}`,
          `Deleted ${target.name_en}`,
          target.unit_id
        );
      }
      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/patrols?id=${encodeURIComponent(patrolId)}`, {
            method: 'DELETE',
          });
        } catch {}
      }
      showToast(lang === 'ar' ? 'تم حذف الطليعة/السداسي' : 'Patrol removed', 'info');
    },
    [patrols, appendAuditLog, dbConnected, apiBaseUrl, showToast, lang]
  );

  // Events & Attendance Actions
  const createEvent = useCallback(
    async (
      eventData: Omit<AttendanceSession, 'id' | 'records' | 'created_by'>
    ): Promise<AttendanceSession> => {
      const unitMembers = members.filter((m) => m.unit_id === eventData.unit_id);
      const initialRecords: Record<string, AttendanceStatus> = {};
      unitMembers.forEach((m) => {
        initialRecords[m.id] = 'present';
      });

      const newEvent: AttendanceSession = {
        ...eventData,
        id: `ev-${Date.now()}`,
        created_by: currentUser.id,
        records: initialRecords,
        notes: {},
      };

      setEvents((prev) => [newEvent, ...prev]);
      appendAuditLog(
        'event:create',
        `إنشاء اجتماع/فعالية: ${newEvent.title_ar}`,
        `Created event: ${newEvent.title_en}`,
        newEvent.unit_id
      );

      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_event',
              event: newEvent,
            }),
          });
        } catch {}
      }
      showToast(
        lang === 'ar' ? `تم إنشاء "${newEvent.title_ar}"` : `Created "${newEvent.title_en}"`,
        'success'
      );
      return newEvent;
    },
    [members, currentUser.id, appendAuditLog, dbConnected, apiBaseUrl, showToast, lang]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      const target = events.find((e) => e.id === eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      if (target) {
        appendAuditLog(
          'event:delete',
          `حذف فعالية: ${target.title_ar}`,
          `Deleted event: ${target.title_en}`,
          target.unit_id
        );
      }
      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/attendance?id=${encodeURIComponent(eventId)}`, {
            method: 'DELETE',
          });
        } catch {}
      }
      showToast(lang === 'ar' ? 'تم حذف الفعالية' : 'Event deleted', 'info');
    },
    [events, appendAuditLog, dbConnected, apiBaseUrl, showToast, lang]
  );

  const saveAttendance = useCallback(
    async (
      eventId: string,
      records: Record<string, AttendanceStatus>,
      notes: Record<string, string> = {}
    ) => {
      const targetEvent = events.find((e) => e.id === eventId);
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, records: { ...records }, notes: { ...notes } } : ev))
      );

      // Update member consecutive absences / attendance stats optimistically
      setMembers((prev) =>
        prev.map((m) => {
          const st = records[m.id];
          if (!st) return m;
          const isAbsent = st === 'absent';
          const newConsecutive = isAbsent ? m.consecutive_absences + 1 : 0;
          return {
            ...m,
            consecutive_absences: newConsecutive,
            unexcused_absences_count: isAbsent
              ? m.unexcused_absences_count + 1
              : m.unexcused_absences_count,
          };
        })
      );

      if (targetEvent) {
        appendAuditLog(
          'attendance:record',
          `حفظ تمام الحضور: ${targetEvent.title_ar}`,
          `Saved attendance roll-call: ${targetEvent.title_en}`,
          targetEvent.unit_id
        );
      }

      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_attendance',
              event_id: eventId,
              records,
              notes,
              recorded_by: currentUser.id,
            }),
          });
        } catch {}
      }

      showToast(
        lang === 'ar'
          ? 'تم حفظ سجل الحضور والتمام في قاعدة البيانات'
          : 'Attendance roll-call saved to database!',
        'success'
      );
    },
    [events, appendAuditLog, dbConnected, apiBaseUrl, currentUser.id, showToast, lang]
  );

  // Admin & Permissions Actions
  const hasCapabilityModule = useCallback(
    (userId: string, moduleId: string): boolean => {
      const mod = CAPABILITY_MODULES.find((m) => m.id === moduleId);
      if (!mod) return false;

      const uRoles = userRoles.filter((ur) => ur.user_id === userId);
      return mod.permissions.every((permKey) => {
        const perm = permissions.find((p) => p.key === permKey);
        if (!perm) return false;
        const ov = userOverrides.find(
          (o) => o.user_id === userId && o.permission_id === perm.id
        );
        if (ov) return ov.grant_type === 'allow';
        return uRoles.some((ur) =>
          rolePermissions.some(
            (rp) => rp.role_id === ur.role_id && rp.permission_id === perm.id
          )
        );
      });
    },
    [userRoles, permissions, userOverrides, rolePermissions]
  );

  const toggleCapabilityModule = useCallback(
    async (userId: string, moduleId: string, enable: boolean) => {
      const mod = CAPABILITY_MODULES.find((m) => m.id === moduleId);
      if (!mod) return;
      const targetUser = users.find((u) => u.id === userId);

      const permIds = mod.permissions
        .map((k) => permissions.find((p) => p.key === k)?.id)
        .filter(Boolean) as string[];

      setUserOverrides((prev) => {
        const filtered = prev.filter(
          (o) => !(o.user_id === userId && permIds.includes(o.permission_id))
        );
        const added: UserPermissionOverride[] = permIds.map((pid, idx) => ({
          id: `ov-${Date.now()}-${idx}`,
          user_id: userId,
          permission_id: pid,
          grant_type: enable ? 'allow' : 'deny',
          reason: `${enable ? 'Granted' : 'Revoked'} ${mod.titleEn}`,
        }));
        return [...filtered, ...added];
      });

      if (targetUser) {
        appendAuditLog(
          'admin:manage_overrides',
          `${enable ? 'منح' : 'إيقاف'} صلاحية "${mod.titleAr}" للقائد ${targetUser.full_name_ar}`,
          `${enable ? 'Enabled' : 'Disabled'} "${mod.titleEn}" for ${targetUser.full_name_en}`
        );
      }

      if (dbConnected) {
        try {
          for (const pid of permIds) {
            await fetch(`${apiBaseUrl}/api/permissions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'set_override',
                user_id: userId,
                permission_id: pid,
                grant_type: enable ? 'allow' : 'deny',
                reason: `${enable ? 'Enabled' : 'Disabled'} ${mod.titleEn}`,
              }),
            });
          }
        } catch {}
      }

      showToast(
        lang === 'ar' ? 'تم تحديث صلاحيات القائد بنجاح' : 'Updated leader permissions',
        'success'
      );
    },
    [users, permissions, appendAuditLog, dbConnected, apiBaseUrl, showToast, lang]
  );

  const assignLeaderUnits = useCallback(
    async (userId: string, roleId: string, unitIds: string[], isGlobal: boolean) => {
      setUserRoles((prev) => {
        const others = prev.filter((ur) => ur.user_id !== userId);
        if (isGlobal) {
          return [
            ...others,
            {
              id: `ur-${Date.now()}-global`,
              user_id: userId,
              role_id: roleId,
              is_global: true,
            },
          ];
        }
        const scoped: UserRole[] = unitIds.map((uid, idx) => ({
          id: `ur-${Date.now()}-${idx}`,
          user_id: userId,
          role_id: roleId,
          unit_id: uid,
          is_global: false,
        }));
        return [...others, ...scoped];
      });

      if (dbConnected) {
        try {
          await fetch(`${apiBaseUrl}/api/permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'assign_units',
              user_id: userId,
              role_id: roleId,
              unit_ids: unitIds,
              is_global: isGlobal,
            }),
          });
        } catch {}
      }

      showToast(
        lang === 'ar' ? 'تم حفظ نطاق مسؤولية القائد' : 'Saved leader unit assignments',
        'success'
      );
    },
    [dbConnected, apiBaseUrl, showToast, lang]
  );

  const addLeader = useCallback(
    async (leader: {
      full_name_ar: string;
      full_name_en: string;
      email: string;
      phone: string;
      title_ar: string;
      title_en: string;
      role_id: string;
      unit_ids: string[];
      is_global: boolean;
    }) => {
      const id = `usr-${Date.now()}`;
      const newUser: User = {
        id,
        full_name_ar: leader.full_name_ar,
        full_name_en: leader.full_name_en,
        email: leader.email,
        phone: leader.phone,
        title_ar: leader.title_ar,
        title_en: leader.title_en,
        avatar_initials: leader.full_name_en
          .split(' ')
          .slice(0, 2)
          .map((s) => s[0] || 'L')
          .join('')
          .toUpperCase(),
        is_active: true,
      };
      setUsers((prev) => [...prev, newUser]);
      await assignLeaderUnits(id, leader.role_id, leader.unit_ids, leader.is_global);
      appendAuditLog(
        'admin:manage_roles',
        `إضافة قائد جديد: ${newUser.full_name_ar}`,
        `Added new leader: ${newUser.full_name_en}`
      );
    },
    [assignLeaderUnits, appendAuditLog]
  );

  const deleteLeader = useCallback(
    async (userId: string) => {
      if (userId === currentUser.id) {
        showToast(
          lang === 'ar' ? 'لا يمكنك حذف حسابك الحالي' : 'Cannot delete your active account',
          'warning'
        );
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setUserRoles((prev) => prev.filter((ur) => ur.user_id !== userId));
      showToast(lang === 'ar' ? 'تم إزالة حساب القائد' : 'Leader removed', 'info');
    },
    [currentUser.id, showToast, lang]
  );

  const theme = isDark ? DARK_SCOUT_THEME : LIGHT_SCOUT_THEME;
  const isRTL = lang === 'ar';

  return (
    <MobileAppContext.Provider
      value={{
        lang,
        setLang,
        isDark,
        setIsDark,
        theme,
        isRTL,
        activeTab,
        setActiveTab,
        selectedUnitId,
        setSelectedUnitId,
        apiBaseUrl,
        setApiBaseUrl,
        dbConnected,
        isSyncing,
        lastSyncedAt,
        refreshFromBackend,
        isAuthenticated,
        portalMode,
        currentUser,
        activeScoutMember,
        loginAsLeader,
        loginAsScout,
        logout,
        switchRolePreset,
        can,
        units,
        accessibleUnits,
        patrols,
        users,
        roles,
        userRoles,
        permissions,
        rolePermissions,
        userOverrides,
        members,
        events,
        auditLogs,
        mediaAlbums,
        mediaItems,
        addMember,
        updateMember,
        deleteMember,
        assignScoutPatrol,
        batchAssignScoutPatrol,
        addPatrol,
        updatePatrol,
        deletePatrol,
        createEvent,
        deleteEvent,
        saveAttendance,
        toggleCapabilityModule,
        hasCapabilityModule,
        assignLeaderUnits,
        addLeader,
        deleteLeader,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </MobileAppContext.Provider>
  );
};

export const useMobileApp = (): MobileAppContextValue => {
  const ctx = useContext(MobileAppContext);
  if (!ctx) {
    throw new Error('useMobileApp must be used inside MobileAppProvider');
  }
  return ctx;
};

