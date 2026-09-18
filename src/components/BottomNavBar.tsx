import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { NavTab } from '../types';
import { SupportedLanguage, translations } from '../i18n/translations';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  eligibleCount: number;
  currentLanguage?: SupportedLanguage;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  eligibleCount,
  currentLanguage = 'hi',
}) => {
  const t = translations[currentLanguage];

  return (
    <View style={styles.navWrapper}>
      <View style={styles.navBar}>
        {/* Tab 1: Home */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? Colors.orange.primary : Colors.white.muted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'home' && styles.tabLabelActive,
            ]}
          >
            {t.homeTab}
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Schemes */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('schemes')}
          activeOpacity={0.7}
        >
          <View>
            <Ionicons
              name={activeTab === 'schemes' ? 'document-text' : 'document-text-outline'}
              size={22}
              color={activeTab === 'schemes' ? Colors.orange.primary : Colors.white.muted}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'schemes' && styles.tabLabelActive,
            ]}
          >
            {t.schemesTab}
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Center Floating Voice Mic (Mitra AI) - Unchanged as requested */}
        <View style={styles.centerButtonContainer}>
          <TouchableOpacity
            style={[
              styles.centerButton,
              activeTab === 'mitra' && styles.centerButtonActive,
            ]}
            onPress={() => onTabChange('mitra')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'mitra' ? 'mic' : 'mic-outline'}
              size={28}
              color={Colors.white.pure}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.centerLabel,
              activeTab === 'mitra' && styles.centerLabelActive,
            ]}
          >
            {t.mitraTab}
          </Text>
        </View>

        {/* Tab 4: Documents */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('docs')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'docs' ? 'folder' : 'folder-outline'}
            size={22}
            color={activeTab === 'docs' ? Colors.orange.primary : Colors.white.muted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'docs' && styles.tabLabelActive,
            ]}
          >
            {t.docsTab}
          </Text>
        </TouchableOpacity>

        {/* Tab 5: Profile */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person-circle' : 'person-circle-outline'}
            size={24}
            color={activeTab === 'profile' ? Colors.orange.primary : Colors.white.muted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'profile' && styles.tabLabelActive,
            ]}
          >
            {t.profileTab}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.white.pure,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.white.border,
    elevation: 20,
    shadowColor: Colors.blue.dark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.white.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.orange.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.orange.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white.pure,
    fontSize: 10,
    fontWeight: 'bold',
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    flex: 1,
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.blue.dark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.blue.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: Colors.white.pure,
  },
  centerButtonActive: {
    backgroundColor: Colors.blue.primary,
    transform: [{ scale: 1.06 }],
  },
  centerLabel: {
    fontSize: 11,
    color: Colors.blue.dark,
    marginTop: 4,
    fontWeight: '700',
  },
  centerLabelActive: {
    color: Colors.blue.primary,
  },
});
