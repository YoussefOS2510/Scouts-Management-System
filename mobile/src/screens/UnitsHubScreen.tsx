import React, { useState, useMemo } from 'react';
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
import { getStageVisuals, getSubdivisionTerms } from '../theme/scoutTheme';
import { UnitStage } from '../types';

export const UnitsHubScreen: React.FC = () => {
  const {
    lang,
    theme,
    accessibleUnits,
    patrols,
    members,
    events,
    selectedUnitId,
    setSelectedUnitId,
    setActiveTab,
    can,
    addPatrol,
    deletePatrol,
    assignScoutPatrol,
  } = useMobileApp();

  const isAr = lang === 'ar';
  const [stageFilter, setStageFilter] = useState<UnitStage | 'all'>('all');
  const [openedUnitId, setOpenedUnitId] = useState<string | null>(null);
  const [unitSubTab, setUnitSubTab] = useState<'patrols' | 'events' | 'roster'>('patrols');

  // New Patrol Modal state
  const [showNewPatrolModal, setShowNewPatrolModal] = useState(false);
  const [newPatrolNameAr, setNewPatrolNameAr] = useState('');
  const [newPatrolNameEn, setNewPatrolNameEn] = useState('');
  const [newPatrolEmblem, setNewPatrolEmblem] = useState('🦅');

  // Assign Scout to Patrol Modal state
  const [assigningMemberId, setAssigningMemberId] = useState<string | null>(null);

  const filteredUnits = useMemo(() => {
    if (stageFilter === 'all') return accessibleUnits;
    return accessibleUnits.filter((u) => u.stage === stageFilter);
  }, [accessibleUnits, stageFilter]);

  const openedUnit = useMemo(
    () => accessibleUnits.find((u) => u.id === openedUnitId) || null,
    [accessibleUnits, openedUnitId]
  );

  // Global KPI stats
  const totalScouts = useMemo(
    () => members.filter((m) => accessibleUnits.some((u) => u.id === m.unit_id)).length,
    [members, accessibleUnits]
  );
  const totalPatrols = useMemo(
    () => patrols.filter((p) => accessibleUnits.some((u) => u.id === p.unit_id)).length,
    [patrols, accessibleUnits]
  );
  const redFlagCount = useMemo(
    () => members.filter((m) => m.consecutive_absences >= 3).length,
    [members]
  );

  const handleCreatePatrol = async () => {
    if (!openedUnit || !newPatrolNameAr.trim()) return;
    const terms = getSubdivisionTerms(openedUnit.stage, openedUnit.gender);
    await addPatrol({
      unit_id: openedUnit.id,
      name_ar: newPatrolNameAr.trim(),
      name_en: newPatrolNameEn.trim() || newPatrolNameAr.trim(),
      subdivision_type: terms.subdivisionType,
      emblem_icon: newPatrolEmblem,
    });
    setNewPatrolNameAr('');
    setNewPatrolNameEn('');
    setShowNewPatrolModal(false);
  };

  // ============================================================================
  // RENDER UNIT DETAIL VIEW
  // ============================================================================
  if (openedUnit) {
    const visuals = getStageVisuals(openedUnit.stage);
    const terms = getSubdivisionTerms(openedUnit.stage, openedUnit.gender);
    const unitPatrols = patrols.filter((p) => p.unit_id === openedUnit.id);
    const unitMembers = members.filter((m) => m.unit_id === openedUnit.id);
    const unassignedMembers = unitMembers.filter((m) => !m.patrol_id);
    const unitEvents = events.filter((e) => e.unit_id === openedUnit.id);
    const canManagePatrols = can('unit:manage_patrols', openedUnit.id);

    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back & Unit Header */}
          <TouchableOpacity
            onPress={() => setOpenedUnitId(null)}
            style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="arrow-back" size={18} color={theme.primary} />
            <Text style={[styles.backBtnText, { color: theme.primary }]}>
              {isAr ? 'العودة لكل الفرق الكشفية' : 'Back to All Units'}
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.unitDetailBanner,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.unitHeaderTop}>
              <View style={[styles.stageIconBox, { backgroundColor: visuals.bgTint }]}>
                <Text style={{ fontSize: 26 }}>{visuals.emblem}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <View style={[styles.stageBadge, { backgroundColor: visuals.bgTint }]}>
                    <Text style={[styles.stageBadgeText, { color: visuals.accentHex }]}>
                      {isAr ? visuals.labelAr : visuals.labelEn}
                    </Text>
                  </View>
                  <Text style={[styles.ageRangeText, { color: theme.textSecondary }]}>
                    {openedUnit.age_range} {isAr ? 'سنة' : 'yrs'}
                  </Text>
                </View>
                <Text style={[styles.unitDetailTitle, { color: theme.text }]}>
                  {isAr ? openedUnit.name_ar : openedUnit.name_en}
                </Text>
                <Text style={[styles.unitDetailSub, { color: theme.textSecondary }]}>
                  {unitMembers.length} {isAr ? 'كشاف مقيد' : 'Scouts'} • {unitPatrols.length}{' '}
                  {isAr ? terms.groupPluralAr : terms.groupPluralEn}
                </Text>
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.unitActionRow}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedUnitId(openedUnit.id);
                  setActiveTab('attendance');
                }}
                style={[styles.actionBtnPrimary, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="checkbox-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnPrimaryText}>
                  {isAr ? 'تسجيل الحضور والتمام' : 'Take Roll-Call'}
                </Text>
              </TouchableOpacity>

              {canManagePatrols && (
                <TouchableOpacity
                  onPress={() => setShowNewPatrolModal(true)}
                  style={[
                    styles.actionBtnSecondary,
                    { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                  ]}
                >
                  <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
                  <Text style={[styles.actionBtnSecondaryText, { color: theme.accent }]}>
                    {isAr ? `إضافة ${terms.groupAr}` : `New ${terms.groupEn}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sub-navigation Tabs */}
          <View
            style={[
              styles.subTabBar,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              onPress={() => setUnitSubTab('patrols')}
              style={[
                styles.subTabItem,
                unitSubTab === 'patrols' && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.subTabText,
                  { color: unitSubTab === 'patrols' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {isAr ? terms.groupPluralAr : terms.groupPluralEn} ({unitPatrols.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUnitSubTab('events')}
              style={[
                styles.subTabItem,
                unitSubTab === 'events' && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.subTabText,
                  { color: unitSubTab === 'events' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {isAr ? 'الاجتماعات' : 'Events'} ({unitEvents.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUnitSubTab('roster')}
              style={[
                styles.subTabItem,
                unitSubTab === 'roster' && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.subTabText,
                  { color: unitSubTab === 'roster' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {isAr ? 'الأفراد' : 'Roster'} ({unitMembers.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* SUB-TAB 1: PATROLS / SIXES / CREWS */}
          {unitSubTab === 'patrols' && (
            <View>
              {/* Unassigned Scouts Alert Box */}
              {unassignedMembers.length > 0 && (
                <View
                  style={[
                    styles.unassignedCard,
                    { backgroundColor: theme.warningSoft, borderColor: theme.accent },
                  ]}
                >
                  <View style={styles.unassignedHeader}>
                    <Ionicons name="people-circle-outline" size={20} color={theme.accent} />
                    <Text style={[styles.unassignedTitle, { color: theme.accent }]}>
                      {isAr
                        ? `كشافون غير مسكنين في ${terms.groupPluralAr} (${unassignedMembers.length})`
                        : `Unassigned Scouts (${unassignedMembers.length})`}
                    </Text>
                  </View>
                  {unassignedMembers.map((m) => (
                    <View
                      key={m.id}
                      style={[
                        styles.memberMiniRow,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.memberMiniName, { color: theme.text }]}>
                        {isAr ? m.full_name_ar : m.full_name_en}
                      </Text>
                      {canManagePatrols && (
                        <TouchableOpacity
                          onPress={() => setAssigningMemberId(m.id)}
                          style={[styles.assignSmallBtn, { backgroundColor: theme.primary }]}
                        >
                          <Text style={styles.assignSmallBtnText}>
                            {isAr ? `تسكين في ${terms.groupAr}` : 'Assign'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Patrol Cards */}
              {unitPatrols.map((patrol) => {
                const pMembers = unitMembers.filter((m) => m.patrol_id === patrol.id);
                const leaderMember = pMembers.find((m) => m.patrol_role === 'leader');
                return (
                  <View
                    key={patrol.id}
                    style={[
                      styles.patrolCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.patrolHeader}>
                      <View style={[styles.patrolEmblem, { backgroundColor: theme.primarySoft }]}>
                        <Text style={{ fontSize: 20 }}>{patrol.emblem_icon || '⚜️'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.patrolName, { color: theme.text }]}>
                          {isAr ? patrol.name_ar : patrol.name_en}
                        </Text>
                        <Text style={[styles.patrolMeta, { color: theme.textSecondary }]}>
                          {pMembers.length} {isAr ? 'أفراد' : 'members'} •{' '}
                          {leaderMember
                            ? `${isAr ? terms.leaderAr : terms.leaderEn}: ${
                                isAr ? leaderMember.full_name_ar : leaderMember.full_name_en
                              }`
                            : isAr
                            ? `لم يتم تعيين ${terms.leaderAr}`
                            : `No ${terms.leaderEn} assigned`}
                        </Text>
                      </View>
                      {canManagePatrols && (
                        <TouchableOpacity
                          onPress={() => deletePatrol(patrol.id)}
                          style={{ padding: 6 }}
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.danger} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Members inside this Patrol */}
                    {pMembers.length === 0 ? (
                      <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
                        {isAr ? 'لا يوجد أفراد مسكنون بعد' : 'No members assigned yet'}
                      </Text>
                    ) : (
                      pMembers.map((pm) => {
                        const isLeader = pm.patrol_role === 'leader';
                        const isAssistant = pm.patrol_role === 'assistant';
                        return (
                          <View
                            key={pm.id}
                            style={[
                              styles.patrolMemberRow,
                              { borderTopColor: theme.border },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.patrolMemberName, { color: theme.text }]}>
                                {isAr ? pm.full_name_ar : pm.full_name_en}
                              </Text>
                              {(isLeader || isAssistant) && (
                                <View
                                  style={[
                                    styles.rolePill,
                                    {
                                      backgroundColor: isLeader
                                        ? theme.accentSoft
                                        : theme.primarySoft,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: '800',
                                      color: isLeader ? theme.accent : theme.primary,
                                    }}
                                  >
                                    {isLeader
                                      ? isAr
                                        ? `⭐ ${terms.leaderAr}`
                                        : `⭐ ${terms.leaderEn}`
                                      : isAr
                                      ? terms.assistantAr
                                      : terms.assistantEn}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {canManagePatrols && (
                              <View style={styles.patrolMemberActions}>
                                <TouchableOpacity
                                  onPress={() =>
                                    assignScoutPatrol(
                                      pm.id,
                                      patrol.id,
                                      isLeader ? 'member' : 'leader'
                                    )
                                  }
                                  style={[
                                    styles.miniRoleBtn,
                                    {
                                      backgroundColor: isLeader
                                        ? theme.accent
                                        : theme.surfaceAlt,
                                    },
                                  ]}
                                >
                                  <Ionicons
                                    name="star"
                                    size={13}
                                    color={isLeader ? '#FFFFFF' : theme.textSecondary}
                                  />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => setAssigningMemberId(pm.id)}
                                  style={[
                                    styles.miniRoleBtn,
                                    { backgroundColor: theme.surfaceAlt },
                                  ]}
                                >
                                  <Ionicons
                                    name="swap-horizontal"
                                    size={14}
                                    color={theme.textSecondary}
                                  />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* SUB-TAB 2: UNIT EVENTS */}
          {unitSubTab === 'events' && (
            <View>
              {unitEvents.map((ev) => {
                const statuses = Object.values(ev.records || {});
                const presentCount = statuses.filter(
                  (s) => s === 'present' || s === 'late'
                ).length;
                return (
                  <TouchableOpacity
                    key={ev.id}
                    onPress={() => {
                      setSelectedUnitId(openedUnit.id);
                      setActiveTab('attendance');
                    }}
                    style={[
                      styles.eventRowCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventTitle, { color: theme.text }]}>
                        {isAr ? ev.title_ar : ev.title_en}
                      </Text>
                      <Text style={[styles.eventMeta, { color: theme.textSecondary }]}>
                        📅 {ev.date} • {presentCount}/{statuses.length || unitMembers.length}{' '}
                        {isAr ? 'حاضر' : 'Present'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* SUB-TAB 3: UNIT ROSTER */}
          {unitSubTab === 'roster' && (
            <View>
              {unitMembers.map((m) => {
                const pat = patrols.find((p) => p.id === m.patrol_id);
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.eventRowCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventTitle, { color: theme.text }]}>
                        {isAr ? m.full_name_ar : m.full_name_en}
                      </Text>
                      <Text style={[styles.eventMeta, { color: theme.textSecondary }]}>
                        {m.scout_code || 'SMSR'} •{' '}
                        {pat
                          ? isAr
                            ? pat.name_ar
                            : pat.name_en
                          : isAr
                          ? 'غير مسكن'
                          : 'Unassigned'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.ratePill,
                        {
                          backgroundColor:
                            m.attendance_rate >= 75 ? theme.successSoft : theme.dangerSoft,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: m.attendance_rate >= 75 ? theme.success : theme.danger,
                        }}
                      >
                        {m.attendance_rate}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Modal: Create New Patrol / Six */}
        <Modal visible={showNewPatrolModal} transparent animationType="slide">
          <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isAr
                  ? `إضافة ${terms.groupAr} جديد في ${openedUnit.name_ar}`
                  : `Add New ${terms.groupEn} in ${openedUnit.name_en}`}
              </Text>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? `اسم ${terms.groupAr} (بالعربية)` : `${terms.groupEn} Name (Arabic)`}
              </Text>
              <TextInput
                value={newPatrolNameAr}
                onChangeText={setNewPatrolNameAr}
                placeholder={isAr ? 'مثال: طليعة الصقور / سداسي الأسود' : 'e.g. سداسي النمور'}
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'الاسم بالإنجليزية (اختياري)' : 'English Name'}
              </Text>
              <TextInput
                value={newPatrolNameEn}
                onChangeText={setNewPatrolNameEn}
                placeholder="e.g. Tigers Six / Falcons Patrol"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'رمز الطليعة / السداسي' : 'Emblem Icon'}
              </Text>
              <View style={styles.emblemPickerRow}>
                {['🦁', '🐯', '🦅', '🐺', '🦌', '🐆', '⚜️', '🧭'].map((em) => (
                  <TouchableOpacity
                    key={em}
                    onPress={() => setNewPatrolEmblem(em)}
                    style={[
                      styles.emblemOption,
                      {
                        backgroundColor:
                          newPatrolEmblem === em ? theme.primarySoft : theme.bg,
                        borderColor:
                          newPatrolEmblem === em ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowNewPatrolModal(false)}
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreatePatrol}
                  style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                    {isAr ? 'حفظ وإنشاء' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Assign Scout to Patrol */}
        <Modal visible={Boolean(assigningMemberId)} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isAr ? `اختر ${terms.groupAr} لتسكين الكشاف` : `Select ${terms.groupEn}`}
              </Text>
              {unitPatrols.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={async () => {
                    if (assigningMemberId) {
                      await assignScoutPatrol(assigningMemberId, p.id, 'member');
                    }
                    setAssigningMemberId(null);
                  }}
                  style={[
                    styles.patrolSelectRow,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{p.emblem_icon || '⚜️'}</Text>
                  <Text style={[styles.patrolSelectText, { color: theme.text }]}>
                    {isAr ? p.name_ar : p.name_en}
                  </Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={async () => {
                  if (assigningMemberId) {
                    await assignScoutPatrol(assigningMemberId, undefined, 'member');
                  }
                  setAssigningMemberId(null);
                }}
                style={[
                  styles.patrolSelectRow,
                  { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
                ]}
              >
                <Ionicons name="remove-circle-outline" size={18} color={theme.danger} />
                <Text style={[styles.patrolSelectText, { color: theme.danger }]}>
                  {isAr ? 'إلغاء التسكين (غير مسكن)' : 'Unassign from Patrol'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAssigningMemberId(null)}
                style={[styles.modalCancelBtn, { borderColor: theme.border, marginTop: 8 }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>
                  {isAr ? 'إغلاق' : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ============================================================================
  // RENDER MAIN UNITS HUB GRID
  // ============================================================================
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top KPI Strip */}
        <View style={styles.kpiRow}>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.kpiValue, { color: theme.primary }]}>
              {accessibleUnits.length}
            </Text>
            <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>
              {isAr ? 'الفرق الكشفية' : 'Active Units'}
            </Text>
          </View>

          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.kpiValue, { color: theme.text }]}>{totalScouts}</Text>
            <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>
              {isAr ? 'إجمالي الأفراد' : 'Total Scouts'}
            </Text>
          </View>

          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.kpiValue, { color: theme.accent }]}>{totalPatrols}</Text>
            <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>
              {isAr ? 'طلائع وسداسيات' : 'Patrols/Sixes'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setActiveTab('members')}
            style={[
              styles.kpiCard,
              {
                backgroundColor: redFlagCount > 0 ? theme.dangerSoft : theme.surface,
                borderColor: redFlagCount > 0 ? theme.danger : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.kpiValue,
                { color: redFlagCount > 0 ? theme.danger : theme.success },
              ]}
            >
              {redFlagCount}
            </Text>
            <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>
              {isAr ? 'إنذار غياب' : 'Tamam Alerts'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stage Filter Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {(
            [
              { id: 'all', labelAr: 'كل المراحل', labelEn: 'All Stages' },
              { id: 'buds', labelAr: '🌱 براعم', labelEn: '🌱 Buds' },
              { id: 'cubs', labelAr: '🐾 أشبال وزهرات', labelEn: '🐾 Cubs' },
              { id: 'scouts', labelAr: '⚜️ كشافة ومرشدات', labelEn: '⚜️ Scouts' },
              { id: 'venturers', labelAr: '🧭 متقدم ورائدات', labelEn: '🧭 Venturers' },
              { id: 'rovers', labelAr: '🔥 جوالة', labelEn: '🔥 Rovers' },
            ] as const
          ).map((st) => {
            const active = stageFilter === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                onPress={() => setStageFilter(st.id)}
                style={[
                  styles.stageChip,
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
                    color: active ? '#FFFFFF' : theme.textSecondary,
                  }}
                >
                  {isAr ? st.labelAr : st.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Units Cards List */}
        {filteredUnits.map((unit) => {
          const visuals = getStageVisuals(unit.stage);
          const terms = getSubdivisionTerms(unit.stage, unit.gender);
          const uMembers = members.filter((m) => m.unit_id === unit.id);
          const uPatrols = patrols.filter((p) => p.unit_id === unit.id);
          const avgAtt =
            uMembers.length > 0
              ? Math.round(
                  uMembers.reduce((acc, m) => acc + m.attendance_rate, 0) / uMembers.length
                )
              : unit.avg_attendance;

          return (
            <View
              key={unit.id}
              style={[
                styles.unitCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setSelectedUnitId(unit.id);
                  setOpenedUnitId(unit.id);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.unitHeaderTop}>
                  <View style={[styles.stageIconBox, { backgroundColor: visuals.bgTint }]}>
                    <Text style={{ fontSize: 24 }}>{visuals.emblem}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.stageBadge, { backgroundColor: visuals.bgTint }]}>
                        <Text style={[styles.stageBadgeText, { color: visuals.accentHex }]}>
                          {isAr ? visuals.labelAr : visuals.labelEn}
                        </Text>
                      </View>
                      <Text style={[styles.ageRangeText, { color: theme.textMuted }]}>
                        {unit.age_range} {isAr ? 'سنة' : 'yrs'}
                      </Text>
                    </View>
                    <Text style={[styles.unitCardTitle, { color: theme.text }]}>
                      {isAr ? unit.name_ar : unit.name_en}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.attBadge,
                      {
                        backgroundColor:
                          avgAtt >= 80 ? theme.successSoft : theme.warningSoft,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: avgAtt >= 80 ? theme.success : theme.warning,
                      }}
                    >
                      {avgAtt}%
                    </Text>
                  </View>
                </View>

                {/* Metrics Strip */}
                <View style={[styles.unitStatsStrip, { borderTopColor: theme.border }]}>
                  <View style={styles.unitStatCol}>
                    <Ionicons name="people-outline" size={15} color={theme.textSecondary} />
                    <Text style={[styles.unitStatText, { color: theme.textSecondary }]}>
                      {uMembers.length || unit.member_count} {isAr ? 'كشاف' : 'Scouts'}
                    </Text>
                  </View>
                  <View style={styles.unitStatCol}>
                    <Ionicons name="flag-outline" size={15} color={theme.textSecondary} />
                    <Text style={[styles.unitStatText, { color: theme.textSecondary }]}>
                      {uPatrols.length} {isAr ? terms.groupPluralAr : terms.groupPluralEn}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Card Bottom Quick Buttons */}
              <View style={styles.unitCardFooter}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedUnitId(unit.id);
                    setOpenedUnitId(unit.id);
                  }}
                  style={[
                    styles.cardBtnSecondary,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  ]}
                >
                  <Ionicons name="layers-outline" size={16} color={theme.text} />
                  <Text style={[styles.cardBtnSecondaryText, { color: theme.text }]}>
                    {isAr ? `إدارة ${terms.groupPluralAr}` : `Manage ${terms.groupPluralEn}`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedUnitId(unit.id);
                    setActiveTab('attendance');
                  }}
                  style={[styles.cardBtnPrimary, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.cardBtnPrimaryText}>
                    {isAr ? 'تسجيل الغياب' : 'Roll-Call'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 32,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  filterScroll: {
    marginBottom: 14,
  },
  stageChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  unitCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  unitHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ageRangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  unitCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  attBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  unitStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  unitStatCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unitStatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  unitCardFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cardBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cardBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  unitDetailBanner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  unitDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  unitDetailSub: {
    fontSize: 12,
    marginTop: 2,
  },
  unitActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 11,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '800',
  },
  subTabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginBottom: 14,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  unassignedCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  unassignedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  unassignedTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  memberMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  memberMiniName: {
    fontSize: 13,
    fontWeight: '700',
  },
  assignSmallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  patrolCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  patrolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  patrolEmblem: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patrolName: {
    fontSize: 15,
    fontWeight: '800',
  },
  patrolMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyHint: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  patrolMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  patrolMemberName: {
    fontSize: 13,
    fontWeight: '700',
  },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  patrolMemberActions: {
    flexDirection: 'row',
    gap: 6,
  },
  miniRoleBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  eventMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  ratePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
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
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  emblemPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emblemOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
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
  patrolSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 11,
    borderWidth: 1,
    marginBottom: 8,
  },
  patrolSelectText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});

