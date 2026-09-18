import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
}

export const Header: React.FC<HeaderProps> = ({
  isHome = false,
  activeTab = 'home',
  onBackPress,
  activeDemoUser,
  onOpenUserSwitcher,
  onOpenNotifications,
  onNavigateToProfile,
  eligibleCount,
  unreadCount = 2,
  currentLanguage = 'hi',
}) => {
  const isEn = currentLanguage === 'en';
  const displayName = isEn
    ? (activeDemoUser.nameEn || activeDemoUser.name)
    : (activeDemoUser.nameHi || activeDemoUser.name);

  // Dynamic screen title on non-home pages
  const getScreenTitle = () => {
    switch (activeTab) {
      case 'schemes':
        return isEn ? 'Government Schemes' : 'सरकारी योजनाएं';
      case 'docs':
        return isEn ? 'Required Documents' : 'आवश्यक दस्तावेज';
      case 'profile':
        return isEn ? 'Citizen Profile' : 'नागरिक प्रोफाइल';
      case 'mitra':
        return isEn ? 'Mitra AI Assistant' : 'मित्र AI सहायक';
      default:
        return isEn ? 'YojnaMitra' : 'योजना मित्र';
    }
  };

  // 1. Compact Header for non-home screens (Chat, Schemes, Docs, Profile) with Back Button
  if (!isHome) {
    return (
      <View style={styles.compactHeaderContainer}>
        {/* Left: Back Button & Screen Title */}
        <View style={styles.compactNavLeft}>
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={isEn ? 'Go back' : 'पीछे जाएं'}
          >
            <Ionicons name="arrow-back" size={23} color={Colors.white.pure} />
          </TouchableOpacity>
          <Text style={styles.compactScreenTitle} numberOfLines={1}>
            {getScreenTitle()}
          </Text>
        </View>

        {/* Right: Bell Icon & Profile Avatar */}
        <View style={styles.actionsContainer}>
          {/* Bell Notification Icon */}
          <TouchableOpacity
            onPress={onOpenNotifications}
            activeOpacity={0.7}
            style={styles.bellButton}
          >
            <Ionicons name="notifications-outline" size={21} color={Colors.white.pure} />
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          {/* Profile Avatar Icon */}
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
        </View>

        {/* Inverted Concave Bottom Corners */}
        <View style={styles.concaveCornerLeft} pointerEvents="none">
          <View style={styles.concaveCornerLeftCutout} />
        </View>
        <View style={styles.concaveCornerRight} pointerEvents="none">
          <View style={styles.concaveCornerRightCutout} />
        </View>
      </View>
    );
  }

  // 2. Full Expanded Header for Home Page
  return (
    <View style={styles.expandedHeaderContainer}>
      {/* Top Row: App Logo, Name & Action Icons */}
      <View style={styles.topRow}>
        {/* App Logo & Title */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/YojnaLogo.png')}
              style={styles.fullLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>
            {isEn ? 'YojnaMitra' : 'योजना मित्र'}
          </Text>
        </View>

        {/* Right Actions: Notification Bell + User Profile Avatar */}
        <View style={styles.actionsContainer}>
          {/* Notification Bell */}
          <TouchableOpacity
            onPress={onOpenNotifications}
            activeOpacity={0.7}
            style={styles.bellButton}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.white.pure} />
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          {/* User Profile Avatar with switcher action */}
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
        </View>
      </View>

      {/* Bottom Greeting Row: Citizen Name & Scheme Eligibility */}
      <View style={styles.greetingRow}>
        <View style={styles.greetingUserWrap}>
          <Text style={styles.greetingGreeting}>
            {isEn ? 'Welcome,' : 'नमस्ते,'}
          </Text>
          <Text style={styles.greetingName}>{displayName}</Text>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.statusPillText}>
            {isEn ? `${eligibleCount} Eligible` : `${eligibleCount} पात्र`}
          </Text>
        </View>
      </View>

      {/* Inverted Concave Bottom Corners */}
      <View style={styles.concaveCornerLeft} pointerEvents="none">
        <View style={styles.concaveCornerLeftCutout} />
      </View>
      <View style={styles.concaveCornerRight} pointerEvents="none">
        <View style={styles.concaveCornerRightCutout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Expanded Home Header (flush to screen at top, inverted concave corners at bottom)
  expandedHeaderContainer: {
    backgroundColor: Colors.blue.dark,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: Colors.blue.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white.pure,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullLogo: {
    width: 38,
    height: 38,
    marginTop: 5,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white.pure,
    letterSpacing: 0.3,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bellButton: {
    position: 'relative',
    padding: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.orange.primary,
    borderWidth: 1.5,
    borderColor: Colors.blue.dark,
  },
  profileAvatarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarEmojiText: {
    fontSize: 22,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  greetingUserWrap: {
    flexDirection: 'column',
  },
  greetingGreeting: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '400',
  },
  greetingName: {
    color: Colors.white.pure,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  statusPillText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },

  // Compact Non-Home Header (flush to screen at top, inverted concave corners at bottom)
  compactHeaderContainer: {
    backgroundColor: Colors.blue.dark,
    paddingTop: Platform.OS === 'android' ? 12 : 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: Colors.blue.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  compactNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactScreenTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white.pure,
    letterSpacing: 0.2,
    flexShrink: 1,
  },

  // Inverted Concave Bottom Corners
  concaveCornerLeft: {
    position: 'absolute',
    bottom: -18,
    left: 0,
    width: 18,
    height: 18,
    backgroundColor: Colors.blue.dark,
    overflow: 'hidden',
  },
  concaveCornerLeftCutout: {
    width: 18,
    height: 18,
    backgroundColor: Colors.white.canvas,
    borderTopLeftRadius: 18,
  },
  concaveCornerRight: {
    position: 'absolute',
    bottom: -18,
    right: 0,
    width: 18,
    height: 18,
    backgroundColor: Colors.blue.dark,
    overflow: 'hidden',
  },
  concaveCornerRightCutout: {
    width: 18,
    height: 18,
    backgroundColor: Colors.white.canvas,
    borderTopRightRadius: 18,
  },
});
