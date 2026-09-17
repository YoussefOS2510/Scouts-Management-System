'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { INITIAL_MEMBERS, INITIAL_UNITS, INITIAL_EQUIPMENT } from '../lib/data';
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
} from 'lucide-react';

export function GoogleWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { language, toggleLanguage, t } = useLanguage();
  const { currentUser, currentRole, currentUnit, isSuperAdmin, can, logout, accessibleUnits } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    setIsDarkMode(!isDarkMode);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark');
    }
  };

  const navItems = [
    {
      href: '/',
      label: language === 'ar' ? 'الوحدات الكشفية' : 'Scout Units',
      icon: Folder,
      badge: '12',
    },
    {
      href: '/attendance',
      label: language === 'ar' ? 'سجل الحضور' : 'Attendance',
      icon: CalendarCheck,
    },
    {
      href: '/admin/analytics',
      label: language === 'ar' ? 'تحليلات الحضور' : 'Analytics',
      icon: BarChart3,
    },
    {
      href: '/members',
      label: language === 'ar' ? 'دليل الأعضاء' : 'Members Directory',
      icon: Users,
    },
    {
      href: '/inventory',
      label: language === 'ar' ? 'إدارة العهدة' : 'Gear & Inventory',
      icon: Package,
    },
    {
      href: '/media',
      label: language === 'ar' ? 'مكتبة الوسائط' : 'Media Library',
      icon: UploadCloud,
    },
  ];

  if (isSuperAdmin || can('users.manage_roles')) {
    navItems.push({
      href: '/admin/permissions',
      label: language === 'ar' ? 'الصلاحيات' : 'Permissions',
      icon: ShieldCheck,
    });
  }

  if (isSuperAdmin || can('admin.audit_logs')) {
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
    members: INITIAL_MEMBERS.filter(m => 
      m.full_name_ar.includes(searchQuery) || 
      (m.full_name_en && m.full_name_en.toLowerCase().includes(searchQuery.toLowerCase())) || 
      m.member_code.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
    equipment: INITIAL_EQUIPMENT.filter(e => 
      e.name.includes(searchQuery) || 
      e.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
  } : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFD] dark:bg-[#121416] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans antialiased">
      {/* 1. TOP APP BAR (Google Workspace / Drive Header) */}
      <header className="h-16 shrink-0 bg-white dark:bg-[#1F1F1F] px-4 sm:px-6 flex items-center justify-between gap-4 z-40 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
        {/* Leading: Hamburger + Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex p-2 rounded-full hover:bg-[#E9EEF6] dark:hover:bg-[#2D2F31] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
            title={language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-[#E9EEF6] dark:hover:bg-[#2D2F31] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer select-none">
            {/* Google Drive styled Tri-Color/Scout Symbol */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B57D0] via-[#146C2E] to-[#B06000] p-0.5 shadow-2xs group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white dark:bg-[#1F1F1F] rounded-[10px] flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-[#0B57D0]" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-normal text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5 leading-tight">
                <span>{language === 'ar' ? 'منظومة الفوج' : 'Scout Drive'}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF]">
                  Workspace
                </span>
              </div>
              <div className="text-[11px] text-[#444746] dark:text-[#8E918F] font-normal leading-tight">
                {language === 'ar' ? 'مجموعة كشافة ومرشدات الفوج' : 'Troop Management Suite'}
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Central Pill Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-2xl relative mx-2 hidden sm:block">
          <div className={`flex items-center gap-3 bg-[#EEF2F6] hover:bg-[#E1E7EE] focus-within:bg-white dark:bg-[#2D2F31] dark:hover:bg-[#35373A] dark:focus-within:bg-[#1F1F1F] rounded-full h-11 px-4 transition-all ${
            isSearchFocused ? 'shadow-md ring-2 ring-[#0B57D0]/40' : ''
          }`}>
            <Search className="w-4 h-4 text-[#444746] dark:text-[#C4C7C5] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={language === 'ar' ? 'البحث في الكشافين، العهدة، الوحدات، والملفات...' : 'Search members, gear, units, and files...'}
              className="w-full bg-transparent border-none text-sm text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#444746] dark:placeholder-[#8E918F] focus:outline-none focus:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-xs text-[#444746]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant Search Results Dropdown */}
          {isSearchFocused && searchResults && (
            <div className="absolute top-12 start-0 end-0 bg-white dark:bg-[#1F1F1F] rounded-2xl shadow-xl border border-[#E0E3E7] dark:border-[#303134] p-3 z-50 space-y-3 mt-1 max-h-96 overflow-y-auto">
              {searchResults.units.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] px-2 py-1">
                    {language === 'ar' ? 'الوحدات الكشفية' : 'Units'}
                  </div>
                  {searchResults.units.map((u) => (
                    <Link
                      key={u.id}
                      href={`/attendance?unit=${u.id}`}
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-xs font-medium transition-colors"
                    >
                      <Folder className="w-4 h-4 text-[#0B57D0]" />
                      <span>{language === 'ar' ? u.name_ar : u.name_en}</span>
                      <span className="text-[10px] text-[#444746] ms-auto">{u.code}</span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.members.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] px-2 py-1">
                    {language === 'ar' ? 'الكشافون والقادة' : 'Members'}
                  </div>
                  {searchResults.members.map((m) => (
                    <Link
                      key={m.id}
                      href="/members"
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-xs font-medium transition-colors"
                    >
                      <Users className="w-4 h-4 text-[#146C2E]" />
                      <span>{language === 'ar' ? m.full_name_ar : (m.full_name_en || m.full_name_ar)}</span>
                      <span className="text-[10px] font-mono text-[#444746] ms-auto">{m.member_code}</span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.equipment.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] px-2 py-1">
                    {language === 'ar' ? 'مهمات العهدة' : 'Equipment'}
                  </div>
                  {searchResults.equipment.map((e) => (
                    <Link
                      key={e.id}
                      href="/inventory"
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-xs font-medium transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#B06000]" />
                      <span>{e.name}</span>
                      <span className="text-[10px] text-[#444746] ms-auto">{e.sku}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trailing: Settings, Theme, Lang, Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switch */}
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-[#E9EEF6] dark:hover:bg-[#2D2F31] text-[#444746] dark:text-[#C4C7C5] text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-[#E9EEF6] dark:hover:bg-[#2D2F31] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-[#E9EEF6] dark:hover:bg-[#2D2F31] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
            title={language === 'ar' ? 'إعدادات المنظومة' : 'Workspace Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Avatar Pill */}
          <div ref={userMenuRef} className="relative ms-1">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 sm:ps-2 sm:pe-3 rounded-full hover:bg-[#E9EEF6] dark:hover:bg-[#2D2F31] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B57D0] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser?.full_name?.charAt(0) || 'ق'}
              </div>
              <div className="hidden lg:block text-start leading-tight">
                <div className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate max-w-[120px]">
                  {currentUser?.full_name.split(' (')[0]}
                </div>
                <div className="text-[10px] text-[#444746] dark:text-[#8E918F]">
                  {currentRole?.description.split(' - ')[0]}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#444746] hidden sm:block" />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute end-0 top-12 w-64 bg-white dark:bg-[#1E1F20] rounded-2xl shadow-xl border border-[#E0E3E7] dark:border-[#303134] p-3 z-50 animate-fadeIn space-y-3">
                <div className="text-center p-2 border-b border-[#F0F4F9] dark:border-[#282A2C]">
                  <div className="w-12 h-12 rounded-full bg-[#0B57D0] text-white font-medium text-lg mx-auto flex items-center justify-center mb-2">
                    {currentUser?.full_name?.charAt(0)}
                  </div>
                  <div className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                    {currentUser?.full_name}
                  </div>
                  <div className="text-xs text-[#444746] dark:text-[#8E918F] mt-0.5">
                    {currentUser?.email}
                  </div>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF]">
                    {currentRole?.name}
                  </span>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/login"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#444746] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تبديل الحساب / الأدوار' : 'Switch Account / Role'}</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                      router.push('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-start cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign out'}</span>
                  </button>
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
          } hidden md:flex flex-col shrink-0 bg-[#F8FAFD] dark:bg-[#121416] p-3 transition-all duration-200 border-e border-[#F0F4F9] dark:border-[#2D2F31] select-none`}
        >
          {/* Floating Google "New" (+) Pill */}
          <div ref={newMenuRef} className="relative mb-4">
            <button
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className={`bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] hover:shadow-md rounded-2xl ${
                isSidebarOpen ? 'px-5 py-3.5 gap-3 w-auto' : 'w-12 h-12 justify-center mx-auto'
              } font-medium flex items-center transition-all cursor-pointer shadow-2xs active:scale-95`}
              title={language === 'ar' ? 'إجراء جديد' : 'New Action'}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              {isSidebarOpen && (
                <span className="text-sm font-medium tracking-wide">
                  {language === 'ar' ? 'إجراء جديد' : 'New'}
                </span>
              )}
            </button>

            {/* "New" Dropdown Menu (Drive Style) */}
            {isNewMenuOpen && (
              <div className="absolute top-14 start-0 w-60 bg-white dark:bg-[#1E1F20] rounded-2xl shadow-xl border border-[#E0E3E7] dark:border-[#303134] py-2 z-50 animate-fadeIn">
                <Link
                  href="/attendance"
                  onClick={() => setIsNewMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors"
                >
                  <CalendarCheck className="w-4 h-4 text-[#146C2E]" />
                  <span>{language === 'ar' ? 'تسجيل كشف حضور جديد' : 'New Attendance Roster'}</span>
                </Link>
                <Link
                  href="/members"
                  onClick={() => setIsNewMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-[#0B57D0]" />
                  <span>{language === 'ar' ? 'إضافة كشاف أو قائد' : 'New Scout or Leader'}</span>
                </Link>
                <Link
                  href="/inventory"
                  onClick={() => setIsNewMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors"
                >
                  <Package className="w-4 h-4 text-[#B06000]" />
                  <span>{language === 'ar' ? 'حجز مهمات عهدة كشفية' : 'New Gear Reservation'}</span>
                </Link>
                <div className="my-1 border-t border-[#F0F4F9] dark:border-[#2D2F31]" />
                <Link
                  href="/media"
                  onClick={() => setIsNewMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-[#7C3AED]" />
                  <span>{language === 'ar' ? 'رفع صور وألبومات' : 'Upload Media to Drive'}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Items (M3 Pill List) */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF] font-medium'
                      : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6] dark:hover:bg-[#282A2C]'
                  }`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#001D35] dark:text-[#C2E7FF]' : ''}`} />
                  {isSidebarOpen && (
                    <span className="truncate flex-1 text-start">
                      {item.label}
                    </span>
                  )}
                  {isSidebarOpen && item.badge && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#E0E3E7] dark:bg-[#303134] text-[#444746] dark:text-[#C4C7C5]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Drive Storage Indicator */}
          {isSidebarOpen && (
            <div className="pt-4 border-t border-[#E0E3E7] dark:border-[#303134] space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#444746] dark:text-[#C4C7C5]">
                <HardDrive className="w-4 h-4 text-[#0B57D0]" />
                <span>{language === 'ar' ? 'مساحة التخزين السحابي' : 'Storage'}</span>
              </div>
              <div className="w-full h-1 bg-[#E0E3E7] dark:bg-[#303134] rounded-full overflow-hidden">
                <div className="w-[15%] h-full bg-[#0B57D0] rounded-full" />
              </div>
              <div className="text-[11px] text-[#444746] dark:text-[#8E918F] font-mono">
                {language === 'ar' ? '15 GB من 100 GB مستخدمة' : '15 GB of 100 GB used'}
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-white dark:bg-[#1E1F20] h-full p-4 flex flex-col z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F4F9]">
                <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                  {language === 'ar' ? 'منظومة الفوج' : 'Scout Workspace'}
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-full hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium ${
                        isActive
                          ? 'bg-[#C2E7FF] text-[#001D35]'
                          : 'text-[#444746] hover:bg-[#E9EEF6]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* 3. MAIN CANVAS (Drive Workspace Style) */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFD] dark:bg-[#121416] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Google Workspace Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F20] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E0E3E7] dark:border-[#303134] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F4F9] dark:border-[#282A2C] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#0B57D0]" />
                <h3 className="text-lg font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                  {language === 'ar' ? 'إعدادات منظومة الفوج (Workspace)' : 'Workspace Settings'}
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                    {language === 'ar' ? 'مزامنة جوجل درايف' : 'Google Drive Sync'}
                  </div>
                  <div className="text-xs text-[#444746] dark:text-[#8E918F]">
                    {language === 'ar' ? 'مجلد الفوج الكشفي نشط ومتصل' : 'Active and synced to Scout Root'}
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#146C2E]" />
              </div>

              <div className="p-3 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                    {language === 'ar' ? 'لغة الواجهة (Interface Language)' : 'Language'}
                  </div>
                  <div className="text-xs text-[#444746] dark:text-[#8E918F]">
                    {language === 'ar' ? 'العربية (محاذاة RTL كاملة)' : 'English (LTR)'}
                  </div>
                </div>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-[#0B57D0] text-white"
                >
                  {language === 'ar' ? 'Switch to EN' : 'تحويل للعربية'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                    {language === 'ar' ? 'المظهر (Material You Theme)' : 'Theme Mode'}
                  </div>
                  <div className="text-xs text-[#444746] dark:text-[#8E918F]">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode (Google Drive standard)'}
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="px-3 py-1 text-xs font-medium rounded-full border border-[#E0E3E7] dark:border-[#303134]"
                >
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 rounded-full bg-[#0B57D0] text-white text-xs font-medium hover:bg-[#0842A0] transition-colors"
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
