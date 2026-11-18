import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { clearAuthSession } from '../services/api';
import { BloomRoseSvg } from './BloomRoseSvg';

interface PinLockScreenProps {
  userEmail?: string;
  expectedPin: string;
  biometricsEnabled: boolean;
  onUnlock: () => void;
  onUsePasswordInstead: () => void;
}

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', '⌫'],
];

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  userEmail,
  expectedPin,
  biometricsEnabled,
  onUnlock,
  onUsePasswordInstead,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);

  const triggerBiometricPrompt = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Bloom',
        cancelLabel: 'Use PIN',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        onUnlock();
      }
    } catch {
      // Fall back to PIN entry
    }
  }, [onUnlock]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!biometricsEnabled || Platform.OS === 'web') return;
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted && hasHardware && isEnrolled) {
          setCanUseBiometrics(true);
          triggerBiometricPrompt();
        }
      } catch {
        // Biometrics unavailable
      }
    })();
    return () => {
      mounted = false;
    };
  }, [biometricsEnabled, triggerBiometricPrompt]);

  const handleKeyPress = (key: string) => {
    setErrorMessage(null);

    if (key === 'bio') {
      if (canUseBiometrics) {
        triggerBiometricPrompt();
      }
      return;
    }

    if (key === '⌫') {
      setEnteredPin((prev) => prev.slice(0, -1));
      return;
    }

    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + key;
    setEnteredPin(nextPin);

    if (nextPin.length === 4) {
      if (nextPin === expectedPin) {
        onUnlock();
      } else {
        setErrorMessage('Incorrect PIN. Please try again.');
        setTimeout(() => setEnteredPin(''), 180);
      }
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <BloomRoseSvg size={64} />
        <Text style={styles.brandTitle}>Bloom</Text>
        <Text style={styles.title}>Enter Your 4-Digit PIN</Text>
        {userEmail && <Text style={styles.emailText}>{userEmail}</Text>}
      </View>

      {/* 4 PIN Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx < enteredPin.length && styles.dotFilled,
            ]}
          />
        ))}
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      {/* Numeric Keypad */}
      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((key, kIdx) => {
              if (key === 'bio' && !canUseBiometrics) {
                return <View key={kIdx} style={styles.keyEmpty} />;
              }
              return (
                <TouchableOpacity
                  key={kIdx}
                  style={styles.keyButton}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                >
                  {key === 'bio' ? (
                    <Ionicons name="finger-print" size={28} color="#D23669" />
                  ) : key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={24} color="#2D2A32" />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.switchAuthButton}
        onPress={async () => {
          await clearAuthSession();
          onUsePasswordInstead();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.switchAuthText}>
          Log in with Email & Password instead
        </Text>
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
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#D23669',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2A32',
  },
  emailText: {
    marginTop: 4,
    fontSize: 13,
    color: '#5C5465',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 14,
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
    marginBottom: 12,
  },
  errorPlaceholder: {
    height: 22,
    marginBottom: 12,
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
  bioKeyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D23669',
    textAlign: 'center',
  },
  switchAuthButton: {
    marginTop: 26,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  switchAuthText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D23669',
  },
});
