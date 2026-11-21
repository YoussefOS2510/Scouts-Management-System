import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileApp, CAPABILITY_MODULES } from '../context/MobileAppContext';
import { getStageVisuals } from '../theme/scoutTheme';

export const AdminScreen: React.FC = () => {
  const {
    lang,
    theme,
    units,
    patrols,
    members,
    users,
    roles,
    userRoles,
    auditLogs,
    hasCapabilityModule,
    toggleCapabilityModule,
    assignLeaderUnits,
    addLeader,
    can,
  } = useMobileApp();

  const isAr = lang === 'ar';
  const [subTab, setSubTab] = useState<'analytics' | 'permissions' | 'logs'>('analytics');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(users[1]?.id || users[0]?.id || 'usr-2');

  // Add Leader Modal
  const [showAddLeaderModal, setShowAddLeaderModal] = useState(false);
  const [newLeaderNameAr, setNewLeaderNameAr] = useState('');
  const [newLeaderNameEn, setNewLeaderNameEn] = useState('');
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [newLeaderPhone, setNewLeaderPhone] = useState('');
  const [newLeaderTitleAr, setNewLeaderTitleAr] = useState('قائد فرقة');
  const [newLeaderUnitId, setNewLeaderUnitId] = useState(units[0]?.id || 'u-cubs-boys');

  // Analytics Computations
  const analytics = useMemo(() => {
    const totalMembers = members.length;
    const avgAtt =
      totalMembers > 0
        ? Math.round(
            members.reduce((acc, m) => acc + m.attendance_rate, 0) / totalMembers
          )
        : 85;
    const completeCount = members.filter((m) => !m.has_missing_data).length;
    const completenessPct =
      totalMembers > 0 ? Math.round((completeCount / totalMembers) * 100) : 100;
    const redFlags = members.filter((m) => m.consecutive_absences >= 3).length;

    return {
      totalMembers,
      avgAtt,
      completenessPct,
      redFlags,
      totalPatrols: patrols.length,
      totalLeaders: users.length,
    };
  }, [members, patrols.length, users.length]);

  const selectedLeader = useMemo(
    () => users.find((u) => u.id === selectedLeaderId) || users[0],
    [users, selectedLeaderId]
  );

  const selectedLeaderRoles = useMemo(
    () => userRoles.filter((ur) => ur.user_id === selectedLeader?.id),
    [userRoles, selectedLeader]
  );

  const isSelectedLeaderGlobal = useMemo(
    () => selectedLeaderRoles.some((ur) => ur.is_global),
    [selectedLeaderRoles]
  );

  const selectedLeaderUnitIds = useMemo(
    () => selectedLeaderRoles.map((ur) => ur.unit_id).filter(Boolean) as string[],
    [selectedLeaderRoles]
  );

  const canManageRoles = can('admin:manage_roles') || can('admin:manage_overrides');

  const handleToggleUnitScope = async (unitId: string) => {
    if (!selectedLeader || !canManageRoles) return;
    const currentRoleId = selectedLeaderRoles[0]?.role_id || 'role-unit-leader';
    const exists = selectedLeaderUnitIds.includes(unitId);
    const nextUnits = exists
      ? selectedLeaderUnitIds.filter((id) => id !== unitId)
      : [...selectedLeaderUnitIds, unitId];
    await assignLeaderUnits(selectedLeader.id, currentRoleId, nextUnits, false);
  };

  const handleCreateLeader = async () => {
    if (!newLeaderNameAr.trim()) return;
    await addLeader({
      full_name_ar: newLeaderNameAr.trim(),
      full_name_en: newLeaderNameEn.trim() || newLeaderNameAr.trim(),
      email: newLeaderEmail.trim() || `leader.${Date.now()}@smsr-scouts.org`,
      phone: newLeaderPhone.trim() || '01200000000',
      title_ar: newLeaderTitleAr.trim(),
      title_en: 'Unit Leader',
      role_id: 'role-unit-leader',
      unit_ids: [newLeaderUnitId],
      is_global: false,
    });
    setNewLeaderNameAr('');
    setNewLeaderNameEn('');
    setNewLeaderEmail('');
    setNewLeaderPhone('');
    setShowAddLeaderModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Segmented Control */}
        <View
          style={[
            styles.segmentedBar,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setSubTab('analytics')}
            style={[
              styles.segBtn,
              subTab === 'analytics' && { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons
              name="bar-chart-outline"
              size={15}
              color={subTab === 'analytics' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.segBtnText,
                { color: subTab === 'analytics' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {isAr ? 'الإحصائيات' : 'Analytics'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSubTab('permissions')}
            style={[
              styles.segBtn,
              subTab === 'permissions' && { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={subTab === 'permissions' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.segBtnText,
                { color: subTab === 'permissions' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {isAr ? 'صلاحيات القادة' : 'Permissions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSubTab('logs')}
            style={[
              styles.segBtn,
              subTab === 'logs' && { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={15}
              color={subTab === 'logs' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.segBtnText,
                { color: subTab === 'logs' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {isAr ? 'سجل النشاط' : 'Audit Logs'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================
            TAB 1: EXECUTIVE ANALYTICS
           ================================================================ */}
        {subTab === 'analytics' && (
          <View>
            {/* 4 Executive Metric Cards */}
            <View style={styles.gridRow}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {isAr ? 'متوسط الحضور العام' : 'Group Avg Attendance'}
                </Text>
                <Text style={[styles.statBigValue, { color: theme.success }]}>
                  {analytics.avgAtt}%
                </Text>
                <View style={[styles.progressBg, { backgroundColor: theme.surfaceAlt }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, analytics.avgAtt)}%`,
                        backgroundColor: theme.success,
                      },
                    ]}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {isAr ? 'اكتمال بيانات الأفراد' : 'Data Completeness'}
                </Text>
                <Text style={[styles.statBigValue, { color: theme.primary }]}>
                  {analytics.completenessPct}%
                </Text>
                <View style={[styles.progressBg, { backgroundColor: theme.surfaceAlt }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, analytics.completenessPct)}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {isAr ? 'القادة الفاعلون' : 'Active Leaders'}
                </Text>
                <Text style={[styles.statBigValue, { color: theme.accent }]}>
                  {analytics.totalLeaders}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                  {isAr ? `عبر ${units.length} فرقة كشفية` : `Across ${units.length} units`}
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {isAr ? 'حالات افتقاد عاجلة' : 'Tamam Red Flags'}
                </Text>
                <Text style={[styles.statBigValue, { color: theme.danger }]}>
                  {analytics.redFlags}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                  {isAr ? '٣ غيابات متتالية أو أكثر' : '3+ consecutive absences'}
                </Text>
              </View>
            </View>

            {/* Unit Performance Breakdown */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>
                {isAr
                  ? 'مؤشرات الحضور والقوة العددية للفرق الكشفية'
                  : 'Unit Attendance & Roster Health'}
              </Text>

              {units.map((u) => {
                const visuals = getStageVisuals(u.stage);
                const uMembers = members.filter((m) => m.unit_id === u.id);
                const att =
                  uMembers.length > 0
                    ? Math.round(
                        uMembers.reduce((a, b) => a + b.attendance_rate, 0) /
                          uMembers.length
                      )
                    : u.avg_attendance;

                return (
                  <View key={u.id} style={styles.unitAnalyticsRow}>
                    <View style={styles.unitAnalyticsTop}>
                      <Text style={[styles.unitAnalyticsName, { color: theme.text }]}>
                        {visuals.emblem} {isAr ? u.name_ar : u.name_en}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: att >= 80 ? theme.success : theme.warning,
                        }}
                      >
                        {att}% ({uMembers.length || u.member_count}{' '}
                        {isAr ? 'فرد' : 'scouts'})
                      </Text>
                    </View>
                    <View style={[styles.progressBg, { backgroundColor: theme.surfaceAlt }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, att)}%`,
                            backgroundColor: visuals.accentHex,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ================================================================
            TAB 2: LEADER PERMISSIONS & UNIT SCOPE MATRIX
           ================================================================ */}
        {subTab === 'permissions' && (
          <View>
            <View style={styles.leaderSelectorHeader}>
              <Text style={[styles.cardHeaderTitle, { color: theme.text, marginBottom: 0 }]}>
                {isAr ? 'اختر القائد لإدارة صلاحياته:' : 'Select Leader to Configure:'}
              </Text>
              {canManageRoles && (
                <TouchableOpacity
                  onPress={() => setShowAddLeaderModal(true)}
                  style={[styles.addLeaderBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="person-add-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.addLeaderBtnText}>
                    {isAr ? 'قائد جديد' : 'Add Leader'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Horizontal Leader Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
            >
              {users.map((u) => {
                const selected = u.id === selectedLeader?.id;
                return (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setSelectedLeaderId(u.id)}
                    style={[
                      styles.leaderPill,
                      {
                        backgroundColor: selected ? theme.primary : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: selected ? '#FFFFFF' : theme.text,
                      }}
                    >
                      {isAr ? u.full_name_ar : u.full_name_en}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: selected ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {isAr ? u.title_ar : u.title_en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedLeader && (
              <>
                {/* Unit Scope Assignment Card */}
                <View
                  style={[
                    styles.sectionCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.scopeTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: theme.text, marginBottom: 2 }]}>
                        {isAr ? 'نطاق المسؤولية والفرق المكلف بها' : 'Assigned Scout Units Scope'}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                        {isSelectedLeaderGlobal
                          ? isAr
                            ? 'صلاحية شاملة على جميع فرق المجموعة (قائد عام)'
                            : 'Global access across all 12 Scout units'
                          : isAr
                          ? 'اضغط على الفرقة لتفعيل أو إلغاء تكليف القائد بها'
                          : 'Tap units below to assign or unassign this leader'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        assignLeaderUnits(
                          selectedLeader.id,
                          isSelectedLeaderGlobal ? 'role-unit-leader' : 'role-group-leader',
                          selectedLeaderUnitIds.length > 0
                            ? selectedLeaderUnitIds
                            : ['u-cubs-boys'],
                          !isSelectedLeaderGlobal
                        )
                      }
                      style={[
                        styles.globalToggleChip,
                        {
                          backgroundColor: isSelectedLeaderGlobal
                            ? theme.accent
                            : theme.surfaceAlt,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: isSelectedLeaderGlobal ? '#FFFFFF' : theme.textSecondary,
                        }}
                      >
                        {isSelectedLeaderGlobal
                          ? isAr
                            ? '🌟 شامل لكل الفرق'
                            : '🌟 Global Scope'
                          : isAr
                          ? 'تفعيل الشامل'
                          : 'Make Global'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!isSelectedLeaderGlobal && (
                    <View style={styles.unitChipsWrap}>
                      {units.map((u) => {
                        const assigned = selectedLeaderUnitIds.includes(u.id);
                        return (
                          <TouchableOpacity
                            key={u.id}
                            onPress={() => handleToggleUnitScope(u.id)}
                            style={[
                              styles.unitScopeChip,
                              {
                                backgroundColor: assigned
                                  ? theme.primarySoft
                                  : theme.bg,
                                borderColor: assigned ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Ionicons
                              name={assigned ? 'checkmark-circle' : 'ellipse-outline'}
                              size={14}
                              color={assigned ? theme.primary : theme.textMuted}
                            />
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: assigned ? theme.primary : theme.textSecondary,
                              }}
                            >
                              {isAr ? u.name_ar : u.name_en}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 5 Capability Module Toggles */}
                <View
                  style={[
                    styles.sectionCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>
                    {isAr
                      ? `مصفوفة الصلاحيات المباشرة (${selectedLeader.full_name_ar})`
                      : `Capability Modules (${selectedLeader.full_name_en})`}
                  </Text>

                  {CAPABILITY_MODULES.map((mod) => {
                    const enabled = hasCapabilityModule(selectedLeader.id, mod.id);
                    return (
                      <View
                        key={mod.id}
                        style={[
                          styles.moduleRow,
                          { borderTopColor: theme.border },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={[styles.moduleTitle, { color: theme.text }]}>
                            {isAr ? mod.titleAr : mod.titleEn}
                          </Text>
                          <Text style={[styles.moduleDesc, { color: theme.textSecondary }]}>
                            {isAr ? mod.descAr : mod.descEn}
                          </Text>
                        </View>
                        <Switch
                          value={enabled}
                          onValueChange={(val) =>
                            toggleCapabilityModule(selectedLeader.id, mod.id, val)
                          }
                          trackColor={{ false: theme.borderStrong, true: theme.primary }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {/* ================================================================
            TAB 3: AUDIT LOGS FEED
           ================================================================ */}
        {subTab === 'logs' && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>
              {isAr
                ? 'سجل النشاط الفوري للقادة (Audit Trail)'
                : 'Live Leader Activity & Audit Log'}
            </Text>

            {auditLogs.map((log) => (
              <View
                key={log.id}
                style={[styles.logItem, { borderTopColor: theme.border }]}
              >
                <View style={[styles.logIconBox, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logTarget, { color: theme.text }]}>
                    {isAr ? log.target_label_ar : log.target_label_en}
                  </Text>
                  <Text style={[styles.logMeta, { color: theme.textSecondary }]}>
                    👤 {isAr ? log.actor_name_ar : log.actor_name_en} • 🕒 {log.created_at}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Add New Leader */}
      <Modal visible={showAddLeaderModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isAr ? 'إضافة قائد جديد للمجموعة' : 'Add New Scout Leader'}
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {isAr ? 'الاسم بالعربية *' : 'Leader Name (Arabic) *'}
            </Text>
            <TextInput
              value={newLeaderNameAr}
              onChangeText={setNewLeaderNameAr}
              placeholder={isAr ? 'مثال: ق. كيرلس هاني' : 'Leader Arabic Name'}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.modalInput,
                { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {isAr ? 'الاسم بالإنجليزية' : 'Leader Name (English)'}
            </Text>
            <TextInput
              value={newLeaderNameEn}
              onChangeText={setNewLeaderNameEn}
              placeholder="e.g. Ldr. Kirollos Hany"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.modalInput,
                { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {isAr ? 'المسمى الكشفي' : 'Scout Title'}
            </Text>
            <TextInput
              value={newLeaderTitleAr}
              onChangeText={setNewLeaderTitleAr}
              placeholder={isAr ? 'قائد فرقة' : 'Unit Leader'}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.modalInput,
                { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
              ]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowAddLeaderModal(false)}
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateLeader}
                style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                  {isAr ? 'إضافة القائد' : 'Add Leader'}
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
  segmentedBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginBottom: 14,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statBigValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  progressBg: {
    height: 6,
    borderRadius: 999,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  unitAnalyticsRow: {
    marginBottom: 12,
  },
  unitAnalyticsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitAnalyticsName: {
    fontSize: 13,
    fontWeight: '700',
  },
  leaderSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addLeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addLeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  leaderPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  scopeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  globalToggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },
  unitChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  unitScopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  moduleDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 11,
    borderTopWidth: 1,
  },
  logIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTarget: {
    fontSize: 13,
    fontWeight: '700',
  },
  logMeta: {
    fontSize: 11,
    marginTop: 3,
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

