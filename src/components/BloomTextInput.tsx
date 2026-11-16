import React, { useRef, useState } from 'react';
import {
  findNodeHandle,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { useKeyboardScroll } from './BloomKeyboardScreen';

export interface BloomTextInputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
}

/**
 * Shared TextInput with uniform Bloom focus-ring highlight (#D23669)
 * and automatic keyboard scroll-into-view when inside BloomKeyboardScreen.
 */
export const BloomTextInput: React.FC<BloomTextInputProps> = ({
  style,
  onFocus,
  onBlur,
  placeholderTextColor = '#9E95A5',
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const keyboardScroll = useKeyboardScroll();

  return (
    <TextInput
      ref={inputRef}
      placeholderTextColor={placeholderTextColor}
      {...rest}
      style={[
        styles.input,
        rest.multiline && styles.multilineInput,
        focused && styles.inputFocused,
        style,
      ]}
      onFocus={(e) => {
        setFocused(true);
        keyboardScroll?.scrollInputIntoView(findNodeHandle(inputRef.current));
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFAF0',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2D2A32',
  },
  multilineInput: {
    borderRadius: 20,
    minHeight: 76,
    textAlignVertical: 'top',
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D23669',
    shadowColor: '#D23669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2,
  },
});
