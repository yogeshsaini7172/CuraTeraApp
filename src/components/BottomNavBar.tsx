import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { NavTab } from '../types';
import { SupportedLanguage } from '../i18n/translations';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentLanguage?: SupportedLanguage;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  currentLanguage = 'hi',
}) => {
  const isEn = currentLanguage === 'en';

  const tabs: { id: NavTab; labelHi: string; labelEn: string; iconActive: string; iconInactive: string }[] = [
    {
      id: 'home',
      labelHi: 'होम',
      labelEn: 'Home',
      iconActive: 'home',
      iconInactive: 'home-outline',
    },
    {
      id: 'schemes',
      labelHi: 'योजनाएं',
      labelEn: 'Scheme',
      iconActive: 'document-text',
      iconInactive: 'document-text-outline',
    },
    {
      id: 'mitra',
      labelHi: 'चैट',
      labelEn: 'Chat',
      iconActive: 'chatbubble-ellipses',
      iconInactive: 'chatbubble-ellipses-outline',
    },
    {
      id: 'profile',
      labelHi: 'प्रोफ़ाइल',
      labelEn: 'Profile',
      iconActive: 'person',
      iconInactive: 'person-outline',
    },
  ];

  return (
    <View style={styles.navWrapper}>
      {/* Full-width light top border for the whole bar */}
      <View style={styles.topBorderLine} />

      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const label = isEn ? tab.labelEn : tab.labelHi;
          const iconName = isActive ? tab.iconActive : tab.iconInactive;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              {/* Amazon/LinkedIn style: colored top-indicator only on active tab */}
              <View style={[styles.topIndicator, isActive && styles.topIndicatorActive]} />

              <Ionicons
                name={iconName}
                size={24}
                color={isActive ? '#0A2540' : '#94A3B8'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  // Full-width subtle separator line (like LinkedIn/Amazon)
  topBorderLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingBottom: Platform.OS === 'android' ? 12 : 26,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  // Top indicator: hidden by default
  topIndicator: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  // Active: show colored top indicator bar
  topIndicatorActive: {
    backgroundColor: '#0A2540',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#0A2540',
    fontWeight: '800',
  },
});
