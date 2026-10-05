'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import {
  Compass,
  CalendarCheck,
  Users,
  Package,
  ShieldCheck,
  UploadCloud,
  Globe,
  LayoutDashboard,
  BarChart3,
  History,
  User,
  ChevronDown,
  LogOut,
} from 'lucide-react';

export function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();
  const { currentUser, currentRole, currentUnit, isSuperAdmin, can, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t('nav_dashboard'), icon: LayoutDashboard },
    { href: '/attendance', label: t('nav_attendance'), icon: CalendarCheck },
    { href: '/members', label: t('nav_members'), icon: Users },
    { href: '/inventory', label: t('nav_inventory'), icon: Package },
    { href: '/media', label: t('nav_media'), icon: UploadCloud },
  ];

  // Analytics: Super admin has executive analytics, team leaders have team attendance analytics
  if (isSuperAdmin || can('admin.analytics')) {
    navLinks.push({ href: '/admin/analytics', label: t('nav_analytics'), icon: BarChart3 });
  } else if (can('attendance.analytics') || can('attendance.take') || !!currentUnit) {
    navLinks.push({ href: '/admin/analytics', label: t('nav_team_analytics'), icon: BarChart3 });
  }
  if (isSuperAdmin || can('admin.audit_logs')) {
    navLinks.push({ href: '/admin/audit-logs', label: t('nav_audit_logs'), icon: History });
  }
  if (isSuperAdmin || can('users.manage_roles')) {
    navLinks.push({ href: '/admin/permissions', label: t('nav_permissions'), icon: ShieldCheck });
  }

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FDFDFC]/95 dark:bg-[#161D1A]/95 backdrop-blur-md border-b border-[#E2DED6] dark:border-[#27342F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center text-white border border-[#143326] shadow-xs group-hover:bg-[#143326] transition-colors">
              <Compass className="w-4 h-4 text-[#FDF6EC]" strokeWidth={2} />
            </div>
            <div>
              <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                {t('system_name')}
              </div>
              <div className="text-[11px] text-stone-600 dark:text-stone-400 font-mono hidden sm:block leading-none">
                {t('system_subtitle')}
              </div>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#E8F0EC] dark:bg-[#1B4332]/40 text-[#1B4332] dark:text-[#86efac] border border-[#2D6A4F]/30'
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-[#F1EFEA] dark:hover:bg-[#1E2723]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1B4332] dark:text-[#86efac]' : 'text-stone-500 dark:text-stone-400'}`} strokeWidth={1.75} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: User Menu & Language */}
          <div className="flex items-center gap-2">
            {/* Current Active User Profile */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161D1A] hover:bg-[#F1EFEA] dark:hover:bg-[#1E2723] border border-[#E2DED6] dark:border-[#27342F] transition-colors text-start cursor-pointer shadow-2xs"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-5 h-5 rounded bg-[#E8F0EC] text-[#1B4332] dark:bg-[#1B4332] dark:text-white flex items-center justify-center text-[10px] font-mono font-bold">
                    {currentUser.full_name.slice(0, 1) || 'U'}
                  </div>
                  <div className="hidden md:block leading-tight">
                    <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 max-w-[130px] truncate">
                      {currentUser.full_name.split(' (')[0]}
                    </div>
                    <div className="text-[10px] text-stone-600 dark:text-stone-400 font-mono flex items-center gap-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${isSuperAdmin ? 'bg-amber-600' : 'bg-[#1B4332]'}`} />
                      <span>{currentUnit ? (language === 'ar' ? currentUnit.name_ar : currentUnit.name_en) : (language === 'ar' ? 'فوج عام' : 'Global')}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />
                </button>

                {/* Profile Card & Logout Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute end-0 mt-1.5 w-64 bg-white dark:bg-[#161D1A] rounded-xl border border-[#E2DED6] dark:border-[#27342F] shadow-lg py-1.5 z-50 animate-fadeIn">
                    <div className="px-3.5 py-2.5 border-b border-[#E2DED6] dark:border-[#27342F]">
                      <div className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                        {language === 'ar' ? 'الحساب المسجّل' : 'Active Account'}
                      </div>
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-1">
                        {currentUser.full_name}
                      </div>
                      <div className="text-[11px] font-mono text-stone-600 dark:text-stone-400 mt-0.5 truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-800 dark:text-stone-200 border border-[#E2DED6] dark:border-[#27342F]">
                        <span>{currentRole?.description.split(' - ')[0]}</span>
                        <span>•</span>
                        <span>{currentUnit ? (language === 'ar' ? currentUnit.name_ar : currentUnit.name_en) : (language === 'ar' ? 'نطاق عام' : 'Global')}</span>
                      </div>
                    </div>

                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-start transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold transition-colors shadow-xs"
              >
                <User className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
              </Link>
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-[#161D1A] hover:bg-[#F1EFEA] dark:hover:bg-[#1E2723] text-stone-800 dark:text-stone-200 border border-[#E2DED6] dark:border-[#27342F] transition-colors cursor-pointer shadow-2xs"
              title="Toggle Language & Direction"
            >
              <Globe className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" strokeWidth={1.75} />
              <span>{language.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navbar */}
      <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t border-[#E2DED6] dark:border-[#27342F] gap-1.5 bg-[#F8F7F4] dark:bg-[#0F1412]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-bold transition-colors ${
                isActive
                  ? 'bg-[#1B4332] text-white dark:bg-[#1B4332] dark:text-white'
                  : 'bg-white dark:bg-[#161D1A] text-stone-800 dark:text-stone-200 border border-[#E2DED6] dark:border-[#27342F]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
