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
import { saveQuickUnlockSettings } from '../services/api';

interface PinSetupScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export const PinSetupScreen: React.FC<PinSetupScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (Platform.OS === 'web') return;
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted && hasHardware && isEnrolled) {
          setBiometricsAvailable(true);
          setBiometricsEnabled(true);
        }
      } catch {
        // Biometrics unavailable on this device
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activePin = step === 'create' ? firstPin : confirmPin;

  const handleKeyPress = async (key: string) => {
    if (!key) return;
    setErrorMessage(null);

    if (key === '⌫') {
      if (step === 'create') {
        setFirstPin((prev) => prev.slice(0, -1));
      } else {
        setConfirmPin((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (activePin.length >= 4) return;
    const nextPin = activePin + key;

    if (step === 'create') {
      setFirstPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => setStep('confirm'), 150);
      }
      return;
    }

    setConfirmPin(nextPin);
    if (nextPin.length === 4) {
      if (nextPin !== firstPin) {
        setErrorMessage('PINs did not match. Please try again.');
        setConfirmPin('');
        setFirstPin('');
        setStep('create');
        return;
      }

      await saveQuickUnlockSettings(nextPin, biometricsEnabled);
      onComplete();
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.badge}>7-Day Session Protection</Text>
        <Text style={styles.title}>
          {step === 'create' ? 'Set a 4-Digit PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'create'
            ? 'Use a quick 4-digit PIN for automatic unlock over the next 7 days.'
            : 'Re-enter your 4-digit PIN to confirm.'}
        </Text>
      </View>

      {/* 4 PIN Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx < activePin.length && styles.dotFilled,
            ]}
          />
        ))}
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      {/* Biometrics Toggle */}
      {biometricsAvailable && (
        <View style={styles.bioCard}>
          <View style={styles.bioTextWrap}>
            <Text style={styles.bioTitle}>Face ID / Fingerprint</Text>
            <Text style={styles.bioSubtitle}>
              Unlock Bloom automatically with biometrics
            </Text>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            trackColor={{ false: '#F3D6DF', true: '#F472B6' }}
            thumbColor={biometricsEnabled ? '#D23669' : '#FFFFFF'}
          />
        </View>
      )}

      {/* Numeric Keypad */}
      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((key, kIdx) =>
              key === '' ? (
                <View key={kIdx} style={styles.keyEmpty} />
              ) : (
                <TouchableOpacity
                  key={kIdx}
                  style={styles.keyButton}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={onSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFAF0',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D23669',
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D2A32',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#5C5465',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 12,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D23669',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#D23669',
  },
  errorText: {
    color: '#BE123C',
    fontSize: 13,
    fontWeight: '600',
    height: 22,
    marginBottom: 10,
  },
  errorPlaceholder: {
    height: 22,
    marginBottom: 10,
  },
  bioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    marginBottom: 20,
  },
  bioTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  bioTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2A32',
  },
  bioSubtitle: {
    fontSize: 12,
    color: '#5C5465',
    marginTop: 2,
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D23669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2A32',
  },
  skipButton: {
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C8296',
  },
});
