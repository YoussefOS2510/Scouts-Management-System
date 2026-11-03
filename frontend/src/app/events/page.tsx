'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS } from '../../lib/data';
import { AttendanceSession } from '../../lib/types';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Plus,
  ChevronRight,
  Folder,
  MapPin,
  Pencil,
  Trash2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  ShieldAlert,
  Tent,
  Compass,
  Trophy,
  Church,
  PartyPopper,
} from 'lucide-react';

const EVENT_PRESETS = [
  { ar: 'اجتماع كشفي أسبوعي', en: 'Weekly Scout Meeting', type: 'meeting' },
  { ar: 'مخيم تدريبي كشفي', en: 'Scout Training Camp', type: 'camp' },
  { ar: 'رحلة خلوية واستكشاف', en: 'Scout Hike & Exploration', type: 'trip' },
  { ar: 'يوم روحي وخدمة', en: 'Spiritual Day & Service', type: 'service' },
  { ar: 'مسابقة ودوري رياضي', en: 'Sports Tournament & Games', type: 'competition' },
  { ar: 'حفل قبول ووعد كشفي', en: 'Promise & Investiture Ceremony', type: 'celebration' },
];

function EventsPageContent() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentUser,
    currentRole,
    isSuperAdmin,
    can,
    accessibleUnits,
    isLoadingPermissions,
  } = useAuth();

  const canViewAllUnits = isSuperAdmin || currentRole?.name === 'group_leader';

  // Unit scoping: get from query param or accessible units
  const initialUnitIdParam = searchParams.get('unitId');
  const defaultUnit = initialUnitIdParam
    ? Number(initialUnitIdParam)
    : accessibleUnits.length > 0
    ? accessibleUnits[0].id
    : 5;

  const [selectedUnitId, setSelectedUnitId] = useState<number>(defaultUnit);
  const canManageEvents = isSuperAdmin || can('attendance.take', selectedUnitId);

  // Sync unit with accessibleUnits
  useEffect(() => {
    if (accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(accessibleUnits[0].id);
    }
  }, [accessibleUnits, selectedUnitId]);

  // Tab State: 'upcoming' or 'previous'
  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous'>('upcoming');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Events State
  const [events, setEvents] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal States
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState<boolean>(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<AttendanceSession | null>(null);

  // Form Fields for Create
  const [newEventTitle, setNewEventTitle] = useState<string>('اجتماع كشفي أسبوعي');
  const [newEventDate, setNewEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState<string>('meeting');
  const [newEventLocation, setNewEventLocation] = useState<string>('');
  const [newEventNotes, setNewEventNotes] = useState<string>('');
  const [directToAttendance, setDirectToAttendance] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields for Edit
  const [editEventTitle, setEditEventTitle] = useState<string>('');
  const [editEventDate, setEditEventDate] = useState<string>('');
  const [editEventType, setEditEventType] = useState<string>('meeting');
  const [editEventLocation, setEditEventLocation] = useState<string>('');
  const [editEventNotes, setEditEventNotes] = useState<string>('');

  // Load events for unit
  const fetchEvents = (unitId: number) => {
    setIsLoading(true);
    fetch(`/api/attendance?unitId=${unitId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.sessions)) {
          setEvents(data.sessions);
        } else {
          setEvents([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load events:', err);
        setEvents([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchEvents(selectedUnitId);
  }, [selectedUnitId]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter & Split Events into Upcoming and Previous
  const { upcomingEvents, previousEvents } = useMemo(() => {
    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          e.session_title.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.session_date.includes(q)
      );
    }

    // Type filter
    if (selectedTypeFilter !== 'all') {
      filtered = filtered.filter((e) => (e.event_type || 'meeting') === selectedTypeFilter);
    }

    // Upcoming: today or in the future, sorted soonest first
    const upcoming = filtered
      .filter((e) => e.session_date >= todayStr)
      .sort((a, b) => a.session_date.localeCompare(b.session_date));

    // Previous: before today, sorted most recent first
    const previous = filtered
      .filter((e) => e.session_date < todayStr)
      .sort((a, b) => b.session_date.localeCompare(a.session_date));

    return { upcomingEvents: upcoming, previousEvents: previous };
  }, [events, searchQuery, selectedTypeFilter, todayStr]);

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    setIsSubmitting(true);
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
        setIsNewEventModalOpen(false);
        const newSession = data.session;

        // Reset inputs
        setNewEventTitle('اجتماع كشفي أسبوعي');
        setNewEventDate(new Date().toISOString().split('T')[0]);
        setNewEventType('meeting');
        setNewEventLocation('');
        setNewEventNotes('');

        if (directToAttendance) {
          // Immediately navigate into the attendance page for this event
          router.push(`/attendance?sessionId=${newSession.id}&unitId=${selectedUnitId}`);
          return;
        }

        setEvents((prev) => [newSession, ...prev]);
        setNotification(
          language === 'ar'
            ? `تم إنشاء فعالية "${newSession.session_title}" بنجاح!`
            : `Event "${newSession.session_title}" created successfully!`
        );
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (err: any) {
      console.error('Error creating event:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Event
  const openEditModal = (evt: AttendanceSession) => {
    setEditingEvent(evt);
    setEditEventTitle(evt.session_title);
    setEditEventDate(evt.session_date);
    setEditEventType(evt.event_type || 'meeting');
    setEditEventLocation(evt.location || '');
    setEditEventNotes(evt.notes || '');
    setIsEditEventModalOpen(true);
  };

  // Handle Edit Event Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editEventTitle.trim()) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: editingEvent.id,
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
            evt.id === editingEvent.id
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
        setNotification(
          language === 'ar' ? 'تم تحديث بيانات الفعالية بنجاح!' : 'Event updated successfully!'
        );
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to update event');
      }
    } catch (err) {
      console.error('Error updating event:', err);
      alert('Failed to update event');
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (evt: AttendanceSession) => {
    const confirmMsg =
      language === 'ar'
        ? `هل أنت متأكد من حذف فعالية "${evt.session_title}"؟ سيتم حذف جميع سجلات حضورها المرتبطة بها.`
        : `Are you sure you want to delete event "${evt.session_title}"? All associated attendance records will be removed.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/attendance?sessionId=${evt.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== evt.id));
        setNotification(
          language === 'ar' ? 'تم حذف الفعالية بنجاح!' : 'Event deleted successfully!'
        );
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const currentUnitObj = INITIAL_UNITS.find((u) => u.id === selectedUnitId);

  // Helper for event type icon and badge styling
  const getEventTypeMeta = (type?: string) => {
    switch (type) {
      case 'camp':
        return {
          label: language === 'ar' ? 'مخيم تدريبي' : 'Camp',
          icon: Tent,
          color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'trip':
        return {
          label: language === 'ar' ? 'رحلة خلوية' : 'Trip',
          icon: Compass,
          color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
        };
      case 'competition':
        return {
          label: language === 'ar' ? 'مسابقة ودوري' : 'Competition',
          icon: Trophy,
          color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        };
      case 'service':
        return {
          label: language === 'ar' ? 'خدمة روحية' : 'Service',
          icon: Church,
          color: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        };
      case 'celebration':
        return {
          label: language === 'ar' ? 'حفل ووعد' : 'Ceremony',
          icon: PartyPopper,
          color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
        };
      default:
        return {
          label: language === 'ar' ? 'اجتماع كشفي' : 'Meeting',
          icon: Users,
          color: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
        };
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

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : previousEvents;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <Link href="/" className="hover:text-sky-500 transition-colors font-bold">
              SMSR
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
            <span className="text-neutral-900 dark:text-neutral-100 font-semibold">
              {t('events_page_title')}
            </span>
            {currentUnitObj && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-medium border border-sky-500/20">
                  {language === 'ar' ? currentUnitObj.name_ar : currentUnitObj.name_en}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {t('events_page_title')}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('events_page_desc')}
          </p>
        </div>

        {/* Unit Selector & Add Event Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {/* Unit Dropdown */}
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#0B0F17] rounded-xl px-3 py-2 border border-neutral-200/80 dark:border-neutral-800/80">
            <Folder className="w-4 h-4 text-sky-500 shrink-0" />
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(Number(e.target.value))}
              disabled={!canViewAllUnits && accessibleUnits.length <= 1}
              className="bg-transparent border-none text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-0 cursor-pointer"
            >
              {accessibleUnits.map((unit) => (
                <option key={unit.id} value={unit.id} className="dark:bg-[#111827]">
                  {language === 'ar' ? unit.name_ar : unit.name_en}
                </option>
              ))}
            </select>
            {!canViewAllUnits && accessibleUnits.length <= 1 && (
              <span className="text-amber-500">
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Add New Event Button */}
          {canManageEvents && (
            <button
              onClick={() => setIsNewEventModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('create_event')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. TAB CONTROLS & FILTER BAR */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-none">
        {/* Tabs: Upcoming vs Previous */}
        <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200/80 dark:border-neutral-800/80 self-start">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('tab_upcoming_events')}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'upcoming'
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {upcomingEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('previous')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'previous'
                ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t('tab_previous_events')}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'previous'
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {previousEvents.length}
            </span>
          </button>
        </div>

        {/* Search & Type Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#0B0F17] rounded-xl px-3 py-1.5 border border-neutral-200/80 dark:border-neutral-800/80 flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث عن فعالية أو مكان...' : 'Search event, location...'}
              className="bg-transparent border-none text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-0 w-full"
              dir="auto"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-[#0B0F17] rounded-xl px-2.5 py-1.5 border border-neutral-200/80 dark:border-neutral-800/80">
            <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all" className="dark:bg-[#111827]">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
              <option value="meeting" className="dark:bg-[#111827]">{t('type_meeting')}</option>
              <option value="camp" className="dark:bg-[#111827]">{t('type_camp')}</option>
              <option value="trip" className="dark:bg-[#111827]">{t('type_trip')}</option>
              <option value="service" className="dark:bg-[#111827]">{t('type_service')}</option>
              <option value="competition" className="dark:bg-[#111827]">{t('type_competition')}</option>
              <option value="celebration" className="dark:bg-[#111827]">{t('type_celebration')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. EVENT CARDS GRID */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-500 mx-auto" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {language === 'ar' ? 'جاري تحميل الفعاليات...' : 'Loading events directory...'}
          </p>
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-10 sm:p-16 text-center border border-dashed border-neutral-300 dark:border-neutral-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center border border-sky-200/80 dark:border-sky-800">
            <CalendarPlus className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {activeTab === 'upcoming'
                ? language === 'ar' ? 'لا توجد فعاليات قادمة مسجلة' : 'No Upcoming Events'
                : language === 'ar' ? 'لا توجد فعاليات سابقة مسجلة' : 'No Previous Events'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {activeTab === 'upcoming' ? t('no_upcoming_events') : t('no_previous_events')}
            </p>
          </div>
          {canManageEvents && activeTab === 'upcoming' && (
            <div className="pt-2">
              <button
                onClick={() => setIsNewEventModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('set_event_now')}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedEvents.map((evt) => {
            const typeMeta = getEventTypeMeta(evt.event_type);
            const TypeIcon = typeMeta.icon;
            const isToday = evt.session_date === todayStr;
            const hasAttendance = (evt.total_records || 0) > 0;

            return (
              <div
                key={evt.id}
                className={`bg-white dark:bg-[#111827] rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isToday
                    ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200/80 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Event Card Header */}
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${typeMeta.color}`}
                    >
                      <TypeIcon className="w-3.5 h-3.5" />
                      <span>{typeMeta.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-2xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          <span>{language === 'ar' ? 'اليوم' : 'Today'}</span>
                        </span>
                      )}

                      {/* Edit / Delete quick buttons */}
                      {canManageEvents && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(evt)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title={t('edit_event')}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={t('delete_event')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Date */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-2" dir="auto">
                      {evt.session_title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="font-medium">{evt.session_date}</span>
                    </div>
                  </div>

                  {/* Location & Notes */}
                  {(evt.location || evt.notes) && (
                    <div className="space-y-1 pt-1 text-xs text-neutral-600 dark:text-neutral-400">
                      {evt.location && (
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate" dir="auto">{evt.location}</span>
                        </div>
                      )}
                      {evt.notes && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 italic" dir="auto">
                          {evt.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Attendance Roll-Call Status Badge */}
                  <div className="pt-2">
                    {hasAttendance ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                        <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('attendance_taken')}</span>
                          </span>
                          <span className="font-mono text-[11px]">
                            {evt.total_records} {language === 'ar' ? 'مسجل' : 'marked'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                          <span className="text-emerald-600 font-bold">{evt.present_count || 0} حاضر</span>
                          <span>•</span>
                          <span className="text-rose-600 font-bold">{evt.absent_count || 0} غائب</span>
                          <span>•</span>
                          <span className="text-amber-600 font-bold">{evt.excused_count || 0} معتذر</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-[#1E293B]/40 border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('attendance_pending')}</span>
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {language === 'ar' ? 'جاهز للتسجيل' : 'Ready'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Action: Take Attendance */}
                <div className="p-3 bg-neutral-50/70 dark:bg-[#161F30]/60 border-t border-neutral-200/70 dark:border-neutral-800/70">
                  <Link
                    href={`/attendance?sessionId=${evt.id}&unitId=${evt.unit_id}`}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
                      hasAttendance
                        ? 'bg-neutral-800 hover:bg-neutral-900 text-white dark:bg-neutral-700 dark:hover:bg-neutral-600'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>{hasAttendance ? t('view_attendance') : t('take_attendance')}</span>
                    {language === 'ar' ? (
                      <ArrowLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CREATE NEW EVENT */}
      {/* ========================================================================= */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
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
                      ? `إضافة فعالية جديدة لوحدة ${currentUnitObj?.name_ar || ''}`
                      : `Add event for unit ${currentUnitObj?.name_en || ''}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: اجتماع الجمعة الأسبوعي' : 'e.g. Weekly Scout Meeting'}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              {/* Date & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_location')} <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                </label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: فناء الكنيسة، أرض المخيم...' : 'e.g. Church Court, Camp ground...'}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('event_notes')} <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                </label>
                <textarea
                  rows={2}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'ملاحظات أو تفاصيل إضافية...' : 'Additional notes or instructions...'}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              {/* Direct to Attendance Checkbox */}
              <label className="flex items-center gap-2 pt-1 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={directToAttendance}
                  onChange={(e) => setDirectToAttendance(e.target.checked)}
                  className="rounded border-neutral-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span>
                  {language === 'ar'
                    ? 'الانتقال المباشر لتسجيل الحضور فور إنشاء الفعالية'
                    : 'Go directly to roll-call roster after creating event'}
                </span>
              </label>

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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{language === 'ar' ? 'إنشاء الفعالية' : 'Create Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDIT EVENT */}
      {/* ========================================================================= */}
      {isEditEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#161F30]/60">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {t('edit_event')}
                </h3>
              </div>
              <button
                onClick={() => setIsEditEventModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
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

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-500 mx-auto" />
        </div>
      }
    >
      <EventsPageContent />
    </Suspense>
  );
}
