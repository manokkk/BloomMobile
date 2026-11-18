import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

interface BloomLoadingScreenProps {
  isReady: boolean;
  onFinish?: () => void;
}

const OUTER_PETAL_ANGLES = [0, 60, 120, 180, 240, 300];
const MID_PETAL_ANGLES = [25, 97, 169, 241, 313];
const INNER_PETAL_ANGLES = [45, 135, 225, 315];

export const BloomLoadingScreen: React.FC<BloomLoadingScreenProps> = ({
  isReady,
  onFinish,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bloomAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const hasStartedBloom = useRef(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (!isReady || hasStartedBloom.current) return;
    hasStartedBloom.current = true;

    Animated.sequence([
      Animated.delay(350),
      Animated.spring(bloomAnim, {
        toValue: 1,
        friction: 6,
        tension: 36,
        useNativeDriver: true,
      }),
      Animated.delay(350),
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onFinish?.();
      }
    });
  }, [isReady, bloomAnim, fadeOutAnim, onFinish]);

  const budPulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });

  const haloScale = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.45],
  });

  const haloOpacity = bloomAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.45, 0.8, 0.35],
  });

  const centerScale = bloomAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.6, 1],
  });

  const outerDistance = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, -32],
  });

  const outerScale = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.68, 1.15],
  });

  const midDistance = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, -20],
  });

  const midScale = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.04],
  });

  const innerDistance = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, -11],
  });

  const innerScale = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0.96],
  });

  return (
    <Animated.View style={[styles.screen, { opacity: fadeOutAnim }]}>
      <View style={styles.centerStage}>
        {/* Soft Blush Halo */}
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />

        {/* SVG Stem & Leaves */}
        <View style={styles.stemContainer}>
          <Svg width={100} height={84} viewBox="0 0 100 84">
            <G>
              <Path
                d="M50 6 C50 28, 49 54, 50 78"
                stroke="#4D7C5B"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M48 34 C30 25, 16 30, 14 42 C26 47, 39 44, 48 34 Z"
                fill="#5C946E"
              />
              <Path
                d="M52 42 C70 33, 84 38, 86 50 C74 55, 61 52, 52 42 Z"
                fill="#4D7C5B"
              />
              <Path
                d="M36 4 Q50 16 64 4 Q50 10 36 4 Z"
                fill="#3F6A4D"
              />
            </G>
          </Svg>
        </View>

        {/* Animated SVG Pink Rose Head */}
        <Animated.View
          style={[
            styles.roseHead,
            { transform: [{ scale: budPulseScale }] },
          ]}
        >
          {/* Outer SVG Petals */}
          {OUTER_PETAL_ANGLES.map((angle, idx) => (
            <Animated.View
              key={`outer-${idx}`}
              style={[
                styles.petalAnchor,
                { transform: [{ rotate: `${angle}deg` }] },
              ]}
            >
              <Animated.View
                style={{
                  transform: [
                    { translateY: outerDistance },
                    { scale: outerScale },
                  ],
                }}
              >
                <Svg width={46} height={54} viewBox="0 0 46 54">
                  <Ellipse
                    cx="23"
                    cy="27"
                    rx="21"
                    ry="25"
                    fill="#F9A8D4"
                    stroke="#F472B6"
                    strokeWidth="1.5"
                  />
                </Svg>
              </Animated.View>
            </Animated.View>
          ))}

          {/* Middle SVG Petals */}
          {MID_PETAL_ANGLES.map((angle, idx) => (
            <Animated.View
              key={`mid-${idx}`}
              style={[
                styles.petalAnchor,
                { transform: [{ rotate: `${angle}deg` }] },
              ]}
            >
              <Animated.View
                style={{
                  transform: [
                    { translateY: midDistance },
                    { scale: midScale },
                  ],
                }}
              >
                <Svg width={40} height={46} viewBox="0 0 40 46">
                  <Ellipse
                    cx="20"
                    cy="23"
                    rx="18"
                    ry="21"
                    fill="#F472B6"
                    stroke="#EC4899"
                    strokeWidth="1.5"
                  />
                </Svg>
              </Animated.View>
            </Animated.View>
          ))}

          {/* Inner SVG Petals */}
          {INNER_PETAL_ANGLES.map((angle, idx) => (
            <Animated.View
              key={`inner-${idx}`}
              style={[
                styles.petalAnchor,
                { transform: [{ rotate: `${angle}deg` }] },
              ]}
            >
              <Animated.View
                style={{
                  transform: [
                    { translateY: innerDistance },
                    { scale: innerScale },
                  ],
                }}
              >
                <Svg width={32} height={38} viewBox="0 0 32 38">
                  <Ellipse
                    cx="16"
                    cy="19"
                    rx="14"
                    ry="17"
                    fill="#D23669"
                    stroke="#BE185D"
                    strokeWidth="1.5"
                  />
                </Svg>
              </Animated.View>
            </Animated.View>
          ))}

          {/* Golden-Pink SVG Rose Center */}
          <Animated.View
            style={{ transform: [{ scale: centerScale }] }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Circle
                cx="12"
                cy="12"
                r="10"
                fill="#FDE68A"
                stroke="#FB7185"
                strokeWidth="3"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      </View>

      <Text style={styles.brandTitle}>Bloom</Text>
      <Text style={styles.subtitle}>
        {isReady ? 'Your space is ready' : 'Preparing your private Bloom space...'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFAF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStage: {
    width: 200,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FCE7F3',
  },
  stemContainer: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  roseHead: {
    width: 120,
    height: 120,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petalAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: '700',
    color: '#D23669',
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#5C5465',
  },
});
