'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { INITIAL_UNITS } from '../lib/data';
import { isSameUser } from '../lib/permissions';
import {
  Search,
  Plus,
  Folder,
  CalendarCheck,
  BarChart3,
  Users,
  Package,
  UploadCloud,
  ShieldCheck,
  History,
  Settings,
  Globe,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  HardDrive,
  CheckCircle2,
  ExternalLink,
  Sliders,
  FolderOpen,
  UserPlus,
  FileSpreadsheet,
  Compass,
  Sparkles,
} from 'lucide-react';

export function GoogleWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { language, toggleLanguage, t } = useLanguage();
  const {
    currentUser,
    currentMember,
    currentRole,
    currentUnit,
    isSuperAdmin,
    isScout,
    can,
    logout,
    accessibleUnits,
    loginAs,
    loginAsMember,
    allUsers,
    userRoles,
    roles,
    members,
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme from localStorage, defaulting to dark mode
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('scouts_theme');
      if (savedTheme === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const searchRef = useRef<HTMLDivElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (typeof document !== 'undefined') {
      if (nextMode) {
        document.documentElement.classList.add('dark');
        try {
          localStorage.setItem('scouts_theme', 'dark');
        } catch {
          // ignore
        }
      } else {
        document.documentElement.classList.remove('dark');
        try {
          localStorage.setItem('scouts_theme', 'light');
        } catch {
          // ignore
        }
      }
    }
  };

  // Permission checks for dynamic navigation
  const canAccessAttendance = !isScout && (isSuperAdmin || can('attendance.take') || can('attendance.edit_history') || can('attendance.export'));
  const canAccessAnalytics = !isScout && (isSuperAdmin || can('admin.analytics') || can('attendance.analytics'));
  const canAccessMembers = !isScout && (isSuperAdmin || can('members.view') || can('members.create_edit'));
  const canAccessInventory = !isScout && (isSuperAdmin || can('inventory.view') || can('inventory.book') || can('inventory.manage') || can('inventory.approve'));
  const canAccessMedia = !isScout && (isSuperAdmin || can('media.upload') || can('media.view_all'));

  const canNewAttendance = !isScout && (isSuperAdmin || can('attendance.take'));
  const canNewMemberOrLeader = !isScout && (isSuperAdmin || can('members.create_edit') || can('users.manage_roles'));
  const canNewGear = !isScout && (isSuperAdmin || can('inventory.book'));
  const canNewMedia = !isScout && (isSuperAdmin || can('media.upload'));
  const hasAnyNewAction = canNewAttendance || canNewMemberOrLeader || canNewGear || canNewMedia;

  // Clean scoped navigation items: leader console never includes 'Youth' portal in primary nav
  const navItems = isScout
    ? [
        {
          href: '/scout',
          label: language === 'ar' ? 'عرين الكشاف' : 'Scout Space',
          icon: Compass,
          badge: currentMember?.member_code,
        },
        {
          href: '/media',
          label: language === 'ar' ? 'مكتبة الوسائط' : 'Media Archive',
          icon: UploadCloud,
        },
      ]
    : [
        {
          href: '/',
          label: language === 'ar' ? 'الوحدات الكشفية' : 'Scout Units',
          icon: Folder,
          badge: isSuperAdmin ? '12' : String(accessibleUnits.length || 0),
        },
        ...(canAccessAttendance
          ? [
              {
                href: '/attendance',
                label: language === 'ar' ? 'سجل الحضور' : 'Attendance',
                icon: CalendarCheck,
              },
            ]
          : []),
        ...(canAccessAnalytics
          ? [
              {
                href: '/admin/analytics',
                label: language === 'ar' ? 'تحليلات الحضور' : 'Analytics',
                icon: BarChart3,
              },
            ]
          : []),
        ...(canAccessMembers
          ? [
              {
                href: '/members',
                label: language === 'ar' ? 'دليل الأعضاء' : 'Members Directory',
                icon: Users,
              },
            ]
          : []),
        ...(canAccessInventory
          ? [
              {
                href: '/inventory',
                label: language === 'ar' ? 'إدارة العهدة' : 'Gear & Inventory',
                icon: Package,
              },
            ]
          : []),
        ...(canAccessMedia
          ? [
              {
                href: '/media',
                label: language === 'ar' ? 'مكتبة الوسائط' : 'Media Library',
                icon: UploadCloud,
              },
            ]
          : []),
      ];

  if (!isScout && (isSuperAdmin || can('users.manage_roles'))) {
    navItems.push({
      href: '/admin/permissions',
      label: language === 'ar' ? 'الصلاحيات' : 'Permissions',
      icon: ShieldCheck,
    });
  }

  if (!isScout && (isSuperAdmin || can('admin.audit_logs'))) {
    navItems.push({
      href: '/admin/audit-logs',
      label: language === 'ar' ? 'سجل التدقيق' : 'Audit Logs',
      icon: History,
    });
  }

  // Quick instant search filtering across units, members, and inventory
  const searchResults = searchQuery.trim().length > 1 ? {
    units: INITIAL_UNITS.filter(u => 
      u.name_ar.includes(searchQuery) || 
      u.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.code.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
    members: members.filter(m => 
      m.full_name_ar.includes(searchQuery) || 
      (m.full_name_en && m.full_name_en.toLowerCase().includes(searchQuery.toLowerCase())) || 
      m.member_code.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
    equipment: [] as any[],
  } : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFD] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F1F5F9] font-sans antialiased">
      {/* 1. TOP APP BAR (SaaS Standard Header) */}
      <header className="h-16 shrink-0 bg-white dark:bg-[#111827] px-4 sm:px-6 flex items-center justify-between gap-4 z-40 border-b border-neutral-200/80 dark:border-neutral-800/60">
        {/* Leading: Hamburger + Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
            title={language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer select-none">
            {/* SMSR Official Logo */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 border border-neutral-200 dark:border-neutral-700/80 shadow-xs group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
              <img
                src="/smsr-logo.jpg"
                alt="SMSR Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 leading-tight tracking-tight">
                <span>SMSR</span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300 border border-sky-500/20">
                  {isScout ? 'Scout' : 'Leader'}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium leading-tight truncate max-w-[170px] sm:max-w-none">
                {language === 'ar' ? 'كشافة السيدة العذراء بالرحاب' : 'St. Mary Scouts Rehab'}
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Central Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-2xl relative mx-2 hidden sm:block">
          <div className={`flex items-center gap-3 bg-neutral-100 dark:bg-[#0B0F17] hover:bg-neutral-200/60 dark:hover:bg-[#161F30] rounded-xl h-10 px-3.5 transition-all border ${
            isSearchFocused
              ? 'border-sky-500/60 ring-1 ring-sky-500/40 bg-white dark:bg-[#111827]'
              : 'border-transparent dark:border-neutral-800/80'
          }`}>
            <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={language === 'ar' ? 'البحث السريع في الكشافين، الوحدات، والملفات...' : 'Search members, gear, units, and rosters...'}
              className="w-full bg-transparent border-none text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-0"
              dir="auto"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant Search Results Dropdown */}
          {isSearchFocused && searchResults && (
            <div className="absolute top-12 start-0 end-0 bg-white dark:bg-[#111827] rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800/90 p-3 z-50 space-y-3 mt-1 max-h-96 overflow-y-auto">
              {searchResults.units.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 px-2 py-1">
                    {language === 'ar' ? 'الوحدات الكشفية' : 'Units'}
                  </div>
                  {searchResults.units.map((u) => (
                    <Link
                      key={u.id}
                      href={`/attendance?unit=${u.id}`}
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1E293B] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors"
                    >
                      <Folder className="w-4 h-4 text-sky-500" />
                      <span dir="auto">{language === 'ar' ? u.name_ar : u.name_en}</span>
                      <span className="text-[10px] font-mono text-neutral-400 ms-auto">{u.code}</span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.members.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 px-2 py-1">
                    {language === 'ar' ? 'الأعضاء والكشافون' : 'Members'}
                  </div>
                  {searchResults.members.map((m) => (
                    <Link
                      key={m.id}
                      href="/members"
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1E293B] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors"
                    >
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span dir="auto">{language === 'ar' ? m.full_name_ar : (m.full_name_en || m.full_name_ar)}</span>
                      <span className="text-[10px] font-mono text-neutral-400 ms-auto">{m.member_code}</span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.equipment.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 px-2 py-1">
                    {language === 'ar' ? 'مهمات العهدة' : 'Equipment'}
                  </div>
                  {searchResults.equipment.map((e) => (
                    <Link
                      key={e.id}
                      href="/inventory"
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1E293B] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors"
                    >
                      <Package className="w-4 h-4 text-amber-500" />
                      <span dir="auto">{e.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400 ms-auto">{e.sku}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trailing: Settings, Theme, Lang, Avatar & Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Testing Persona Quick Return Button */}
          {!isSuperAdmin && (
            <button
              onClick={() => loginAs('u0')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
              title={language === 'ar' ? 'الرجوع لحساب مدير النظام لتعديل الصلاحيات' : 'Switch back to System Admin to edit permissions'}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ar' ? 'اختبار كـ:' : 'Testing as:'} {currentUser?.full_name?.split(' (')[0]?.split(' ')[0]}</span>
              <span className="text-[10px] underline font-bold ms-1">{language === 'ar' ? '(رجوع للأدمن)' : '(Switch to Admin)'}</span>
            </button>
          )}

          {/* Language Switch */}
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline font-mono text-xs">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
            title={language === 'ar' ? 'إعدادات المنظومة' : 'Workspace Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Avatar with Integrated Role / Persona Switcher */}
          <div ref={userMenuRef} className="relative ms-1">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 sm:ps-2 sm:pe-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700/60"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser?.full_name?.charAt(0) || <Users className="w-4 h-4" />}
              </div>
              <div className="hidden lg:block text-start leading-tight">
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[120px]" dir="auto">
                  {currentUser ? currentUser.full_name.split(' (')[0] : (language === 'ar' ? 'تسجيل الدخول' : 'Sign in')}
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[120px]" dir="auto">
                  {currentUser ? (isScout ? (currentMember?.member_code || 'Scout') : (currentRole?.name || 'Leader')) : (language === 'ar' ? 'غير مسجل' : 'Guest')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
            </button>

            {/* User Dropdown with Role / Persona Switcher (Section 1 requirement) */}
            {isUserMenuOpen && (
              <div className="absolute end-0 top-12 w-72 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800/90 p-3 z-50 animate-fadeIn space-y-3">
                {/* User Identity Header */}
                {currentUser ? (
                  <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#0B0F17] border border-neutral-200/60 dark:border-neutral-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-sky-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {currentUser.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                          {currentUser.full_name}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300 border border-sky-500/20 font-mono">
                        {isScout ? (language === 'ar' ? 'حساب كشاف' : 'Scout Persona') : (currentRole?.description ? currentRole.description.split(' - ')[0] : 'Leader')}
                      </span>
                      {isScout && currentMember && (
                        <span className="text-[10px] font-mono text-neutral-400">
                          {currentMember.member_code}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0B0F17] border border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {language === 'ar' ? 'غير مسجل دخول' : 'Not Signed In'}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in'}
                      </div>
                    </div>
                    <Link
                      href="/login"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors"
                    >
                      {language === 'ar' ? 'دخول' : 'Sign in'}
                    </Link>
                  </div>
                )}

                {/* ROLE & PERSONA SWITCHER (Moved here from primary navigation) */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-400 px-2 py-1 flex items-center justify-between">
                    <span>{language === 'ar' ? 'تبديل الدور / الشخصية' : 'Switch Role / Persona'}</span>
                    <Sparkles className="w-3 h-3 text-sky-500" />
                  </div>

                  {/* Leader Mode Switch */}
                  <button
                    onClick={() => {
                      loginAs('u0');
                      setIsUserMenuOpen(false);
                      if (pathname === '/scout') router.push('/');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      !isScout && currentUser?.id === 'u0'
                        ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 border border-sky-500/30'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                      <span>{language === 'ar' ? 'لوحة قيادة القائد العام' : 'Leader Console (Admin)'}</span>
                    </div>
                    {!isScout && (currentUser?.id === 'u0' || currentUser?.email === 'admin@scouts.org') && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                  </button>

                  {/* Leader Persona: Andrew Nabil (Assistant Leader - Kashafa A) */}
                  <button
                    onClick={() => {
                      loginAs('u4');
                      setIsUserMenuOpen(false);
                      if (pathname === '/scout') router.push('/');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      !isScout && (currentUser?.id === 'u4' || currentUser?.email === 'andrew.nabil@scouts.org')
                        ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 border border-amber-500/30 font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span dir="auto">{language === 'ar' ? 'أندرو نبيل (مساعد: كشافة A)' : 'Andrew Nabil (Scouts A)'}</span>
                    </div>
                    {!isScout && (currentUser?.id === 'u4' || currentUser?.email === 'andrew.nabil@scouts.org') && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                  </button>

                  {/* Leader Persona: Christine Nabil (Media - Morshdat A & B) */}
                  <button
                    onClick={() => {
                      loginAs('u18');
                      setIsUserMenuOpen(false);
                      router.push('/media');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      !isScout && (currentUser?.id === 'u18' || currentUser?.email === 'christine.nabil@scouts.org')
                        ? 'bg-purple-500/10 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300 border border-purple-500/30 font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UploadCloud className="w-3.5 h-3.5 text-purple-500" />
                      <span dir="auto">{language === 'ar' ? 'كريستين نبيل (إعلام: مرشدات A و B)' : 'Christine Nabil (Media - Morshdat A & B)'}</span>
                    </div>
                    {!isScout && (currentUser?.id === 'u18' || currentUser?.email === 'christine.nabil@scouts.org') && <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />}
                  </button>

                  {/* Quick Select Any Leader from Database */}
                  <div className="px-2 pt-1 pb-1">
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                      {language === 'ar' ? 'تبديل لأي قائد بقاعدة البيانات:' : 'Quick Select Any Leader:'}
                    </label>
                    <select
                      value={allUsers.find(u => isSameUser(u.id, currentUser?.id))?.id || currentUser?.id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          loginAs(e.target.value);
                          setIsUserMenuOpen(false);
                        }
                      }}
                      className="w-full bg-neutral-100 dark:bg-[#1E293B] border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                      {allUsers.map((u) => {
                        return (
                          <option key={u.id} value={u.id}>
                            {u.full_name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Scout Persona 1: Mina Samir */}
                  <button
                    onClick={() => {
                      loginAsMember('m1');
                      setIsUserMenuOpen(false);
                      router.push('/scout');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isScout && currentMember?.id === 'm1'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 border border-emerald-500/30'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-emerald-500" />
                      <span dir="auto">{language === 'ar' ? 'مينا سمير (متقدم A)' : 'Mina Samir (Scout)'}</span>
                    </div>
                    {isScout && currentMember?.id === 'm1' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>

                  {/* Scout Persona 2: Fady Maged */}
                  <button
                    onClick={() => {
                      loginAsMember('m101');
                      setIsUserMenuOpen(false);
                      router.push('/scout');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isScout && currentMember?.id === 'm101'
                        ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 border border-amber-500/30'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                      <span dir="auto">{language === 'ar' ? 'فادي ماجد (شبل A)' : 'Fady Maged (Cubs)'}</span>
                    </div>
                    {isScout && currentMember?.id === 'm101' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                  </button>

                  {/* Scout Persona 3: Maryam Sherif */}
                  <button
                    onClick={() => {
                      loginAsMember('m301');
                      setIsUserMenuOpen(false);
                      router.push('/scout');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isScout && currentMember?.id === 'm301'
                        ? 'bg-teal-500/10 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300 border border-teal-500/30'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-teal-500" />
                      <span dir="auto">{language === 'ar' ? 'مريم شريف (مرشدات)' : 'Maryam Sherif (Guides)'}</span>
                    </div>
                    {isScout && currentMember?.id === 'm301' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />}
                  </button>
                </div>

                <div className="border-t border-neutral-200/80 dark:border-neutral-800/80 pt-2 space-y-1">
                  <Link
                    href="/login"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#1E293B] hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{currentUser ? (language === 'ar' ? 'تسجيل دخول بحساب آخر...' : 'Sign in as another user...') : (language === 'ar' ? 'صفحة تسجيل الدخول' : 'Go to login page')}</span>
                  </Link>

                  {currentUser && (
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                        router.push('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-start cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign out'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY WORKSPACE (Collapsible Drawer + Main Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Drawer (Sidebar) */}
        <aside
          className={`${
            isSidebarOpen ? 'w-64' : 'w-20'
          } hidden md:flex flex-col shrink-0 bg-white dark:bg-[#111827] p-3 transition-all duration-200 border-e border-neutral-200/80 dark:border-neutral-800/60 select-none`}
        >
          {/* New Action Button (Only visible if the leader has permission for at least one action) */}
          {hasAnyNewAction && (
            <div ref={newMenuRef} className="relative mb-3">
              <button
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className={`bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl ${
                  isSidebarOpen ? 'px-4 py-2.5 gap-2.5 w-full justify-start' : 'w-10 h-10 justify-center mx-auto'
                } font-medium flex items-center transition-all cursor-pointer shadow-xs`}
                title={language === 'ar' ? 'إجراء جديد' : 'New Action'}
              >
                <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                {isSidebarOpen && (
                  <span className="text-xs font-semibold tracking-wide">
                    {language === 'ar' ? 'إجراء جديد' : 'New Action'}
                  </span>
                )}
              </button>

              {/* "New" Dropdown Menu */}
              {isNewMenuOpen && (
                <div className="absolute top-12 start-0 w-60 bg-white dark:bg-[#111827] rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800/90 py-1.5 z-50 animate-fadeIn">
                  {canNewAttendance && (
                    <Link
                      href="/attendance"
                      onClick={() => setIsNewMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4 text-emerald-500" />
                      <span>{language === 'ar' ? 'تسجيل كشف حضور جديد' : 'New Attendance Roster'}</span>
                    </Link>
                  )}
                  {canNewMemberOrLeader && (
                    <Link
                      href="/members"
                      onClick={() => setIsNewMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-sky-500" />
                      <span>{language === 'ar' ? 'إضافة كشاف أو قائد' : 'New Scout or Leader'}</span>
                    </Link>
                  )}
                  {canNewGear && (
                    <Link
                      href="/inventory"
                      onClick={() => setIsNewMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors"
                    >
                      <Package className="w-4 h-4 text-amber-500" />
                      <span>{language === 'ar' ? 'حجز مهمات عهدة كشفية' : 'New Gear Reservation'}</span>
                    </Link>
                  )}
                  {canNewMedia && (
                    <>
                      {(canNewAttendance || canNewMemberOrLeader || canNewGear) && (
                        <div className="my-1 border-t border-neutral-200/80 dark:border-neutral-800/80" />
                      )}
                      <Link
                        href="/media"
                        onClick={() => setIsNewMenuOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors"
                      >
                        <UploadCloud className="w-4 h-4 text-purple-500" />
                        <span>{language === 'ar' ? 'رفع صور وألبومات' : 'Upload Media to Drive'}</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Items (Crisp modern active states) */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 font-semibold border-s-2 border-sky-600 dark:border-sky-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/80 dark:hover:bg-[#1E293B]/60 border-s-2 border-transparent'
                  }`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-neutral-400'}`} />
                  {isSidebarOpen && (
                    <span className="truncate flex-1 text-start">
                      {item.label}
                    </span>
                  )}
                  {isSidebarOpen && item.badge && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1E293B] text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-800/60">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Drive Storage Indicator */}
          {isSidebarOpen && (
            <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <HardDrive className="w-3.5 h-3.5 text-sky-500" />
                <span>{language === 'ar' ? 'مساحة التخزين السحابي' : 'Storage'}</span>
              </div>
              <div className="w-full h-1 bg-neutral-200 dark:bg-[#1E293B] rounded-full overflow-hidden">
                <div className="w-[15%] h-full bg-sky-500 rounded-full" />
              </div>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-400 font-mono">
                {language === 'ar' ? '15 GB من 100 GB مستخدمة' : '15 GB of 100 GB used'}
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-white dark:bg-[#111827] h-full p-4 flex flex-col z-10 shadow-2xl border-e border-neutral-200 dark:border-neutral-800/80">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 border border-neutral-200 dark:border-neutral-700 shrink-0">
                    <img
                      src="/smsr-logo.jpg"
                      alt="SMSR Logo"
                      className="w-full h-full object-contain rounded"
                    />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
                      SMSR
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {language === 'ar' ? 'كشافة السيدة العذراء بالرحاب' : 'St. Mary Scouts Rehab'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="mt-4 flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border-s-2 border-sky-500'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* 3. MAIN CANVAS */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFD] dark:bg-[#0B0F17] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-500" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {language === 'ar' ? 'إعدادات المنظومة (Workspace)' : 'Workspace Settings'}
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1E293B] border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {language === 'ar' ? 'مزامنة جوجل درايف' : 'Google Drive Sync'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {language === 'ar' ? 'المجلد الكشفي السحابي متصل ونشط' : 'Scout Cloud Storage connected'}
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1E293B] border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {language === 'ar' ? 'لغة الواجهة (Interface Language)' : 'Language'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {language === 'ar' ? 'العربية (محاذاة كاملة RTL)' : 'English (LTR)'}
                  </div>
                </div>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'Switch to EN' : 'التحويل للعربية'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1E293B] border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {language === 'ar' ? 'المظهر (Theme Mode)' : 'Theme Mode'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isDarkMode ? 'Dark Mode (Linear/Vercel standard)' : 'Light Mode'}
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                >
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
