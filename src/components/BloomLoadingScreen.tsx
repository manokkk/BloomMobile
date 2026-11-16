import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

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

  // Gentle breathing pulse while waiting for background initialization
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

  // Trigger the rose bloom once everything is ready in the background
  useEffect(() => {
    if (!isReady || hasStartedBloom.current) return;
    hasStartedBloom.current = true;

    Animated.sequence([
      // Brief pause so the closed rosebud is visible even on fast connections
      Animated.delay(350),
      // Unfurl the pink rose petals
      Animated.spring(bloomAnim, {
        toValue: 1,
        friction: 6,
        tension: 36,
        useNativeDriver: true,
      }),
      // Hold the full bloom momentarily before revealing the dashboard
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

  const leftLeafRotate = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-22deg', '-42deg'],
  });

  const rightLeafRotate = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['22deg', '42deg'],
  });

  const outerDistance = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, -34],
  });

  const outerScale = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.68, 1.15],
  });

  const midDistance = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, -22],
  });

  const midScale = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.04],
  });

  const innerDistance = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, -12],
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

        {/* Stem & Leaves */}
        <View style={styles.stemContainer}>
          <View style={styles.stem} />
          <Animated.View
            style={[
              styles.leaf,
              styles.leafLeft,
              { transform: [{ rotate: leftLeafRotate }] },
            ]}
          />
          <Animated.View
            style={[
              styles.leaf,
              styles.leafRight,
              { transform: [{ rotate: rightLeafRotate }] },
            ]}
          />
          <View style={styles.sepal} />
        </View>

        {/* Animated Pink Rose Head */}
        <Animated.View
          style={[
            styles.roseHead,
            { transform: [{ scale: budPulseScale }] },
          ]}
        >
          {/* Outer Petals (Light Blush Pink) */}
          {OUTER_PETAL_ANGLES.map((angle, idx) => (
            <Animated.View
              key={`outer-${idx}`}
              style={[
                styles.petalAnchor,
                { transform: [{ rotate: `${angle}deg` }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.outerPetal,
                  {
                    transform: [
                      { translateY: outerDistance },
                      { scale: outerScale },
                    ],
                  },
                ]}
              />
            </Animated.View>
          ))}

          {/* Middle Petals (Vibrant Rose Pink) */}
          {MID_PETAL_ANGLES.map((angle, idx) => (
            <Animated.View
              key={`mid-${idx}`}
              style={[
                styles.petalAnchor,
                { transform: [{ rotate: `${angle}deg` }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.midPetal,
                  {
                    transform: [
                      { translateY: midDistance },
                      { scale: midScale },
                    ],
                  },
                ]}
              />
            </Animated.View>
          ))}

          {/* Inner Petals (Deep Rose Magenta) */}
          {INNER_PETAL_ANGLES.map((angle, idx) => (
            <Animated.View
              key={`inner-${idx}`}
              style={[
                styles.petalAnchor,
                { transform: [{ rotate: `${angle}deg` }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.innerPetal,
                  {
                    transform: [
                      { translateY: innerDistance },
                      { scale: innerScale },
                    ],
                  },
                ]}
              />
            </Animated.View>
          ))}

          {/* Golden-Pink Rose Center revealed on bloom */}
          <Animated.View
            style={[
              styles.roseCenter,
              { transform: [{ scale: centerScale }] },
            ]}
          />
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
    bottom: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  stem: {
    width: 6,
    height: 68,
    borderRadius: 3,
    backgroundColor: '#4D7C5B',
  },
  sepal: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#3F6A4D',
  },
  leaf: {
    position: 'absolute',
    top: 26,
    width: 30,
    height: 16,
    backgroundColor: '#5C946E',
  },
  leafLeft: {
    right: 6,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
  },
  leafRight: {
    left: 6,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  roseHead: {
    width: 120,
    height: 120,
    marginBottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petalAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerPetal: {
    width: 44,
    height: 52,
    borderRadius: 24,
    backgroundColor: '#F9A8D4',
    borderWidth: 1,
    borderColor: '#F472B6',
    opacity: 0.92,
  },
  midPetal: {
    width: 38,
    height: 44,
    borderRadius: 20,
    backgroundColor: '#F472B6',
    borderWidth: 1,
    borderColor: '#EC4899',
    opacity: 0.95,
  },
  innerPetal: {
    width: 30,
    height: 36,
    borderRadius: 16,
    backgroundColor: '#D23669',
    borderWidth: 1,
    borderColor: '#BE185D',
  },
  roseCenter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FDE68A',
    borderWidth: 3,
    borderColor: '#FB7185',
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
