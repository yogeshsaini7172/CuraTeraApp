import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { DemoUser } from '../data/demoUsers';
import { SupportedLanguage } from '../i18n/translations';
import { NavTab } from '../types';

interface HeaderProps {
  isHome?: boolean;
  activeTab?: NavTab;
  onBackPress?: () => void;
  activeDemoUser: DemoUser;
  onOpenUserSwitcher: () => void;
  onOpenNotifications: () => void;
  onNavigateToProfile?: () => void;
  eligibleCount: number;
  unreadCount?: number;
  currentLanguage?: SupportedLanguage;
  themeLight?: string;
  themeColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'schemes',
  onBackPress,
  activeDemoUser,
  onOpenUserSwitcher,
  onOpenNotifications,
  onNavigateToProfile,
  unreadCount = 0,
  currentLanguage = 'hi',
  themeLight,
  themeColor,
}) => {
  const isEn = currentLanguage === 'en';
  const isRootTab = activeTab === 'home' || activeTab === 'schemes';
  const showBack = !isRootTab && !!onBackPress;

  const isHomeTab = activeTab === 'home';
  const isSchemesTab = activeTab === 'schemes';

  // Screen Title
  const getScreenTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'CuraTera';
      case 'schemes':
        return isEn ? 'Schemes' : 'योजनाएं';
      case 'docs':
        return isEn ? 'Required Documents' : 'आवश्यक दस्तावेज';
      case 'profile':
        return isEn ? 'Citizen Profile' : 'नागरिक प्रोफाइल';
      case 'mitra':
        return 'CuraTera';
      default:
        return 'CuraTera';
    }
  };

  return (
    <View
      style={[
        styles.headerContainer,
        isHomeTab && !!themeLight && { backgroundColor: themeLight },
      ]}
    >
      {/* Left: Logo (on root tab except schemes) or Back Arrow (on sub tabs) + Title */}
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={isEn ? 'Go back' : 'पीछे जाएं'}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
        ) : isSchemesTab ? null : (
          <View style={styles.logoCircleWrapper}>
            <Image
              source={require('../../assets/CuraTera_Logo.png')}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
        )}
        <Text
          style={[
            styles.screenTitle,
            isRootTab && styles.brandTitle,
            isSchemesTab && styles.schemesTabTitle,
          ]}
          numberOfLines={1}
        >
          {getScreenTitle()}
        </Text>
      </View>

      {/* Right: Notification Bell (Avatar hidden on schemes page) */}
      <View style={styles.actionsContainer}>
        {/* Bell Icon (Black) */}
        <TouchableOpacity
          onPress={onOpenNotifications}
          activeOpacity={0.7}
          style={styles.bellButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          {unreadCount > 0 && <View style={styles.notificationDot} />}
        </TouchableOpacity>

        {/* Profile Avatar Button - Hidden on schemes tab */}
        {!isSchemesTab && (
          <TouchableOpacity
            style={styles.profileAvatarButton}
            onPress={onNavigateToProfile || onOpenUserSwitcher}
            activeOpacity={0.7}
          >
            {activeDemoUser.image ? (
              <Image
                source={activeDemoUser.image}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarEmojiText}>{activeDemoUser.avatar}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Clean Simple White Header
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 12 : 48,
    paddingBottom: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircleWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#0055FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    textShadowColor: 'rgba(15, 23, 42, 0.2)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  schemesTabTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.orange.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileAvatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarEmojiText: {
    fontSize: 18,
  },
});
