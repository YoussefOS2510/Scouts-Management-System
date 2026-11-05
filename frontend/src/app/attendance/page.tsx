'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS } from '../../lib/data';
import { getSubdivisionTerms } from '@/lib/scout-terms';
import { AttendanceStatus, AttendanceSession } from '../../lib/types';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Users,
  Save,
  FileSpreadsheet,
  Check,
  Lock,
  RotateCcw,
  BarChart3,
  LayoutGrid,
  List,
  ChevronRight,
  Folder,
  ShieldAlert,
  RefreshCw,
  Plus,
  Calendar,
  CalendarPlus,
  MapPin,
  Tag,
  Trash2,
  Pencil,
  X,
  Sparkles,
  Info,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { TeamAttendanceAnalytics } from '../../components/TeamAttendanceAnalytics';

const EVENT_PRESETS = [
  { ar: 'اجتماع كشفي أسبوعي', en: 'Weekly Scout Meeting', type: 'meeting' },
  { ar: 'مخيم تدريبي كشفي', en: 'Scout Training Camp', type: 'camp' },
  { ar: 'رحلة خلوية واستكشاف', en: 'Scout Hike & Exploration', type: 'trip' },
  { ar: 'يوم روحي وخدمة', en: 'Spiritual Day & Service', type: 'service' },
  { ar: 'مسابقة ودوري رياضي', en: 'Sports Tournament & Games', type: 'competition' },
  { ar: 'حفل قبول ووعد كشفي', en: 'Promise & Investiture Ceremony', type: 'celebration' },
];

function AttendancePageContent() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get('sessionId');
  const queryUnitId = searchParams.get('unitId');

  const {
    currentUser,
    currentRole,
    isSuperAdmin,
    can,
    logAction,
    accessibleUnits,
    members,
    patrols,
    isLoadingPermissions,
  } = useAuth();

  // Role permissions
  const canViewAllUnits = isSuperAdmin || currentRole?.name === 'group_leader';

  const canAccessAttendance =
    isSuperAdmin ||
    can('attendance.take') ||
    can('attendance.edit_history') ||
    can('attendance.export') ||
    can('attendance.analytics');

  // Tab view: 'roster' (take attendance) or 'analytics' (team attendance analytics)
  const [activeView, setActiveView] = useState<'roster' | 'analytics'>('roster');

  // Roster layout: 'list' (Drive Table Rows) vs 'grid' (Tactile Patrol Cards)
  const [rosterViewMode, setRosterViewMode] = useState<'list' | 'grid'>('list');

  // Unit scoping: prioritize queryUnitId if provided and accessible
  const defaultUnit = queryUnitId
    ? Number(queryUnitId)
    : accessibleUnits.length > 0
    ? accessibleUnits[0].id
    : 5;
  const [selectedUnitId, setSelectedUnitId] = useState<number>(defaultUnit);

  const canTakeAttendance = isSuperAdmin || can('attendance.take', selectedUnitId);

  // If visiting /attendance without a specific sessionId, seamlessly route to /events
  useEffect(() => {
    if (!querySessionId && !isLoadingPermissions) {
      router.replace(selectedUnitId ? `/events?unitId=${selectedUnitId}` : '/events');
    }
  }, [querySessionId, selectedUnitId, isLoadingPermissions, router]);

  // Sync unit when accessibleUnits switch
  useEffect(() => {
    if (accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(accessibleUnits[0].id);
    }
  }, [accessibleUnits, selectedUnitId]);

  // Events & Active Session State
  const [events, setEvents] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(querySessionId || null);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);

  // Attendance records state: { [memberId]: { status?: AttendanceStatus, notes: string } }
  const [records, setRecords] = useState<Record<string, { status?: AttendanceStatus; notes: string }>>({});
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modal States
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState<boolean>(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState<boolean>(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState<boolean>(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState<string>('اجتماع كشفي أسبوعي');
  const [newEventDate, setNewEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState<string>('meeting');
  const [newEventLocation, setNewEventLocation] = useState<string>('');
  const [newEventNotes, setNewEventNotes] = useState<string>('');
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);

  // Edit Event Form State
  const [editEventTitle, setEditEventTitle] = useState<string>('');
  const [editEventDate, setEditEventDate] = useState<string>('');
  const [editEventType, setEditEventType] = useState<string>('meeting');
  const [editEventLocation, setEditEventLocation] = useState<string>('');
  const [editEventNotes, setEditEventNotes] = useState<string>('');

  // Fetch events and records whenever selectedUnitId changes
  const loadUnitEvents = (unitId: number, targetSessionId?: string) => {
    setIsLoadingEvents(true);
    const url = targetSessionId
      ? `/api/attendance?unitId=${unitId}&sessionId=${targetSessionId}`
      : `/api/attendance?unitId=${unitId}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const sessionsList: AttendanceSession[] = data.sessions || [];
          setEvents(sessionsList);

          // Only activate session if targetSessionId was explicitly provided
          const activeId = targetSessionId || null;
          setSelectedSessionId(activeId);

          // Populate records for active session
          const map: Record<string, { status?: AttendanceStatus; notes: string }> = {};
          if (Array.isArray(data.records) && activeId) {
            data.records.forEach((rec: any) => {
              map[rec.member_id] = {
                status: rec.status,
                notes: rec.notes || '',
              };
            });
          }
          setRecords(map);
        }
      })
      .catch((err) => console.error('Failed to fetch events:', err))
      .finally(() => setIsLoadingEvents(false));
  };

  useEffect(() => {
    loadUnitEvents(selectedUnitId, querySessionId || undefined);
  }, [selectedUnitId, querySessionId]);

  // Load records when switching active event session
  const handleSelectEvent = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    fetch(`/api/attendance?unitId=${selectedUnitId}&sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.records)) {
          const map: Record<string, { status?: AttendanceStatus; notes: string }> = {};
          data.records.forEach((rec: any) => {
            map[rec.member_id] = {
              status: rec.status,
              notes: rec.notes || '',
            };
          });
          setRecords(map);
        }
      })
      .catch((err) => console.error('Failed to load event records:', err));
  };

  // Find active event object
  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedSessionId) || null;
  }, [events, selectedSessionId]);

  // Filter scouts for selected unit
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.unit_id === selectedUnitId);
  }, [members, selectedUnitId]);

  // Filter patrols for selected unit
  const activePatrols = useMemo(() => {
    return patrols.filter((p) => p.unit_id === selectedUnitId);
  }, [patrols, selectedUnitId]);

  // Group scouts by patrol / six / clan
  const groupedScouts = useMemo(() => {
    const groups: { patrolName: string; members: typeof activeMembers }[] = [];
    const unitTerms = getSubdivisionTerms(selectedUnitId);

    activePatrols.forEach((patrol) => {
      const pMembers = activeMembers.filter((m) => m.patrol_id === patrol.id);
      if (pMembers.length > 0) {
        groups.push({
          patrolName: language === 'ar' ? patrol.name_ar : patrol.name_en,
          members: pMembers,
        });
      }
    });

    const unassigned = activeMembers.filter(
      (m) => !m.patrol_id || !activePatrols.some((p) => p.id === m.patrol_id)
    );
    if (unassigned.length > 0) {
      groups.push({
        patrolName: language === 'ar' ? unitTerms.unassignedAr : unitTerms.unassignedEn,
        members: unassigned,
      });
    }

    return groups;
  }, [activeMembers, activePatrols, selectedUnitId, language]);

  // Mark all present
  const handleMarkAllPresent = () => {
    if (!canTakeAttendance || !selectedSessionId) return;
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    activeMembers.forEach((m) => {
      updated[m.id] = {
        status: 'present',
        notes: records[m.id]?.notes || '',
      };
    });
    setRecords(updated);
  };

  // Reset to no selection
  const handleClearAll = () => {
    if (!canTakeAttendance || !selectedSessionId) return;
    setRecords({});
  };

  // Toggle status
  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    if (!canTakeAttendance || !selectedSessionId) return;
    setRecords((prev) => {
      const isCurrentlySelected = prev[memberId]?.status === status;
      if (isCurrentlySelected) {
        const copy = { ...prev };
        delete copy[memberId];
        return copy;
      }
      return {
        ...prev,
        [memberId]: {
          status,
          notes: prev[memberId]?.notes || '',
        },
      };
    });
  };

  // Update note
  const handleNotesChange = (memberId: string, notes: string) => {
    if (!canTakeAttendance || !selectedSessionId) return;
    setRecords((prev) => ({
      ...prev,
      [memberId]: {
        status: prev[memberId]?.status,
        notes,
      },
    }));
  };

  // Create New Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال اسم الفعالية' : 'Please enter event title');
      return;
    }

    setIsCreatingEvent(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_event',
          unitId: selectedUnitId,
          sessionDate: newEventDate,
          sessionTitle: newEventTitle.trim(),
          eventType: newEventType,
          location: newEventLocation.trim() || undefined,
          notes: newEventNotes.trim() || undefined,
          recordedBy: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        // Add to events and make active
        const newEvent: AttendanceSession = {
          ...data.session,
          total_records: 0,
          present_count: 0,
          absent_count: 0,
          excused_count: 0,
          late_count: 0,
        };

        setEvents((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);
        setSelectedSessionId(newEvent.id);
        setRecords({}); // fresh attendance roster for new event
        setIsNewEventModalOpen(false);

        // Reset inputs
        setNewEventTitle('اجتماع كشفي أسبوعي');
        setNewEventDate(new Date().toISOString().split('T')[0]);
        setNewEventType('meeting');
        setNewEventLocation('');
        setNewEventNotes('');

        setSaveNotification(
          language === 'ar'
            ? `تم إنشاء فعالية "${newEvent.session_title}" بنجاح!`
            : `Event "${newEvent.session_title}" created successfully!`
        );
        setTimeout(() => setSaveNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (err: any) {
      console.error('Create event error:', err);
      alert('Error creating event: ' + err.message);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Open Edit Event Modal
  const openEditModal = () => {
    if (!activeEvent) return;
    setEditEventTitle(activeEvent.session_title);
    setEditEventDate(activeEvent.session_date);
    setEditEventType(activeEvent.event_type || 'meeting');
    setEditEventLocation(activeEvent.location || '');
    setEditEventNotes(activeEvent.notes || '');
    setIsEditEventModalOpen(true);
  };

  // Submit Edit Event
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !editEventTitle.trim()) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeEvent.id,
          sessionTitle: editEventTitle.trim(),
          sessionDate: editEventDate,
          eventType: editEventType,
          location: editEventLocation.trim() || undefined,
          notes: editEventNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((evt) =>
            evt.id === activeEvent.id
              ? {
                  ...evt,
                  session_title: editEventTitle.trim(),
                  session_date: editEventDate,
                  event_type: editEventType,
                  location: editEventLocation.trim(),
                  notes: editEventNotes.trim(),
                }
              : evt
          )
        );
        setIsEditEventModalOpen(false);
        setSaveNotification(
          language === 'ar' ? 'تم تحديث بيانات الفعالية بنجاح!' : 'Event details updated successfully!'
        );
        setTimeout(() => setSaveNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to update event');
      }
    } catch (err) {
      console.error('Update event error:', err);
      alert('Failed to update event details');
    }
  };

  // Delete Event
  const handleDeleteEvent = async () => {
    if (!activeEvent) return;
    const confirmMsg =
      language === 'ar'
        ? `هل أنت متأكد من حذف فعالية "${activeEvent.session_title}" وسجلات حضورها؟`
        : `Are you sure you want to delete event "${activeEvent.session_title}" and its attendance records?`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeletingEvent(true);
    try {
      const res = await fetch(`/api/attendance?sessionId=${activeEvent.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        const remaining = events.filter((e) => e.id !== activeEvent.id);
        setEvents(remaining);
        if (remaining.length > 0) {
          handleSelectEvent(remaining[0].id);
        } else {
          setSelectedSessionId(null);
          setRecords({});
        }
        setSaveNotification(
          language === 'ar' ? 'تم حذف الفعالية وسجلاتها بنجاح!' : 'Event deleted successfully!'
        );
        setTimeout(() => setSaveNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Delete event error:', err);
      alert('Failed to delete event');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // Save Attendance for active event
  const handleSaveAttendance = () => {
    if (!canTakeAttendance) return;
    if (!selectedSessionId || !activeEvent) {
      alert(language === 'ar' ? 'يرجى تحديد أو إنشاء فعالية أولاً' : 'Please set an event first');
      return;
    }

    setIsSaving(true);
    const payloadRecords = Object.entries(records).map(([mId, rec]) => ({
      memberId: mId,
      status: rec.status,
      notes: rec.notes,
    }));

    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: selectedSessionId,
        unitId: selectedUnitId,
        sessionDate: activeEvent.session_date,
        sessionTitle: activeEvent.session_title,
        recordedBy: currentUser?.id,
        records: payloadRecords,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSaveNotification(
            language === 'ar'
              ? `تم حفظ كشف حضور فعالية "${activeEvent.session_title}" بنجاح!`
              : `Attendance for "${activeEvent.session_title}" saved successfully!`
          );
          setTimeout(() => setSaveNotification(null), 4500);

          // Update event in local list
          setEvents((prev) =>
            prev.map((e) =>
              e.id === selectedSessionId
                ? {
                    ...e,
                    total_records: payloadRecords.length,
                    present_count: payloadRecords.filter((r) => r.status === 'present').length,
                    absent_count: payloadRecords.filter((r) => r.status === 'absent').length,
                    excused_count: payloadRecords.filter((r) => r.status === 'excused').length,
                    late_count: payloadRecords.filter((r) => r.status === 'late').length,
                  }
                : e
            )
          );
        } else {
          alert(data.error || 'Failed to save attendance');
        }
      })
      .catch((err) => {
        console.error('Save attendance error:', err);
        alert('Database connection error while saving attendance');
      })
      .finally(() => setIsSaving(false));
  };

  // Aggregate stats for currently marked roster
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    let late = 0;
    let unselected = 0;

    activeMembers.forEach((m) => {
      const st = records[m.id]?.status;
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'excused') excused++;
      else if (st === 'late') late++;
      else unselected++;
    });

    const total = activeMembers.length;
    const recordedTotal = present + absent + excused + late;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, excused, late, unselected, recordedTotal, rate };
  }, [activeMembers, records]);

  const currentUnitObj = INITIAL_UNITS.find((u) => u.id === selectedUnitId);

  // Helper for event type label
  const getEventTypeLabel = (type?: string) => {
    switch (type) {
      case 'camp':
        return language === 'ar' ? 'مخيم' : 'Camp';
      case 'trip':
        return language === 'ar' ? 'رحلة' : 'Trip';
      case 'service':
        return language === 'ar' ? 'خدمة روحية' : 'Service';
      case 'competition':
        return language === 'ar' ? 'مسابقة ودوري' : 'Competition';
      case 'celebration':
        return language === 'ar' ? 'احتفال ووعد' : 'Celebration';
      default:
        return language === 'ar' ? 'اجتماع' : 'Meeting';
    }
  };

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

  if (!canAccessAttendance) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-xs">
          <ShieldAlert className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'وصول مقيّد: سجل الحضور والغياب' : 'Restricted Access: Attendance Roster'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          {language === 'ar'
            ? 'حسابك الحالي لا يمتلك صلاحيات تسجيل أو إدارة كشوف الحضور الكشفية.'
            : 'Your current role does not have permission to mark attendance or view roll-call rosters.'}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            {language === 'ar' ? 'العودة للرئيسية' : 'Return to Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 1. BREADCRUMBS & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200/80 dark:border-neutral-800/60">
        {/* Breadcrumbs & Back to Events */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={selectedUnitId ? `/events?unitId=${selectedUnitId}` : '/events'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200/80 dark:border-neutral-700 transition-colors shadow-2xs"
          >
            {language === 'ar' ? (
              <>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{t('back_to_events')}</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('back_to_events')}</span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/" className="hover:text-sky-500 transition-colors font-bold">
              SMSR
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
            <Link href={selectedUnitId ? `/events?unitId=${selectedUnitId}` : '/events'} className="hover:text-sky-500 transition-colors font-medium">
              {language === 'ar' ? 'الفعاليات' : 'Events'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
            <span className="text-neutral-900 dark:text-neutral-100 font-semibold">
              {language === 'ar' ? 'كشف الحضور' : 'Attendance Roll-Call'}
            </span>
            {currentUnitObj && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
                <span
                  className="text-xs px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-medium border border-sky-500/20"
                  dir="auto"
                >
                  {language === 'ar' ? currentUnitObj.name_ar : currentUnitObj.name_en}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tab & View Mode Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Main View Switcher: Roster vs Analytics */}
          <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80">
            <button
              onClick={() => setActiveView('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'roster'
                  ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>{t('daily_roster')}</span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'analytics'
                  ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t('team_attendance_analytics')}</span>
            </button>
          </div>

          {/* List vs Grid Layout */}
          {activeView === 'roster' && (
            <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80">
              <button
                onClick={() => setRosterViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  rosterViewMode === 'list'
                    ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                }`}
                title={language === 'ar' ? 'عرض جدول (List View)' : 'Table List View'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRosterViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  rosterViewMode === 'grid'
                    ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                }`}
                title={language === 'ar' ? 'عرض بطاقات (Grid View)' : 'Card Grid View'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {activeView === 'analytics' ? (
        <TeamAttendanceAnalytics
          initialUnitId={selectedUnitId}
          onBackToSession={() => setActiveView('roster')}
        />
      ) : (
        <>
          {/* 2. REVOLUTIONIZED CONTROL TOOLBAR (Unit Selector, Event Picker, + Set New Event Button) */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-none">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
              {/* Unit Dropdown */}
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#0B0F17] rounded-lg px-2.5 py-1.5 border border-neutral-200/80 dark:border-neutral-800/80 justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-sky-500 shrink-0" />
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                    disabled={!canViewAllUnits && accessibleUnits.length <= 1}
                    className="bg-transparent border-none text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    {accessibleUnits.map((unit) => (
                      <option key={unit.id} value={unit.id} className="dark:bg-[#111827]">
                        {language === 'ar' ? unit.name_ar : unit.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                {!canViewAllUnits && accessibleUnits.length <= 1 && (
                  <span className="text-[10px] text-amber-500 flex items-center gap-0.5 shrink-0">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Event Dropdown Selector */}
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#0B0F17] rounded-lg px-2.5 py-1.5 border border-neutral-200/80 dark:border-neutral-800/80 flex-1 sm:flex-initial min-w-[220px]">
                <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium shrink-0">
                  {language === 'ar' ? 'الفعالية:' : 'Event:'}
                </span>
                <select
                  value={selectedSessionId || ''}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  disabled={events.length === 0}
                  className="bg-transparent border-none text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-0 cursor-pointer w-full truncate"
                >
                  {events.length === 0 ? (
                    <option value="" disabled className="dark:bg-[#111827]">
                      {language === 'ar' ? 'لا توجد فعاليات مسجلة' : 'No events available'}
                    </option>
                  ) : (
                    events.map((evt) => (
                      <option key={evt.id} value={evt.id} className="dark:bg-[#111827]">
                        {evt.session_title} • {evt.session_date}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* "+ Set New Event" Button */}
              {canTakeAttendance && (
                <button
                  onClick={() => setIsNewEventModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100/80 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-300 dark:border-sky-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title={t('create_event')}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('create_event')}</span>
                </button>
              )}
            </div>

            {/* Actions: Batch Mark, Export Excel, Save Session */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
              {canTakeAttendance && activeEvent && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleMarkAllPresent}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title={t('mark_all_present')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('mark_all_present')}</span>
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title={language === 'ar' ? 'مسح الاختيارات' : 'Clear selection'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {can('attendance.export', selectedUnitId) && activeEvent && (
                <button
                  onClick={() => {
                    alert(
                      language === 'ar'
                        ? `تم تصدير كشف حضور فعالية "${activeEvent.session_title}" بنجاح إلى ملف إكسيل!`
                        : `Exported attendance roster for "${activeEvent.session_title}" to Excel successfully!`
                    );
                    logAction({
                      action_type: 'attendance_saved',
                      title_ar: `تصدير كشف الحضور: ${activeEvent.session_title}`,
                      title_en: `Exported Attendance: ${activeEvent.session_title}`,
                      description_ar: `قام ${currentUser?.full_name} بتصدير كشف حضور فعالية "${activeEvent.session_title}" (${activeEvent.session_date})`,
                      description_en: `${currentUser?.full_name} exported attendance roster for event "${activeEvent.session_title}"`,
                      unit_id: selectedUnitId,
                    });
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-neutral-100 hover:bg-neutral-200/70 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-200/80 dark:border-neutral-700/50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span className="hidden sm:inline">{language === 'ar' ? 'تصدير' : 'Export'}</span>
                </button>
              )}

              {canTakeAttendance && activeEvent ? (
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{t('save_event_attendance')}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Success Notification */}
          {saveNotification && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium animate-fadeIn">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{saveNotification}</span>
            </div>
          )}

          {/* 3. ACTIVE EVENT CARD HEADER (WHEN AN EVENT IS SELECTED) */}
          {activeEvent ? (
            <div className="bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-500/15 dark:via-sky-500/5 dark:to-transparent rounded-2xl p-4 sm:p-5 border border-sky-200/70 dark:border-sky-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-600 text-white uppercase tracking-wider">
                    {getEventTypeLabel(activeEvent.event_type)}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                    {activeEvent.session_title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    <span className="font-mono font-medium">{activeEvent.session_date}</span>
                  </div>

                  {activeEvent.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span dir="auto">{activeEvent.location}</span>
                    </div>
                  )}

                  {activeEvent.recorded_by_name && (
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <span>•</span>
                      <span>{language === 'ar' ? 'سجله القائد:' : 'Recorded by:'} {activeEvent.recorded_by_name}</span>
                    </div>
                  )}
                </div>

                {activeEvent.notes && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-0.5 italic" dir="auto">
                    {activeEvent.notes}
                  </p>
                )}
              </div>

              {/* Event Actions: Edit & Delete */}
              {canTakeAttendance && (
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={openEditModal}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#1E293B] hover:bg-neutral-100 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title={t('edit_event')}
                  >
                    <Pencil className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{t('edit_event')}</span>
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    disabled={isDeletingEvent}
                    className="p-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#1E293B] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                    title={t('delete_event')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* EMPTY STATE: NO EVENTS REGISTERED YET FOR THIS UNIT */
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 sm:p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-800 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center border border-sky-200/80 dark:border-sky-800 shadow-xs">
                <CalendarPlus className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {language === 'ar' ? 'لم يتم تحديد أي فعالية بعد لهذه الوحدة' : 'No Events Set Yet for this Unit'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {t('no_events_found')}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href={selectedUnitId ? `/events?unitId=${selectedUnitId}` : '/events'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors shadow-2xs border border-neutral-300 dark:border-neutral-700"
                >
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>{t('back_to_events')}</span>
                </Link>
                {canTakeAttendance && (
                  <button
                    onClick={() => setIsNewEventModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('set_event_now')}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. SLEEK STATS SUMMARY BAR (WHEN AN EVENT IS ACTIVE) */}
          {activeEvent && (
            <div className="bg-white dark:bg-[#111827] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 sm:gap-4 shadow-none">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 divide-x rtl:divide-x-reverse divide-neutral-200 dark:divide-neutral-800/80 text-xs">
                {/* Enrolled Total */}
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {language === 'ar' ? 'المقيدين بالوحدة' : 'Enrolled'}
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                    <bdi>{stats.total}</bdi>
                  </span>
                </div>

                {/* Present */}
                <div className="ps-3 sm:ps-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">{t('present_count')}</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    <bdi>{stats.present}</bdi>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)
                  </span>
                </div>

                {/* Absent */}
                <div className="ps-4 sm:ps-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">{t('absent_count')}</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    <bdi>{stats.absent}</bdi>
                  </span>
                </div>

                {/* Excused / Late */}
                <div className="ps-4 sm:ps-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {t('excused_count')} / {t('late_count')}
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                    <bdi>{stats.excused}</bdi>
                  </span>
                  <span className="text-xs font-mono text-neutral-400">+<bdi>{stats.late}</bdi></span>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="flex items-center gap-3 ms-auto">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{t('attendance_rate')}</span>
                <span className="text-base sm:text-lg font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                  <bdi>{stats.rate}%</bdi>
                </span>
                {stats.unselected > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60">
                    {stats.unselected} {language === 'ar' ? 'متبقي' : 'pending'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 5. ROSTER MEMBERS INSIDE THE ACTIVE EVENT */}
          {activeEvent && (
            <div className="space-y-4">
              {groupedScouts.map((group, gIdx) => (
                <div
                  key={gIdx}
                  className="bg-white dark:bg-[#111827] rounded-xl border border-neutral-200 dark:border-neutral-800/80 overflow-hidden shadow-none"
                >
                  {/* Patrol Header */}
                  <div className="px-4 py-2.5 bg-neutral-50 dark:bg-[#161F30] border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-500" />
                      <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100" dir="auto">
                        {group.patrolName}
                      </h3>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        ({group.members.length} {language === 'ar' ? 'كشاف' : 'scouts'})
                      </span>
                    </div>
                  </div>

                  {/* VIEW MODE 1: Table List View */}
                  {rosterViewMode === 'list' && (
                    <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/60">
                      {group.members.map((member) => {
                        const current = records[member.id];
                        const currentStatus = current?.status;

                        return (
                          <div
                            key={member.id}
                            className="h-auto sm:h-14 px-4 py-2.5 hover:bg-neutral-50/80 dark:hover:bg-[#1E293B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                          >
                            {/* Member Details */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-200 flex items-center justify-center text-xs font-bold shrink-0 border border-neutral-200/60 dark:border-neutral-700/50">
                                {member.full_name_ar?.charAt(0) || 'ك'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                                    <bdi>{language === 'ar' ? member.full_name_ar : (member.full_name_en || member.full_name_ar)}</bdi>
                                  </span>
                                  <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                                    <bdi>{member.member_code}</bdi>
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate" dir="auto">
                                  <bdi>{member.academic_year}</bdi> &bull; <bdi>{member.school_or_college || 'سان جورج'}</bdi>
                                </div>
                              </div>
                            </div>

                            {/* Unified Compact Segmented Radio-Group Control */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                              <div
                                role="radiogroup"
                                aria-label={`Attendance for ${member.full_name_ar}`}
                                className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex p-0.5 rounded-xl sm:rounded-lg bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200/90 dark:border-neutral-800 shrink-0"
                              >
                                {/* Present */}
                                <button
                                  type="button"
                                  role="radio"
                                  aria-checked={currentStatus === 'present'}
                                  onClick={() => handleStatusChange(member.id, 'present')}
                                  className={`px-1.5 sm:px-2.5 py-2 sm:py-1 text-xs rounded-lg sm:rounded-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                                    currentStatus === 'present'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shadow-xs font-semibold'
                                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
                                  }`}
                                  title={t('status_present')}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t('status_present')}</span>
                                </button>

                                {/* Absent */}
                                <button
                                  type="button"
                                  role="radio"
                                  aria-checked={currentStatus === 'absent'}
                                  onClick={() => handleStatusChange(member.id, 'absent')}
                                  className={`px-1.5 sm:px-2.5 py-2 sm:py-1 text-xs rounded-lg sm:rounded-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                                    currentStatus === 'absent'
                                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40 shadow-xs font-semibold'
                                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
                                  }`}
                                  title={t('status_absent')}
                                >
                                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t('status_absent')}</span>
                                </button>

                                {/* Excused */}
                                <button
                                  type="button"
                                  role="radio"
                                  aria-checked={currentStatus === 'excused'}
                                  onClick={() => handleStatusChange(member.id, 'excused')}
                                  className={`px-1.5 sm:px-2.5 py-2 sm:py-1 text-xs rounded-lg sm:rounded-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                                    currentStatus === 'excused'
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-xs font-semibold'
                                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
                                  }`}
                                  title={t('status_excused')}
                                >
                                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t('status_excused')}</span>
                                </button>

                                {/* Late */}
                                <button
                                  type="button"
                                  role="radio"
                                  aria-checked={currentStatus === 'late'}
                                  onClick={() => handleStatusChange(member.id, 'late')}
                                  className={`px-1.5 sm:px-2.5 py-2 sm:py-1 text-xs rounded-lg sm:rounded-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                                    currentStatus === 'late'
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs font-semibold'
                                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
                                  }`}
                                  title={t('status_late')}
                                >
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t('status_late')}</span>
                                </button>
                              </div>

                              {/* Excuse Reason Input */}
                              {currentStatus === 'excused' && (
                                <div className="w-full sm:w-56 animate-fadeIn">
                                  <input
                                    type="text"
                                    placeholder={language === 'ar' ? 'سبب الاعتذار...' : 'Excuse reason...'}
                                    value={current?.notes || ''}
                                    onChange={(e) => handleNotesChange(member.id, e.target.value)}
                                    autoFocus
                                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    dir="auto"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* VIEW MODE 2: Card Grid View */}
                  {rosterViewMode === 'grid' && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.members.map((member) => {
                        const current = records[member.id];
                        const currentStatus = current?.status;

                        return (
                          <div
                            key={member.id}
                            className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-200/80 dark:border-neutral-800/80 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                                <bdi>{language === 'ar' ? member.full_name_ar : (member.full_name_en || member.full_name_ar)}</bdi>
                              </div>
                              <span className="text-[11px] font-mono text-neutral-400">
                                <bdi>{member.member_code}</bdi>
                              </span>
                            </div>

                            {/* Segmented radio control */}
                            <div
                              role="radiogroup"
                              aria-label={`Attendance for ${member.full_name_ar}`}
                              className="inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200/90 dark:border-neutral-800 w-full justify-between"
                            >
                              <button
                                type="button"
                                role="radio"
                                aria-checked={currentStatus === 'present'}
                                onClick={() => handleStatusChange(member.id, 'present')}
                                className={`flex-1 py-1 text-xs rounded-md text-center transition-all cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shadow-xs font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                                }`}
                              >
                                {t('status_present')}
                              </button>
                              <button
                                type="button"
                                role="radio"
                                aria-checked={currentStatus === 'absent'}
                                onClick={() => handleStatusChange(member.id, 'absent')}
                                className={`flex-1 py-1 text-xs rounded-md text-center transition-all cursor-pointer ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40 shadow-xs font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                                }`}
                              >
                                {t('status_absent')}
                              </button>
                              <button
                                type="button"
                                role="radio"
                                aria-checked={currentStatus === 'excused'}
                                onClick={() => handleStatusChange(member.id, 'excused')}
                                className={`flex-1 py-1 text-xs rounded-md text-center transition-all cursor-pointer ${
                                  currentStatus === 'excused'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-xs font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                                }`}
                              >
                                {t('status_excused')}
                              </button>
                              <button
                                type="button"
                                role="radio"
                                aria-checked={currentStatus === 'late'}
                                onClick={() => handleStatusChange(member.id, 'late')}
                                className={`flex-1 py-1 text-xs rounded-md text-center transition-all cursor-pointer ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                                }`}
                              >
                                {t('status_late')}
                              </button>
                            </div>

                            {/* Dynamic excuse reason input */}
                            {currentStatus === 'excused' && (
                              <input
                                type="text"
                                placeholder={language === 'ar' ? 'سبب الاعتذار...' : 'Excuse reason...'}
                                value={current?.notes || ''}
                                onChange={(e) => handleNotesChange(member.id, e.target.value)}
                                autoFocus
                                className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                dir="auto"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CREATE / SET NEW EVENT */}
      {/* ========================================================================= */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#161F30]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {t('create_event')}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {language === 'ar'
                      ? `تحديد فعالية مع تاريخها لوحدة ${currentUnitObj?.name_ar || ''}`
                      : `Set event with date for unit ${currentUnitObj?.name_en || ''}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEvent} className="p-5 space-y-4">
              {/* Event Presets Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{language === 'ar' ? 'نماذج جاهزة سريعة:' : 'Quick Presets:'}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewEventTitle(language === 'ar' ? preset.ar : preset.en);
                        setNewEventType(preset.type);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200/70 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/50 transition-colors cursor-pointer"
                    >
                      {language === 'ar' ? preset.ar : preset.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: اجتماع الجمعة الأسبوعي' : 'e.g. Weekly Friday Meeting'}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              {/* Date & Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Event Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('event_date')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  />
                </div>

                {/* Event Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('event_type')}
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="meeting" className="dark:bg-[#111827]">{t('type_meeting')}</option>
                    <option value="camp" className="dark:bg-[#111827]">{t('type_camp')}</option>
                    <option value="trip" className="dark:bg-[#111827]">{t('type_trip')}</option>
                    <option value="service" className="dark:bg-[#111827]">{t('type_service')}</option>
                    <option value="competition" className="dark:bg-[#111827]">{t('type_competition')}</option>
                    <option value="celebration" className="dark:bg-[#111827]">{t('type_celebration')}</option>
                    <option value="other" className="dark:bg-[#111827]">{t('type_other')}</option>
                  </select>
                </div>
              </div>

              {/* Location (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_location')} <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                </label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: فناء الكنيسة، أرض المخيم...' : 'e.g. Church Court, Scout Ground...'}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_notes')} <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                </label>
                <textarea
                  rows={2}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'أي تفاصيل أو تعليمات خاصة بالفعالية...' : 'Special notes or instructions...'}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEvent}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isCreatingEvent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{language === 'ar' ? 'إنشاء الفعالية وبدء الحضور' : 'Create Event & Start Roll-Call'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: EDIT EVENT */}
      {/* ========================================================================= */}
      {isEditEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#161F30]/60">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {t('edit_event')}
                </h3>
              </div>
              <button
                onClick={() => setIsEditEventModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditEvent} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_name')}
                </label>
                <input
                  type="text"
                  required
                  value={editEventTitle}
                  onChange={(e) => setEditEventTitle(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('event_date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('event_type')}
                  </label>
                  <select
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="meeting" className="dark:bg-[#111827]">{t('type_meeting')}</option>
                    <option value="camp" className="dark:bg-[#111827]">{t('type_camp')}</option>
                    <option value="trip" className="dark:bg-[#111827]">{t('type_trip')}</option>
                    <option value="service" className="dark:bg-[#111827]">{t('type_service')}</option>
                    <option value="competition" className="dark:bg-[#111827]">{t('type_competition')}</option>
                    <option value="celebration" className="dark:bg-[#111827]">{t('type_celebration')}</option>
                    <option value="other" className="dark:bg-[#111827]">{t('type_other')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_location')}
                </label>
                <input
                  type="text"
                  value={editEventLocation}
                  onChange={(e) => setEditEventLocation(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_notes')}
                </label>
                <textarea
                  rows={2}
                  value={editEventNotes}
                  onChange={(e) => setEditEventNotes(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-500 mx-auto" />
        </div>
      }
    >
      <AttendancePageContent />
    </Suspense>
  );
}
