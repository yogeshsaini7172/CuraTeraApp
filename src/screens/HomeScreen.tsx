import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Scheme, NavTab } from '../types';
import { DemoUser, DEMO_USERS } from '../data/demoUsers';
import { SupportedLanguage } from '../i18n/translations';
import { Header } from '../components/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 84% width allows the next card to peek gracefully on the right
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.83);
const CARD_GAP = 14;
const SIDE_SPACER = Math.round((SCREEN_WIDTH - CARD_WIDTH) / 2);

// Smooth multi-step opacity fade from active color into white (mixing into white, no curve)
const FADE_STEPS = [
  0.95, 0.88, 0.80, 0.72, 0.64, 0.56, 0.48, 0.40, 0.32, 0.25, 0.18, 0.12, 0.07, 0.03, 0.01, 0,
];

function hexToRgb(hex: string) {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Subtly lighten card colors to make them softer and fresh while preserving vivid tone
function lightenColor(hex: string, amount: number = 0.18): string {
  const { r, g, b } = hexToRgb(hex);
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));
  return `rgb(${newR}, ${newG}, ${newB})`;
}

// Color-matched light gray text palette per card:
// - First card (Voice AI): Crisp pure white (#FFFFFF)
// - Other scheme cards: Refined light gray tones (eliminating harsh white over-highlighting)
function getCardTextColors(scheme: Scheme, isVoiceAi: boolean) {
  if (isVoiceAi) {
    return {
      titleColor: '#FFFFFF',
      descColor: 'rgba(255, 255, 255, 0.85)',
    };
  }

  const isWarmScheme =
    scheme.category === 'farming' ||
    scheme.id === 'pm-mudra-yojana' ||
    scheme.id === 'pm-kisan';

  if (isWarmScheme) {
    return {
      titleColor: '#F3F4F6', // Soft warm light gray (Gray-100)
      descColor: '#D1D5DB',  // Balanced light gray (Gray-300)
    };
  }

  // Cool schemes (PMAY Blue, Sukanya Purple, Antyodaya Teal, etc.)
  return {
    titleColor: '#E2E8F0', // Soft cool light gray (Slate-200)
    descColor: '#CBD5E1',  // Balanced cool light gray (Slate-300)
  };
}

interface HomeScreenProps {
  schemes: Scheme[];
  onViewDocs: (scheme: Scheme) => void;
  onNavigateToSchemes: () => void;
  onStartVoiceChat?: () => void;
  onNavigateToTab?: (tab: NavTab) => void;
  activeUser?: DemoUser;
  onOpenProfile?: () => void;
  onOpenUserSwitcher?: () => void;
  onOpenNotifications?: () => void;
  eligibleCount?: number;
  unreadCount?: number;
  currentLanguage?: SupportedLanguage;
  onActiveSchemeChange?: (scheme: Scheme | null) => void;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
}

// Flagship Hero Card #1: AI Voice Mitra Assistant (Poster Style)
const VOICE_AI_CARD: Scheme = {
  id: 'intro-voice-mitra',
  titleHi: 'बोलकर पूछें,\nमित्र बताएगा!',
  titleEn: 'Ask by Voice,\nCuraTera Explains!',
  category: 'farming',
  categoryLabelHi: 'AI साथी',
  categoryLabelEn: 'AI CuraTera',
  ministryHi: 'CuraTera 24x7 स्मार्ट असिस्टेंट',
  ministryEn: 'CuraTera 24x7 Smart Assistant',
  benefitHi: 'माइक दबाएं और अपनी भाषा में किसी भी सरकारी योजना की जानकारी व पात्रता तुरंत पाएं।',
  benefitEn: 'Tap mic and ask anything about government schemes in your own language.',
  benefitAmount: '24x7 AI साथी',
  benefitAmountHi: '24x7 AI साथी',
  benefitAmountEn: '24x7 AI CuraTera',
  isEligible: true,
  matchPercentage: 100,
  whyEligibleHi: 'सभी नागरिकों के लिए मुफ्त',
  whyEligibleEn: 'Free for all citizens',
  descriptionHi: 'माइक दबाकर बोलें • हिंदी, English व क्षेत्रीय भाषाओं में तुरंत सहायता पाएं 👉',
  descriptionEn: 'Tap mic & talk • Instant guidance in Hindi, English & regional languages 👉',
  requiredDocsHi: ['आवाज़ से पूछें', 'कोई टाइपिंग नहीं'],
  requiredDocsEn: ['Speak by voice', 'No typing needed'],
  officialUrl: 'https://www.india.gov.in',
  helplinePhone: '1800111555',
  themeColor: '#4F46E5',
  themeLight: '#EEF2FF',
  themeBorder: '#818CF8',
  themeDark: '#1E1B4B',
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  schemes,
  onViewDocs,
  onNavigateToSchemes,
  onStartVoiceChat,
  onNavigateToTab,
  activeUser,
  onOpenProfile,
  onOpenUserSwitcher,
  onOpenNotifications,
  eligibleCount = 0,
  unreadCount = 2,
  currentLanguage = 'hi',
  onActiveSchemeChange,
  registerBackHandler,
}) => {
  const isEn = currentLanguage === 'en';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Step-by-step internal back action handler (Clear search -> Tab pop)
  const handleInternalBack = useCallback((): boolean => {
    if (searchQuery.length > 0) {
      setSearchQuery('');
      setActiveIndex(0);
      scrollRef.current?.scrollTo({ x: 0, animated: true });
      return true;
    }
    return false;
  }, [searchQuery]);

  useEffect(() => {
    registerBackHandler?.(handleInternalBack);
    return () => registerBackHandler?.(null);
  }, [handleInternalBack, registerBackHandler]);

  // 1. Initial Load: Pick 8 diverse/random schemes from available list
  const [initialRandomPool] = useState<Scheme[]>(() => {
    const copy = [...schemes];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 8);
  });

  // 2. Dynamic Schemes (Voice AI Card + random pool or search matches)
  const displaySchemes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      return schemes
        .filter((s) => {
          const matchesSearch =
            s.titleHi.toLowerCase().includes(query) ||
            s.titleEn.toLowerCase().includes(query) ||
            s.benefitHi.toLowerCase().includes(query) ||
            s.benefitEn.toLowerCase().includes(query) ||
            s.categoryLabelHi.toLowerCase().includes(query) ||
            s.categoryLabelEn.toLowerCase().includes(query);
          return matchesSearch;
        })
        .slice(0, 8);
    }
    return [VOICE_AI_CARD, ...initialRandomPool];
  }, [schemes, searchQuery, initialRandomPool]);

  // Top 3 schemes recommended by CuraTerra-AI Recommendation Agent
  const recommendedSchemes = useMemo(() => {
    const eligible = schemes.filter((s) => s.isEligible);
    return eligible.length > 0 ? eligible.slice(0, 3) : schemes.slice(0, 3);
  }, [schemes]);

  // Notify parent of active scheme so colors sync seamlessly
  useEffect(() => {
    if (displaySchemes.length > 0) {
      const active = displaySchemes[activeIndex] || displaySchemes[0];
      onActiveSchemeChange?.(active);
    } else {
      onActiveSchemeChange?.(null);
    }
  }, [activeIndex, displaySchemes, onActiveSchemeChange]);

  // Auto-slide carousel every 3.5 seconds with smart pause on touch
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (displaySchemes.length <= 1 || isUserInteracting) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % displaySchemes.length;
        scrollRef.current?.scrollTo({
          x: nextIndex * (CARD_WIDTH + CARD_GAP),
          animated: true,
        });
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [displaySchemes.length, isUserInteracting]);

  const handleTouchStart = () => {
    setIsUserInteracting(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    // Resume auto-slide 5 seconds after touch ceases
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 5000);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
    if (index !== activeIndex && index >= 0 && index < displaySchemes.length) {
      setActiveIndex(index);
    }
  };

  const currentActiveScheme = displaySchemes[activeIndex] || displaySchemes[0];
  const activeThemeDark = currentActiveScheme?.themeDark || '#1E3A8A';
  const activeThemeLight = currentActiveScheme?.themeLight || '#EFF6FF';

  // RGB for smooth linear color-to-white mixing
  const rgb = useMemo(() => hexToRgb(activeThemeLight), [activeThemeLight]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[1]}
      >
        {/* ── 0. Top Header (Scrolls smoothly off-screen as user scrolls down) ── */}
        <View style={{ backgroundColor: activeThemeLight }}>
          <Header
            isHome={true}
            activeTab="home"
            activeDemoUser={activeUser || ({ id: 'citizen', name: 'Citizen', profile: {} } as any)}
            onOpenUserSwitcher={onOpenUserSwitcher || onOpenProfile || (() => {})}
            onOpenNotifications={onOpenNotifications || (() => {})}
            onNavigateToProfile={() => onNavigateToTab?.('profile')}
            eligibleCount={eligibleCount}
            unreadCount={unreadCount}
            currentLanguage={currentLanguage}
            themeLight={activeThemeLight}
            themeColor={currentActiveScheme?.themeColor}
          />
        </View>

        {/* ── 1. Floating Sticky Search Bar (Sticks cleanly at the top) ── */}
        <View style={[styles.stickySearchWrapper, { backgroundColor: activeThemeLight }]}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={19} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder={isEn ? 'Search schemes...' : 'योजना खोजें...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setActiveIndex(0);
                scrollRef.current?.scrollTo({ x: 0, animated: true });
              }}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setActiveIndex(0);
                  scrollRef.current?.scrollTo({ x: 0, animated: true });
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── 2. Body Content (Canopy Fade, Hero Carousel, Quick Actions, Recommended List) ── */}
        <View style={styles.bodyContent}>
          {/* Dynamic Color Backdrop Mixing into White */}
          <View pointerEvents="none" style={styles.gradientCanopyWrapper}>
            <View style={[styles.solidCanopy, { backgroundColor: activeThemeLight }]} />
            {FADE_STEPS.map((alpha, idx) => (
              <View
                key={idx}
                style={[
                  styles.fadeStrip,
                  {
                    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`,
                  },
                ]}
              />
            ))}
          </View>

        {/* ── 2. Flagship Card Carousel (Peeking next card, bigger title, reduced image, no extra text) ── */}
        {displaySchemes.length > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.cardCarouselContent,
              { paddingLeft: SIDE_SPACER, paddingRight: SIDE_SPACER },
            ]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onTouchStart={handleTouchStart}
            onScrollBeginDrag={handleTouchStart}
          >
            {displaySchemes.map((scheme) => {
              const isVoiceAi = scheme.id === 'intro-voice-mitra';
              const title = isEn ? scheme.titleEn : scheme.titleHi;
              const benefit = isEn
                ? (scheme.benefitAmountEn || scheme.benefitAmount)
                : (scheme.benefitAmountHi || scheme.benefitAmount);
              const infoText = isEn ? scheme.descriptionEn : scheme.descriptionHi;

              const themeDark = scheme.themeDark || '#1E293B';
              const themeBorder = scheme.themeBorder || '#FDBA74';
              const cardTextColors = getCardTextColors(scheme, isVoiceAi);

              // First card (Voice AI) stays rich dark (#1E1B4B).
              // Other scheme cards are made slightly lighter and fresher than themeDark.
              const cardBgColor = isVoiceAi
                ? themeDark
                : lightenColor(scheme.themeColor || '#2563EB', 0.16);
              const cardBorderColor = isVoiceAi
                ? themeBorder
                : (scheme.themeBorder || '#93C5FD');

              // High-Res Unique Category Image
              const schemeImage =
                scheme.image ||
                (scheme.category === 'housing'
                  ? require('../../assets/scheme_awas.jpg')
                  : scheme.category === 'health'
                  ? require('../../assets/scheme_health.jpg')
                  : scheme.category === 'education'
                  ? require('../../assets/scheme_education.jpg')
                  : require('../../assets/scheme_kisan.jpg'));

              return (
                <TouchableOpacity
                  key={scheme.id}
                  style={[
                    styles.heroCard,
                    {
                      backgroundColor: cardBgColor,
                      borderColor: cardBorderColor,
                    },
                  ]}
                  onPress={() => {
                    if (isVoiceAi) {
                      if (onStartVoiceChat) {
                        onStartVoiceChat();
                      } else {
                        onNavigateToSchemes();
                      }
                    } else {
                      onViewDocs(scheme);
                    }
                  }}
                  activeOpacity={0.94}
                >
                  {isVoiceAi ? (
                    <View style={styles.voiceCardInner}>
                      {/* 1. Header with Live Status & Language Badges */}
                      <View style={styles.voiceTopHeader}>
                        <View style={styles.voiceTagRow}>
                          <View style={styles.liveAiChip}>
                            <View style={styles.liveGreenDot} />
                            <Text style={styles.liveAiChipText}>
                              {isEn ? 'AI Mitra Live 24x7' : '⚡ AI मित्र 24x7'}
                            </Text>
                          </View>
                          <View style={styles.langChip}>
                            <Text style={styles.langChipText}>
                              {isEn ? 'Voice Assistant' : 'बोलकर खोजें'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.voiceMainTitle}>
                          {title}
                        </Text>
                        <Text style={styles.voiceSubtitle}>
                          {isEn
                            ? 'Tap mic & ask anything in your native language'
                            : 'माइक दबाएं और अपनी भाषा में कोई भी योजना पूछें'}
                        </Text>
                      </View>

                      {/* 2. Center Hero Graphic: Glowing Mic Orb + Live Example Speech Prompts */}
                      <View style={styles.voiceCenterHero}>
                        {/* Dynamic Pulsing Voice Orb */}
                        <View style={styles.voiceOrbOuter}>
                          <View style={styles.voiceOrbMiddle}>
                            <View style={styles.voiceOrbCore}>
                              <Ionicons name="mic" size={28} color="#FFFFFF" />
                            </View>
                          </View>
                        </View>

                        {/* Floating Realistic Speech Prompts */}
                        <View style={styles.speechPromptsList}>
                          <View style={[styles.speechBubble, styles.bubbleLeft]}>
                            <Text style={styles.bubbleEmoji}>👧</Text>
                            <Text style={styles.bubbleText}>
                              {isEn ? 'Schemes for daughter education?' : 'बेटी की पढ़ाई के लिए कौन-सी योजना है?'}
                            </Text>
                          </View>

                          <View style={[styles.speechBubble, styles.bubbleRight]}>
                            <Text style={styles.bubbleEmoji}>🌾</Text>
                            <Text style={styles.bubbleText}>
                              {isEn ? 'Subsidies for farming & seeds?' : 'खेती और खाद पर सरकारी सहायता कैसे पाएं?'}
                            </Text>
                          </View>

                          <View style={[styles.speechBubble, styles.bubbleLeft]}>
                            <Text style={styles.bubbleEmoji}>🏥</Text>
                            <Text style={styles.bubbleText}>
                              {isEn ? 'Ayushman ₹5 Lakh free treatment?' : 'आयुष्मान कार्ड से ₹5 लाख मुफ्त इलाज?'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 3. Bottom Action Banner Strip (Amazon-style elevated white bar) */}
                      <View style={styles.voiceBottomStripWrapper}>
                        <View style={styles.voiceActionStrip}>
                          <View style={styles.voiceActionLeft}>
                            <View style={styles.voiceActionIconWrap}>
                              <Ionicons name="mic" size={18} color="#FFFFFF" />
                            </View>
                            <View>
                              <Text style={styles.voiceActionTitle}>
                                {isEn ? 'Voice Search' : 'माइक दबाकर बोलें'}
                              </Text>
                              <Text style={styles.voiceActionDesc}>
                                {isEn ? 'Instant answers • 100% Free' : 'तुरंत जवाब • 100% फ्री'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.voiceActionCtaBtn}>
                            <Text style={styles.voiceActionCtaText}>
                              {isEn ? 'Ask 🎙️ →' : 'अभी पूछें 🎙️ →'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Top: Big Bold Yojna Name (NO category box, NO extra text) */}
                      <View style={styles.cardHeader}>
                        <Text
                          style={[styles.schemeName, { color: cardTextColors.titleColor }]}
                          numberOfLines={2}
                        >
                          {title}
                        </Text>
                      </View>

                      {/* Center: Framed Photo Tile (Comfortable margins, expansive & clear) */}
                      <View style={styles.imageWrap}>
                        <Image source={schemeImage} style={styles.schemeImage} resizeMode="cover" />
                      </View>

                      {/* Bottom: Slim Benefit Banner Strip + Concise Scheme Description */}
                      <View style={styles.cardBottomArea}>
                        <View style={styles.benefitBannerStrip}>
                          <View style={styles.benefitLeft}>
                            <Text style={[styles.benefitAmountText, { color: themeDark }]}>
                              {benefit}
                            </Text>
                            <Text style={styles.benefitDivider}>|</Text>
                            <Text style={[styles.benefitLabelText, { color: themeDark }]}>
                              {isEn ? 'Direct Benefit' : 'सीधा वित्तीय लाभ'}
                            </Text>
                          </View>
                          <View style={styles.detailsCta}>
                            <Text style={[styles.viewDetailsText, { color: themeDark }]}>
                              {isEn ? 'Details →' : 'विवरण →'}
                            </Text>
                          </View>
                        </View>

                        {Boolean(infoText) && (
                          <Text
                            style={[styles.directSchemeInfo, { color: cardTextColors.descColor }]}
                            numberOfLines={2}
                          >
                            {infoText}
                          </Text>
                        )}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {isEn ? 'No schemes found' : 'कोई योजना नहीं मिली'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isEn ? 'Try another keyword' : 'कोई दूसरा शब्द खोजें'}
            </Text>
          </View>
        )}
        {/* ── AI Tools & Sections ── */}
        <View style={styles.belowCarouselArea}>

          {/* ── Quick Actions (2 tiles) ── */}
          <Text style={styles.sectionMainTitle}>
            {isEn ? 'Quick Actions' : 'जल्दी करें'}
          </Text>

          <View style={styles.agentGrid}>
            <TouchableOpacity
              style={styles.agentTile}
              onPress={() => onStartVoiceChat ? onStartVoiceChat() : onNavigateToSchemes()}
              activeOpacity={0.8}
            >
              <Text style={styles.agentTileTitle}>
                {isEn ? 'Eligibility Check' : 'पात्रता जांचें'}
              </Text>
              <Text style={styles.agentTileDesc}>
                {isEn ? 'Know your scheme eligibility' : 'अपनी पात्रता जानें'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.agentTile}
              onPress={() => onNavigateToSchemes()}
              activeOpacity={0.8}
            >
              <Text style={styles.agentTileTitle}>
                {isEn ? 'Top Schemes' : 'बेस्ट योजनाएं'}
              </Text>
              <Text style={styles.agentTileDesc}>
                {isEn ? 'Best matches for you' : 'आपके लिए चुनी गईं'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Recommended Schemes ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionMainTitle}>
              {isEn ? 'For You' : 'आपके लिए'}
            </Text>
            <TouchableOpacity onPress={onNavigateToSchemes}>
              <Text style={styles.seeAllText}>{isEn ? 'View All →' : 'सभी देखें →'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recommendedList}>
            {recommendedSchemes.map((s) => {
              const sTitle = isEn ? s.titleEn : s.titleHi;
              const sBenefit = isEn ? (s.benefitAmountEn || s.benefitAmount) : (s.benefitAmountHi || s.benefitAmount);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.recommendedCard}
                  onPress={() => onViewDocs(s)}
                  activeOpacity={0.88}
                >
                  <View style={styles.recommendedTop}>
                    <Text style={styles.recommendedCategory}>
                      {isEn ? s.categoryLabelEn : s.categoryLabelHi}
                    </Text>
                    <Text style={styles.seeAllText}>{isEn ? 'Details →' : 'विवरण →'}</Text>
                  </View>

                  <Text style={styles.recommendedTitle} numberOfLines={2}>
                    {sTitle}
                  </Text>

                  <Text style={styles.recommendedBenefitAmount}>{sBenefit}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    position: 'relative',
    paddingTop: 0,
    paddingBottom: 95,
  },

  // 0. Sticky Search Bar Container
  stickySearchWrapper: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 8,
    zIndex: 100,
  },

  // Body content container
  bodyContent: {
    position: 'relative',
    paddingTop: 8,
  },

  // 0. Dynamic Color Backdrop Mixing into White (NO curves, smooth linear gradient)
  gradientCanopyWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  solidCanopy: {
    width: '100%',
    height: 140,
  },
  fadeStrip: {
    width: '100%',
    height: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9ff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },

  // 2. Hero Scheme Card Carousel (Peeking next card)
  cardCarouselContent: {
    paddingTop: 10,
    paddingBottom: 8,
    gap: CARD_GAP,
  },
  heroCard: {
    width: CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  // Top of Card: Big Bold Yojna Name (No category box, no extra text)
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  schemeName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 29,
  },

  // Center of Card: Framed Photo Tile (Comfortable margins, wide & clear)
  imageWrap: {
    marginHorizontal: 22,
    borderRadius: 18,
    overflow: 'hidden',
    height: 240,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  schemeImage: {
    width: '100%',
    height: '100%',
  },

  // ── Voice AI Card Custom Poster Layout (Option 3 - Amazon Style) ──
  voiceCardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  voiceTopHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  voiceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  liveAiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 5,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveAiChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  langChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  langChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  voiceMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  voiceSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 4,
    fontWeight: '500',
  },

  // Center Hero Visual
  voiceCenterHero: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  voiceOrbOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.35)',
  },
  voiceOrbMiddle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceOrbCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  speechPromptsList: {
    gap: 7,
  },
  speechBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderWidth: 1,
    gap: 7,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    maxWidth: '92%',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.26)',
    borderColor: 'rgba(129, 140, 248, 0.45)',
    maxWidth: '94%',
  },
  bubbleEmoji: {
    fontSize: 13,
  },
  bubbleText: {
    fontSize: 11.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Bottom Action Strip
  voiceBottomStripWrapper: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 18,
  },
  voiceActionStrip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  voiceActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  voiceActionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceActionTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  voiceActionDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  voiceActionCtaBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  voiceActionCtaText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#4338CA',
  },

  // Bottom of Card: Clean Benefit Banner Strip + Two-Line Description
  cardBottomArea: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
  },
  benefitBannerStrip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  benefitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  benefitAmountText: {
    fontSize: 13,
    fontWeight: '900',
  },
  benefitDivider: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '400',
  },
  benefitLabelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '800',
  },
  directSchemeInfo: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 19,
    marginTop: 10,
    paddingHorizontal: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2942',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },

  // ── Below Carousel Area Styles (CuraTerra-AI Sections) ──
  belowCarouselArea: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 22,
  },

  // Common Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  // 4. Agent Grid (2x2)
  agentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  agentTile: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agentTileTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  agentTileDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },

  // 5. Citizen Profile Card
  profileMeterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileMeterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  profileMeterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  profileAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeterName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileMeterTagline: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  profileScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  profileScoreBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  profileScoreNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803D',
  },
  profileScoreLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#166534',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  profileChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  profileChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  profileChipMissing: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  profileChipMissingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  profileCtaBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  profileCtaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 6. Recommended Schemes
  recommendedList: {
    gap: 8,
  },
  recommendedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recommendedTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  recommendedCategory: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  recommendedTitle: {
    fontSize: 14.5,
    fontWeight: '700' as const,
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  recommendedBenefitAmount: {
    fontSize: 13.5,
    fontWeight: '700' as const,
    color: '#16A34A',
  },

  // 7. Documents
  docVaultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docVaultTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  docVaultSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  docVaultIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docChecklist: {
    gap: 6,
    marginBottom: 12,
  },
  docItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 4,
  },
  docItemText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500' as const,
  },
  docStatusOk: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#16A34A',
  },
  docStatusWarn: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#D97706',
  },
  docStatusVerified: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  docStatusVerifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  docStatusPending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  docStatusPendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  docVaultBtn: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docVaultBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
});
