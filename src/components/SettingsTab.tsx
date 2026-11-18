import React, { useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import {
  clearAuthSession,
  getQuickUnlockSettings,
  saveQuickUnlockSettings,
} from '../services/api';

interface SettingsTabProps {
  userEmail: string;
  onOpenPinSetup?: () => void;
  onLogout?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  userEmail,
  onOpenPinSetup,
  onLogout,
}) => {
  const [hasPin, setHasPin] = useState(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

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
});
