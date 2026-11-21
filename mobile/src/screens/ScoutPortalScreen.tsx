import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileApp } from '../context/MobileAppContext';
import { getStageVisuals, getSubdivisionTerms } from '../theme/scoutTheme';

export const ScoutPortalScreen: React.FC = () => {
  const {
    lang,
    theme,
    members,
    units,
    patrols,
    events,
    mediaAlbums,
    mediaItems,
    activeScoutMember,
    loginAsScout,
  } = useMobileApp();

  const isAr = lang === 'ar';
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const scout = activeScoutMember || members[0];
  const unit = useMemo(
    () => units.find((u) => u.id === scout?.unit_id) || units[0],
    [units, scout]
  );
  const patrol = useMemo(
    () => patrols.find((p) => p.id === scout?.patrol_id),
    [patrols, scout]
  );

  const visuals = getStageVisuals(unit.stage);
  const terms = getSubdivisionTerms(unit.stage, unit.gender);

  const myEvents = useMemo(
    () => events.filter((ev) => ev.unit_id === unit.id),
    [events, unit.id]
  );

  const unitAlbums = useMemo(
    () => mediaAlbums.filter((a) => a.unit_id === unit.id || mediaAlbums.length > 0),
    [mediaAlbums, unit.id]
  );

  const activeAlbum = useMemo(
    () => unitAlbums.find((a) => a.id === selectedAlbumId) || unitAlbums[0],
    [unitAlbums, selectedAlbumId]
  );

  const albumPhotos = useMemo(
    () =>
      activeAlbum
        ? mediaItems.filter((item) => item.album_id === activeAlbum.id)
        : mediaItems,
    [mediaItems, activeAlbum]
  );

  if (!scout) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Scout Profile Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {members.slice(0, 6).map((m) => {
            const active = m.id === scout.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => loginAsScout(m.scout_code || m.id, m.unit_id)}
                style={[
                  styles.scoutSwitchChip,
                  {
                    backgroundColor: active ? theme.accent : theme.surface,
                    borderColor: active ? theme.accent : theme.border,
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
                  {isAr ? m.full_name_ar : m.full_name_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 1. Digital Scout Membership Card */}
        <View
          style={[
            styles.idCard,
            { backgroundColor: theme.primary, borderColor: theme.primaryHover },
          ]}
        >
          <View style={styles.idCardHeader}>
            <View style={styles.idEmblemBox}>
              <Text style={{ fontSize: 28 }}>{visuals.emblem}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.idOrgLabel}>
                {isAr ? 'بطاقة العضوية الكشفية الرقمية' : 'DIGITAL SCOUT ID CARD'}
              </Text>
              <Text style={styles.idScoutName}>
                {isAr ? scout.full_name_ar : scout.full_name_en}
              </Text>
              <Text style={styles.idUnitName}>
                {isAr ? unit.name_ar : unit.name_en}
              </Text>
            </View>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{scout.scout_code || 'SMSR-2041'}</Text>
            </View>
          </View>

          <View style={styles.idCardBottom}>
            <View style={styles.idMetaCol}>
              <Text style={styles.idMetaLabel}>
                {isAr ? terms.groupAr : terms.groupEn}
              </Text>
              <Text style={styles.idMetaValue}>
                {patrol
                  ? `${patrol.emblem_icon || '⚜️'} ${isAr ? patrol.name_ar : patrol.name_en}`
                  : isAr
                  ? 'قيد التسكين'
                  : 'Pending'}
              </Text>
            </View>

            <View style={styles.idMetaCol}>
              <Text style={styles.idMetaLabel}>
                {isAr ? 'الرتبة بالطليعة' : 'Patrol Role'}
              </Text>
              <Text style={styles.idMetaValue}>
                {scout.patrol_role === 'leader'
                  ? isAr
                    ? `⭐ ${terms.leaderAr}`
                    : `⭐ ${terms.leaderEn}`
                  : scout.patrol_role === 'assistant'
                  ? isAr
                    ? terms.assistantAr
                    : terms.assistantEn
                  : isAr
                  ? terms.memberAr
                  : terms.memberEn}
              </Text>
            </View>

            <View style={styles.idMetaCol}>
              <Text style={styles.idMetaLabel}>
                {isAr ? 'سنة الالتحاق' : 'Joined'}
              </Text>
              <Text style={styles.idMetaValue}>{scout.join_year || 2023}</Text>
            </View>
          </View>
        </View>

        {/* 2. Attendance & Honor Badge Strip */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.statBig, { color: theme.success }]}>
              {scout.attendance_rate}%
            </Text>
            <Text style={[styles.statTitle, { color: theme.text }]}>
              {isAr ? 'نسبة الانتظام والحضور' : 'Attendance Rate'}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
              {scout.attendance_rate >= 85
                ? isAr
                  ? '🏅 وسام التميز في الالتزام'
                  : '🏅 Gold Commitment Badge'
                : isAr
                ? 'واظب على الاجتماعات القادمة'
                : 'Keep attending weekly meetings!'}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.statBig, { color: theme.accent }]}>
              {myEvents.length}
            </Text>
            <Text style={[styles.statTitle, { color: theme.text }]}>
              {isAr ? 'اجتماعات ومعسكرات الفرقة' : 'Unit Events'}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
              {isAr ? 'سجل مشاركاتك الكشفية' : 'Your field participation'}
            </Text>
          </View>
        </View>

        {/* 3. My Recent Meetings & Attendance Log */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            {isAr ? 'سجل حضوري في الاجتماعات الأخيرة' : 'My Recent Meetings & Attendance'}
          </Text>

          {myEvents.map((ev) => {
            const myStatus = ev.records?.[scout.id] || 'present';
            const isPresent = myStatus === 'present' || myStatus === 'late';
            return (
              <View
                key={ev.id}
                style={[styles.eventRow, { borderTopColor: theme.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: theme.text }]}>
                    {isAr ? ev.title_ar : ev.title_en}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                    📅 {ev.date}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusTag,
                    {
                      backgroundColor: isPresent ? theme.successSoft : theme.dangerSoft,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: isPresent ? theme.success : theme.danger,
                    }}
                  >
                    {myStatus === 'present'
                      ? isAr
                        ? '✓ حاضر'
                        : '✓ Present'
                      : myStatus === 'excused'
                      ? isAr
                        ? 'بعذر'
                        : 'Excused'
                      : myStatus === 'late'
                      ? isAr
                        ? 'متأخر'
                        : 'Late'
                      : isAr
                      ? 'غائب'
                      : 'Absent'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 4. Unit Photo Albums & Memories */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            {isAr ? '📸 ألبومات صور الفرقة والمعسكرات' : '📸 Unit Photo Albums & Camp Memories'}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {unitAlbums.map((alb) => {
              const selected = alb.id === activeAlbum?.id;
              return (
                <TouchableOpacity
                  key={alb.id}
                  onPress={() => setSelectedAlbumId(alb.id)}
                  style={[
                    styles.albumChip,
                    {
                      backgroundColor: selected ? theme.primarySoft : theme.bg,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: selected ? theme.primary : theme.text,
                    }}
                  >
                    {isAr ? alb.title_ar : alb.title_en}
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                    {alb.date} • {alb.item_count} {isAr ? 'صور' : 'photos'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {albumPhotos.map((photo) => (
            <View
              key={photo.id}
              style={[
                styles.photoCard,
                { backgroundColor: theme.bg, borderColor: theme.border },
              ]}
            >
              <Image
                source={{ uri: photo.url }}
                style={styles.photoImage}
                resizeMode="cover"
              />
              <View style={styles.photoCaptionBox}>
                <Text style={[styles.photoCaption, { color: theme.text }]}>
                  {isAr ? photo.caption_ar : photo.caption_en}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                  {photo.created_at}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
    paddingBottom: 36,
  },
  scoutSwitchChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  idCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  idEmblemBox: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idOrgLabel: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  idScoutName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  idUnitName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  codeBadgeText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  idCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  idMetaCol: {
    flex: 1,
  },
  idMetaLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
  },
  idMetaValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  statBig: {
    fontSize: 24,
    fontWeight: '800',
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderTopWidth: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  albumChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  photoCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoImage: {
    width: '100%',
    height: 180,
  },
  photoCaptionBox: {
    padding: 12,
  },
  photoCaption: {
    fontSize: 13,
    fontWeight: '700',
  },
});

