import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';

const { width } = Dimensions.get('window');

/**
 * SplashScreen — Pure branded loading screen.
 *
 * No internal timer. App.tsx drives the minimum 4-second wait
 * (parallel with auth check) and calls onFinish when ready.
 * This component just shows the brand and fades in nicely.
 */
export const SplashScreen: React.FC = () => {
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const logoScale     = useRef(new Animated.Value(0.82)).current;
  const titleOpacity  = useRef(new Animated.Value(0)).current;
  const titleSlideY   = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowScale     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous breathing glow
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.18,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();

    // Staggered entrance
    Animated.sequence([
      // Logo appears first
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 38,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Title slides up 200ms later
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleSlideY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Tagline fades in 150ms after title
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    return () => {
      glow.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Ambient glow ring */}
      <Animated.View
        style={[styles.glowRing, { transform: [{ scale: glowScale }] }]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image
          source={require('../../assets/CuraTera_Logo.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* App Name */}
      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleSlideY }],
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <Text style={styles.appName}>CuraTera</Text>
        <Text style={styles.appSub}>EMPOWERING CITIZENS</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        हर नागरिक का डिजिटल साथी
      </Animated.Text>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: taglineOpacity }]}>
        <View style={styles.tribar}>
          <View style={[styles.tribarSegment, { backgroundColor: '#FF9933' }]} />
          <View style={[styles.tribarSegment, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.tribarSegment, { backgroundColor: '#138808' }]} />
        </View>
        <Text style={styles.footerText}>Powered by Avensoft</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
    alignItems: 'center',
    justifyContent: 'center',
  },

  glowRing: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: 'rgba(30, 90, 160, 0.14)',
  },

  logoWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
  },

  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  appSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 4,
    marginTop: 3,
    opacity: 0.85,
  },

  tagline: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.4,
  },

  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
    gap: 8,
  },
  tribar: {
    flexDirection: 'row',
    gap: 5,
  },
  tribarSegment: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.40)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
