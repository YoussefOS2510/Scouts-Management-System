import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileApp } from '../context/MobileAppContext';
import { Member } from '../types';

export const MembersScreen: React.FC = () => {
  const {
    lang,
    theme,
    accessibleUnits,
    patrols,
    members,
    can,
    addMember,
    updateMember,
    deleteMember,
  } = useMobileApp();

  const isAr = lang === 'ar';

  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'tamam' | 'missing' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Member Modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [fullNameAr, setFullNameAr] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [memberUnitId, setMemberUnitId] = useState(accessibleUnits[0]?.id || 'u-cubs-boys');
  const [memberPatrolId, setMemberPatrolId] = useState<string | undefined>(undefined);
  const [phonePersonal, setPhonePersonal] = useState('');
  const [phoneGuardian, setPhoneGuardian] = useState('');
  const [dob, setDob] = useState('');
  const [school, setSchool] = useState('');
  const [address, setAddress] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const scopedMembers = useMemo(
    () =>
      members.filter((m) =>
        accessibleUnits.some((u) => u.id === m.unit_id)
      ),
    [members, accessibleUnits]
  );

  const tamamCount = useMemo(
    () => scopedMembers.filter((m) => m.consecutive_absences >= 3).length,
    [scopedMembers]
  );
  const missingCount = useMemo(
    () => scopedMembers.filter((m) => m.has_missing_data).length,
    [scopedMembers]
  );
  const unassignedCount = useMemo(
    () => scopedMembers.filter((m) => !m.patrol_id).length,
    [scopedMembers]
  );

  const filteredMembers = useMemo(() => {
    return scopedMembers.filter((m) => {
      if (unitFilter !== 'all' && m.unit_id !== unitFilter) return false;
      if (quickFilter === 'tamam' && m.consecutive_absences < 3) return false;
      if (quickFilter === 'missing' && !m.has_missing_data) return false;
      if (quickFilter === 'unassigned' && m.patrol_id) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.full_name_ar.includes(q) ||
          m.full_name_en.toLowerCase().includes(q) ||
          (m.scout_code && m.scout_code.toLowerCase().includes(q)) ||
          m.phone_guardian.includes(q)
        );
      }
      return true;
    });
  }, [scopedMembers, unitFilter, quickFilter, searchQuery]);

  const openAddModal = () => {
    setEditingMember(null);
    setFullNameAr('');
    setFullNameEn('');
    const defaultUnit = unitFilter !== 'all' ? unitFilter : accessibleUnits[0]?.id || 'u-cubs-boys';
    setMemberUnitId(defaultUnit);
    setMemberPatrolId(undefined);
    setPhonePersonal('');
    setPhoneGuardian('');
    setDob('2015-05-10');
    setSchool('');
    setAddress('الرحاب');
    setMedicalNotes('لا يوجد');
    setShowMemberModal(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFullNameAr(m.full_name_ar);
    setFullNameEn(m.full_name_en);
    setMemberUnitId(m.unit_id);
    setMemberPatrolId(m.patrol_id);
    setPhonePersonal(m.phone_personal);
    setPhoneGuardian(m.phone_guardian);
    setDob(m.dob);
    setSchool(m.school_or_university);
    setAddress(m.address);
    setMedicalNotes(m.medical_notes);
    setShowMemberModal(true);
  };

  const handleSaveMember = async () => {
    if (!fullNameAr.trim()) return;
    if (editingMember) {
      await updateMember(editingMember.id, {
        full_name_ar: fullNameAr.trim(),
        full_name_en: fullNameEn.trim() || fullNameAr.trim(),
        unit_id: memberUnitId,
        patrol_id: memberPatrolId,
        phone_personal: phonePersonal.trim(),
        phone_guardian: phoneGuardian.trim(),
        dob: dob.trim(),
        school_or_university: school.trim(),
        address: address.trim(),
        medical_notes: medicalNotes.trim(),
      });
    } else {
      const missingFields: string[] = [];
      if (!phoneGuardian.trim()) missingFields.push('phone_guardian');
      if (!dob.trim()) missingFields.push('dob');
      if (!school.trim()) missingFields.push('school_or_university');

      await addMember({
        full_name_ar: fullNameAr.trim(),
        full_name_en: fullNameEn.trim() || fullNameAr.trim(),
        unit_id: memberUnitId,
        patrol_id: memberPatrolId,
        patrol_role: 'member',
        phone_personal: phonePersonal.trim(),
        phone_guardian: phoneGuardian.trim(),
        dob: dob.trim(),
        school_or_university: school.trim(),
        address: address.trim(),
        medical_notes: medicalNotes.trim(),
        attendance_rate: 100,
        unexcused_absences_count: 0,
        consecutive_absences: 0,
        has_missing_data: missingFields.length > 0,
        missing_fields: missingFields,
        join_year: new Date().getFullYear(),
      });
    }
    setShowMemberModal(false);
  };

  const dialPhone = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Quick Segment Filter Bar (All / Tamam Red-Flags / Missing Data / Unassigned) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentScroll}>
          <TouchableOpacity
            onPress={() => setQuickFilter('all')}
            style={[
              styles.segmentPill,
              {
                backgroundColor: quickFilter === 'all' ? theme.primary : theme.surface,
                borderColor: quickFilter === 'all' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: quickFilter === 'all' ? '#FFFFFF' : theme.text,
              }}
            >
              {isAr ? `كل الأفراد (${scopedMembers.length})` : `All Scouts (${scopedMembers.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setQuickFilter('tamam')}
            style={[
              styles.segmentPill,
              {
                backgroundColor: quickFilter === 'tamam' ? theme.danger : theme.dangerSoft,
                borderColor: theme.danger,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: quickFilter === 'tamam' ? '#FFFFFF' : theme.danger,
              }}
            >
              ⚠️ {isAr ? `إنذارات التمام (${tamamCount})` : `Tamam Alerts (${tamamCount})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setQuickFilter('missing')}
            style={[
              styles.segmentPill,
              {
                backgroundColor: quickFilter === 'missing' ? theme.warning : theme.warningSoft,
                borderColor: theme.warning,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: quickFilter === 'missing' ? '#FFFFFF' : theme.warning,
              }}
            >
              📋 {isAr ? `بيانات ناقصة (${missingCount})` : `Missing Data (${missingCount})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setQuickFilter('unassigned')}
            style={[
              styles.segmentPill,
              {
                backgroundColor: quickFilter === 'unassigned' ? theme.info : theme.surface,
                borderColor: quickFilter === 'unassigned' ? theme.info : theme.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: quickFilter === 'unassigned' ? '#FFFFFF' : theme.textSecondary,
              }}
            >
              {isAr ? `غير مسكنين (${unassignedCount})` : `Unassigned (${unassignedCount})`}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 2. Search & Add Member Row */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={theme.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                isAr
                  ? 'ابحث بالاسم، الكود الكشفي، أو الهاتف...'
                  : 'Search name, SMSR code, or phone...'
              }
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          {can('member:create') && (
            <TouchableOpacity
              onPress={openAddModal}
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="person-add-outline" size={17} color="#FFFFFF" />
              <Text style={styles.addBtnText}>{isAr ? 'إضافة كشاف' : 'Add'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Unit Filter Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setUnitFilter('all')}
            style={[
              styles.unitFilterPill,
              {
                backgroundColor: unitFilter === 'all' ? theme.primarySoft : theme.surface,
                borderColor: unitFilter === 'all' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: unitFilter === 'all' ? theme.primary : theme.textSecondary,
              }}
            >
              {isAr ? 'جميع الفرق' : 'All Units'}
            </Text>
          </TouchableOpacity>
          {accessibleUnits.map((u) => {
            const active = unitFilter === u.id;
            return (
              <TouchableOpacity
                key={u.id}
                onPress={() => setUnitFilter(u.id)}
                style={[
                  styles.unitFilterPill,
                  {
                    backgroundColor: active ? theme.primarySoft : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: active ? theme.primary : theme.textSecondary,
                  }}
                >
                  {isAr ? u.name_ar : u.name_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Members List */}
        {filteredMembers.map((member) => {
          const unit = accessibleUnits.find((u) => u.id === member.unit_id);
          const patrol = patrols.find((p) => p.id === member.patrol_id);
          const isTamamAlert = member.consecutive_absences >= 3;

          return (
            <View
              key={member.id}
              style={[
                styles.memberCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: isTamamAlert ? theme.danger : theme.border,
                },
              ]}
            >
              {/* Top Info Row */}
              <View style={styles.cardTopRow}>
                <View style={[styles.codeCircle, { backgroundColor: theme.primarySoft }]}>
                  <Text style={[styles.codeCircleText, { color: theme.primary }]}>
                    {(member.scout_code || 'SMSR').replace('SMSR-', '#')}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberTitle, { color: theme.text }]}>
                    {isAr ? member.full_name_ar : member.full_name_en}
                  </Text>
                  <Text style={[styles.memberSub, { color: theme.textSecondary }]}>
                    {unit ? (isAr ? unit.name_ar : unit.name_en) : ''} •{' '}
                    {patrol
                      ? `${patrol.emblem_icon || ''} ${isAr ? patrol.name_ar : patrol.name_en}`
                      : isAr
                      ? 'غير مسكن'
                      : 'Unassigned'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.attPill,
                    {
                      backgroundColor:
                        member.attendance_rate >= 75
                          ? theme.successSoft
                          : theme.dangerSoft,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color:
                        member.attendance_rate >= 75 ? theme.success : theme.danger,
                    }}
                  >
                    {member.attendance_rate}%
                  </Text>
                </View>
              </View>

              {/* Tamam Red-Flag Alert Banner */}
              {isTamamAlert && (
                <View
                  style={[
                    styles.alertStrip,
                    { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
                  ]}
                >
                  <Ionicons name="warning" size={16} color={theme.danger} />
                  <Text style={[styles.alertStripText, { color: theme.danger }]}>
                    {isAr
                      ? `إنذار تمام: غائب ${member.consecutive_absences} اجتماعات متتالية — يرجى افتقاد الكشاف`
                      : `Tamam Alert: ${member.consecutive_absences} consecutive absences — follow up needed`}
                  </Text>
                </View>
              )}

              {/* Missing Data Warning Banner */}
              {member.has_missing_data && (
                <View
                  style={[
                    styles.alertStrip,
                    { backgroundColor: theme.warningSoft, borderColor: theme.warning },
                  ]}
                >
                  <Ionicons name="alert-circle" size={16} color={theme.warning} />
                  <Text style={[styles.alertStripText, { color: theme.warning }]}>
                    {isAr
                      ? 'بيانات الملف الكشفي غير مكتملة (اضغط تعديل لاستكمالها)'
                      : 'Incomplete profile data (Tap Edit to complete)'}
                  </Text>
                </View>
              )}

              {/* Contact & Actions Footer */}
              <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                {member.phone_guardian ? (
                  <TouchableOpacity
                    onPress={() => dialPhone(member.phone_guardian)}
                    style={[
                      styles.footerActionBtn,
                      { backgroundColor: theme.successSoft },
                    ]}
                  >
                    <Ionicons name="call-outline" size={15} color={theme.success} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.success }}>
                      {isAr ? 'ولي الأمر' : 'Call Parent'} ({member.phone_guardian})
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noPhoneBadge}>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      {isAr ? 'لا يوجد رقم ولي أمر' : 'No guardian phone'}
                    </Text>
                  </View>
                )}

                <View style={styles.rightActions}>
                  {can('member:edit', member.unit_id) && (
                    <TouchableOpacity
                      onPress={() => openEditModal(member)}
                      style={[
                        styles.iconActionBtn,
                        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                      ]}
                    >
                      <Ionicons name="create-outline" size={16} color={theme.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                        {isAr ? 'تعديل' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {can('member:delete', member.unit_id) && (
                    <TouchableOpacity
                      onPress={() => deleteMember(member.id)}
                      style={[
                        styles.iconActionBtn,
                        { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
                      ]}
                    >
                      <Ionicons name="trash-outline" size={15} color={theme.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal: Add / Edit Member */}
      <Modal visible={showMemberModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingMember
                  ? isAr
                    ? `تعديل بيانات: ${editingMember.full_name_ar}`
                    : `Edit Scout: ${editingMember.full_name_en}`
                  : isAr
                  ? 'تسجيل كشاف جديد بالفرقة'
                  : 'Register New Scout'}
              </Text>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'الاسم الرباعي بالعربية *' : 'Full Name (Arabic) *'}
              </Text>
              <TextInput
                value={fullNameAr}
                onChangeText={setFullNameAr}
                placeholder={isAr ? 'مثال: يوسف ماجد شفيق' : 'Arabic Full Name'}
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'الاسم بالإنجليزية' : 'Full Name (English)'}
              </Text>
              <TextInput
                value={fullNameEn}
                onChangeText={setFullNameEn}
                placeholder="e.g. Youssef Maged Shafik"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'الفرقة الكشفية' : 'Scout Unit'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {accessibleUnits.map((u) => {
                  const selected = u.id === memberUnitId;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() => {
                        setMemberUnitId(u.id);
                        setMemberPatrolId(undefined);
                      }}
                      style={[
                        styles.unitSelectChip,
                        {
                          backgroundColor: selected ? theme.primary : theme.bg,
                          borderColor: selected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: selected ? '#FFFFFF' : theme.text,
                        }}
                      >
                        {isAr ? u.name_ar : u.name_en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'رقم هاتف ولي الأمر (للتواصل والتمام)' : 'Guardian Phone'}
              </Text>
              <TextInput
                value={phoneGuardian}
                onChangeText={setPhoneGuardian}
                keyboardType="phone-pad"
                placeholder="01223344556"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'تاريخ الميلاد (YYYY-MM-DD)' : 'Date of Birth (YYYY-MM-DD)'}
              </Text>
              <TextInput
                value={dob}
                onChangeText={setDob}
                placeholder="2015-04-12"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'المدرسة / الجامعة' : 'School or University'}
              </Text>
              <TextInput
                value={school}
                onChangeText={setSchool}
                placeholder={isAr ? 'مثال: مدرسة سان جورج بالرحاب' : 'School / University'}
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'ملاحظات طبية أو حساسية' : 'Medical Notes'}
              </Text>
              <TextInput
                value={medicalNotes}
                onChangeText={setMedicalNotes}
                placeholder={isAr ? 'لا يوجد' : 'None'}
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
                ]}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowMemberModal(false)}
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveMember}
                  style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                    {editingMember
                      ? isAr
                        ? 'حفظ التعديلات'
                        : 'Save Updates'
                      : isAr
                      ? 'إضافة الكشاف'
                      : 'Add Scout'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  segmentScroll: {
    marginBottom: 12,
  },
  segmentPill: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchBox: {
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
    paddingVertical: 10,
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  unitFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  memberCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeCircle: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCircleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  memberTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  memberSub: {
    fontSize: 11,
    marginTop: 2,
  },
  attPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  alertStripText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noPhoneBadge: {
    paddingVertical: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '90%',
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
  unitSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    marginRight: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});

