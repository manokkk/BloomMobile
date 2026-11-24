import React, {
  ComponentRef,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface KeyboardScrollContextValue {
  scrollInputIntoView: (target: any) => void;
  ensureFocusedVisible: () => void;
}

const KeyboardScrollContext = createContext<KeyboardScrollContextValue | null>(null);

export function useKeyboardScroll() {
  return useContext(KeyboardScrollContext);
}

interface BloomKeyboardScreenProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  extraOffset?: number;
}

/**
 * Shared screen wrapper providing uniform keyboard avoidance and
 * automatic scroll-into-view whenever any nested BloomTextInput is focused.
 */
export const BloomKeyboardScreen: React.FC<BloomKeyboardScreenProps> = ({
  children,
  contentContainerStyle,
  style,
  extraOffset = 28,
}) => {
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const focusedTargetRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scrollToTarget = useCallback(
    (target: any, kbHeightOverride?: number) => {
      const scrollView = scrollViewRef.current;
      if (
        !scrollView ||
        !target ||
        typeof target.measureInWindow !== 'function'
      ) {
        return;
      }

      const kbHeight = kbHeightOverride ?? keyboardHeightRef.current;
      const windowHeight = Dimensions.get('window').height;
      const effectiveKbHeight = kbHeight > 0 ? kbHeight : 300;
      const visibleBottom = windowHeight - effectiveKbHeight - extraOffset;

      target.measureInWindow(
        (_x: number, y: number, _width: number, height: number) => {
          if (!Number.isFinite(y) || !Number.isFinite(height)) return;
          const inputBottom = y + height;

          if (inputBottom > visibleBottom) {
            const delta = inputBottom - visibleBottom + 16;
            scrollView.scrollTo({
              y: Math.max(0, scrollYRef.current + delta),
              animated: true,
            });
          } else if (y < 72) {
            const delta = 72 - y;
            scrollView.scrollTo({
              y: Math.max(0, scrollYRef.current - delta),
              animated: true,
            });
          }
        }
      );
    },
    [extraOffset]
  );

  const scheduleScrollToFocused = useCallback(
    (delayMs: number, kbHeightOverride?: number) => {
      clearPendingTimer();
      timerRef.current = setTimeout(() => {
        if (focusedTargetRef.current) {
          scrollToTarget(focusedTargetRef.current, kbHeightOverride);
        }
      }, delayMs);
    },
    [clearPendingTimer, scrollToTarget]
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates?.height ?? 0;
      keyboardHeightRef.current = height;
      setKeyboardHeight(height);
      if (focusedTargetRef.current) {
        scheduleScrollToFocused(Platform.OS === 'ios' ? 60 : 120, height);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      clearPendingTimer();
    };
  }, [clearPendingTimer, scheduleScrollToFocused]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const scrollInputIntoView = useCallback(
    (target: any) => {
      if (target) {
        focusedTargetRef.current = target;
      }
      scheduleScrollToFocused(Platform.OS === 'ios' ? 80 : 160);
    },
    [scheduleScrollToFocused]
  );

  const ensureFocusedVisible = useCallback(() => {
    if (focusedTargetRef.current) {
      scheduleScrollToFocused(60);
    }
  }, [scheduleScrollToFocused]);

  return (
    <KeyboardScrollContext.Provider
      value={{ scrollInputIntoView, ensureFocusedVisible }}
    >
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.flex}
          contentContainerStyle={[
            contentContainerStyle,
            keyboardHeight > 0 && { paddingBottom: 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardScrollContext.Provider>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },
});
