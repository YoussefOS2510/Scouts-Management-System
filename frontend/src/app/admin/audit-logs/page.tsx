'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';
import { useAuth } from '../../../lib/AuthContext';
import { INITIAL_UNITS } from '../../../lib/data';
import { AuditActionType, AuditLogEntry } from '../../../lib/types';
import {
  History,
  ShieldAlert,
  Search,
  CalendarCheck,
  Package,
  ShieldCheck,
  UploadCloud,
  UserCheck,
  Clock,
  Info,
  RefreshCw,
} from 'lucide-react';

export default function LeaderAuditLogsPage() {
  const { language, t } = useLanguage();
  const { isSuperAdmin, can, auditLogs, allUsers, isLoadingPermissions } = useAuth();

  const [liveLogs, setLiveLogs] = useState<AuditLogEntry[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch live audit logs from ScoutsDB on mount
  React.useEffect(() => {
    fetch('/api/audit-logs?limit=100')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.logs)) {
          setLiveLogs(data.logs);
        }
      })
      .catch((err) => console.error('Failed to fetch live audit logs:', err));
  }, []);

  const logsToFilter = liveLogs.length > 0 ? liveLogs : auditLogs;

  // Permission Guard
  if (isLoadingPermissions) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {language === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Verifying leader permissions...'}
        </p>
      </div>
    );
  }

  if (!isSuperAdmin && !can('admin.audit_logs')) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
          <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'وصول مقيّد: سجل تتبع القادة' : 'Restricted Access: Leader Action Tracking'}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {language === 'ar'
            ? 'سجل العمليات متاح فقط لقائد الفوج لمراجعة وتدقيق الإجراءات المتخذة في المنظومة.'
            : 'The leader audit trail is restricted to the Group Leader to inspect actions taken across the system.'}
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
        </Link>
      </div>
    );
  }

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logsToFilter.filter((log) => {
      const matchUser = selectedUserFilter === 'all' || log.user_id === selectedUserFilter;
      const matchUnit = selectedUnitFilter === 'all' || log.unit_id === selectedUnitFilter;
      const matchAction = selectedActionFilter === 'all' || log.action_type === selectedActionFilter;
      const matchSearch =
        !searchQuery ||
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.title_ar.includes(searchQuery) ||
        log.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description_ar.includes(searchQuery) ||
        log.description_en.toLowerCase().includes(searchQuery.toLowerCase());

      return matchUser && matchUnit && matchAction && matchSearch;
    });
  }, [logsToFilter, selectedUserFilter, selectedUnitFilter, selectedActionFilter, searchQuery]);

  const getActionBadge = (actionType: AuditActionType) => {
    switch (actionType) {
      case 'attendance_saved':
        return {
          icon: CalendarCheck,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
          label: language === 'ar' ? 'حضور وغياب' : 'Attendance',
        };
      case 'booking_created':
      case 'booking_approved':
      case 'booking_rejected':
        return {
          icon: Package,
          color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
          label: language === 'ar' ? 'حجز عهدة' : 'Inventory',
        };
      case 'permission_overridden':
        return {
          icon: ShieldCheck,
          color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
          label: language === 'ar' ? 'صلاحيات' : 'Permissions',
        };
      case 'media_uploaded':
        return {
          icon: UploadCloud,
          color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
          label: language === 'ar' ? 'وسائط وDrive' : 'Media',
        };
      case 'user_login':
        return {
          icon: UserCheck,
          color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
          label: language === 'ar' ? 'تسجيل دخول' : 'Login',
        };
      default:
        return {
          icon: Info,
          color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
          label: language === 'ar' ? 'إجراء عام' : 'General',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-1.5">
            <History className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
            <span>{language === 'ar' ? 'سجل التدقيق والمراقبة' : 'Leader Action Audit Feed'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">{t('audit_logs_title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t('audit_logs_desc')}</p>
        </div>

        <div className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{language === 'ar' ? 'مراقبة حية ونشطة للمنظومة' : 'Real-time Telemetry Active'}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#121214] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-2.5" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث باسم القائد أو تفاصيل الإجراء...' : 'Search leader or details...'}
            className="w-full ps-9 pe-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
          />
        </div>

        {/* Filter by Leader */}
        <div>
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
          >
            <option value="all">{language === 'ar' ? 'جميع القادة' : 'All Leaders'}</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name.split(' (')[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Unit */}
        <div>
          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
          >
            <option value="all">{language === 'ar' ? 'جميع الفرق والمراحل' : 'All Units / Teams'}</option>
            {INITIAL_UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {language === 'ar' ? u.name_ar : u.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Action Category */}
        <div>
          <select
            value={selectedActionFilter}
            onChange={(e) => setSelectedActionFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
          >
            <option value="all">{language === 'ar' ? 'جميع أنواع العمليات' : 'All Action Types'}</option>
            <option value="attendance_saved">{language === 'ar' ? 'تسجيل حضور' : 'Attendance Saved'}</option>
            <option value="booking_created">{language === 'ar' ? 'طلب حجز عهدة' : 'Booking Created'}</option>
            <option value="booking_approved">{language === 'ar' ? 'اعتماد حجز' : 'Booking Approved'}</option>
            <option value="permission_overridden">{language === 'ar' ? 'تعديل صلاحيات' : 'Permission Override'}</option>
            <option value="media_uploaded">{language === 'ar' ? 'رفع وسائط' : 'Media Upload'}</option>
            <option value="user_login">{language === 'ar' ? 'تسجيل دخول' : 'User Login'}</option>
          </select>
        </div>
      </div>

      {/* Audit Timeline Grid */}
      <div className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-mono">
            {language === 'ar' ? 'لا توجد سجلات مطابقة لخيارات الفلترة' : 'No audit entries match the filters'}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getActionBadge(log.action_type);
            const Icon = badge.icon;
            const unit = log.unit_id ? INITIAL_UNITS.find((u) => u.id === log.unit_id) : null;

            return (
              <div key={log.id} className="p-4 hover:bg-zinc-50/75 dark:hover:bg-zinc-800/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${badge.color}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        {language === 'ar' ? log.title_ar : log.title_en}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {unit && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {language === 'ar' ? unit.name_ar : unit.name_en}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                      {language === 'ar' ? log.description_ar : log.description_en}
                    </p>

                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 pt-0.5">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{log.user_name}</span>
                      <span>•</span>
                      <span className="text-zinc-400 dark:text-zinc-500">{log.user_role_name}</span>
                    </div>

                    {/* Metadata chips */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {Object.entries(log.metadata).map(([key, val]) => (
                          <span
                            key={key}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700"
                          >
                            {key}: <strong className="text-zinc-800 dark:text-zinc-200">{String(val)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono tabular-nums whitespace-nowrap flex items-center gap-1 shrink-0 sm:pt-0.5">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>
                    {new Date(log.created_at || log.timestamp || Date.now()).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
