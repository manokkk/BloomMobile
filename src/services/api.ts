import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Configure API Base URL.
 * Automatically detects the dev machine LAN IP from Expo hostUri when running on a physical device,
 * or falls back to 192.168.100.51 / emulator localhost.
 */
function resolveApiBaseUrl(): string {
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (debuggerHost && /^\d+\.\d+\.\d+\.\d+$/.test(debuggerHost)) {
    return `http://${debuggerHost}:3000`;
  }
  return Platform.OS === 'android' ? 'http://192.168.100.51:3000' : 'http://localhost:3000';
}

export const API_BASE_URL = resolveApiBaseUrl();

const TOKEN_STORAGE_KEY = 'bloom_secure_session_token';
const USER_ID_STORAGE_KEY = 'bloom_secure_user_id';
const USER_EMAIL_STORAGE_KEY = 'bloom_secure_user_email';
const SESSION_CREATED_AT_KEY = 'bloom_secure_session_created_at';
const PIN_CODE_STORAGE_KEY = 'bloom_secure_pin_code';
const BIOMETRICS_ENABLED_KEY = 'bloom_secure_biometrics_enabled';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

let inMemoryToken: string | null = null;
let inMemoryUserId: string | null = null;
let inMemoryUserEmail: string | null = null;
let inMemorySessionCreatedAt: number | null = null;
let inMemoryPinCode: string | null = null;
let inMemoryBiometricsEnabled = false;

export async function saveAuthSession(
  token: string,
  userId: string,
  email?: string
): Promise<void> {
  const now = Date.now();
  inMemoryToken = token;
  inMemoryUserId = userId;
  inMemorySessionCreatedAt = now;
  if (email) {
    inMemoryUserEmail = email;
  }
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
      await SecureStore.setItemAsync(USER_ID_STORAGE_KEY, userId);
      await SecureStore.setItemAsync(SESSION_CREATED_AT_KEY, String(now));
      if (email) {
        await SecureStore.setItemAsync(USER_EMAIL_STORAGE_KEY, email);
      }
    }
  } catch {
    // Fallback remains in-memory if SecureStore is unavailable
  }
}

export async function getStoredSession(): Promise<{
  token: string | null;
  userId: string | null;
  email: string | null;
  expired: boolean;
}> {
  if (inMemoryToken && inMemoryUserId && inMemorySessionCreatedAt) {
    if (Date.now() - inMemorySessionCreatedAt > SEVEN_DAYS_MS) {
      await clearAuthSession();
      return { token: null, userId: null, email: null, expired: true };
    }
    return {
      token: inMemoryToken,
      userId: inMemoryUserId,
      email: inMemoryUserEmail,
      expired: false,
    };
  }
  try {
    if (Platform.OS !== 'web') {
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      const userId = await SecureStore.getItemAsync(USER_ID_STORAGE_KEY);
      const email = await SecureStore.getItemAsync(USER_EMAIL_STORAGE_KEY);
      const createdAtRaw = await SecureStore.getItemAsync(SESSION_CREATED_AT_KEY);

      if (!token || !userId || !createdAtRaw) {
        return { token: null, userId: null, email: null, expired: false };
      }

      const createdAt = Number(createdAtRaw);
      if (!Number.isFinite(createdAt) || Date.now() - createdAt > SEVEN_DAYS_MS) {
        await clearAuthSession();
        return { token: null, userId: null, email: null, expired: true };
      }

      inMemoryToken = token;
      inMemoryUserId = userId;
      inMemoryUserEmail = email;
      inMemorySessionCreatedAt = createdAt;
      return { token, userId, email, expired: false };
    }
  } catch {
    // Ignore storage read errors on unsupported targets
  }
  return {
    token: inMemoryToken,
    userId: inMemoryUserId,
    email: inMemoryUserEmail,
    expired: false,
  };
}

export async function saveQuickUnlockSettings(
  pin: string,
  biometricsEnabled: boolean
): Promise<void> {
  inMemoryPinCode = pin;
  inMemoryBiometricsEnabled = biometricsEnabled;
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(PIN_CODE_STORAGE_KEY, pin);
      await SecureStore.setItemAsync(
        BIOMETRICS_ENABLED_KEY,
        biometricsEnabled ? 'true' : 'false'
      );
    }
  } catch {
    // Fallback remains in-memory if SecureStore is unavailable
  }
}

export async function getQuickUnlockSettings(): Promise<{
  hasPin: boolean;
  pin: string | null;
  biometricsEnabled: boolean;
}> {
  if (inMemoryPinCode) {
    return {
      hasPin: true,
      pin: inMemoryPinCode,
      biometricsEnabled: inMemoryBiometricsEnabled,
    };
  }
  try {
    if (Platform.OS !== 'web') {
      const pin = await SecureStore.getItemAsync(PIN_CODE_STORAGE_KEY);
      const bioRaw = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
      inMemoryPinCode = pin;
      inMemoryBiometricsEnabled = bioRaw === 'true';
      return {
        hasPin: Boolean(pin && pin.length === 4),
        pin,
        biometricsEnabled: inMemoryBiometricsEnabled,
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return {
    hasPin: Boolean(inMemoryPinCode && inMemoryPinCode.length === 4),
    pin: inMemoryPinCode,
    biometricsEnabled: inMemoryBiometricsEnabled,
  };
}

export async function clearAuthSession(): Promise<void> {
  inMemoryToken = null;
  inMemoryUserId = null;
  inMemoryUserEmail = null;
  inMemorySessionCreatedAt = null;
  inMemoryPinCode = null;
  inMemoryBiometricsEnabled = false;
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(USER_ID_STORAGE_KEY);
      await SecureStore.deleteItemAsync(USER_EMAIL_STORAGE_KEY);
      await SecureStore.deleteItemAsync(SESSION_CREATED_AT_KEY);
      await SecureStore.deleteItemAsync(PIN_CODE_STORAGE_KEY);
      await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
    }
  } catch {
    // Ignore storage delete errors on unsupported targets
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach Bearer JWT token to every outgoing API request
apiClient.interceptors.request.use(async (config) => {
  const { token } = await getStoredSession();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CycleDataResponse {
  cycle: {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string | null;
    expected_next_start: string;
  };
  prediction: {
    start_date: string;
    expected_next_start: string;
    ovulation_date: string;
    fertile_window_start: string;
    fertile_window_end: string;
    current_cycle_day: number;
    days_until_next_period: number;
    current_phase: 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';
    phase_description: string;
  };
  logs: Array<{
    id: string;
    log_date: string;
    flow_intensity: string | null;
    symptoms: string[];
    mood: string[];
    notes: string | null;
  }>;
}

export interface UpsertDailyLogPayload {
  user_id: string;
  cycle_id?: string;
  log_date: string;
  flow_intensity: string | null;
  symptoms: string[];
  mood: string[];
  notes?: string;
}

export async function signUpUser(email: string, password: string) {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila';
  const response = await apiClient.post('/api/auth/signup', {
    email,
    password,
    timezone,
  });
  const { token, user } = response.data;
  await saveAuthSession(token, user.id, user.email);
  return { token, user };
}

export async function loginUser(email: string, password: string) {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password,
  });
  const { token, user } = response.data;
  await saveAuthSession(token, user.id, user.email);
  return { token, user };
}

export async function fetchUserCycle(userId: string): Promise<CycleDataResponse> {
  const response = await apiClient.get<CycleDataResponse>(`/api/cycle/${userId}`);
  return response.data;
}

export async function logNewCycleStart(payload: {
  user_id: string;
  start_date: string;
  end_date?: string;
}) {
  const response = await apiClient.post('/api/cycle', payload);
  return response.data;
}

export async function upsertDailySymptomLog(payload: UpsertDailyLogPayload) {
  const response = await apiClient.post('/api/logs', payload);
  return response.data;
}

