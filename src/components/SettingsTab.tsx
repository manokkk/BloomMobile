import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { BloomTextInput } from './BloomTextInput';
import {
  clearAuthSession,
  getQuickUnlockSettings,
  saveQuickUnlockSettings,
  updateUserProfile,
  UserCycleProfile,
} from '../services/api';

const GOAL_OPTIONS = [
  { label: 'Track Cycle', value: 'track_cycle' },
  { label: 'Conceive', value: 'conceive' },
  { label: 'Perimenopause', value: 'perimenopause' },
  { label: 'General Health', value: 'general_health' },
];

const CONTRACEPTION_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Pill', value: 'pill' },
  { label: 'Hormonal IUD', value: 'iud_hormonal' },
  { label: 'Copper IUD', value: 'iud_copper' },
  { label: 'Implant', value: 'implant' },
];

const CONDITION_OPTIONS = [
  { label: 'PCOS', value: 'pcos' },
  { label: 'Endometriosis', value: 'endometriosis' },
  { label: 'Thyroid', value: 'thyroid' },
  { label: 'Fibroids', value: 'fibroids' },
];

interface SettingsTabProps {
  userId?: string;
  userEmail: string;
  initialProfile?: UserCycleProfile;
  onProfileUpdated?: () => void | Promise<void>;
  onOpenPinSetup?: () => void;
  onLogout?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  userId,
  userEmail,
  initialProfile,
  onProfileUpdated,
  onOpenPinSetup,
  onLogout,
}) => {
  const [hasPin, setHasPin] = useState(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const [trackingGoal, setTrackingGoal] = useState<string>(
    initialProfile?.tracking_goal || 'track_cycle'
  );
  const [typicalCycleLen, setTypicalCycleLen] = useState<string>(
    String(initialProfile?.typical_cycle_length || 28)
  );
  const [typicalPeriodLen, setTypicalPeriodLen] = useState<string>(
    String(initialProfile?.typical_period_length || 5)
  );
  const [cyclesRegular, setCyclesRegular] = useState<boolean>(
    initialProfile?.cycles_are_regular ?? true
  );
  const [contraception, setContraception] = useState<string>(
    initialProfile?.contraception_type || 'none'
  );
  const [conditions, setConditions] = useState<string[]>(
    Array.isArray(initialProfile?.health_conditions)
      ? initialProfile!.health_conditions!
      : []
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const unlock = await getQuickUnlockSettings();
      if (!mounted) return;
      setHasPin(unlock.hasPin);
      setSavedPin(unlock.pin);
      setBiometricsEnabled(unlock.biometricsEnabled);

      if (Platform.OS !== 'web') {
        try {
          const hw = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          if (mounted) {
            setBiometricsAvailable(hw && enrolled);
          }
        } catch {
          // Ignore hardware check errors
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleBiometrics = async (nextValue: boolean) => {
    setBiometricsEnabled(nextValue);
    if (savedPin) {
      await saveQuickUnlockSettings(savedPin, nextValue);
    }
  };

  const toggleCondition = (val: string) => {
    setConditions((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      await updateUserProfile(userId, {
        tracking_goal: trackingGoal,
        typical_cycle_length: Number(typicalCycleLen) || 28,
        typical_period_length: Number(typicalPeriodLen) || 5,
        cycles_are_regular: cyclesRegular,
        contraception_type: contraception,
        health_conditions: conditions,
        onboarding_completed: true,
      });
      await onProfileUpdated?.();
      setProfileStatus('Cycle baseline saved & predictions updated.');
    } catch (err: any) {
      setProfileStatus(err?.message || 'Could not save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View>
      <Text style={styles.pageTitle}>Settings</Text>
      <Text style={styles.pageSubtitle}>
        Manage your private account, 7-day session, and quick unlock.
      </Text>

      {/* Account Card */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person-circle-outline" size={16} color="#D23669" />
          <Text style={styles.sectionLabel}>Account</Text>
        </View>
        <Text style={styles.emailText}>{userEmail || 'Protected Session'}</Text>
        <Text style={styles.helperText}>
          Your session stays active for 7 days, encrypted with SecureStore and JWT.
        </Text>
      </View>

      {/* Cycle Baseline & Health Profile Card */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="flower-outline" size={16} color="#D23669" />
          <Text style={styles.sectionLabel}>Cycle Baseline & Profile</Text>
        </View>

        <Text style={styles.fieldLabel}>Tracking Goal</Text>
        <View style={styles.chipWrap}>
          {GOAL_OPTIONS.map((opt) => {
            const active = trackingGoal === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setTrackingGoal(opt.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.numberRow}>
          <View style={styles.numberCol}>
            <Text style={styles.fieldLabel}>Typical Cycle (days)</Text>
            <BloomTextInput
              value={typicalCycleLen}
              onChangeText={setTypicalCycleLen}
              keyboardType="number-pad"
              placeholder="28"
            />
          </View>
          <View style={styles.numberCol}>
            <Text style={styles.fieldLabel}>Typical Period (days)</Text>
            <BloomTextInput
              value={typicalPeriodLen}
              onChangeText={setTypicalPeriodLen}
              keyboardType="number-pad"
              placeholder="5"
            />
          </View>
        </View>

        <View style={[styles.row, { marginTop: 10, marginBottom: 6 }]}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Usually Regular Cycles</Text>
            <Text style={styles.rowSubtitle}>
              Turn off if your cycles vary by more than 5 days
            </Text>
          </View>
          <Switch
            value={cyclesRegular}
            onValueChange={setCyclesRegular}
            trackColor={{ false: '#F3D6DF', true: '#F472B6' }}
            thumbColor={cyclesRegular ? '#D23669' : '#FFFFFF'}
          />
        </View>

        <Text style={styles.fieldLabel}>Birth Control / Contraception</Text>
        <View style={styles.chipWrap}>
          {CONTRACEPTION_OPTIONS.map((opt) => {
            const active = contraception === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setContraception(opt.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Health Context (Optional)</Text>
        <View style={styles.chipWrap}>
          {CONDITION_OPTIONS.map((opt) => {
            const active = conditions.includes(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => toggleCondition(opt.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {profileStatus && (
          <Text style={styles.profileStatusText}>{profileStatus}</Text>
        )}

        <TouchableOpacity
          style={styles.saveProfileButton}
          onPress={handleSaveProfile}
          disabled={savingProfile || !userId}
          activeOpacity={0.85}
        >
          {savingProfile ? (
            <ActivityIndicator size="small" color="#D23669" />
          ) : (
            <Text style={styles.saveProfileButtonText}>Save Cycle Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Privacy & Quick Unlock Card */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#D23669" />
          <Text style={styles.sectionLabel}>Privacy & Quick Unlock</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowIconWrap}>
            <Ionicons name="keypad-outline" size={20} color="#D23669" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>4-Digit PIN Lock</Text>
            <Text style={styles.rowSubtitle}>
              {hasPin ? 'Enabled for quick app unlock' : 'Not set yet'}
            </Text>
          </View>
          {onOpenPinSetup && (
            <TouchableOpacity
              style={styles.pillButton}
              onPress={onOpenPinSetup}
              activeOpacity={0.8}
            >
              <Text style={styles.pillButtonText}>
                {hasPin ? 'Change PIN' : 'Set PIN'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {biometricsAvailable && (
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="finger-print-outline" size={20} color="#D23669" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Face ID / Fingerprint</Text>
              <Text style={styles.rowSubtitle}>
                {hasPin
                  ? 'Unlock Bloom automatically with biometrics'
                  : 'Set a 4-digit PIN first to enable biometrics'}
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              disabled={!hasPin}
              trackColor={{ false: '#F3D6DF', true: '#F472B6' }}
              thumbColor={biometricsEnabled ? '#D23669' : '#FFFFFF'}
            />
          </View>
        )}
      </View>

      {/* Sign Out Button */}
      {onLogout && (
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={async () => {
            await clearAuthSession();
            onLogout();
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#BE123C" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#D23669',
  },
  pageSubtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 13,
    color: '#5C5465',
  },
  card: {
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
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#D23669',
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A32',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#5C5465',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowDivider: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#FFF0F5',
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2A32',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#5C5465',
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FCE7F3',
  },
  pillButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D23669',
  },
  signOutButton: {
    marginTop: 6,
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FDA4AF',
    borderRadius: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#BE123C',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D2A32',
    marginTop: 10,
    marginBottom: 6,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#FFFAF0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  chipTextActive: {
    color: '#D23669',
    fontWeight: '700',
  },
  numberRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  numberCol: {
    flex: 1,
  },
  profileStatusText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#D23669',
    textAlign: 'center',
  },
  saveProfileButton: {
    marginTop: 12,
    backgroundColor: '#FCE7F3',
    borderWidth: 1.5,
    borderColor: '#D23669',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveProfileButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D23669',
  },
});
