import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Dashboard } from './src/components/Dashboard';
import { BloomLoadingScreen } from './src/components/BloomLoadingScreen';
import { WelcomeLoginScreen } from './src/components/WelcomeLoginScreen';
import { PinSetupScreen } from './src/components/PinSetupScreen';
import { PinLockScreen } from './src/components/PinLockScreen';
import {
  getQuickUnlockSettings,
  getStoredSession,
} from './src/services/api';

type AppScreen = 'loading' | 'auth' | 'pin-setup' | 'lock' | 'dashboard';

interface ActiveUser {
  id: string;
  email?: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('loading');
  const [nextScreenAfterLoad, setNextScreenAfterLoad] =
    useState<AppScreen>('auth');
  const [activeUser, setActiveUser] = useState<ActiveUser | null>(null);
  const [savedPin, setSavedPin] = useState<string>('');
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string | null>(
    null
  );
  const [isLoaderReady, setIsLoaderReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await getStoredSession();
      if (!mounted) return;

      if (stored.token && stored.userId) {
        setActiveUser({ id: stored.userId, email: stored.email || undefined });
        const unlock = await getQuickUnlockSettings();
        if (!mounted) return;

        if (unlock.hasPin && unlock.pin) {
          setSavedPin(unlock.pin);
          setBiometricsEnabled(unlock.biometricsEnabled);
          setNextScreenAfterLoad('lock');
        } else {
          setNextScreenAfterLoad('dashboard');
        }
      } else {
        if (stored.expired) {
          setSessionExpiredMsg(
            'Your 7-day session expired. Please log in again with your email and password.'
          );
        }
        setNextScreenAfterLoad('auth');
      }

      setIsLoaderReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleBloomFinished = useCallback(() => {
    setCurrentScreen(nextScreenAfterLoad);
  }, [nextScreenAfterLoad]);

  const handleLoginSuccess = useCallback(
    async (user: { id: string; email: string }) => {
      setSessionExpiredMsg(null);
      setActiveUser(user);
      const unlock = await getQuickUnlockSettings();
      if (unlock.hasPin && unlock.pin) {
        setSavedPin(unlock.pin);
        setBiometricsEnabled(unlock.biometricsEnabled);
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('pin-setup');
      }
    },
    []
  );

  const handlePinSetupComplete = useCallback(async () => {
    const unlock = await getQuickUnlockSettings();
    if (unlock.pin) {
      setSavedPin(unlock.pin);
      setBiometricsEnabled(unlock.biometricsEnabled);
    }
    setCurrentScreen('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    setActiveUser(null);
    setSavedPin('');
    setBiometricsEnabled(false);
    setSessionExpiredMsg(null);
    setCurrentScreen('auth');
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        {currentScreen === 'loading' && (
          <BloomLoadingScreen
            isReady={isLoaderReady}
            onFinish={handleBloomFinished}
          />
        )}
        {currentScreen === 'auth' && (
          <WelcomeLoginScreen
            onLoginSuccess={handleLoginSuccess}
            sessionExpiredMessage={sessionExpiredMsg}
          />
        )}
        {currentScreen === 'pin-setup' && (
          <PinSetupScreen
            onComplete={handlePinSetupComplete}
            onSkip={() => setCurrentScreen('dashboard')}
          />
        )}
        {currentScreen === 'lock' && (
          <PinLockScreen
            userEmail={activeUser?.email}
            expectedPin={savedPin}
            biometricsEnabled={biometricsEnabled}
            onUnlock={() => setCurrentScreen('dashboard')}
            onUsePasswordInstead={handleLogout}
          />
        )}
        {currentScreen === 'dashboard' && activeUser && (
          <Dashboard
            initialUser={activeUser}
            onLogout={handleLogout}
            onOpenPinSetup={() => setCurrentScreen('pin-setup')}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },
});
