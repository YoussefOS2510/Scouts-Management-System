import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileApp } from '../context/MobileAppContext';
import { AttendanceStatus } from '../types';

export const AttendanceScreen: React.FC = () => {
  const {
    lang,
    theme,
    accessibleUnits,
    selectedUnitId,
    setSelectedUnitId,
    patrols,
    members,
    events,
    can,
    createEvent,
    deleteEvent,
    saveAttendance,
  } = useMobileApp();

  const isAr = lang === 'ar';

  const unitEvents = useMemo(
    () => events.filter((ev) => ev.unit_id === selectedUnitId),
    [events, selectedUnitId]
  );

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [draftRecords, setDraftRecords] = useState<Record<string, AttendanceStatus>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatrolId, setSelectedPatrolId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');

  // New Event Modal state
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newEventType, setNewEventType] = useState<'weekly_meeting' | 'camp' | 'service' | 'outdoors'>('weekly_meeting');
  const [newEventDate, setNewEventDate] = useState('2026-11-07');

  // Keep selectedEventId synced with unitEvents
  useEffect(() => {
    if (unitEvents.length > 0 && !unitEvents.some((e) => e.id === selectedEventId)) {
      setSelectedEventId(unitEvents[0].id);
    } else if (unitEvents.length === 0) {
      setSelectedEventId('');
    }
  }, [unitEvents, selectedEventId]);

  const currentEvent = useMemo(
    () => unitEvents.find((e) => e.id === selectedEventId) || null,
    [unitEvents, selectedEventId]
  );

  const unitMembers = useMemo(
    () => members.filter((m) => m.unit_id === selectedUnitId),
    [members, selectedUnitId]
  );

  const unitPatrols = useMemo(
    () => patrols.filter((p) => p.unit_id === selectedUnitId),
    [patrols, selectedUnitId]
  );

  // Sync draftRecords when currentEvent changes
  useEffect(() => {
    if (!currentEvent) {
      setDraftRecords({});
      setDraftNotes({});
      setHasUnsavedChanges(false);
      return;
    }
    const baseRecords: Record<string, AttendanceStatus> = {};
    unitMembers.forEach((m) => {
      baseRecords[m.id] = currentEvent.records?.[m.id] || 'present';
    });
    setDraftRecords(baseRecords);
    setDraftNotes(currentEvent.notes || {});
    setHasUnsavedChanges(false);
  }, [currentEvent, unitMembers]);

  const canRecord = can('attendance:record', selectedUnitId);
  const canCreateEvent = can('event:create', selectedUnitId);

  const handleSetStatus = (memberId: string, status: AttendanceStatus) => {
    if (!canRecord) return;
    setDraftRecords((prev) => ({ ...prev, [memberId]: status }));
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    if (!canRecord) return;
    const allPresent: Record<string, AttendanceStatus> = {};
    unitMembers.forEach((m) => {
      allPresent[m.id] = 'present';
    });
    setDraftRecords(allPresent);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!currentEvent) return;
    await saveAttendance(currentEvent.id, draftRecords, draftNotes);
    setHasUnsavedChanges(false);
  };

  const handleCreateNewEvent = async () => {
    if (!newTitleAr.trim()) return;
    const created = await createEvent({
      unit_id: selectedUnitId,
      title_ar: newTitleAr.trim(),
      title_en: newTitleEn.trim() || newTitleAr.trim(),
      date: newEventDate,
      event_type: newEventType,
    });
    setSelectedEventId(created.id);
    setNewTitleAr('');
    setNewTitleEn('');
    setShowNewEventModal(false);
  };

  // Counts
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    let late = 0;
    unitMembers.forEach((m) => {
      const st = draftRecords[m.id] || 'present';
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'excused') excused++;
      else if (st === 'late') late++;
    });
    return { present, absent, excused, late };
  }, [unitMembers, draftRecords]);

  const filteredMembers = useMemo(() => {
    return unitMembers.filter((m) => {
      if (selectedPatrolId !== 'all' && m.patrol_id !== selectedPatrolId) return false;
      const st = draftRecords[m.id] || 'present';
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.full_name_ar.includes(q) ||
          m.full_name_en.toLowerCase().includes(q) ||
          (m.scout_code && m.scout_code.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [unitMembers, selectedPatrolId, statusFilter, searchQuery, draftRecords]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Unit Selector Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitStrip}>
          {accessibleUnits.map((u) => {
            const active = u.id === selectedUnitId;
            return (
              <TouchableOpacity
                key={u.id}
                onPress={() => {
                  setSelectedUnitId(u.id);
                  setSelectedPatrolId('all');
                }}
                style={[
                  styles.unitPill,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: active ? '#FFFFFF' : theme.text,
                  }}
                >
                  {isAr ? u.name_ar : u.name_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. Event Selector & Create Event Card */}
        <View
          style={[
            styles.eventCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.eventCardHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {isAr ? 'دفتر التمام والغياب الميداني' : 'Field Attendance & Roll-Call'}
              </Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
                {isAr
                  ? 'اختر الاجتماع أو أنشئ فعالية جديدة لتسجيل الحضور'
                  : 'Select a meeting or create a new event'}
              </Text>
            </View>

            {canCreateEvent && (
              <TouchableOpacity
                onPress={() => setShowNewEventModal(true)}
                style={[styles.newEventBtn, { backgroundColor: theme.accent }]}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.newEventBtnText}>
                  {isAr ? 'اجتماع جديد' : 'New Event'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {unitEvents.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {isAr
                  ? 'لا توجد اجتماعات مسجلة لهذه الفرقة بعد. اضغط "اجتماع جديد" للبدء.'
                  : 'No meetings found for this unit. Tap "New Event" to start.'}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {unitEvents.map((ev) => {
                const selected = ev.id === selectedEventId;
                return (
                  <TouchableOpacity
                    key={ev.id}
                    onPress={() => setSelectedEventId(ev.id)}
                    style={[
                      styles.eventChip,
                      {
                        backgroundColor: selected ? theme.primarySoft : theme.bg,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: selected ? theme.primary : theme.text,
                      }}
                    >
                      {isAr ? ev.title_ar : ev.title_en}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                      📅 {ev.date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {currentEvent && (
          <>
            {/* 3. Live Status Counters (Tap to filter) */}
            <View style={styles.countersRow}>
              {(
                [
                  {
                    key: 'present',
                    labelAr: 'حاضر',
                    labelEn: 'Present',
                    count: counts.present,
                    color: theme.success,
                    bg: theme.successSoft,
                  },
                  {
                    key: 'absent',
                    labelAr: 'غائب',
                    labelEn: 'Absent',
                    count: counts.absent,
                    color: theme.danger,
                    bg: theme.dangerSoft,
                  },
                  {
                    key: 'excused',
                    labelAr: 'بعذر',
                    labelEn: 'Excused',
                    count: counts.excused,
                    color: theme.info,
                    bg: theme.infoSoft,
                  },
                  {
                    key: 'late',
                    labelAr: 'متأخر',
                    labelEn: 'Late',
                    count: counts.late,
                    color: theme.warning,
                    bg: theme.warningSoft,
                  },
                ] as const
              ).map((item) => {
                const active = statusFilter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() =>
                      setStatusFilter(statusFilter === item.key ? 'all' : item.key)
                    }
                    style={[
                      styles.counterBox,
                      {
                        backgroundColor: active ? item.bg : theme.surface,
                        borderColor: active ? item.color : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.counterNum, { color: item.color }]}>
                      {item.count}
                    </Text>
                    <Text style={[styles.counterLabel, { color: theme.textSecondary }]}>
                      {isAr ? item.labelAr : item.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Search, Patrol Filter & Quick Actions Bar */}
            <View style={styles.toolbarRow}>
              <View
                style={[
                  styles.searchWrap,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="search-outline" size={17} color={theme.textMuted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={isAr ? 'ابحث باسم الكشاف...' : 'Search scout...'}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </View>

              {canRecord && (
                <TouchableOpacity
                  onPress={handleMarkAllPresent}
                  style={[
                    styles.markAllBtn,
                    { backgroundColor: theme.primarySoft, borderColor: theme.primary },
                  ]}
                >
                  <Ionicons name="checkmark-done" size={16} color={theme.primary} />
                  <Text style={[styles.markAllText, { color: theme.primary }]}>
                    {isAr ? 'تحضير الكل' : 'All Present'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Patrol Filter Pills */}
            {unitPatrols.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedPatrolId('all')}
                  style={[
                    styles.patrolFilterChip,
                    {
                      backgroundColor:
                        selectedPatrolId === 'all' ? theme.primary : theme.surface,
                      borderColor:
                        selectedPatrolId === 'all' ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: selectedPatrolId === 'all' ? '#FFFFFF' : theme.textSecondary,
                    }}
                  >
                    {isAr ? 'كل الطلائع/السداسيات' : 'All Patrols'}
                  </Text>
                </TouchableOpacity>
                {unitPatrols.map((p) => {
                  const active = selectedPatrolId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedPatrolId(p.id)}
                      style={[
                        styles.patrolFilterChip,
                        {
                          backgroundColor: active ? theme.primary : theme.surface,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: active ? '#FFFFFF' : theme.textSecondary,
                        }}
                      >
                        {p.emblem_icon} {isAr ? p.name_ar : p.name_en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* 5. Member Roll-Call List */}
            {filteredMembers.map((member) => {
              const currentStatus = draftRecords[member.id] || 'present';
              const pat = unitPatrols.find((p) => p.id === member.patrol_id);
              const isRedFlag = member.consecutive_absences >= 3;

              return (
                <View
                  key={member.id}
                  style={[
                    styles.memberAttCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isRedFlag ? theme.danger : theme.border,
                    },
                  ]}
                >
                  <View style={styles.memberTopRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.memberName, { color: theme.text }]}>
                          {isAr ? member.full_name_ar : member.full_name_en}
                        </Text>
                        {isRedFlag && (
                          <View
                            style={[
                              styles.redFlagChip,
                              { backgroundColor: theme.dangerSoft },
                            ]}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '800', color: theme.danger }}>
                              ⚠️ {member.consecutive_absences} {isAr ? 'غياب' : 'Abs'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.memberSub, { color: theme.textSecondary }]}>
                        {member.scout_code || 'SMSR'} •{' '}
                        {pat
                          ? `${pat.emblem_icon || ''} ${isAr ? pat.name_ar : pat.name_en}`
                          : isAr
                          ? 'بدون طليعة'
                          : 'Unassigned'}
                      </Text>
                    </View>
                  </View>

                  {/* 4-State Tactile Radio Buttons */}
                  <View style={styles.statusBtnGroup}>
                    {(
                      [
                        {
                          st: 'present',
                          labelAr: 'حاضر',
                          labelEn: 'Present',
                          icon: 'checkmark-circle',
                          activeBg: theme.success,
                        },
                        {
                          st: 'absent',
                          labelAr: 'غائب',
                          labelEn: 'Absent',
                          icon: 'close-circle',
                          activeBg: theme.danger,
                        },
                        {
                          st: 'excused',
                          labelAr: 'عذر',
                          labelEn: 'Excused',
                          icon: 'document-text',
                          activeBg: theme.info,
                        },
                        {
                          st: 'late',
                          labelAr: 'متأخر',
                          labelEn: 'Late',
                          icon: 'time',
                          activeBg: theme.warning,
                        },
                      ] as const
                    ).map((opt) => {
                      const selected = currentStatus === opt.st;
                      return (
                        <TouchableOpacity
                          key={opt.st}
                          onPress={() => handleSetStatus(member.id, opt.st)}
                          style={[
                            styles.statusRadioBtn,
                            {
                              backgroundColor: selected ? opt.activeBg : theme.bg,
                              borderColor: selected ? opt.activeBg : theme.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={15}
                            color={selected ? '#FFFFFF' : theme.textSecondary}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '800',
                              color: selected ? '#FFFFFF' : theme.textSecondary,
                            }}
                          >
                            {isAr ? opt.labelAr : opt.labelEn}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Optional Note Field for Absent or Excused */}
                  {(currentStatus === 'absent' || currentStatus === 'excused') && (
                    <TextInput
                      value={draftNotes[member.id] || ''}
                      onChangeText={(txt) => {
                        setDraftNotes((prev) => ({ ...prev, [member.id]: txt }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder={
                        isAr
                          ? 'سبب الغياب أو العذر (اختياري)...'
                          : 'Reason for absence or excuse...'
                      }
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.noteInput,
                        {
                          backgroundColor: theme.bg,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}

            {/* Save Button Bar */}
            {canRecord && (
              <View style={styles.saveFooter}>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[
                    styles.savePrimaryBtn,
                    {
                      backgroundColor: hasUnsavedChanges ? theme.accent : theme.primary,
                    },
                  ]}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.savePrimaryText}>
                    {hasUnsavedChanges
                      ? isAr
                        ? 'حفظ تعديلات التمام في قاعدة البيانات'
                        : 'Save Attendance Changes to DB'
                      : isAr
                      ? 'تأكيد وحفظ سجل الحضور'
                      : 'Confirm & Save Roll-Call'}
                  </Text>
                </TouchableOpacity>

                {unitEvents.length > 1 && (
                  <TouchableOpacity
                    onPress={() => deleteEvent(currentEvent.id)}
                    style={[
                      styles.deleteEventBtn,
                      { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal: Create New Meeting / Event */}
      <Modal visible={showNewEventModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isAr ? 'إنشاء اجتماع أو فعالية كشفية جديدة' : 'Create New Scout Meeting / Event'}
            </Text>

            {/* Quick Template Presets */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {isAr ? 'قوالب سريعة:' : 'Quick Presets:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {[
                {
                  ar: 'الاجتماع الأسبوعي للفرقة',
                  en: 'Weekly Unit Meeting',
                  type: 'weekly_meeting' as const,
                },
                {
                  ar: 'تجمع القداس والخدمة الكشفية',
                  en: 'Liturgy & Scout Service',
                  type: 'service' as const,
                },
                {
                  ar: 'يوم خلاوي وتدريب ميداني',
                  en: 'Outdoor Field Training Day',
                  type: 'outdoors' as const,
                },
                {
                  ar: 'معسكر الفرقة الكشفي',
                  en: 'Unit Training Camp',
                  type: 'camp' as const,
                },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.en}
                  onPress={() => {
                    setNewTitleAr(preset.ar);
                    setNewTitleEn(preset.en);
                    setNewEventType(preset.type);
                  }}
                  style={[
                    styles.presetChip,
                    { backgroundColor: theme.primarySoft, borderColor: theme.primary },
                  ]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                    + {isAr ? preset.ar : preset.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {isAr ? 'عنوان الفعالية (عربي)' : 'Event Title (Arabic)'}
            </Text>
            <TextInput
              value={newTitleAr}
              onChangeText={setNewTitleAr}
              placeholder={isAr ? 'مثال: الاجتماع الأسبوعي - العقد والربطات' : 'Event title in Arabic'}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.modalInput,
                { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {isAr ? 'عنوان الفعالية (إنجليزي)' : 'Event Title (English)'}
            </Text>
            <TextInput
              value={newTitleEn}
              onChangeText={setNewTitleEn}
              placeholder="e.g. Weekly Meeting - Knots & Lashings"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.modalInput,
                { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {isAr ? 'التاريخ (YYYY-MM-DD)' : 'Date (YYYY-MM-DD)'}
            </Text>
            <TextInput
              value={newEventDate}
              onChangeText={setNewEventDate}
              placeholder="2026-11-07"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.modalInput,
                { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
              ]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowNewEventModal(false)}
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateNewEvent}
                style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                  {isAr ? 'إنشاء وفتح الدفتر' : 'Create & Open'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 36,
  },
  unitStrip: {
    marginBottom: 12,
  },
  unitPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  eventCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  newEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newEventBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  eventChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  countersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  counterBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  counterNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '800',
  },
  patrolFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  memberAttCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '800',
  },
  memberSub: {
    fontSize: 11,
    marginTop: 2,
  },
  redFlagChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  statusRadioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteInput: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
  },
  saveFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  savePrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  savePrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  deleteEventBtn: {
    width: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    marginRight: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
});

