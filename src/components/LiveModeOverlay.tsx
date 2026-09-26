import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  StatusBar,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '../utils/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Gemini's actual color palette
const COLORS = {
  bg: '#131314',              // Gemini dark background
  textPrimary: '#E3E3E3',
  textSecondary: '#8E8E93',
  textTranscript: '#C4C7C5',
  waveBlue: '#4285F4',        // Google Blue
  waveCyan: '#34A853',        // Google Green  
  wavePurple: '#A855F7',      // Purple accent
  waveActive: '#8AB4F8',      // Bright blue when active
  endCallBg: '#EA4335',       // Google Red
  controlBg: 'rgba(255,255,255,0.08)',
  controlBgHover: 'rgba(255,255,255,0.14)',
  pillBg: 'rgba(255,255,255,0.06)',
  sparkleGlow: 'rgba(66, 133, 244, 0.3)',
};

const WAVE_BAR_COUNT = 5;
const WAVE_BAR_WIDTH = 4;
const WAVE_BAR_GAP = 5;

interface LiveModeOverlayProps {
  visible: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  isMuted: boolean;
  transcript: string;
  aiResponse: string;
  currentLanguage: string;
  onToggleMute: () => void;
  onEndSession: () => void;
}

const LiveModeOverlay: React.FC<LiveModeOverlayProps> = ({
  visible,
  isListening,
  isSpeaking,
  isLoading,
  isMuted,
  transcript,
  aiResponse,
  currentLanguage,
  onToggleMute,
  onEndSession,
}) => {
  const isEn = currentLanguage === 'en';

  // === Animations ===
  const fadeIn = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(0.3)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const sparkleTranslateY = useRef(new Animated.Value(-100)).current;
  const waveformOpacity = useRef(new Animated.Value(0)).current;
  const statusDotPulse = useRef(new Animated.Value(1)).current;
  const transcriptFade = useRef(new Animated.Value(0)).current;

  // Waveform bars
  const waveBars = useRef(
    Array.from({ length: WAVE_BAR_COUNT }, () => new Animated.Value(12))
  ).current;

  // Glow pulse for the sparkle
  const sparkleGlowScale = useRef(new Animated.Value(1)).current;

  // Entrance animation: Sparkle drops → morphs into waveform
  useEffect(() => {
    if (visible) {
      // Reset
      sparkleScale.setValue(0.3);
      sparkleOpacity.setValue(0);
      sparkleTranslateY.setValue(-100);
      waveformOpacity.setValue(0);

      Animated.sequence([
        // 1. Fade in background
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // 2. Sparkle appears in center and drops down
        Animated.parallel([
          Animated.timing(sparkleOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(sparkleScale, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
        ]),
        // 3. Waveform fades in
        Animated.timing(waveformOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeIn.setValue(0);
      sparkleOpacity.setValue(0);
      waveformOpacity.setValue(0);
    }
  }, [visible]);

  // Sparkle glow pulse (continuous) - REMOVED per user request


  // Status dot pulse
  useEffect(() => {
    if (!visible) return;
    const dotPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(statusDotPulse, {
          toValue: 1.5,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(statusDotPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    dotPulse.start();
    return () => dotPulse.stop();
  }, [visible]);

  // Waveform animation — reactive to state
  useEffect(() => {
    if (!visible) return;

    const animateWave = () => {
      const animations = waveBars.map((bar, i) => {
        let minH: number, maxH: number, dur: number;

        if (isListening) {
          // Active listening: Tall, fast, energetic bars
          minH = 16 + Math.random() * 8;
          maxH = 30 + Math.random() * 28;
          dur = 150 + Math.random() * 150;
        } else if (isSpeaking) {
          // AI speaking: Smooth, medium-height breathing bars
          minH = 12 + Math.random() * 6;
          maxH = 24 + Math.random() * 22;
          dur = 200 + Math.random() * 200;
        } else if (isLoading) {
          // Thinking: Gentle low pulse
          minH = 8 + Math.random() * 4;
          maxH = 16 + Math.random() * 12;
          dur = 400 + Math.random() * 200;
        } else {
          // Idle: Very subtle breathing
          minH = 6;
          maxH = 10 + Math.random() * 6;
          dur = 600 + Math.random() * 300;
        }

        return Animated.sequence([
          Animated.timing(bar, {
            toValue: maxH,
            duration: dur,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: minH,
            duration: dur,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]);
      });

      Animated.parallel(animations).start(() => {
        if (visible) animateWave();
      });
    };

    animateWave();
  }, [visible, isListening, isSpeaking, isLoading]);

  // Transcript fade
  useEffect(() => {
    Animated.timing(transcriptFade, {
      toValue: (transcript || aiResponse) ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [transcript, aiResponse]);

  const getStatusText = () => {
    if (isMuted) return isEn ? 'Muted' : 'म्यूट';
    if (isListening) return isEn ? 'Listening...' : 'सुन रहा हूँ...';
    if (isLoading) return isEn ? 'Thinking...' : 'सोच रहा हूँ...';
    if (isSpeaking) return isEn ? 'Speaking...' : 'बोल रहा हूँ...';
    return isEn ? 'Ready' : 'तैयार';
  };

  const getStatusColor = () => {
    if (isMuted) return '#9AA0A6';
    if (isListening) return COLORS.waveBlue;
    if (isLoading) return COLORS.wavePurple;
    if (isSpeaking) return COLORS.waveCyan;
    return COLORS.textSecondary;
  };

  const getWaveColor = () => {
    if (isMuted) return '#5F6368';
    if (isListening) return COLORS.waveActive;
    if (isSpeaking) return COLORS.waveCyan;
    if (isLoading) return COLORS.wavePurple;
    return '#5F6368';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onEndSession}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <Animated.View style={[styles.overlay, { opacity: fadeIn }]}>

        {/* ── Top: Status ── */}
        <View style={styles.topArea}>
          <View style={styles.statusRow}>
            <Animated.View style={[
              styles.statusDot,
              {
                backgroundColor: getStatusColor(),
                transform: [{ scale: statusDotPulse }],
              },
            ]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* ── Center: Transcript / AI Response ── */}
        <View style={styles.centerArea}>
          <Animated.View style={{ opacity: transcriptFade }}>
            {transcript ? (
              <Text style={styles.userTranscript}>"{transcript}"</Text>
            ) : aiResponse ? (
              <Text style={styles.aiResponseText} numberOfLines={6}>
                {aiResponse}
              </Text>
            ) : (
              <Text style={styles.placeholderText}>
                {isEn
                  ? isMuted ? 'Microphone is muted' : 'Start speaking...'
                  : isMuted ? 'माइक्रोफ़ोन म्यूट है' : 'बोलना शुरू करें...'}
              </Text>
            )}
          </Animated.View>
        </View>

        {/* ── Bottom: Gemini-style Waveform Pill + Controls ── */}
        <View style={styles.bottomSection}>

          {/* Waveform Pill (The Gemini Signature) */}
          <Animated.View style={[styles.waveformPill, { opacity: waveformOpacity }]}>
            {/* Glow behind sparkle */}
            <Animated.View style={[
              styles.sparkleGlow,
              { transform: [{ scale: sparkleGlowScale }] },
            ]} />

            {/* Left waveform bars */}
            <View style={styles.waveformBarsGroup}>
              {waveBars.slice(0, Math.floor(WAVE_BAR_COUNT / 2)).map((barHeight, i) => (
                <Animated.View
                  key={`left-${i}`}
                  style={[
                    styles.waveBar,
                    {
                      height: barHeight,
                      backgroundColor: getWaveColor(),
                      opacity: isMuted ? 0.3 : 0.9,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Center: Sparkle Logo */}
            <Animated.View style={[
              styles.sparkleContainer,
              {
                opacity: sparkleOpacity,
                transform: [
                  { scale: sparkleScale },
                  { translateY: sparkleTranslateY },
                ],
              },
            ]}>
              <View style={styles.sparkleIcon}>
                <Ionicons name="sparkles" size={22} color={COLORS.waveBlue} />
              </View>
            </Animated.View>

            {/* Right waveform bars */}
            <View style={styles.waveformBarsGroup}>
              {waveBars.slice(Math.floor(WAVE_BAR_COUNT / 2)).map((barHeight, i) => (
                <Animated.View
                  key={`right-${i}`}
                  style={[
                    styles.waveBar,
                    {
                      height: barHeight,
                      backgroundColor: getWaveColor(),
                      opacity: isMuted ? 0.3 : 0.9,
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Control Buttons Row */}
          <View style={styles.controlsRow}>
            {/* Mute */}
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnMuted]}
              onPress={() => {
                Vibration.vibrate(25);
                onToggleMute();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={22}
                color={isMuted ? '#EA4335' : COLORS.textPrimary}
              />
            </TouchableOpacity>

            {/* End Session */}
            <TouchableOpacity
              style={styles.endBtn}
              onPress={() => {
                Vibration.vibrate(40);
                onEndSession();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Back to Chat */}
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={onEndSession}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Top ──
  topArea: {
    paddingTop: Platform.OS === 'android' ? 50 : 64,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Center ──
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  userTranscript: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 32,
  },
  aiResponseText: {
    fontSize: 17,
    fontWeight: '400',
    color: COLORS.textTranscript,
    textAlign: 'center',
    lineHeight: 26,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#5F6368',
    textAlign: 'center',
  },

  // ── Bottom ──
  bottomSection: {
    paddingBottom: Platform.OS === 'android' ? 36 : 48,
    alignItems: 'center',
    gap: 28,
  },

  // Waveform Pill (Gemini's signature element)
  waveformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: WAVE_BAR_GAP,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 40,
    paddingHorizontal: 28,
    paddingVertical: 18,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  waveformBarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WAVE_BAR_GAP,
  },
  waveBar: {
    width: WAVE_BAR_WIDTH,
    borderRadius: WAVE_BAR_WIDTH / 2,
    minHeight: 6,
  },

  // Sparkle
  sparkleContainer: {
    marginHorizontal: 10,
  },
  sparkleIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(66, 133, 244, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.sparkleGlow,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -35,
    top: '50%',
    marginTop: -35,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.controlBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  controlBtnMuted: {
    backgroundColor: 'rgba(234, 67, 53, 0.12)',
    borderColor: 'rgba(234, 67, 53, 0.2)',
  },
  endBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.endCallBg,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.endCallBg,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});

export default LiveModeOverlay;
