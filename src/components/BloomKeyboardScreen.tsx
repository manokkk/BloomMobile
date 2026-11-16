import React, { createContext, useCallback, useContext, useRef } from 'react';
import {
  findNodeHandle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface KeyboardScrollContextValue {
  scrollInputIntoView: (inputHandle: number | null) => void;
}

const KeyboardScrollContext = createContext<KeyboardScrollContextValue | null>(null);

export function useKeyboardScroll() {
  return useContext(KeyboardScrollContext);
}

interface BloomKeyboardScreenProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared screen wrapper providing uniform keyboard avoidance and
 * automatic scroll-into-view whenever any nested BloomTextInput is focused.
 */
export const BloomKeyboardScreen: React.FC<BloomKeyboardScreenProps> = ({
  children,
  contentContainerStyle,
  style,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollInputIntoView = useCallback((inputHandle: number | null) => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) return;

    setTimeout(() => {
      const scrollNode = findNodeHandle(scrollView);
      if (inputHandle && scrollNode) {
        try {
          // Scroll the focused input into view above the mobile keyboard
          const scrollResponder = scrollView.getScrollResponder?.() as any;
          if (scrollResponder?.scrollResponderScrollNativeHandleToKeyboard) {
            scrollResponder.scrollResponderScrollNativeHandleToKeyboard(
              inputHandle,
              96,
              true
            );
            return;
          }
        } catch {
          // Fall through to scrollToEnd if native responder is unavailable
        }
      }
      scrollView.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  return (
    <KeyboardScrollContext.Provider value={{ scrollInputIntoView }}>
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={contentContainerStyle}
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
