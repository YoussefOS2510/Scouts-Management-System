'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_UNITS } from '@/lib/data';
import { getSubdivisionTerms } from '@/lib/scout-terms';
import { AttendanceSession, Member, Patrol } from '@/lib/types';
import {
  Folder,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Users,
  UserPlus,
  Clock,
  MapPin,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Phone,
  Church,
  GraduationCap,
  Eye,
  Trash2,
  Pencil,
  X,
  Check,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Layers,
  LayoutGrid,
  List,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const EVENT_PRESETS = [
  { ar: 'اجتماع كشفي أسبوعي', en: 'Weekly Scout Meeting', type: 'meeting' },
  { ar: 'مخيم تدريبي كشفي', en: 'Scout Training Camp', type: 'camp' },
  { ar: 'رحلة خلوية واستكشاف', en: 'Scout Hike & Exploration', type: 'trip' },
  { ar: 'يوم روحي وخدمة', en: 'Spiritual Day & Service', type: 'service' },
  { ar: 'مسابقة ودوري رياضي', en: 'Sports Tournament & Games', type: 'competition' },
  { ar: 'حفل قبول ووعد كشفي', en: 'Promise & Investiture Ceremony', type: 'celebration' },
];

function UnitHubContent() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Unit ID from route param /units/[id] or fallback query param
  const rawId = params?.id || searchParams?.get('unitId') || searchParams?.get('unit');
  const unitId = Number(rawId) || 1;

  const {
    currentUser,
    currentRole,
    isSuperAdmin,
    can,
    accessibleUnits,
    members,
    patrols,
    addMember,
    deleteMember,
    addPatrol,
    updatePatrol,
    deletePatrol,
    assignScoutPatrol,
  } = useAuth();

  const canViewAllUnits = isSuperAdmin || currentRole?.name === 'group_leader';
  const canManageEvents = isSuperAdmin || can('attendance.take', unitId);
  const canManageMembers = isSuperAdmin || can('members.create_edit', unitId);
  const canTakeAttendance = isSuperAdmin || can('attendance.take', unitId);

  // Unit metadata
  const unitObj = useMemo(() => {
    return INITIAL_UNITS.find((u) => u.id === unitId) || INITIAL_UNITS[0];
  }, [unitId]);

  const subdivisionTerms = useMemo(() => {
    return getSubdivisionTerms(unitObj.id);
  }, [unitObj.id]);

  // Stage colors
  const getStageColor = (code: string) => {
    if (code.startsWith('cubs') || code.startsWith('brownies') || code.includes('ashbal') || code.includes('zahrat')) {
      return {
        color: '#B06000',
        badgeBg: 'bg-[#FEF7EC] dark:bg-amber-950/40 text-[#7A3F00] dark:text-amber-300 border-[#FFCD85]/50',
        stageName: language === 'ar' ? (code.includes('ashbal') || code.startsWith('cubs') ? 'أشبال' : 'زهرات') : (code.includes('ashbal') || code.startsWith('cubs') ? 'Cubs' : 'Brownies'),
      };
    }
    if (code.startsWith('scouts') || code.startsWith('guides') || code.includes('kashafa') || code.includes('morshdat')) {
      return {
        color: '#146C2E',
        badgeBg: 'bg-[#E8F0EC] dark:bg-emerald-950/40 text-[#0A5326] dark:text-emerald-300 border-[#A8E5B6]/50',
        stageName: language === 'ar' ? (code.includes('kashafa') || code.startsWith('scouts') ? 'كشافة' : 'مرشدات') : (code.includes('kashafa') || code.startsWith('scouts') ? 'Scouts' : 'Guides'),
      };
    }
    if (code.includes('motakadem') || code.includes('ra2edat') || code.includes('gawala') || code.includes('advanced') || code.includes('senior') || code.includes('rovers')) {
      return {
        color: '#0B57D0',
        badgeBg: 'bg-[#D3E3FD] dark:bg-sky-950/40 text-[#043372] dark:text-sky-300 border-[#A8C7FA]/50',
        stageName: language === 'ar' ? (code.includes('gawala') || code.includes('rovers') ? 'جوالة' : (code.includes('ra2edat') || code.includes('senior') ? 'رائدات' : 'متقدم')) : 'Rovers',
      };
    }
    return {
      color: '#444746',
      badgeBg: 'bg-[#F0F4F9] dark:bg-stone-800 text-[#1F1F1F] dark:text-stone-300 border-[#E0E3E7]',
      stageName: language === 'ar' ? 'قادة' : 'Leaders',
    };
  };

  const stageStyle = getStageColor(unitObj.code);

  // Active Main Tab: 'events' | 'roster' | 'patrols'
  const [activeTab, setActiveTab] = useState<'events' | 'roster' | 'patrols'>('events');

  // Sub Tab inside Events: 'upcoming' | 'previous'
  const [eventsSubTab, setEventsSubTab] = useState<'upcoming' | 'previous'>('upcoming');

  // Events State
  const [events, setEvents] = useState<AttendanceSession[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch events for this unit
  const fetchEvents = (id: number) => {
    setIsLoadingEvents(true);
    fetch(`/api/attendance?unitId=${id}`)
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
      .finally(() => setIsLoadingEvents(false));
  };

  useEffect(() => {
    fetchEvents(unitId);
  }, [unitId]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Split events
  const { upcomingEvents, previousEvents, nextEvent } = useMemo(() => {
    const upcoming = events
      .filter((e) => e.session_date >= todayStr)
      .sort((a, b) => a.session_date.localeCompare(b.session_date));

    const previous = events
      .filter((e) => e.session_date < todayStr)
      .sort((a, b) => b.session_date.localeCompare(a.session_date));

    const next = upcoming.length > 0 ? upcoming[0] : null;

    return { upcomingEvents: upcoming, previousEvents: previous, nextEvent: next };
  }, [events, todayStr]);

  // Members in this unit
  const unitMembers = useMemo(() => {
    return members.filter((m) => m.unit_id === unitId);
  }, [members, unitId]);

  // Patrols in this unit
  const unitPatrols = useMemo(() => {
    return patrols.filter((p) => p.unit_id === unitId);
  }, [patrols, unitId]);

  // Unassigned scouts in this unit
  const unassignedMembers = useMemo(() => {
    return unitMembers.filter((m) => !m.patrol_id);
  }, [unitMembers]);

  // Member Search & Patrol Filter
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedPatrolFilter, setSelectedPatrolFilter] = useState<number | 'all'>('all');
  const [rosterViewMode, setRosterViewMode] = useState<'table' | 'cards'>('table');

  const filteredMembers = useMemo(() => {
    let result = [...unitMembers];
    if (selectedPatrolFilter !== 'all') {
      result = result.filter((m) => m.patrol_id === selectedPatrolFilter);
    }
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.full_name_ar.toLowerCase().includes(q) ||
          (m.full_name_en && m.full_name_en.toLowerCase().includes(q)) ||
          (m.member_code && m.member_code.toLowerCase().includes(q)) ||
          (m.member_phone && m.member_phone.includes(q)) ||
          (m.father_phone && m.father_phone.includes(q))
      );
    }
    return result;
  }, [unitMembers, selectedPatrolFilter, memberSearch]);

  // Modals for Events & Members
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<Member | null>(null);

  // Patrol / Six Management State & Modals
  const [isAddPatrolOpen, setIsAddPatrolOpen] = useState(false);
  const [newPatrolNameAr, setNewPatrolNameAr] = useState('');
  const [newPatrolNameEn, setNewPatrolNameEn] = useState('');
  const [isSubmittingPatrol, setIsSubmittingPatrol] = useState(false);

  const [editingPatrol, setEditingPatrol] = useState<Patrol | null>(null);
  const [editPatrolNameAr, setEditPatrolNameAr] = useState('');
  const [editPatrolNameEn, setEditPatrolNameEn] = useState('');
  const [isUpdatingPatrol, setIsUpdatingPatrol] = useState(false);

  const [patrolToDelete, setPatrolToDelete] = useState<Patrol | null>(null);
  const [isDeletingPatrol, setIsDeletingPatrol] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('اجتماع كشفي أسبوعي');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState('meeting');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [directToAttendance, setDirectToAttendance] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // New Member Form State
  const [mNameAr, setMNameAr] = useState('');
  const [mNameEn, setMNameEn] = useState('');
  const [mDob, setMDob] = useState('2014-01-01');
  const [mPatrolId, setMPatrolId] = useState<string>('none');
  const [mFatherPhone, setMFatherPhone] = useState('');
  const [mMotherPhone, setMMotherPhone] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mGrade, setMGrade] = useState('');
  const [mSchool, setMSchool] = useState('');
  const [mConfession, setMConfession] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [mPin, setMPin] = useState('1234');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  // Handle Create Event Submit
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    setIsSubmittingEvent(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_event',
          unitId: unitId,
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
          router.push(`/attendance?sessionId=${newSession.id}&unitId=${unitId}`);
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
      setIsSubmittingEvent(false);
    }
  };

  // Handle Add Member Submit
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mNameAr.trim()) return;

    setIsSubmittingMember(true);
    const codePrefix = unitObj ? unitObj.code.split('_')[0].toUpperCase() : 'SCOUT';
    const randomNum = Math.floor(100 + Math.random() * 900);
    const autoCode = `${codePrefix}-2026-${randomNum}`;

    try {
      const created = addMember({
        full_name_ar: mNameAr.trim(),
        full_name_en: mNameEn.trim() || undefined,
        member_code: autoCode,
        pin: mPin.trim() || '1234',
        unit_id: unitId,
        patrol_id: mPatrolId === 'none' ? null : Number(mPatrolId),
        date_of_birth: mDob,
        father_phone: mFatherPhone.trim(),
        mother_phone: mMotherPhone.trim() || undefined,
        member_phone: mPhone.trim() || undefined,
        address_ar: mAddress.trim() || 'القاهرة، مصر',
        academic_year: mGrade.trim(),
        school_or_college: mSchool.trim() || undefined,
        father_of_confession: mConfession.trim() || undefined,
        notes: mNotes.trim() || undefined,
        is_active: true,
      });

      setIsAddMemberModalOpen(false);
      setMNameAr('');
      setMNameEn('');
      setMFatherPhone('');
      setMMotherPhone('');
      setMPhone('');
      setMAddress('');
      setMNotes('');
      setMConfession('');

      setNotification(
        language === 'ar'
          ? `تم تسجيل الكشاف (${created.full_name_ar}) بكود [${created.member_code}] بنجاح!`
          : `Scout member (${created.full_name_ar}) registered with code [${created.member_code}]!`
      );
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Error registering member:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // Handle Add Patrol Submit
  const handleAddPatrolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatrolNameAr.trim()) return;

    setIsSubmittingPatrol(true);
    try {
      const created = await addPatrol(unitId, newPatrolNameAr.trim(), newPatrolNameEn.trim() || undefined);
      if (created) {
        setIsAddPatrolOpen(false);
        setNewPatrolNameAr('');
        setNewPatrolNameEn('');
        setNotification(
          language === 'ar'
            ? `تمت إضافة ${subdivisionTerms.singularAr} "${created.name_ar}" بنجاح!`
            : `Added "${created.name_ar}" successfully!`
        );
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert('Error adding: ' + err.message);
    } finally {
      setIsSubmittingPatrol(false);
    }
  };

  // Handle Update Patrol Submit
  const handleUpdatePatrolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatrol || !editPatrolNameAr.trim()) return;

    setIsUpdatingPatrol(true);
    try {
      const success = await updatePatrol(editingPatrol.id, editPatrolNameAr.trim(), editPatrolNameEn.trim() || undefined);
      if (success) {
        setEditingPatrol(null);
        setNotification(
          language === 'ar'
            ? `تم تحديث اسم ${subdivisionTerms.singularAr} بنجاح!`
            : `Updated successfully!`
        );
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert('Error updating: ' + err.message);
    } finally {
      setIsUpdatingPatrol(false);
    }
  };

  // Handle Confirm Delete Patrol
  const handleConfirmDeletePatrol = async () => {
    if (!patrolToDelete) return;

    setIsDeletingPatrol(true);
    try {
      const success = await deletePatrol(patrolToDelete.id);
      if (success) {
        const deletedName = patrolToDelete.name_ar;
        setPatrolToDelete(null);
        setNotification(
          language === 'ar'
            ? `تم حذف ${subdivisionTerms.singularAr} "${deletedName}" ونقل الكشافين إلى غير المعينين.`
            : `Deleted "${deletedName}" successfully.`
        );
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    } finally {
      setIsDeletingPatrol(false);
    }
  };

  // Handle Quick Reassign Scout Patrol
  const handleAssignScout = (memberId: string, newPatrolId: number | null) => {
    const success = assignScoutPatrol(memberId, newPatrolId);
    if (success) {
      const scout = unitMembers.find((m) => m.id === memberId);
      const targetPatrol = unitPatrols.find((p) => p.id === newPatrolId);
      setNotification(
        language === 'ar'
          ? `تم تعيين الكشاف (${scout?.full_name_ar || ''}) إلى: ${targetPatrol ? targetPatrol.name_ar : 'بدون تعيين'}`
          : `Scout reassigned successfully`
      );
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800/60">
        {/* Breadcrumb Path & Unit Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/" className="hover:text-sky-500 transition-colors font-bold">
              SMSR
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
            <Link href="/" className="hover:text-sky-500 transition-colors">
              {language === 'ar' ? 'دليل الوحدات' : 'Units'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
            <span className="text-neutral-900 dark:text-neutral-100 font-semibold" dir="auto">
              {language === 'ar' ? unitObj.name_ar : unitObj.name_en}
            </span>
          </div>

          {/* Unit Quick Switcher Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-[#111827] rounded-xl px-2.5 py-1.5 border border-neutral-200/80 dark:border-neutral-800/80">
              <Folder className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <select
                value={unitId}
                onChange={(e) => router.push(`/units/${e.target.value}`)}
                className="bg-transparent border-none text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-0 cursor-pointer"
              >
                {accessibleUnits.map((u) => (
                  <option key={u.id} value={u.id} className="dark:bg-[#111827]">
                    {language === 'ar' ? u.name_ar : u.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Unit Identity Card & Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: `${stageStyle.color}15`, color: stageStyle.color }}
            >
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100" dir="auto">
                  {language === 'ar' ? unitObj.name_ar : unitObj.name_en}
                </h1>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${stageStyle.badgeBg}`}>
                  {stageStyle.stageName}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-400 font-mono">
                  {unitObj.code}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2" dir="auto">
                <span>{unitObj.target_grade}</span>
                <span>&bull;</span>
                <span>{unitObj.gender === 'boys' ? (language === 'ar' ? 'بنين' : 'Boys') : (language === 'ar' ? 'بنات' : 'Girls')}</span>
                <span>&bull;</span>
                <span>
                  {unitMembers.length} {language === 'ar' ? 'كشاف مسجل' : 'registered scouts'}
                </span>
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canManageEvents && (
              <button
                onClick={() => setIsNewEventModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة فعالية جديدة' : 'Set New Event'}</span>
              </button>
            )}

            {canManageMembers && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة كشاف جديد' : 'Add New Member'}</span>
              </button>
            )}

            <Link
              href={`/attendance?unitId=${unitId}`}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-neutral-100 hover:bg-neutral-200/70 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors border border-neutral-200/80 dark:border-neutral-700/50"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ar' ? 'كشف الحضور' : 'Take Attendance'}</span>
            </Link>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium">{language === 'ar' ? 'أعضاء الوحدة' : 'Scouts'}</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {unitMembers.length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            {language === 'ar' ? 'كشاف نشط مسجل' : 'Active roster'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium">
              {language === 'ar' ? subdivisionTerms.pluralAr : subdivisionTerms.pluralEn}
            </span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {unitPatrols.length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            {language === 'ar' ? `تشكيلات ${subdivisionTerms.pluralAr}` : 'Formations'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium">{language === 'ar' ? 'الفعاليات القادمة' : 'Upcoming'}</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {upcomingEvents.length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            {language === 'ar' ? 'فعالية مجدولة' : 'Scheduled events'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium">{language === 'ar' ? 'سجل الفعاليات' : 'History'}</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {previousEvents.length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            {language === 'ar' ? 'فعالية سابقة منفذة' : 'Completed sessions'}
          </div>
        </div>
      </div>

      {/* 3. CURRENT / NEXT EVENT CALLOUT BANNER */}
      {nextEvent && (
        <div className="bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border border-sky-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300">
                  {language === 'ar' ? 'الفعالية الحالية / القادمة' : 'Active / Current Event'}
                </span>
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  {nextEvent.session_date}
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1" dir="auto">
                {nextEvent.session_title}
              </h3>
              {nextEvent.location && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  <span>{nextEvent.location}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {canTakeAttendance && (
              <Link
                href={`/attendance?sessionId=${nextEvent.id}&unitId=${unitId}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'تسجيل ورصد الحضور الآن' : 'Take Attendance Now'}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4. MAIN NAVIGATION TABS */}
      <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tab 1: Events */}
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{language === 'ar' ? 'الفعاليات وسجل النشاط' : 'Events & Schedule'}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-400">
              {events.length}
            </span>
          </button>

          {/* Tab 2: Unit Roster */}
          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{language === 'ar' ? 'كشف أعضاء الوحدة' : 'Unit Roster'}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-400">
              {unitMembers.length}
            </span>
          </button>

          {/* Tab 3: Patrols / Formations */}
          <button
            onClick={() => setActiveTab('patrols')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'patrols'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {language === 'ar'
                ? `تشكيلات ${subdivisionTerms.pluralAr}`
                : subdivisionTerms.pluralEn}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-400">
              {unitPatrols.length}
            </span>
          </button>
        </div>
      </div>

      {/* 5. TAB CONTENT */}

      {/* TAB 1: EVENTS CONTENT */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Sub Tab Switcher: Upcoming vs Previous */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80">
              <button
                onClick={() => setEventsSubTab('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  eventsSubTab === 'upcoming'
                    ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'الفعاليات القادمة والحالية' : 'Upcoming & Current'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600">
                  {upcomingEvents.length}
                </span>
              </button>

              <button
                onClick={() => setEventsSubTab('previous')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  eventsSubTab === 'previous'
                    ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'الفعاليات السابقة والأرشيف' : 'Previous Events'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600">
                  {previousEvents.length}
                </span>
              </button>
            </div>

            {canManageEvents && (
              <button
                onClick={() => setIsNewEventModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إضافة فعالية جديدة' : 'Add Event'}</span>
              </button>
            )}
          </div>

          {/* Sub Tab 1: Upcoming Events List */}
          {eventsSubTab === 'upcoming' && (
            <div className="space-y-3">
              {isLoadingEvents ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  {language === 'ar' ? 'جاري تحميل الفعاليات...' : 'Loading events...'}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="p-10 text-center bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-[#1E293B] flex items-center justify-center mx-auto text-neutral-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {language === 'ar' ? 'لا توجد فعاليات قادمة مجدولة' : 'No upcoming events scheduled'}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    {language === 'ar'
                      ? 'قم بإضافة اجتماع أو مخيم كشفي جديد لبدء رصد الحضور والتنظيم'
                      : 'Create a new meeting or camp to start taking attendance'}
                  </p>
                  {canManageEvents && (
                    <button
                      onClick={() => setIsNewEventModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{language === 'ar' ? 'إنشاء فعالية الآن' : 'Create Event Now'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcomingEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                            <CalendarCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                              {evt.session_title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              <span className="font-mono">{evt.session_date}</span>
                              {evt.location && (
                                <>
                                  <span>&bull;</span>
                                  <span className="truncate flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-neutral-400" />
                                    {evt.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50 shrink-0">
                          {evt.event_type || 'meeting'}
                        </span>
                      </div>

                      {evt.notes && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 bg-neutral-50 dark:bg-[#161F30] p-2 rounded-lg" dir="auto">
                          {evt.notes}
                        </p>
                      )}

                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {evt.present_count ?? 0} {language === 'ar' ? 'مسجل حضور' : 'present'}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/attendance?sessionId=${evt.id}&unitId=${unitId}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'رصد الحضور' : 'Take Attendance'}</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub Tab 2: Previous Events List */}
          {eventsSubTab === 'previous' && (
            <div className="space-y-3">
              {previousEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 bg-white dark:bg-[#111827] rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {language === 'ar' ? 'لا توجد فعاليات سابقة مسجلة' : 'No previous events recorded'}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800/80 overflow-hidden divide-y divide-neutral-200/80 dark:divide-neutral-800/60">
                  {previousEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 sm:p-4 hover:bg-neutral-50/70 dark:hover:bg-[#161F30]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1E293B] text-neutral-500 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                            {evt.session_title}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2">
                            <span className="font-mono">{evt.session_date}</span>
                            {evt.location && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate">{evt.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                            {evt.present_count ?? 0} {language === 'ar' ? 'حاضر' : 'pres'}
                          </span>
                          <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                            {evt.absent_count ?? 0} {language === 'ar' ? 'غائب' : 'abs'}
                          </span>
                        </div>

                        <Link
                          href={`/attendance?sessionId=${evt.id}&unitId=${unitId}`}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1E293B] dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-200/80 dark:border-neutral-700/50"
                        >
                          {language === 'ar' ? 'مراجعة الكشف' : 'Review'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNIT ROSTER CONTENT */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Roster Controls: Search, Patrol filter, Add Member */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={language === 'ar' ? 'بحث باسم الكشاف، الكود، الهاتف...' : 'Search scout, code, phone...'}
                className="w-full bg-white dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl ps-9 pe-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                dir="auto"
              />
            </div>

            {/* Filter by Patrol / Six & Add Member */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={selectedPatrolFilter}
                onChange={(e) => setSelectedPatrolFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-white dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80 text-xs font-medium rounded-xl px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">
                  {language === 'ar' ? `كل ${subdivisionTerms.pluralAr}` : `All ${subdivisionTerms.pluralEn}`}
                </option>
                {unitPatrols.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'ar' ? p.name_ar : p.name_en}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80">
                <button
                  onClick={() => setRosterViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    rosterViewMode === 'table'
                      ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                  }`}
                  title={language === 'ar' ? 'عرض جدول' : 'Table View'}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRosterViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    rosterViewMode === 'cards'
                      ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                  }`}
                  title={language === 'ar' ? 'عرض بطاقات' : 'Cards View'}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {canManageMembers && (
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إضافة كشاف' : 'Add Scout'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Table View */}
          {rosterViewMode === 'table' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800/80 overflow-x-auto shadow-none">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/75 dark:bg-[#161F30]/60 text-neutral-500 dark:text-neutral-400 font-semibold text-[11px]">
                    <th className="py-2.5 px-3 text-start">#</th>
                    <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'اسم الكشاف' : 'Scout Name'}</th>
                    <th className="py-2.5 px-3 text-start">
                      {language === 'ar' ? subdivisionTerms.singularAr : subdivisionTerms.singularEn}
                    </th>
                    <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الصف الدراسي' : 'Grade'}</th>
                    <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'هاتف ولي الأمر' : 'Parent Phone'}</th>
                    <th className="py-2.5 px-3 text-end">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800/60">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">
                        {language === 'ar' ? 'لا يوجد كشافون مطابقون للبحث' : 'No scouts match your criteria'}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m, idx) => {
                      const patrol = unitPatrols.find((p) => p.id === m.patrol_id);
                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-neutral-50/80 dark:hover:bg-[#161F30]/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedMemberDetails(m)}
                        >
                          <td className="py-2.5 px-3 font-mono text-neutral-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100" dir="auto">
                              {language === 'ar' ? m.full_name_ar : (m.full_name_en || m.full_name_ar)}
                            </div>
                            <div className="font-mono text-[10px] text-neutral-400">
                              {m.member_code}
                            </div>
                          </td>
                          <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                            {canManageMembers ? (
                              <select
                                value={m.patrol_id ?? 'none'}
                                onChange={(e) => {
                                  const val = e.target.value === 'none' ? null : Number(e.target.value);
                                  handleAssignScout(m.id, val);
                                }}
                                className="text-[11px] font-medium bg-neutral-100 dark:bg-[#1E293B] border border-neutral-200/80 dark:border-neutral-700/60 rounded-lg px-2 py-1 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                              >
                                {unitPatrols.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {language === 'ar' ? p.name_ar : p.name_en}
                                  </option>
                                ))}
                                <option value="none">{language === 'ar' ? 'بدون تعيين' : 'Unassigned'}</option>
                              </select>
                            ) : patrol ? (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-300 font-medium text-[11px] border border-neutral-200/60 dark:border-neutral-700/50">
                                {language === 'ar' ? patrol.name_ar : patrol.name_en}
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300">
                            {m.academic_year || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-300">
                            {m.father_phone || m.mother_phone || m.member_phone || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedMemberDetails(m)}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-[#1E293B] text-sky-600 dark:text-sky-400 transition-colors"
                              title={language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Cards View */}
          {rosterViewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMembers.map((m) => {
                const patrol = unitPatrols.find((p) => p.id === m.patrol_id);
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMemberDetails(m)}
                    className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                          {language === 'ar' ? m.full_name_ar : (m.full_name_en || m.full_name_ar)}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                          {m.member_code}
                        </div>
                      </div>
                      {patrol && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-300 shrink-0">
                          {language === 'ar' ? patrol.name_ar : patrol.name_en}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1 text-[11px]">
                      {m.father_phone && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{m.father_phone}</span>
                        </div>
                      )}
                      {m.academic_year && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3 text-neutral-400" />
                          <span>{m.academic_year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PATROLS / FORMATIONS CONTENT */}
      {activeTab === 'patrols' && (
        <div className="space-y-4">
          {/* Header with Title and Add Patrol Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>
                  {language === 'ar'
                    ? `إدارة وتعديل ${subdivisionTerms.pluralAr} وتوزيع الأعضاء`
                    : `Manage ${subdivisionTerms.pluralEn} & Formations`}
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {language === 'ar'
                  ? `إضافة وتعديل وحذف ${subdivisionTerms.pluralAr} وإعادة توزيع الكشافين مباشرة`
                  : `Add, rename, delete ${subdivisionTerms.pluralEn} and assign scouts`}
              </p>
            </div>

            {canManageMembers && (
              <button
                type="button"
                onClick={() => {
                  setNewPatrolNameAr('');
                  setNewPatrolNameEn('');
                  setIsAddPatrolOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? subdivisionTerms.addNewAr : subdivisionTerms.addNewEn}</span>
              </button>
            )}
          </div>

          {/* Unassigned Scouts Card (if any) */}
          {unassignedMembers.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {language === 'ar'
                      ? `كشافون غير معينين في أي ${subdivisionTerms.singularAr} (${unassignedMembers.length})`
                      : `Unassigned Scouts (${unassignedMembers.length})`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {unassignedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 bg-white dark:bg-[#111827] rounded-xl border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                        {language === 'ar' ? m.full_name_ar : (m.full_name_en || m.full_name_ar)}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400">{m.member_code}</div>
                    </div>

                    {canManageMembers && (
                      <select
                        value="none"
                        onChange={(e) => {
                          if (e.target.value !== 'none') {
                            handleAssignScout(m.id, Number(e.target.value));
                          }
                        }}
                        className="text-[11px] font-medium bg-neutral-100 dark:bg-[#1E293B] border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 text-neutral-800 dark:text-neutral-200 cursor-pointer shrink-0"
                      >
                        <option value="none">{language === 'ar' ? 'تعيين إلى...' : 'Assign to...'}</option>
                        {unitPatrols.map((p) => (
                          <option key={p.id} value={p.id}>
                            {language === 'ar' ? p.name_ar : p.name_en}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patrol Cards Grid with full Edit/Delete controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {unitPatrols.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#1E293B] flex items-center justify-center mx-auto text-neutral-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {language === 'ar' ? `لا توجد ${subdivisionTerms.pluralAr} منشأة بعد` : 'No formations created yet'}
                </div>
                {canManageMembers && (
                  <button
                    onClick={() => {
                      setNewPatrolNameAr('');
                      setNewPatrolNameEn('');
                      setIsAddPatrolOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? subdivisionTerms.addNewAr : subdivisionTerms.addNewEn}</span>
                  </button>
                )}
              </div>
            ) : (
              unitPatrols.map((patrol) => {
                const membersInPatrol = unitMembers.filter((m) => m.patrol_id === patrol.id);
                return (
                  <div
                    key={patrol.id}
                    className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800/80 space-y-3 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      {/* Header with Name, Badge and Action Buttons */}
                      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60 pb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {(patrol.order_index ?? 0) + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                              {language === 'ar' ? patrol.name_ar : (patrol.name_en || patrol.name_ar)}
                            </h4>
                            {patrol.name_en && (
                              <p className="text-[10px] text-neutral-400 font-mono truncate">{patrol.name_en}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-400">
                            {membersInPatrol.length} {language === 'ar' ? 'كشاف' : 'scouts'}
                          </span>

                          {canManageMembers && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPatrol(patrol);
                                  setEditPatrolNameAr(patrol.name_ar);
                                  setEditPatrolNameEn(patrol.name_en || '');
                                }}
                                title={language === 'ar' ? subdivisionTerms.editTitleAr : subdivisionTerms.editTitleEn}
                                className="p-1 rounded-lg text-neutral-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPatrolToDelete(patrol)}
                                title={language === 'ar' ? subdivisionTerms.deleteTitleAr : subdivisionTerms.deleteTitleEn}
                                className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Scouts List inside Patrol Card */}
                      <div className="space-y-1.5 max-h-52 overflow-y-auto mt-2.5 pe-1 no-scrollbar">
                        {membersInPatrol.length === 0 ? (
                          <div className="py-6 text-center text-xs text-neutral-400">
                            {language === 'ar' ? 'لا يوجد كشافون معينون بعد' : 'No scouts assigned yet'}
                          </div>
                        ) : (
                          membersInPatrol.map((m) => (
                            <div
                              key={m.id}
                              className="p-2 rounded-xl bg-neutral-50 dark:bg-[#161F30]/60 hover:bg-neutral-100 dark:hover:bg-[#161F30] flex items-center justify-between text-xs transition-colors gap-2"
                            >
                              <div
                                className="min-w-0 flex-1 cursor-pointer"
                                onClick={() => setSelectedMemberDetails(m)}
                              >
                                <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate" dir="auto">
                                  {language === 'ar' ? m.full_name_ar : (m.full_name_en || m.full_name_ar)}
                                </div>
                                <div className="text-[10px] font-mono text-neutral-400">{m.member_code}</div>
                              </div>

                              {canManageMembers && (
                                <select
                                  value={m.patrol_id ?? 'none'}
                                  onChange={(e) => {
                                    const val = e.target.value === 'none' ? null : Number(e.target.value);
                                    handleAssignScout(m.id, val);
                                  }}
                                  className="text-[10px] font-medium bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-700 rounded-md px-1.5 py-0.5 text-neutral-700 dark:text-neutral-300 cursor-pointer shrink-0"
                                  title={language === 'ar' ? 'نقل الكشاف' : 'Move Scout'}
                                >
                                  {unitPatrols.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {language === 'ar' ? p.name_ar : p.name_en}
                                    </option>
                                  ))}
                                  <option value="none">{language === 'ar' ? 'إلغاء التعيين' : 'Unassign'}</option>
                                </select>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 6. CREATE EVENT MODAL */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#161F30]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {language === 'ar' ? 'إضافة فعالية جديدة' : 'Create New Event'}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {language === 'ar'
                      ? `إضافة فعالية لوحدة ${unitObj.name_ar}`
                      : `Add event for unit ${unitObj.name_en}`}
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
                  {language === 'ar' ? 'اسم الفعالية' : 'Event Title'} <span className="text-rose-500">*</span>
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
                    {language === 'ar' ? 'تاريخ الفعالية' : 'Date'} <span className="text-rose-500">*</span>
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
                    {language === 'ar' ? 'نوع الفعالية' : 'Type'}
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="meeting" className="dark:bg-[#111827]">
                      {language === 'ar' ? 'اجتماع كشفي' : 'Meeting'}
                    </option>
                    <option value="camp" className="dark:bg-[#111827]">
                      {language === 'ar' ? 'مخيم تدريبي' : 'Camp'}
                    </option>
                    <option value="trip" className="dark:bg-[#111827]">
                      {language === 'ar' ? 'رحلة واستكشاف' : 'Trip'}
                    </option>
                    <option value="service" className="dark:bg-[#111827]">
                      {language === 'ar' ? 'يوم روحي وخدمة' : 'Service Day'}
                    </option>
                    <option value="competition" className="dark:bg-[#111827]">
                      {language === 'ar' ? 'مسابقة ودوري' : 'Competition'}
                    </option>
                    <option value="celebration" className="dark:bg-[#111827]">
                      {language === 'ar' ? 'حفل ووعد' : 'Celebration'}
                    </option>
                    <option value="other" className="dark:bg-[#111827]">
                      {language === 'ar' ? 'أخرى' : 'Other'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {language === 'ar' ? 'مكان الفعالية' : 'Location'}{' '}
                  <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
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
                  {language === 'ar' ? 'ملاحظات الفعالية' : 'Notes'}{' '}
                  <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                </label>
                <textarea
                  rows={2}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'توجيهات أو تجهيزات خاصة بالفعالية...' : 'Special instructions or gear required...'}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="auto"
                />
              </div>

              {/* Direct to Attendance Checkbox */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-200/60 dark:border-neutral-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={directToAttendance}
                  onChange={(e) => setDirectToAttendance(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-neutral-300 dark:border-neutral-700"
                />
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  {language === 'ar'
                    ? 'الانتقال مباشرة لرصد الحضور بعد الحفظ'
                    : 'Navigate directly to attendance roster after creation'}
                </span>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isSubmittingEvent
                      ? language === 'ar' ? 'جاري الحفظ...' : 'Saving...'
                      : language === 'ar' ? 'حفظ الفعالية' : 'Save Event'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. ADD MEMBER MODAL */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#161F30]/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {language === 'ar' ? 'إضافة كشاف جديد' : 'Register New Scout'}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {language === 'ar' ? `تسجيل كشاف بوحدة ${unitObj.name_ar}` : `Adding to ${unitObj.name_en}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              {/* Arabic Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {language === 'ar' ? 'الاسم بالكامل (بالعربية)' : 'Full Name (Arabic)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mNameAr}
                  onChange={(e) => setMNameAr(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: مينا ريمون حليم' : 'e.g. Mina Raymond Halim'}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  dir="rtl"
                />
              </div>

              {/* English Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {language === 'ar' ? 'الاسم بالإنجليزية' : 'Full Name (English)'}{' '}
                  <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                </label>
                <input
                  type="text"
                  value={mNameEn}
                  onChange={(e) => setMNameEn(e.target.value)}
                  placeholder="e.g. Mina Raymond Halim"
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  dir="ltr"
                />
              </div>

              {/* Patrol & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {language === 'ar' ? subdivisionTerms.singularAr : subdivisionTerms.singularEn}
                  </label>
                  <select
                    value={mPatrolId}
                    onChange={(e) => setMPatrolId(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="none">
                      {language === 'ar' ? 'بدون تعيين حالياً' : 'Unassigned'}
                    </option>
                    {unitPatrols.map((p) => (
                      <option key={p.id} value={p.id}>
                        {language === 'ar' ? p.name_ar : p.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={mDob}
                    onChange={(e) => setMDob(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {language === 'ar' ? 'هاتف ولي الأمر (الأب)' : 'Father Phone'}
                  </label>
                  <input
                    type="tel"
                    value={mFatherPhone}
                    onChange={(e) => setMFatherPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {language === 'ar' ? 'هاتف الكشاف' : 'Scout Phone'}
                  </label>
                  <input
                    type="tel"
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Grade & School */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {language === 'ar' ? 'الصف الدراسي' : 'Grade / Academic Year'}
                  </label>
                  <input
                    type="text"
                    value={mGrade}
                    onChange={(e) => setMGrade(e.target.value)}
                    placeholder={unitObj.target_grade || 'الصف الخامس الابتدائي'}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    dir="auto"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {language === 'ar' ? 'أب الاعتراف' : 'Father of Confession'}
                  </label>
                  <input
                    type="text"
                    value={mConfession}
                    onChange={(e) => setMConfession(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: أبونا ميخائيل' : 'e.g. Fr. Michael'}
                    className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    dir="auto"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMember}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isSubmittingMember
                      ? language === 'ar' ? 'جاري التسجيل...' : 'Registering...'
                      : language === 'ar' ? 'تسجيل الكشاف' : 'Register Scout'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MEMBER DETAILS MODAL */}
      {selectedMemberDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#161F30]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100" dir="auto">
                    {language === 'ar' ? selectedMemberDetails.full_name_ar : (selectedMemberDetails.full_name_en || selectedMemberDetails.full_name_ar)}
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-400">
                    {selectedMemberDetails.member_code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberDetails(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-neutral-50 dark:bg-[#161F30] rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="text-[10px] text-neutral-400">
                    {language === 'ar' ? subdivisionTerms.singularAr : subdivisionTerms.singularEn}
                  </div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                    {unitPatrols.find((p) => p.id === selectedMemberDetails.patrol_id)?.name_ar || '-'}
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-50 dark:bg-[#161F30] rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="text-[10px] text-neutral-400">
                    {language === 'ar' ? 'الصف الدراسي' : 'Grade'}
                  </div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                    {selectedMemberDetails.academic_year || '-'}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {selectedMemberDetails.father_phone && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-[#161F30]">
                    <span className="text-neutral-500">{language === 'ar' ? 'هاتف الأب:' : 'Father Phone:'}</span>
                    <a
                      href={`tel:${selectedMemberDetails.father_phone}`}
                      className="font-mono font-semibold text-sky-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedMemberDetails.father_phone}
                    </a>
                  </div>
                )}

                {selectedMemberDetails.mother_phone && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-[#161F30]">
                    <span className="text-neutral-500">{language === 'ar' ? 'هاتف الأم:' : 'Mother Phone:'}</span>
                    <a
                      href={`tel:${selectedMemberDetails.mother_phone}`}
                      className="font-mono font-semibold text-sky-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedMemberDetails.mother_phone}
                    </a>
                  </div>
                )}

                {selectedMemberDetails.father_of_confession && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-[#161F30]">
                    <span className="text-neutral-500">{language === 'ar' ? 'أب الاعتراف:' : 'Confession Father:'}</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {selectedMemberDetails.father_of_confession}
                    </span>
                  </div>
                )}

                {selectedMemberDetails.notes && (
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#161F30] space-y-1">
                    <span className="text-neutral-500 block text-[11px]">{language === 'ar' ? 'ملاحظات:' : 'Notes:'}</span>
                    <p className="text-neutral-800 dark:text-neutral-200" dir="auto">
                      {selectedMemberDetails.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. ADD PATROL MODAL */}
      {isAddPatrolOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#161F30]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {language === 'ar' ? subdivisionTerms.addNewAr : subdivisionTerms.addNewEn}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {language === 'ar' ? `إضافة تشكيل لوحدة ${unitObj.name_ar}` : `Adding to ${unitObj.name_en}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPatrolOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPatrolSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {language === 'ar' ? `اسم الـ${subdivisionTerms.singularAr} (بالعربية)` : 'Name (Arabic)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPatrolNameAr}
                  onChange={(e) => setNewPatrolNameAr(e.target.value)}
                  placeholder={subdivisionTerms.placeholderAr}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  dir="rtl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {language === 'ar' ? `اسم الـ${subdivisionTerms.singularAr} (بالإنجليزية)` : 'Name (English)'}{' '}
                  <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                </label>
                <input
                  type="text"
                  value={newPatrolNameEn}
                  onChange={(e) => setNewPatrolNameEn(e.target.value)}
                  placeholder={subdivisionTerms.placeholderEn}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddPatrolOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPatrol}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isSubmittingPatrol
                      ? language === 'ar' ? 'جاري الإضافة...' : 'Adding...'
                      : language === 'ar' ? 'إضافة التشكيل' : 'Add Patrol'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. EDIT PATROL MODAL */}
      {editingPatrol && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#161F30]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {language === 'ar' ? subdivisionTerms.editTitleAr : subdivisionTerms.editTitleEn}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {language === 'ar' ? `تعديل اسم ${editingPatrol.name_ar}` : `Edit ${editingPatrol.name_ar}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPatrol(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePatrolSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {language === 'ar' ? 'الاسم بالكامل (بالعربية)' : 'Name (Arabic)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPatrolNameAr}
                  onChange={(e) => setEditPatrolNameAr(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="rtl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}{' '}
                  <span className="text-neutral-400 text-[10px]">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                </label>
                <input
                  type="text"
                  value={editPatrolNameEn}
                  onChange={(e) => setEditPatrolNameEn(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingPatrol(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPatrol}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isUpdatingPatrol
                      ? language === 'ar' ? 'جاري الحفظ...' : 'Saving...'
                      : language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. DELETE PATROL CONFIRMATION MODAL */}
      {patrolToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                {language === 'ar'
                  ? `حذف ${subdivisionTerms.singularAr} "${patrolToDelete.name_ar}"`
                  : `Delete "${patrolToDelete.name_ar}"`}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {language === 'ar'
                  ? `هل أنت متأكد من حذف هذا التشكيل؟ سيتم نقل كافة الكشافين التابعين له إلى قائمة "غير المعينين" دون حذف أي كشاف من الوحدة.`
                  : `Are you sure you want to delete this formation? All assigned scouts will become unassigned.`}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPatrolToDelete(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePatrol}
                  disabled={isDeletingPatrol}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isDeletingPatrol
                      ? language === 'ar' ? 'جاري الحذف...' : 'Deleting...'
                      : language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnitHubPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-neutral-400">
          Loading unit hub...
        </div>
      }
    >
      <UnitHubContent />
    </Suspense>
  );
}
