/**
 * TypingIndicator - Animated bouncing dots that mimic a "typing..." indicator.
 * Three dots animate up and down in sequence, like iMessage / WhatsApp.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const DOT_SIZE = 8;
const BOUNCE_HEIGHT = -6;
const DURATION = 400;

const AnimatedDot: React.FC<{ delay: number }> = ({ delay }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: BOUNCE_HEIGHT,
          duration: DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: DURATION,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, translateY]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { transform: [{ translateY }] },
      ]}
    />
  );
};

export const TypingIndicator: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <AnimatedDot delay={0} />
        <AnimatedDot delay={150} />
        <AnimatedDot delay={300} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    maxWidth: '88%',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#94A3B8',
  },
});

export default TypingIndicator;
