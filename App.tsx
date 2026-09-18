import React, { useState, useEffect } from 'react';
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
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
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

import { DEMO_USERS, DemoUser } from './src/data/demoUsers';
import { UserSwitcherModal } from './src/components/UserSwitcherModal';
import { SupportedLanguage, translations } from './src/i18n/translations';

export default function App() {
  // 1. App Lifecycle & Navigation State
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [navHistory, setNavHistory] = useState<NavTab[]>(['home']);

  // 2. Demo Citizen Persona State (Ramesh, Priya, Sunita, Raju)
  const [activeDemoUser, setActiveDemoUser] = useState<DemoUser>(DEMO_USERS[0]);
  const [isUserSwitcherVisible, setIsUserSwitcherVisible] = useState<boolean>(false);

  // 3. UI Language State (Default: English - can toggle to Hindi in Profile)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const t = translations[currentLanguage];
  const isEn = currentLanguage === 'en';

  // 4. Notifications & Modals State
  const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);
  const [selectedSchemeForDocs, setSelectedSchemeForDocs] = useState<Scheme | null>(null);
  const [isSpeakingScheme, setIsSpeakingScheme] = useState<boolean>(false);

  // Helper: Navigate to tab with history stack tracking
  const navigateToTab = (newTab: NavTab) => {
    if (newTab === activeTab) return;
    if (newTab === 'home') {
      setNavHistory(['home']);
    } else {
      setNavHistory((prev) => {
        if (prev[prev.length - 1] === newTab) return prev;
        return [...prev, newTab];
      });
    }
    setActiveTab(newTab);
  };

  // Step-by-step back navigation handler (Modal -> Subscreen -> Home)
  const handleGoBack = (): boolean => {
    // Step 1: Close scheme details modal if open
    if (selectedSchemeForDocs) {
      handleCloseDocsModal();
      return true;
    }

    // Step 2: Close user switcher modal if open
    if (isUserSwitcherVisible) {
      setIsUserSwitcherVisible(false);
      return true;
    }

    // Step 3: Close notifications modal if open
    if (isNotificationVisible) {
      setIsNotificationVisible(false);
      return true;
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

    // At root home with no open modals: allow default Android hardware back behavior
    return false;
  };

  // Hardware Back Button integration (Android physical / gesture back)
  useEffect(() => {
    const onHardwareBack = () => {
      return handleGoBack();
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => backSubscription.remove();
  }, [
    selectedSchemeForDocs,
    isUserSwitcherVisible,
    isNotificationVisible,
    navHistory,
    activeTab,
  ]);

  // Dynamically calculate scheme eligibility based on active persona
  const dynamicSchemes = SCHEMES.map((scheme) => ({
    ...scheme,
    isEligible: activeDemoUser.eligibleSchemeIds.includes(scheme.id),
    matchPercentage: activeDemoUser.eligibleSchemeIds.includes(scheme.id) ? 100 : 40,
  }));

  const eligibleCount = dynamicSchemes.filter((s) => s.isEligible).length;

  // Handlers
  const handleStartVoiceChat = () => {
    navigateToTab('mitra');
  };

  const handleViewDocs = (scheme: Scheme) => {
    setSelectedSchemeForDocs(scheme);
  };

  const handleCloseDocsModal = () => {
    Speech.stop();
    setIsSpeakingScheme(false);
    setSelectedSchemeForDocs(null);
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
      <>
        <RNStatusBar barStyle="light-content" backgroundColor="#0A2540" translucent={true} />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  // 2. Login Phase
  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A2540' }}>
        <RNStatusBar barStyle="light-content" backgroundColor="#0A2540" translucent={true} />
        {Platform.OS === 'android' && (
          <View style={{ height: statusBarHeight, backgroundColor: '#0A2540' }} />
        )}
        <LoginScreen
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          onLoginSuccess={(userName) => {
            setIsLoggedIn(true);
          }}
          onDemoLogin={() => {
            setActiveDemoUser(DEMO_USERS[0]);
            setIsLoggedIn(true);
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
  return (
    <View style={styles.appContainer}>
      <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />

      {/* Top Status Bar Filler - Pure White for clean ABHA style */}
      {Platform.OS === 'android' && (
        <View style={{ height: statusBarHeight, backgroundColor: '#FFFFFF' }} />
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
          onBack={() => setIsNotificationVisible(false)}
          currentLanguage={currentLanguage}
        />
      ) : (
        <>
          {/* Fixed Compact Header with Back Button on Sub-Screens (Schemes, Docs, Profile, Mitra AI) */}
          {activeTab !== 'home' && (
            <Header
              isHome={false}
              activeTab={activeTab}
              onBackPress={handleGoBack}
              activeDemoUser={activeDemoUser}
              onOpenUserSwitcher={() => setIsUserSwitcherVisible(true)}
              onOpenNotifications={() => setIsNotificationVisible(true)}
              onNavigateToProfile={() => navigateToTab('profile')}
              eligibleCount={eligibleCount}
              unreadCount={2}
              currentLanguage={currentLanguage}
            />
          )}

          {/* Screen Body */}
          <View style={styles.screenArea}>
            {activeTab === 'home' && (
              <HomeScreen
                categories={CATEGORIES}
                schemes={dynamicSchemes}
                onStartVoiceChat={handleStartVoiceChat}
                onViewDocs={handleViewDocs}
                currentLanguage={currentLanguage}
                headerComponent={
                  <Header
                    isHome={true}
                    activeTab="home"
                    activeDemoUser={activeDemoUser}
                    onOpenUserSwitcher={() => setIsUserSwitcherVisible(true)}
                    onOpenNotifications={() => setIsNotificationVisible(true)}
                    onNavigateToProfile={() => navigateToTab('profile')}
                    eligibleCount={eligibleCount}
                    unreadCount={2}
                    currentLanguage={currentLanguage}
                  />
                }
              />
            )}

            {activeTab === 'schemes' && (
              <SchemesScreen
                schemes={dynamicSchemes}
                onViewDocs={handleViewDocs}
                currentLanguage={currentLanguage}
              />
            )}

            {activeTab === 'mitra' && (
              <ChatScreen
                onNavigateToSchemes={() => navigateToTab('schemes')}
                currentLanguage={currentLanguage}
              />
            )}

            {activeTab === 'docs' && (
              <DocumentsScreen
                currentLanguage={currentLanguage}
                onNavigateToSchemes={(schemeId) => {
                  if (schemeId) {
                    const targetScheme = dynamicSchemes.find((s) => s.id === schemeId);
                    if (targetScheme) {
                      setSelectedSchemeForDocs(targetScheme);
                    }
                  }
                  navigateToTab('schemes');
                }}
                activeDemoUser={activeDemoUser}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileScreen
                onStartReProfiling={() => navigateToTab('mitra')}
                activeDemoUser={activeDemoUser}
                onOpenUserSwitcher={() => setIsUserSwitcherVisible(true)}
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
                onLogout={() => {
                  setIsLoggedIn(false);
                  setHasSelectedLanguage(false);
                  setActiveTab('home');
                  setNavHistory(['home']);
                }}
                onUpdateAvatar={(newImageSource) => {
                  setActiveDemoUser((prev) => ({
                    ...prev,
                    image: newImageSource,
                  }));
                }}
                onUpdateProfile={(updatedProfile, updatedName) => {
                  setActiveDemoUser((prev) => ({
                    ...prev,
                    name: updatedName || prev.name,
                    nameEn: updatedName || prev.nameEn,
                    nameHi: updatedName || prev.nameHi,
                    profile: {
                      ...prev.profile,
                      ...updatedProfile,
                    },
                  }));
                }}
              />
            )}
          </View>

          {/* Bottom Navigation Bar - Hidden on Mitra AI chat screen for full-screen conversational interface */}
          {activeTab !== 'mitra' && (
            <BottomNavBar
              activeTab={activeTab}
              onTabChange={navigateToTab}
              eligibleCount={eligibleCount}
              currentLanguage={currentLanguage}
            />
          )}
        </>
      )}

      {/* Demo Citizen Switcher Modal */}
      <UserSwitcherModal
        visible={isUserSwitcherVisible}
        activeUserId={activeDemoUser.id}
        onSelectUser={(user) => setActiveDemoUser(user)}
        onClose={() => setIsUserSwitcherVisible(false)}
        currentLanguage={currentLanguage}
      />




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
