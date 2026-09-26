import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  BackHandler,
  ToastAndroid,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from './src/utils/icons';
import Speech from './src/utils/speech';
import { Colors } from './src/theme/colors';
import { NavTab, Scheme } from './src/types';
import { SCHEMES, CATEGORIES } from './src/data/schemesData';
import { Header } from './src/components/Header';
import { BottomNavBar } from './src/components/BottomNavBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { SchemesScreen } from './src/screens/SchemesScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { LanguageSelectScreen } from './src/screens/LanguageSelectScreen';
import { SchemeDetailScreen } from './src/screens/SchemeDetailScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';

import { DemoUser } from './src/data/demoUsers';
import { SupportedLanguage, translations } from './src/i18n/translations';
import { requestNotificationPermission, getFCMToken, onForegroundMessage } from './src/utils/fcm';
import AuthStore from './src/store/AuthStore';
import apiClient from './src/api/client';
import { UserProfile } from './src/types';

const EMPTY_CITIZEN_PROFILE: UserProfile = {
  name: '',
  age: null,
  state: '',
  stateHi: '',
  stateEn: '',
  area: '',
  areaHi: '',
  areaEn: '',
  occupation: '',
  occupationHi: '',
  occupationEn: '',
  annualIncome: '',
  annualIncomeHi: '',
  annualIncomeEn: '',
  category: '',
  categoryHi: '',
  categoryEn: '',
  houseType: '',
  houseTypeHi: '',
  houseTypeEn: '',
  isKisan: false,
  gender: '',
  genderHi: '',
  genderEn: '',
};

const createCitizenUser = (email: string, name?: string, profileData?: Partial<UserProfile>): DemoUser => {
  const displayName = name || (email ? email.split('@')[0] : '');
  const eligibleSchemeIds = Array.isArray(profileData?.eligibleSchemeIds)
    ? profileData.eligibleSchemeIds
    : [];

  return {
    id: email || 'citizen',
    name: displayName,
    nameHi: displayName,
    nameEn: displayName,
    avatar: '👤',
    image: null,
    tagline: 'Registered Citizen • CuraTera',
    taglineHi: 'पंजीकृत नागरिक • क्यूराटेरा',
    taglineEn: 'Registered Citizen • CuraTera',
    eligibleSchemeIds,
    profile: {
      ...EMPTY_CITIZEN_PROFILE,
      name: displayName,
      ...profileData,
    },
  };
};

export default function App() {
  // 1. App Lifecycle & Navigation State
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loggedInEmail, setLoggedInEmail] = useState<string>('');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [navHistory, setNavHistory] = useState<NavTab[]>(['home']);

  // Screen-specific back handler delegates (for sub-views, edit modes, and search states)
  const profileBackRef = useRef<(() => boolean) | null>(null);
  const schemesBackRef = useRef<(() => boolean) | null>(null);
  const chatBackRef = useRef<(() => boolean) | null>(null);
  const homeBackRef = useRef<(() => boolean) | null>(null);
  const lastExitPressRef = useRef<number>(0);

  // 2. Real Authenticated Citizen State (stored in MongoDB & local session)
  const [currentUser, setCurrentUser] = useState<DemoUser>(() =>
    createCitizenUser('', '')
  );
  const activeDemoUser = currentUser;

  // 3. UI Language State (Default: English - can toggle to Hindi in Profile)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const t = translations[currentLanguage];
  const isEn = currentLanguage === 'en';

  // 4. Notifications & Modals State
  const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);
  const [returnToNotificationOnBack, setReturnToNotificationOnBack] = useState<boolean>(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(['notif-3', 'notif-4']);
  const [selectedSchemeForDocs, setSelectedSchemeForDocs] = useState<Scheme | null>(null);
  const [isSpeakingScheme, setIsSpeakingScheme] = useState<boolean>(false);
  const [activeHomeScheme, setActiveHomeScheme] = useState<Scheme | null>(null);

  // 5a. Restore session from local cache on app start - Strictly verified with MongoDB backend
  useEffect(() => {
    async function restoreSession() {
      const session = await AuthStore.restore();
      if (!session) {
        setIsLoggedIn(false);
        return;
      }

      // STRICT CHECK: Verify with MongoDB server that this user actually exists
      try {
        const res = await apiClient.get('/api/profile');
        if (res.data?.profile) {
          const p = res.data.profile;
          setLoggedInEmail(session.user.email);
          setCurrentUser(createCitizenUser(session.user.email, session.user.displayName, p));
          setIsLoggedIn(true);
          setHasSelectedLanguage(true); // Skip language screen for returning verified users
        } else {
          throw new Error('User profile not found on server');
        }
      } catch (err: any) {
        // User not in MongoDB / token invalid -> Force logout and keep on Login/Signup screen!
        console.log('Session verification failed on server, forcing Login/Signup:', err?.message);
        await AuthStore.logout();
        setIsLoggedIn(false);
      }
    }
    restoreSession();
  }, []);

  // 5b. FCM Push Notification Setup
  useEffect(() => {
    async function setupFCM() {
      const permissionGranted = await requestNotificationPermission();
      if (permissionGranted) {
        const token = await getFCMToken();
        if (token) {
          console.log('FCM Token ready for backend:', token);
        }
      } else {
        console.log('Notification permission denied');
      }
    }
    setupFCM();

    const unsubscribe = onForegroundMessage();
    return () => unsubscribe();
  }, []);

  // Track visited tabs to keep screens mounted (lazy keep-alive) for instant 0ms tab switching
  const [visitedTabs, setVisitedTabs] = useState<Partial<Record<NavTab, boolean>>>({
    home: true,
  });

  useEffect(() => {
    setVisitedTabs((prev) => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
  }, [activeTab]);

  // Helper: Navigate to tab with history stack tracking (memoized for instant 0ms callback)
  const navigateToTab = useCallback((newTab: NavTab) => {
    setActiveTab((currentTab) => {
      if (newTab === currentTab) return currentTab;
      setNavHistory((prev) => {
        if (prev[prev.length - 1] === newTab) return prev;
        return [...prev, newTab];
      });
      return newTab;
    });
  }, []);

  const handleCloseDocsModal = useCallback(() => {
    Speech.stop();
    setIsSpeakingScheme(false);
    setSelectedSchemeForDocs(null);
    if (returnToNotificationOnBack) {
      setReturnToNotificationOnBack(false);
      setIsNotificationVisible(true);
    }
  }, [returnToNotificationOnBack]);

  // Step-by-step back navigation handler (Modal -> Subscreen/Dropdown/Edit -> Tab History -> Double-tap Exit)
  const handleGoBack = useCallback((): boolean => {
    // Step 1: Close scheme details modal if open
    if (selectedSchemeForDocs) {
      handleCloseDocsModal();
      return true;
    }

    // Step 2: Close notifications modal if open
    if (isNotificationVisible) {
      setIsNotificationVisible(false);
      setReturnToNotificationOnBack(false);
      return true;
    }

    // Step 3: Current active tab's internal sub-screen / sub-modal / dropdown / search / edit handler
    if (activeTab === 'profile' && profileBackRef.current) {
      if (profileBackRef.current()) return true;
    }
    if (activeTab === 'schemes' && schemesBackRef.current) {
      if (schemesBackRef.current()) return true;
    }
    if (activeTab === 'mitra' && chatBackRef.current) {
      if (chatBackRef.current()) return true;
    }
    if (activeTab === 'home' && homeBackRef.current) {
      if (homeBackRef.current()) return true;
    }

    // Step 4: Step-by-step tab history pop
    if (navHistory.length > 1) {
      const nextHistory = [...navHistory];
      nextHistory.pop(); // remove current tab
      const previousTab = nextHistory[nextHistory.length - 1] || 'home';
      setNavHistory(nextHistory);
      setActiveTab(previousTab);
      return true;
    }

    // Step 5: Fallback to home if not on home
    if (activeTab !== 'home') {
      setActiveTab('home');
      setNavHistory(['home']);
      return true;
    }

    // Step 6: Root Home Tab — Double-tap back within 2 seconds to gracefully exit
    const now = Date.now();
    if (lastExitPressRef.current && now - lastExitPressRef.current < 2000) {
      BackHandler.exitApp();
      return true;
    }

    lastExitPressRef.current = now;
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        currentLanguage === 'en' ? 'Press back again to exit' : 'ऐप बंद करने के लिए दोबारा बैक दबाएं',
        ToastAndroid.SHORT
      );
    }
    return true;
  }, [
    selectedSchemeForDocs,
    isNotificationVisible,
    activeTab,
    navHistory,
    currentLanguage,
    handleCloseDocsModal,
  ]);

  // Hardware Back Button integration (Android physical / gesture back)
  useEffect(() => {
    const onHardwareBack = () => {
      return handleGoBack();
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => backSubscription.remove();
  }, [handleGoBack]);

  // Dynamically calculate scheme eligibility strictly based on citizen's actual profile details
  const dynamicSchemes = useMemo(() => {
    const p = activeDemoUser.profile;
    const hasOcc = Boolean(p?.occupation && p.occupation.trim());
    const hasIncome = Boolean(p?.annualIncome && p.annualIncome.trim());
    const hasAge = p?.age !== null && p?.age !== undefined && String(p.age).trim() !== '';
    const hasExplicit = Boolean(activeDemoUser.eligibleSchemeIds && activeDemoUser.eligibleSchemeIds.length > 0);
    const isProfileProper = hasOcc || hasIncome || hasAge || hasExplicit;

    // Strict real-world rule: Incomplete / blank profile -> ZERO eligibility!
    if (!isProfileProper) {
      return SCHEMES.map((scheme) => ({
        ...scheme,
        isEligible: false,
        matchPercentage: 0,
      }));
    }

    const eligibleIds = activeDemoUser.eligibleSchemeIds || [];
    return SCHEMES.map((scheme) => ({
      ...scheme,
      isEligible: eligibleIds.includes(scheme.id),
      matchPercentage: eligibleIds.includes(scheme.id) ? 100 : 0,
    }));
  }, [activeDemoUser]);

  const eligibleCount = useMemo(() => {
    return dynamicSchemes.filter((s) => s.isEligible).length;
  }, [dynamicSchemes]);

  // Handlers
  const handleStartVoiceChat = () => {
    navigateToTab('mitra');
  };

  const handleViewDocs = (scheme: Scheme) => {
    setSelectedSchemeForDocs(scheme);
  };


  const handleSpeakSchemeDetails = (scheme: Scheme) => {
    if (isSpeakingScheme) {
      Speech.stop();
      setIsSpeakingScheme(false);
      return;
    }

    const textToSpeak = currentLanguage === 'en'
      ? `${scheme.titleEn}. Benefit: ${scheme.benefitAmount}. ${scheme.benefitEn}.`
      : `${scheme.titleHi}। लाभ: ${scheme.benefitAmount}। ${scheme.benefitHi}।`;

    setIsSpeakingScheme(true);
    Speech.speak(textToSpeak, {
      language: currentLanguage === 'en' ? 'en-IN' : 'hi-IN',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => setIsSpeakingScheme(false),
      onError: () => setIsSpeakingScheme(false),
    });
  };

  const handleCallSchemeHelpline = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const statusBarHeight = RNStatusBar.currentHeight || 28;

  // 1. Splash Screen Phase
  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A2540' }}>
        <RNStatusBar barStyle="light-content" backgroundColor="#0A2540" translucent={true} />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </View>
    );
  }

  // 2. Login Phase
  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />
        {Platform.OS === 'android' && (
          <View style={{ height: statusBarHeight, backgroundColor: '#FFFFFF' }} />
        )}
        <LoginScreen
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          onLoginSuccess={async (userName, email) => {
            setLoggedInEmail(email);
            setCurrentUser(createCitizenUser(email, userName));
            setIsLoggedIn(true);

            // Fetch latest profile from backend
            try {
              const res = await apiClient.get('/api/profile');
              if (res.data?.profile) {
                const p = res.data.profile;
                setCurrentUser((prev) => ({
                  ...prev,
                  name: p.name || prev.name,
                  nameEn: p.name || prev.nameEn,
                  nameHi: p.name || prev.nameHi,
                  profile: {
                    ...prev.profile,
                    ...p,
                  },
                }));
              }
            } catch (_) {}
          }}
        />
      </View>
    );
  }

  // 3. Post-Login Language Selection Phase (Strictly 2 Languages: हिन्दी and English)
  if (!hasSelectedLanguage) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />
        {Platform.OS === 'android' && (
          <View style={{ height: statusBarHeight, backgroundColor: '#FFFFFF' }} />
        )}
        <LanguageSelectScreen
          initialLanguage={currentLanguage}
          onLanguageSelected={(selectedLang) => {
            setCurrentLanguage(selectedLang);
            setHasSelectedLanguage(true);
          }}
        />
      </View>
    );
  }

  // 4. Main Authenticated App
  const isHomeTab = activeTab === 'home';
  const homeThemeLight = isHomeTab && activeHomeScheme?.themeLight ? activeHomeScheme.themeLight : '#FFFFFF';

  return (
    <View style={styles.appContainer}>
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor={homeThemeLight}
        translucent={true}
      />

      {/* Top Status Bar Filler - Dynamic Theme */}
      {Platform.OS === 'android' && (
        <View
          style={{
            height: statusBarHeight,
            backgroundColor: homeThemeLight,
          }}
        />
      )}

      {/* Conditional Full-Screen Scheme Detail Page or Notifications Page or Standard App Screen Flow */}
      {selectedSchemeForDocs ? (
        <SchemeDetailScreen
          scheme={selectedSchemeForDocs}
          onBack={handleCloseDocsModal}
          currentLanguage={currentLanguage}
          isSpeaking={isSpeakingScheme}
          onToggleSpeech={() => handleSpeakSchemeDetails(selectedSchemeForDocs)}
          onCallHelpline={(phone) => handleCallSchemeHelpline(phone)}
        />
      ) : isNotificationVisible ? (
        <NotificationsScreen
          onBack={() => {
            setIsNotificationVisible(false);
            setReturnToNotificationOnBack(false);
          }}
          currentLanguage={currentLanguage}
          readNotificationIds={readNotificationIds}
          onMarkNotificationAsRead={(id) => {
            setReadNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
          }}
          onSelectScheme={(scheme) => {
            setReturnToNotificationOnBack(true);
            setSelectedSchemeForDocs(scheme);
          }}
        />
      ) : (
        <>
          {/* Header — Rendered at top on tabs other than home, mitra, and profile (Chat and Profile have their own wireframe headers) */}
          {activeTab !== 'home' && activeTab !== 'mitra' && activeTab !== 'profile' && (
            <Header
              isHome={false}
              activeTab={activeTab}
              onBackPress={handleGoBack}
              activeDemoUser={activeDemoUser}
              onOpenUserSwitcher={() => navigateToTab('profile')}
              onOpenNotifications={() => setIsNotificationVisible(true)}
              onNavigateToProfile={() => navigateToTab('profile')}
              eligibleCount={eligibleCount}
              unreadCount={Math.max(0, 4 - readNotificationIds.length)}
              currentLanguage={currentLanguage}
              themeLight={activeHomeScheme?.themeLight}
              themeColor={activeHomeScheme?.themeColor}
            />
          )}

          {/* Screen Body with 0ms Instant Tab Keep-Alive */}
          <View style={styles.screenArea}>
            {visitedTabs.home && (
              <View style={[styles.tabScreenContainer, activeTab !== 'home' && styles.hiddenScreen]}>
                <HomeScreen
                  schemes={dynamicSchemes}
                  onViewDocs={handleViewDocs}
                  onNavigateToSchemes={() => navigateToTab('schemes')}
                  onStartVoiceChat={() => navigateToTab('mitra')}
                  onNavigateToTab={navigateToTab}
                  activeUser={activeDemoUser}
                  onOpenProfile={() => navigateToTab('profile')}
                  onOpenUserSwitcher={() => navigateToTab('profile')}
                  onOpenNotifications={() => setIsNotificationVisible(true)}
                  eligibleCount={eligibleCount}
                  unreadCount={Math.max(0, 4 - readNotificationIds.length)}
                  currentLanguage={currentLanguage}
                  onActiveSchemeChange={setActiveHomeScheme}
                  registerBackHandler={(h) => {
                    homeBackRef.current = h;
                  }}
                />
              </View>
            )}

            {visitedTabs.schemes && (
              <View style={[styles.tabScreenContainer, activeTab !== 'schemes' && styles.hiddenScreen]}>
                <SchemesScreen
                  schemes={dynamicSchemes}
                  isActive={activeTab === 'schemes'}
                  userEmail={loggedInEmail || undefined}
                  onViewDocs={handleViewDocs}
                  onOpenMitraAI={() => navigateToTab('mitra')}
                  currentLanguage={currentLanguage}
                  registerBackHandler={(h) => {
                    schemesBackRef.current = h;
                  }}
                />
              </View>
            )}

            {visitedTabs.mitra && (
              <View style={[styles.tabScreenContainer, activeTab !== 'mitra' && styles.hiddenScreen]}>
                <ChatScreen
                  onBack={handleGoBack}
                  onNavigateToSchemes={() => navigateToTab('schemes')}
                  currentLanguage={currentLanguage}
                  registerBackHandler={(h) => {
                    chatBackRef.current = h;
                  }}
                  onProfileUpdated={(updatedProfile) => {
                    if (!updatedProfile || typeof updatedProfile !== 'object') return;
                    setCurrentUser((prev) => ({
                      ...prev,
                      name: updatedProfile.name || prev.name,
                      nameEn: updatedProfile.name || prev.nameEn,
                      nameHi: updatedProfile.name || prev.nameHi,
                      eligibleSchemeIds: updatedProfile.eligibleSchemeIds || prev.eligibleSchemeIds,
                      profile: {
                        ...prev.profile,
                        ...updatedProfile,
                      },
                    }));
                  }}
                />
              </View>
            )}

            {visitedTabs.profile && (
              <View style={[styles.tabScreenContainer, activeTab !== 'profile' && styles.hiddenScreen]}>
                <ProfileScreen
                  onStartReProfiling={() => navigateToTab('mitra')}
                  activeDemoUser={activeDemoUser}
                  onOpenUserSwitcher={() => navigateToTab('profile')}
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                  registerBackHandler={(h) => {
                    profileBackRef.current = h;
                  }}
                  onLogout={async () => {
                    await AuthStore.logout();
                    setIsLoggedIn(false);
                    setHasSelectedLanguage(false);
                    setActiveTab('home');
                    setNavHistory(['home']);
                  }}
                  onUpdateAvatar={(newImageSource) => {
                    setCurrentUser((prev) => ({
                      ...prev,
                      image: newImageSource,
                    }));
                  }}
                  onUpdateProfile={async (updatedProfile, updatedName) => {
                    setCurrentUser((prev) => ({
                      ...prev,
                      name: updatedName || prev.name,
                      nameEn: updatedName || prev.nameEn,
                      nameHi: updatedName || prev.nameHi,
                      profile: {
                        ...prev.profile,
                        ...updatedProfile,
                      },
                    }));

                    // Sync to MongoDB backend
                    try {
                      await apiClient.put('/api/profile', {
                        ...updatedProfile,
                        name: updatedName,
                      });
                    } catch (err) {
                      console.log('Profile sync error:', err);
                    }
                  }}
                />
              </View>
            )}
          </View>

          {/* Bottom Navigation Bar — Hidden in Chat view as in wireframe sketch */}
          {activeTab !== 'mitra' && (
            <BottomNavBar
              activeTab={activeTab}
              onTabChange={navigateToTab}
              currentLanguage={currentLanguage}
            />
          )}
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: Colors.white.canvas,
  },
  screenArea: {
    flex: 1,
  },
  tabScreenContainer: {
    flex: 1,
  },
  hiddenScreen: {
    display: 'none',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white.pure,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingBottom: 24,
  },
  notificationModalContent: {
    backgroundColor: Colors.white.pure,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.white.border,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.blue.dark,
  },
  notificationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.white.border,
    marginBottom: 10,
  },
  notifBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notifBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.blue.primary,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.white.muted,
  },
  notifDesc: {
    fontSize: 13,
    color: Colors.white.textDark,
    lineHeight: 18,
  },
  modalBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.blue.primary,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.blue.dark,
    lineHeight: 22,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  modalTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTopBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCategoryPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.blue.primary,
  },
  modalEligiblePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.green.light,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modalEligibleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.green.dark,
  },
  modalTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconBtnActive: {
    backgroundColor: Colors.blue.primary,
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  modalSchemeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.blue.dark,
    lineHeight: 24,
    marginBottom: 4,
  },
  modalMinistryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 14,
  },
  modalBenefitCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  modalBenefitLabel: {
    fontSize: 11,
    color: Colors.green.dark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalBenefitAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.green.dark,
    marginVertical: 3,
  },
  modalBenefitDesc: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalFullDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.blue.dark,
    marginBottom: 4,
  },
  modalSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  criteriaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  criteriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  criteriaChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  modalDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  docCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.green.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDocText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  cscGuideBox: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  cscGuideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 3,
  },
  cscGuideDesc: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  modalApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.blue.primary,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  modalApplyButtonText: {
    color: Colors.white.pure,
    fontSize: 14,
    fontWeight: '700',
  },
  modalHelplineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  modalHelplineText: {
    color: Colors.blue.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
