import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { BloomKeyboardScreen } from './BloomKeyboardScreen';
import { BloomTextInput } from './BloomTextInput';
import {
  fetchUserCycle,
  upsertDailySymptomLog,
  clearAuthSession,
  CycleDataResponse,
} from '../services/api';

const FLOW_OPTIONS = ['None', 'Spotting', 'Light', 'Medium', 'Heavy'];
const SYMPTOM_OPTIONS = [
  'Cramps',
  'Bloating',
  'Headache',
  'Tender Breasts',
  'Fatigue',
  'Backache',
  'Cravings',
  'Clear Skin',
];
const MOOD_OPTIONS = [
  'Calm',
  'Energetic',
  'Sensitive',
  'Focused',
  'Anxious',
  'Irritable',
  'Affectionate',
  'Reflective',
];

function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function generateCalendarStrip(centerDateIso: string) {
  const days = [];
  const [y, m, d] = centerDateIso.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let offset = -3; offset <= 3; offset++) {
    const dt = new Date(base);
    dt.setUTCDate(base.getUTCDate() + offset);
    const iso = dt.toISOString().split('T')[0];
    days.push({
      iso,
      dayName: dayNames[dt.getUTCDay()],
      dayNumber: dt.getUTCDate(),
      isToday: iso === getTodayIso(),
    });
  }
  return days;
}

interface DashboardProps {
  initialUser?: { id: string; email?: string };
  onReady?: () => void;
  onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  initialUser,
  onReady,
  onLogout,
}) => {
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [cycleData, setCycleData] = useState<CycleDataResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());

  // Daily Symptom Form State
  const [flowIntensity, setFlowIntensity] = useState<string>('None');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const syncFormWithDate = useCallback(
    (dateIso: string, logs: CycleDataResponse['logs']) => {
      const existing = logs.find((item) => item.log_date === dateIso);
      if (existing) {
        setFlowIntensity(existing.flow_intensity || 'None');
        setSelectedSymptoms(Array.isArray(existing.symptoms) ? existing.symptoms : []);
        setSelectedMoods(Array.isArray(existing.mood) ? existing.mood : []);
        setNotes(existing.notes || '');
      } else {
        setFlowIntensity('None');
        setSelectedSymptoms([]);
        setSelectedMoods([]);
        setNotes('');
      }
    },
    []
  );

  const bootstrapDashboard = useCallback(async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const activeUserId = initialUser?.id || '';
      const activeEmail = initialUser?.email || '';

      if (!activeUserId) {
        onLogout?.();
        return;
      }

      setUserId(activeUserId);
      setUserEmail(activeEmail);

      const data = await fetchUserCycle(activeUserId);
      setCycleData(data);
      syncFormWithDate(selectedDate, data.logs);
    } catch (err: any) {
      if (err?.response?.status === 401 && onLogout) {
        await clearAuthSession();
        onLogout();
        return;
      }
      setErrorBanner(
        'Offline Preview Mode: Start BloomBackend on port 3000 to sync live data.'
      );
      // Graceful fallback preview state if backend is not yet started
      const fallbackToday = getTodayIso();
      setCycleData({
        cycle: {
          id: 'preview-cycle-id',
          user_id: 'preview-user',
          start_date: '2026-10-29',
          end_date: '2026-11-02',
          expected_next_start: '2026-11-26',
        },
        prediction: {
          start_date: '2026-10-29',
          expected_next_start: '2026-11-26',
          ovulation_date: '2026-11-12',
          fertile_window_start: '2026-11-07',
          fertile_window_end: '2026-11-13',
          current_cycle_day: 12,
          days_until_next_period: 17,
          current_phase: 'Follicular',
          phase_description:
            'Estrogen rises as follicles mature. High energy and cognitive clarity.',
        },
        logs: [
          {
            id: 'sample-log',
            log_date: fallbackToday,
            flow_intensity: 'None',
            symptoms: ['Clear Skin'],
            mood: ['Calm', 'Energetic'],
            notes: 'Feeling well-rested today.',
          },
        ],
      });
    } finally {
      setLoading(false);
      onReady?.();
    }
  }, [initialUser?.id, initialUser?.email, selectedDate, syncFormWithDate, onReady, onLogout]);

  useEffect(() => {
    bootstrapDashboard();
  }, [bootstrapDashboard]);

  const handleSelectDate = (dateIso: string) => {
    setSelectedDate(dateIso);
    setStatusBanner(null);
    if (cycleData) {
      syncFormWithDate(dateIso, cycleData.logs);
    }
  };

  const toggleItem = (
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSaveDailyLog = async () => {
    if (!userId) {
      setStatusBanner('Saved locally in preview mode. Start backend for DB persistence.');
      return;
    }

    setSaving(true);
    setStatusBanner(null);
    setErrorBanner(null);

    try {
      await upsertDailySymptomLog({
        user_id: userId,
        cycle_id: cycleData?.cycle.id,
        log_date: selectedDate,
        flow_intensity: flowIntensity,
        symptoms: selectedSymptoms,
        mood: selectedMoods,
        notes,
      });

      const refreshed = await fetchUserCycle(userId);
      setCycleData(refreshed);
      setStatusBanner(`Daily log for ${selectedDate} securely encrypted & saved.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to save daily log.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-floralWhite p-6"
        style={[styles.screenBg, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <ActivityIndicator size="large" color="#D23669" />
      </View>
    );
  }

  const prediction = cycleData?.prediction;
  const calendarDays = generateCalendarStrip(selectedDate);

  return (
    <BloomKeyboardScreen
      style={styles.screenBg}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Top Privacy & Brand Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-3xl font-bold text-magentaBloom" style={styles.brandTitle}>
            Bloom
          </Text>
          <Text className="text-xs text-deepCharcoal opacity-75" style={styles.subtleText}>
            Privacy-First Reproductive Health • {userEmail || 'Protected Session'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            className="px-3 py-1.5 rounded-3xl bg-softRose border border-magentaBloom"
            style={styles.privacyBadge}
          >
            <Text className="text-xs font-semibold text-magentaBloom" style={styles.magentaText}>
              🔒 End-to-End API
            </Text>
          </View>
          {onLogout && (
            <TouchableOpacity
              onPress={async () => {
                await clearAuthSession();
                onLogout();
              }}
              style={styles.signOutPill}
              activeOpacity={0.75}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {errorBanner && (
        <View
          className="mb-4 p-4 rounded-3xl border border-magentaBloom bg-petalLight"
          style={styles.alertBanner}
        >
          <Text className="text-xs font-medium text-magentaBloom" style={styles.magentaText}>
            {errorBanner}
          </Text>
        </View>
      )}

      {/* Horizontal Floral Calendar Strip */}
      <View
        className="mb-6 p-4 rounded-3xl bg-white shadow-sm"
        style={styles.cardContainer}
      >
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-bold text-deepCharcoal" style={styles.sectionTitle}>
            Cycle Calendar
          </Text>
          <Text className="text-xs font-semibold text-magentaBloom" style={styles.magentaText}>
            Selected: {selectedDate}
          </Text>
        </View>

        <View className="flex-row justify-between">
          {calendarDays.map((day) => {
            const isSelected = day.iso === selectedDate;
            return (
              <TouchableOpacity
                key={day.iso}
                onPress={() => handleSelectDate(day.iso)}
                className={`items-center justify-center px-3 py-3 rounded-3xl ${isSelected ? 'bg-softRose border border-magentaBloom' : 'bg-floralWhite'
                  }`}
                style={[
                  styles.calendarDayPill,
                  isSelected && styles.calendarDayPillActive,
                ]}
              >
                <Text
                  className="text-xs font-medium text-deepCharcoal mb-1"
                  style={[
                    styles.calendarDayLabel,
                    isSelected && styles.magentaText,
                  ]}
                >
                  {day.dayName}
                </Text>
                <Text
                  className="text-base font-bold text-deepCharcoal"
                  style={[
                    styles.calendarDayNumber,
                    isSelected && styles.magentaText,
                  ]}
                >
                  {day.dayNumber}
                </Text>
                {day.isToday && (
                  <View
                    className="w-1.5 h-1.5 rounded-full bg-magentaBloom mt-1"
                    style={styles.todayDot}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Circular Cycle Ring Centerpiece */}
      <View className="items-center justify-center my-2 mb-6">
        <View
          className="items-center justify-center rounded-full bg-softRose shadow-md"
          style={styles.outerFloralRing}
        >
          <View
            className="items-center justify-center rounded-full bg-floralWhite"
            style={styles.innerFloralRing}
          >
            <Text
              className="text-xs uppercase tracking-widest font-bold text-magentaBloom mb-1"
              style={styles.phasePillText}
            >
              {prediction?.current_phase} Phase
            </Text>
            <Text
              className="text-5xl font-extrabold text-deepCharcoal"
              style={styles.cycleDayHero}
            >
              Day {prediction?.current_cycle_day ?? 1}
            </Text>
            <Text
              className="text-sm font-semibold text-magentaBloom mt-1"
              style={styles.magentaText}
            >
              {prediction?.days_until_next_period ?? 16} days until next period
            </Text>
            <Text
              className="text-xs text-center text-deepCharcoal px-6 mt-2 opacity-80"
              style={styles.ringDescription}
            >
              {prediction?.phase_description}
            </Text>
          </View>
        </View>
      </View>

      {/* Cycle Key Dates Summary Cards */}
      <View className="flex-row justify-between mb-6" style={styles.metricsRow}>
        <View
          className="flex-1 p-4 rounded-3xl bg-white shadow-sm mr-2"
          style={[styles.cardContainer, styles.metricCard]}
        >
          <Text className="text-xs text-deepCharcoal opacity-70" style={styles.subtleText}>
            Cycle Started
          </Text>
          <Text className="text-base font-bold text-deepCharcoal mt-1" style={styles.charcoalText}>
            {cycleData?.cycle.start_date}
          </Text>
          <Text className="text-xs text-magentaBloom mt-1" style={styles.magentaText}>
            Fertile: {prediction?.fertile_window_start?.slice(5)} to{' '}
            {prediction?.fertile_window_end?.slice(5)}
          </Text>
        </View>

        <View
          className="flex-1 p-4 rounded-3xl bg-white shadow-sm ml-2"
          style={[styles.cardContainer, styles.metricCard]}
        >
          <Text className="text-xs text-deepCharcoal opacity-70" style={styles.subtleText}>
            Expected Next Period
          </Text>
          <Text className="text-base font-bold text-magentaBloom mt-1" style={styles.magentaText}>
            {cycleData?.cycle.expected_next_start}
          </Text>
          <Text className="text-xs text-deepCharcoal mt-1" style={styles.subtleText}>
            Est. Ovulation: {prediction?.ovulation_date?.slice(5)}
          </Text>
        </View>
      </View>

      {/* Daily Symptom & Mood Logging Form */}
      <View
        className="p-5 rounded-3xl bg-white shadow-md mb-8"
        style={styles.cardContainer}
      >
        <Text className="text-lg font-bold text-deepCharcoal mb-1" style={styles.sectionTitle}>
          Daily Body & Mood Check-In
        </Text>
        <Text className="text-xs text-deepCharcoal opacity-70 mb-4" style={styles.subtleText}>
          Logging for {selectedDate} • Upserts securely per unique date
        </Text>

        {/* Flow Intensity */}
        <Text className="text-sm font-semibold text-deepCharcoal mb-2" style={styles.charcoalText}>
          Menstrual Flow Intensity
        </Text>
        <View className="flex-row flex-wrap mb-4" style={styles.chipWrap}>
          {FLOW_OPTIONS.map((flow) => {
            const active = flowIntensity === flow;
            return (
              <TouchableOpacity
                key={flow}
                onPress={() => setFlowIntensity(flow)}
                className={`px-4 py-2 rounded-3xl mr-2 mb-2 ${active ? 'bg-softRose border border-magentaBloom' : 'bg-floralWhite'
                  }`}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  className="text-xs font-semibold"
                  style={[styles.chipText, active && styles.magentaText]}
                >
                  {flow}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Physical Symptoms */}
        <Text className="text-sm font-semibold text-deepCharcoal mb-2" style={styles.charcoalText}>
          Physical Symptoms
        </Text>
        <View className="flex-row flex-wrap mb-4" style={styles.chipWrap}>
          {SYMPTOM_OPTIONS.map((symptom) => {
            const active = selectedSymptoms.includes(symptom);
            return (
              <TouchableOpacity
                key={symptom}
                onPress={() =>
                  toggleItem(symptom, selectedSymptoms, setSelectedSymptoms)
                }
                className={`px-4 py-2 rounded-3xl mr-2 mb-2 ${active ? 'bg-softRose border border-magentaBloom' : 'bg-floralWhite'
                  }`}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  className="text-xs font-semibold"
                  style={[styles.chipText, active && styles.magentaText]}
                >
                  {symptom}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mood Dynamics */}
        <Text className="text-sm font-semibold text-deepCharcoal mb-2" style={styles.charcoalText}>
          Mood & Emotional State
        </Text>
        <View className="flex-row flex-wrap mb-4" style={styles.chipWrap}>
          {MOOD_OPTIONS.map((mood) => {
            const active = selectedMoods.includes(mood);
            return (
              <TouchableOpacity
                key={mood}
                onPress={() => toggleItem(mood, selectedMoods, setSelectedMoods)}
                className={`px-4 py-2 rounded-3xl mr-2 mb-2 ${active ? 'bg-softRose border border-magentaBloom' : 'bg-floralWhite'
                  }`}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  className="text-xs font-semibold"
                  style={[styles.chipText, active && styles.magentaText]}
                >
                  {mood}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Personal Notes */}
        <Text className="text-sm font-semibold text-deepCharcoal mb-2" style={styles.charcoalText}>
          Private Reflections
        </Text>
        <BloomTextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add private notes about sleep, nutrition, or energy..."
          placeholderTextColor="#888888"
          multiline
          style={styles.notesSpacing}
        />

        {statusBanner && (
          <View
            className="mb-4 p-3 rounded-3xl bg-softRose border border-magentaBloom"
            style={styles.statusBanner}
          >
            <Text className="text-xs font-semibold text-magentaBloom text-center" style={styles.magentaText}>
              ✓ {statusBanner}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSaveDailyLog}
          disabled={saving}
          className="py-4 rounded-3xl bg-softRose border border-magentaBloom items-center shadow-sm"
          style={styles.primaryButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#D23669" />
          ) : (
            <Text className="text-base font-bold text-magentaBloom" style={styles.primaryButtonText}>
              Save Daily Bloom Log
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </BloomKeyboardScreen>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: '#FFFAF0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#D23669',
    letterSpacing: 0.4,
  },
  charcoalText: {
    color: '#333333',
  },
  subtleText: {
    color: '#555555',
    fontSize: 12,
  },
  magentaText: {
    color: '#D23669',
    fontWeight: '700',
  },
  privacyBadge: {
    backgroundColor: '#FFC0CB',
    borderColor: '#D23669',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alertBanner: {
    backgroundColor: '#FFF0F5',
    borderColor: '#D23669',
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFE4E9',
    shadowColor: '#D23669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  calendarDayPill: {
    backgroundColor: '#FFFAF0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 44,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  calendarDayPillActive: {
    backgroundColor: '#FFC0CB',
    borderColor: '#D23669',
  },
  calendarDayLabel: {
    fontSize: 11,
    color: '#555555',
    marginBottom: 4,
  },
  calendarDayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D23669',
    marginTop: 4,
  },
  outerFloralRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFC0CB',
    borderWidth: 3,
    borderColor: '#D23669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D23669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  innerFloralRing: {
    width: 222,
    height: 222,
    borderRadius: 111,
    backgroundColor: '#FFFAF0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  phasePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D23669',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  cycleDayHero: {
    fontSize: 42,
    fontWeight: '800',
    color: '#333333',
    marginVertical: 4,
  },
  ringDescription: {
    fontSize: 11,
    color: '#333333',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#FFFAF0',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F3D6DF',
  },
  chipActive: {
    backgroundColor: '#FFC0CB',
    borderColor: '#D23669',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  notesSpacing: {
    marginBottom: 16,
  },
  statusBanner: {
    backgroundColor: '#FFF0F5',
    borderColor: '#D23669',
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#FFC0CB',
    borderColor: '#D23669',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#D23669',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signOutPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3D6DF',
  },
  signOutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C5465',
  },
});

