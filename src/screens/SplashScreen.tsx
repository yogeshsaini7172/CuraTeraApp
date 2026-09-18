import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Staggered animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const dividerScale = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const statusOpacity = useRef(new Animated.Value(1)).current;

  const [statusText, setStatusText] = useState('सुरक्षित पोर्टल से जुड़ रहे हैं...');
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // 1. Continuous breathing ambient aura glow
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 2. Orchestrated Entrance Sequence
    Animated.parallel([
      // Logo spring entrance
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5.5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),

      // Title reveal (staggered +200ms)
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Divider expansion (staggered +400ms)
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(dividerScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Subtitles & Badges reveal (staggered +550ms)
      Animated.sequence([
        Animated.delay(550),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),

      // Progress bar fill (0% -> 100% over 4.5s)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    // 3. Dynamic rotating status updates (calibrated for 5.0s total duration)
    const timer1 = setTimeout(() => {
      Animated.sequence([
        Animated.timing(statusOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(statusOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setStatusText('कल्याणकारी योजनाएं लोड हो रही हैं...');
    }, 1800);

    const timer2 = setTimeout(() => {
      Animated.sequence([
        Animated.timing(statusOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(statusOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setStatusText('तैयार! आपका स्वागत है...');
    }, 3500);

    // 4. Auto navigate at exactly 5.0 seconds
    const finishTimer = setTimeout(() => {
      pulseLoop.stop();
      onFinishRef.current();
    }, 5000);

    return () => {
      pulseLoop.stop();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(finishTimer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* 1. Dynamic Breathing Ambient Aura Rings */}
      <Animated.View
        style={[
          styles.glowCircleOuter,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowCircleInner,
          {
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.15],
                  outputRange: [1.1, 0.95],
                }),
              },
            ],
          },
        ]}
      />

      {/* 2. Main Brand Hero Content */}
      <View style={styles.content}>
        {/* Animated App Logo Card */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/YojnaSplash.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Animated Brand Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.titleHi}>योजना मित्र</Text>
          <Text style={styles.titleEnSub}>YOJNA MITRA</Text>
        </Animated.View>

        {/* Animated Indian Tricolor Divider */}
        <Animated.View
          style={[
            styles.dividerRow,
            {
              transform: [{ scaleX: dividerScale }],
              opacity: subtitleOpacity,
            },
          ]}
        >
          <View style={[styles.dividerSegment, { backgroundColor: '#FF9933' }]} />
          <View style={[styles.dividerSegment, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.dividerSegment, { backgroundColor: '#138808' }]} />
        </Animated.View>

        {/* Tagline & Mitra AI Pill */}
        <Animated.View style={[styles.taglineWrap, { opacity: subtitleOpacity }]}>
          <Text style={styles.tagline}>हर नागरिक का डिजिटल साथी</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✦ Mitra AI • डिजिटल भारत ✦</Text>
          </View>
        </Animated.View>

        {/* Dynamic Loading Progress Bar & Live Status */}
        <Animated.View style={[styles.progressSection, { opacity: subtitleOpacity }]}>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <Animated.Text style={[styles.statusText, { opacity: statusOpacity }]}>
            {statusText}
          </Animated.Text>
        </Animated.View>
      </View>

      {/* 3. Footer GovTech Trust Badges */}
      <Animated.View style={[styles.footer, { opacity: subtitleOpacity }]}>
        <View style={styles.dotRow}>
          <View style={[styles.dot, { backgroundColor: '#FF9933' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.dot, { backgroundColor: '#138808' }]} />
        </View>
        <Text style={styles.footerTrustText}>
          DigiLocker Integrated • राष्ट्रीय जनकल्याण मंच
        </Text>
        <Text style={styles.footerSubText}>
          100% सुरक्षित • प्रत्यक्ष लाभ अंतरण (DBT) समर्थित
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blue.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Breathing Ambient Glow Rings
  glowCircleOuter: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: (width * 0.95) / 2,
    backgroundColor: 'rgba(21, 101, 192, 0.12)',
  },
  glowCircleInner: {
    position: 'absolute',
    width: width * 0.70,
    height: width * 0.70,
    borderRadius: (width * 0.70) / 2,
    backgroundColor: 'rgba(194, 65, 12, 0.08)',
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Logo Wrapper
  logoWrapper: {
    width: 180,
    height: 180,
    borderRadius: 34,
    backgroundColor: Colors.white.pure,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  logoImage: {
    width: 180,
    height: 180,
  },

  // Brand Titles
  titleContainer: {
    alignItems: 'center',
  },
  titleHi: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.white.pure,
    letterSpacing: 0.8,
  },
  titleEnSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 4,
    marginTop: 2,
    opacity: 0.85,
  },

  // Tricolor Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 14,
  },
  dividerSegment: {
    width: 22,
    height: 3,
    borderRadius: 2,
  },

  // Tagline & Badges
  taglineWrap: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white.pure,
    letterSpacing: 0.4,
  },
  aiBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  aiBadgeText: {
    fontSize: 11,
    color: '#FDE047',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Dynamic Progress Bar & Live Status Text
  progressSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  progressBarTrack: {
    width: 180,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.orange.primary,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.70)',
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 0.2,
  },

  // Footer Trust
  footer: {
    position: 'absolute',
    bottom: 28,
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerTrustText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footerSubText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '400',
    marginTop: 2,
  },
});
