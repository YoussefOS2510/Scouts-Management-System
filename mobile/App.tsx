import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  MobileAppProvider,
  useMobileApp,
  ActiveMobileTab,
} from './src/context/MobileAppContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { UnitsHubScreen } from './src/screens/UnitsHubScreen';
import { AttendanceScreen } from './src/screens/AttendanceScreen';
import { MembersScreen } from './src/screens/MembersScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { ScoutPortalScreen } from './src/screens/ScoutPortalScreen';

const MainMobileShell: React.FC = () => {
  const {
    lang,
    setLang,
    isDark,
    setIsDark,
    theme,
    activeTab,
    setActiveTab,
    isAuthenticated,
    portalMode,
    currentUser,
    activeScoutMember,
    users,
    switchRolePreset,
    logout,
    dbConnected,
    isSyncing,
    lastSyncedAt,
    apiBaseUrl,
    setApiBaseUrl,
    refreshFromBackend,
    toastMessage,
  } = useMobileApp();

  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [urlDraft, setUrlDraft] = useState(apiBaseUrl);

  const isAr = lang === 'ar';

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safeRoot, { backgroundColor: theme.bg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LoginScreen />
      </SafeAreaView>
    );
  }

  const navItems: {
    id: ActiveMobileTab;
    labelAr: string;
    labelEn: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      id: 'units',
      labelAr: 'الفرق',
      labelEn: 'Units',
      icon: 'compass-outline',
      iconActive: 'compass',
    },
    {
      id: 'attendance',
      labelAr: 'التمام والغياب',
      labelEn: 'Attendance',
      icon: 'checkbox-outline',
      iconActive: 'checkbox',
    },
    {
      id: 'members',
      labelAr: 'الأفراد',
      labelEn: 'Members',
      icon: 'people-outline',
      iconActive: 'people',
    },
    {
      id: 'admin',
      labelAr: 'الإدارة',
      labelEn: 'Admin',
      icon: 'shield-checkmark-outline',
      iconActive: 'shield-checkmark',
    },
    {
      id: 'scout',
      labelAr: 'الكشاف',
      labelEn: 'Scout ID',
      icon: 'flame-outline',
      iconActive: 'flame',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeRoot, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Scout App Header */}
      <View
        style={[
          styles.topHeader,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.brandRow}>
          <View style={[styles.brandEmblem, { backgroundColor: theme.primary }]}>
            <Ionicons name="compass" size={20} color="#FDE68A" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.brandTitle, { color: theme.text }]}>
                {isAr ? 'كشافة السيدة العذراء' : 'SMSR Scouts'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setUrlDraft(apiBaseUrl);
                  setShowServerModal(true);
                }}
                style={[
                  styles.liveStatusPill,
                  {
                    backgroundColor: dbConnected ? theme.successSoft : theme.warningSoft,
                  },
                ]}
              >
                {isSyncing ? (
                  <ActivityIndicator size={10} color={theme.primary} />
                ) : (
                  <View
                    style={[
                      styles.liveDot,
                      { backgroundColor: dbConnected ? theme.success : theme.warning },
                    ]}
                  />
                )}
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '800',
                    color: dbConnected ? theme.success : theme.warning,
                  }}
                >
                  {dbConnected
                    ? isAr
                      ? 'متصل'
                      : 'LIVE DB'
                    : isAr
                    ? 'محلي'
                    : 'LOCAL'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowPersonaModal(true)}
              style={styles.personaTrigger}
            >
              <Text style={[styles.personaSubtitle, { color: theme.textSecondary }]}>
                {portalMode === 'scout'
                  ? `🏕️ ${
                      isAr
                        ? activeScoutMember?.full_name_ar
                        : activeScoutMember?.full_name_en
                    }`
                  : `⚜️ ${
                      isAr ? currentUser.full_name_ar : currentUser.full_name_en
                    } (${isAr ? currentUser.title_ar : currentUser.title_en})`}
              </Text>
              <Ionicons name="chevron-down" size={12} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* Header Controls: Language, Dark Mode, Logout */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setLang(isAr ? 'en' : 'ar')}
              style={[
                styles.headerIconBtn,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text }}>
                {isAr ? 'EN' : 'ع'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsDark(!isDark)}
              style={[
                styles.headerIconBtn,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={15}
                color={theme.accent}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={logout}
              style={[
                styles.headerIconBtn,
                { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
              ]}
            >
              <Ionicons name="log-out-outline" size={15} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <View
          style={[
            styles.toastBar,
            {
              backgroundColor:
                toastMessage.type === 'warning'
                  ? theme.warning
                  : toastMessage.type === 'info'
                  ? theme.info
                  : theme.primary,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage.text}</Text>
        </View>
      )}

      {/* Active Screen Content */}
      <View style={styles.screenViewport}>
        {activeTab === 'units' && <UnitsHubScreen />}
        {activeTab === 'attendance' && <AttendanceScreen />}
        {activeTab === 'members' && <MembersScreen />}
        {activeTab === 'admin' && <AdminScreen />}
        {activeTab === 'scout' && <ScoutPortalScreen />}
      </View>

      {/* Bottom Tab Navigation Bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        {navItems.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={styles.bottomTabBtn}
            >
              <View
                style={[
                  styles.bottomIconPill,
                  active && { backgroundColor: theme.primarySoft },
                ]}
              >
                <Ionicons
                  name={active ? tab.iconActive : tab.icon}
                  size={20}
                  color={active ? theme.primary : theme.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.bottomTabLabel,
                  {
                    color: active ? theme.primary : theme.textMuted,
                    fontWeight: active ? '800' : '600',
                  },
                ]}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal: 1-Tap Persona / Role Switcher */}
      <Modal visible={showPersonaModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isAr
                ? 'التبديل السريع بين حسابات القادة (معاينة الصلاحيات)'
                : 'Quick Leader Persona Switcher'}
            </Text>

            {users.map((u) => {
              const isCurrent = portalMode === 'leader' && u.id === currentUser.id;
              return (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => {
                    switchRolePreset(u.id);
                    setShowPersonaModal(false);
                  }}
                  style={[
                    styles.personaOption,
                    {
                      backgroundColor: isCurrent ? theme.primarySoft : theme.bg,
                      borderColor: isCurrent ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                      {u.avatar_initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>
                      {isAr ? u.full_name_ar : u.full_name_en}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                      {isAr ? u.title_ar : u.title_en}
                    </Text>
                  </View>
                  {isCurrent && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => setShowPersonaModal(false)}
              style={[styles.closeModalBtn, { borderColor: theme.border }]}
            >
              <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>
                {isAr ? 'إغلاق' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Backend API Server Connection Settings */}
      <Modal visible={showServerModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isAr ? 'إعدادات الاتصال بالخادم وقاعدة البيانات' : 'Backend API & Database Sync'}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 10 }}>
              {isAr
                ? `الحالة: ${dbConnected ? 'متصل بقاعدة البيانات PostgreSQL' : 'وضع محلي'}${
                    lastSyncedAt ? ` (آخر مزامنة ${lastSyncedAt})` : ''
                  }`
                : `Status: ${dbConnected ? 'Connected to PostgreSQL' : 'Local mode'}${
                    lastSyncedAt ? ` (Last synced ${lastSyncedAt})` : ''
                  }`}
            </Text>

            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 6 }}>
              {isAr ? 'عنوان خادم API (للأندرويد و iOS والشبكة المحلية):' : 'API Base URL:'}
            </Text>
            <TextInput
              value={urlDraft}
              onChangeText={setUrlDraft}
              autoCapitalize="none"
              placeholder="http://192.168.1.10:3000"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.urlInput,
                { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text },
              ]}
            />

            {/* Quick Local/Emulator URL Presets */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {[
                { label: 'Web / iOS (localhost)', url: 'http://localhost:3000' },
                { label: 'Android Emulator (10.0.2.2)', url: 'http://10.0.2.2:3000' },
                { label: 'LAN Wi-Fi (192.168.1.10)', url: 'http://192.168.1.10:3000' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.url}
                  onPress={() => setUrlDraft(p.url)}
                  style={[
                    styles.urlPresetPill,
                    { backgroundColor: theme.primarySoft, borderColor: theme.primary },
                  ]}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary }}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowServerModal(false)}
                style={[styles.closeModalBtn, { flex: 1, borderColor: theme.border, marginTop: 0 }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await setApiBaseUrl(urlDraft);
                  await refreshFromBackend();
                  setShowServerModal(false);
                }}
                style={[
                  styles.closeModalBtn,
                  {
                    flex: 1,
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                    marginTop: 0,
                  },
                ]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                  {isAr ? 'حفظ ومزامنة' : 'Save & Sync'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileAppProvider>
        <MainMobileShell />
      </MobileAppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandEmblem: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  personaTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  personaSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  screenViewport: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  bottomTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomIconPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },
  bottomTabLabel: {
    fontSize: 10,
    marginTop: 2,
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
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  personaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalBtn: {
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 6,
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  urlPresetPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});

