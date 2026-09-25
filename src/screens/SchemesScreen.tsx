import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { Scheme } from '../types';
import { SchemeCard } from '../components/SchemeCard';
import { SupportedLanguage } from '../i18n/translations';

interface SchemesScreenProps {
  schemes: Scheme[];
  onViewDocs: (scheme: Scheme) => void;
  onOpenMitraAI: () => void;
  currentLanguage?: SupportedLanguage;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

// Clean WhatsApp-style category filter options (no emojis)
const FILTER_OPTIONS = [
  { id: 'all',       labelHi: 'सभी',      labelEn: 'All'      },
  { id: 'farming',   labelHi: 'किसान',    labelEn: 'Farming'  },
  { id: 'education', labelHi: 'शिक्षा',   labelEn: 'Education'},
  { id: 'health',    labelHi: 'स्वास्थ्य', labelEn: 'Health'   },
  { id: 'housing',   labelHi: 'आवास',     labelEn: 'Housing'  },
  { id: 'business',  labelHi: 'रोजगार',   labelEn: 'Business' },
  { id: 'pension',   labelHi: 'पेंशन',    labelEn: 'Pension'  },
];

export const SchemesScreen: React.FC<SchemesScreenProps> = ({
  schemes,
  onViewDocs,
  currentLanguage = 'hi',
  isRefreshing,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const isEn = currentLanguage === 'en';

  const filteredSchemes = schemes.filter((s) => {
    const matchesCategory = activeFilter === 'all' || s.category === activeFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query ||
      s.titleHi.toLowerCase().includes(query) ||
      s.titleEn.toLowerCase().includes(query) ||
      s.benefitHi.toLowerCase().includes(query) ||
      s.benefitEn.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* ── 1. Fixed Search Bar (ALWAYS VISIBLE — DOES NOT SCROLL) ── */}
      <View style={styles.fixedSearchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.white.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={isEn ? 'Search schemes...' : 'योजना खोजें...'}
            placeholderTextColor={Colors.white.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.orange.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 2. ScrollView (Filter below search bar scrolls with schemes!) ── */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.blue.primary, Colors.orange.primary]}
              tintColor={Colors.blue.primary}
            />
          ) : undefined
        }
      >
        {/* Category Pills (Inside ScrollView — scrolls away when user scrolls down schemes!) */}
        <View style={styles.pillsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
            nestedScrollEnabled={true}
          >
            {FILTER_OPTIONS.map((f) => {
              const isActive = activeFilter === f.id;
              const label = isEn ? f.labelEn : f.labelHi;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setActiveFilter(f.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Schemes List (Clean WhatsApp chat list style) */}
        <View style={styles.schemesList}>
          {filteredSchemes.length > 0 ? (
            filteredSchemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                onViewDocs={onViewDocs}
                currentLanguage={currentLanguage}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {isEn ? 'No schemes found' : 'कोई योजना नहीं मिली'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isEn
                  ? 'Try a different keyword or category'
                  : 'कोई दूसरा शब्द या श्रेणी आज़माएं'}
              </Text>
            </View>
          )}
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

  // 1. Fixed Search Bar at Top (Never scrolls)
  fixedSearchWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },

  // 2. Scrollable Area (Filter + WhatsApp List)
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
  },

  // Category Filter Pills (Scrolls away with the schemes)
  pillsWrapper: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#0F2942',
    borderColor: '#0F2942',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Schemes List (Cards style matching Home For You)
  schemesList: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 10,
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
    color: Colors.blue.dark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
});
