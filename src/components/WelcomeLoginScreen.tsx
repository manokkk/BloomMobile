import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginUser, signUpUser } from '../services/api';
import { BloomKeyboardScreen } from './BloomKeyboardScreen';
import { BloomRoseSvg } from './BloomRoseSvg';
import { BloomTextInput } from './BloomTextInput';

interface WelcomeLoginScreenProps {
  onLoginSuccess: (user: { id: string; email: string }) => void;
  sessionExpiredMessage?: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const WelcomeLoginScreen: React.FC<WelcomeLoginScreenProps> = ({
  onLoginSuccess,
  sessionExpiredMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const switchMode = (nextMode: 'login' | 'signup') => {
    setMode(nextMode);
    setErrorMessage(null);
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    } else if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { user } =
        mode === 'signup'
          ? await signUpUser(normalizedEmail, password)
          : await loginUser(normalizedEmail, password);
      onLoginSuccess({ id: user.id, email: user.email });
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error ||
          'Unable to reach BloomBackend. Make sure the server is running on port 3000.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BloomKeyboardScreen contentContainerStyle={styles.scrollContent}>
      {/* Rose Emblem Header */}
      <View style={styles.emblemWrapper}>
        <BloomRoseSvg size={88} />
        <Text style={styles.brandTitle}>Bloom</Text>
        <Text style={styles.tagline}>
          Your private, cycle-aware wellness companion
        </Text>
      </View>

      {/* Log In / Sign Up Card */}
      <View style={styles.card}>
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
            onPress={() => switchMode('login')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'login' && styles.modeTabTextActive,
              ]}
            >
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
            onPress={() => switchMode('signup')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'signup' && styles.modeTabTextActive,
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text style={styles.cardSubtitle}>
          {mode === 'login'
            ? 'Log in with your email and password to access your private cycle logs.'
            : 'Sign up with your email and a strong password to start tracking privately.'}
        </Text>

        {sessionExpiredMessage && !errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{sessionExpiredMessage}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <Text style={styles.inputLabel}>Email Address</Text>
        <BloomTextInput
          style={styles.fieldSpacing}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting}
        />

        <View style={styles.passwordLabelRow}>
          <Text style={styles.inputLabel}>Password</Text>
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.toggleRow}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={15}
              color="#D23669"
            />
            <Text style={styles.togglePasswordText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        <BloomTextInput
          style={styles.fieldSpacing}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder={
            mode === 'signup' ? 'At least 8 characters' : 'Enter your password'
          }
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting}
          returnKeyType={mode === 'login' ? 'done' : 'next'}
          onSubmitEditing={() => {
            if (mode === 'login') handleSubmit();
          }}
        />

        {mode === 'signup' && (
          <>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <BloomTextInput
              style={styles.fieldSpacing}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Re-enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#8C8296" />
        <Text style={styles.privacyFooter}>
          Protected with scrypt password hashing & JWT encryption
        </Text>
      </View>
    </BloomKeyboardScreen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emblemWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emblemHalo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emblemInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F9A8D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPetalTop: {
    position: 'absolute',
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F472B6',
  },
  miniPetalLeft: {
    position: 'absolute',
    left: 8,
    bottom: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EC4899',
  },
  miniPetalRight: {
    position: 'absolute',
    right: 8,
    bottom: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EC4899',
  },
  miniPetalCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D23669',
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#D23669',
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: '#5C5465',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    shadowColor: '#D23669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFAF0',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    marginBottom: 18,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FCE7F3',
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C8296',
  },
  modeTabTextActive: {
    color: '#D23669',
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2A32',
  },
  cardSubtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 19,
    color: '#5C5465',
  },
  errorBox: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FDA4AF',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#BE123C',
    fontSize: 12,
    fontWeight: '500',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D2A32',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  togglePasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D23669',
  },
  fieldSpacing: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#D23669',
    borderRadius: 18,
    paddingVertical: 15,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  privacyFooter: {
    fontSize: 12,
    color: '#8C8296',
    textAlign: 'center',
  },
});
