import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileApp } from '../context/MobileAppContext';

export const LoginScreen: React.FC = () => {
  const {
    lang,
    setLang,
    isDark,
    setIsDark,
    theme,
    users,
    members,
    units,
    loginAsLeader,
    loginAsScout,
    dbConnected,
  } = useMobileApp();

  const [mode, setMode] = useState<'leader' | 'scout'>('leader');
  const [emailInput, setEmailInput] = useState<string>('andrew.samir@smsr-scouts.org');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••');
  const [scoutCodeInput, setScoutCodeInput] = useState<string>('SMSR-2041');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('u-cubs-boys');

  const isAr = lang === 'ar';

  const handleSubmit = async () => {
    if (mode === 'leader') {
      loginAsLeader(emailInput);
    } else {
      await loginAsScout(scoutCodeInput, selectedUnitId);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Utility Row */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.dbBadge,
              {
                backgroundColor: dbConnected ? theme.successSoft : theme.warningSoft,
                borderColor: dbConnected ? theme.primary : theme.accent,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: dbConnected ? theme.success : theme.warning },
              ]}
            />
            <Text
              style={[
                styles.dbBadgeText,
                { color: dbConnected ? theme.primary : theme.accent },
              ]}
            >
              {dbConnected
                ? isAr
                  ? 'متصل بقاعدة البيانات السحابية'
                  : 'Connected to Live PostgreSQL'
                : isAr
                ? 'وضع العمل المحلي (Offline-Ready)'
                : 'Local Offline-Ready Mode'}
            </Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => setLang(isAr ? 'en' : 'ar')}
              style={[styles.iconChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Ionicons name="language-outline" size={16} color={theme.text} />
              <Text style={[styles.iconChipText, { color: theme.text }]}>
                {isAr ? 'EN' : 'عربي'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsDark(!isDark)}
              style={[styles.iconChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={16}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Scout Banner */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.primary, borderColor: theme.primaryHover },
          ]}
        >
          <View style={styles.heroEmblemRow}>
            <View style={[styles.emblemCircle, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Ionicons name="compass" size={32} color="#FDE68A" />
            </View>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroBadgeText}>
                {isAr ? 'مجموعة كشافة السيدة العذراء بالرحاب' : 'ST. MARY SCOUTS REHAB • SMSR'}
              </Text>
              <Text style={styles.heroTitle}>
                {isAr ? 'المنصة الكشفية الموحدة' : 'Scout Field & Command App'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {isAr
                  ? 'إدارة الفرق، التمام والغياب، سجل الأفراد، ومساحة الكشاف'
                  : 'Units, Roll-Call Attendance, Roster & Youth Scout Space'}
              </Text>
            </View>
          </View>
        </View>

        {/* Mode Segmented Switcher */}
        <View
          style={[
            styles.modeSwitcher,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setMode('leader')}
            style={[
              styles.modeButton,
              mode === 'leader' && { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={mode === 'leader' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.modeButtonText,
                { color: mode === 'leader' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {isAr ? 'بوابة القادة' : 'Leader Portal'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode('scout')}
            style={[
              styles.modeButton,
              mode === 'scout' && { backgroundColor: theme.accent },
            ]}
          >
            <Ionicons
              name="flame-outline"
              size={18}
              color={mode === 'scout' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.modeButtonText,
                { color: mode === 'scout' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {isAr ? 'مساحة الكشاف' : 'Scout Space'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Login Card */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {mode === 'leader' ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {isAr ? 'تسجيل دخول القادة' : 'Leader Sign In'}
              </Text>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                {isAr
                  ? 'ادخل بحسابك الكشفي أو اختر أحد حسابات المعاينة الفورية بالأسفل'
                  : 'Sign in with your leader credentials or tap a quick persona preset below'}
              </Text>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'البريد الإلكتروني للقائد' : 'Leader Email'}
              </Text>
              <TextInput
                value={emailInput}
                onChangeText={setEmailInput}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="leader@smsr-scouts.org"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'كلمة المرور' : 'Password'}
              </Text>
              <TextInput
                value={passwordInput}
                onChangeText={setPasswordInput}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />

              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {isAr ? 'دخول لبوابة القادة' : 'Enter Leader Command Hub'}
                </Text>
              </TouchableOpacity>

              {/* Quick Leader Persona Presets */}
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.presetHeader, { color: theme.textSecondary }]}>
                {isAr
                  ? 'معاينة فورية للصلاحيات (اضغط للدخول المباشر):'
                  : '1-Tap Role Presets (Instant Preview):'}
              </Text>

              {users.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => loginAsLeader(u.id)}
                  style={[
                    styles.presetRow,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.avatarBadge, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {u.avatar_initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.presetName, { color: theme.text }]}>
                      {isAr ? u.full_name_ar : u.full_name_en}
                    </Text>
                    <Text style={[styles.presetRole, { color: theme.textSecondary }]}>
                      {isAr ? u.title_ar : u.title_en}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.primary} />
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {isAr ? 'دخول الكشافين والأفراد' : 'Youth Scout Access'}
              </Text>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                {isAr
                  ? 'أدخل الكود الكشفي أو اسمك لمتابعة نسبة حضورك وألبومات صور فرقتك'
                  : 'Enter your Scout Code or name to view your attendance badge & unit albums'}
              </Text>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'الكود الكشفي أو الاسم' : 'Scout Code or Name'}
              </Text>
              <TextInput
                value={scoutCodeInput}
                onChangeText={setScoutCodeInput}
                placeholder="SMSR-2041"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {isAr ? 'الفرقة الكشفية' : 'Scout Unit'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 14 }}
              >
                {units.slice(0, 6).map((u) => {
                  const selected = u.id === selectedUnitId;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() => setSelectedUnitId(u.id)}
                      style={[
                        styles.unitChip,
                        {
                          backgroundColor: selected ? theme.accent : theme.bg,
                          borderColor: selected ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
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

              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              >
                <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {isAr ? 'دخول مساحة الكشاف' : 'Open My Scout Space'}
                </Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.presetHeader, { color: theme.textSecondary }]}>
                {isAr ? 'حسابات كشافين تجريبية سريعة:' : 'Sample Youth Scout Profiles:'}
              </Text>
              {members.slice(0, 3).map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => loginAsScout(m.scout_code || m.id, m.unit_id)}
                  style={[
                    styles.presetRow,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.avatarBadge, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="person-outline" size={16} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.presetName, { color: theme.text }]}>
                      {isAr ? m.full_name_ar : m.full_name_en}
                    </Text>
                    <Text style={[styles.presetRole, { color: theme.textSecondary }]}>
                      {m.scout_code || 'SMSR'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.accent} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dbBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroEmblemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emblemCircle: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleWrap: {
    flex: 1,
  },
  heroBadgeText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 17,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  formCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  presetHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  presetName: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetRole: {
    fontSize: 11,
    marginTop: 2,
  },
});

