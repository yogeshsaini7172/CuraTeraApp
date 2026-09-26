import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { Scheme } from '../types';
import { SchemeCard } from '../components/SchemeCard';
import { SupportedLanguage } from '../i18n/translations';
import { schemesApi } from '../api/schemesApi';

interface SchemesScreenProps {
  schemes: Scheme[];
  onViewDocs: (scheme: Scheme) => void;
  onOpenMitraAI: () => void;
  currentLanguage?: SupportedLanguage;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
  isActive?: boolean;
  userEmail?: string;
}

// Clean category filter options with Eligible pill
const FILTER_OPTIONS = [
  { id: 'all',       labelHi: 'सभी',      labelEn: 'All'      },
  { id: 'eligible',  labelHi: 'पात्र',    labelEn: 'Eligible' },
  { id: 'farming',   labelHi: 'किसान',    labelEn: 'Farming'  },
  { id: 'education', labelHi: 'शिक्षा',   labelEn: 'Education'},
  { id: 'health',    labelHi: 'स्वास्थ्य', labelEn: 'Health'   },
  { id: 'housing',   labelHi: 'आवास',     labelEn: 'Housing'  },
  { id: 'business',  labelHi: 'रोजगार',   labelEn: 'Business' },
  { id: 'pension',   labelHi: 'पेंशन',    labelEn: 'Pension'  },
];

const PAGE_SIZE = 10;

export const SchemesScreen: React.FC<SchemesScreenProps> = ({
  schemes: initialFallbackSchemes,
  onViewDocs,
  currentLanguage = 'hi',
  registerBackHandler,
  isActive = false,
  userEmail,
}) => {
  const isEn = currentLanguage === 'en';

  // Server-driven pagination states
  const [displayedSchemes, setDisplayedSchemes] = useState<Scheme[]>(() =>
    initialFallbackSchemes.slice(0, PAGE_SIZE)
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(initialFallbackSchemes.length);
  const [eligibleCount, setEligibleCount] = useState<number>(() =>
    initialFallbackSchemes.filter((s) => s.isEligible).length
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch schemes chunk from server
  const fetchFromServer = useCallback(
    async (
      pageToFetch: number,
      categoryToFetch: string,
      queryToFetch: string,
      isRefresh: boolean = false
    ) => {
      try {
        const res = await schemesApi.getSchemes({
          page: pageToFetch,
          limit: PAGE_SIZE,
          category: categoryToFetch,
          q: queryToFetch,
          email: userEmail,
        });

        if (res && Array.isArray(res.schemes)) {
          if (pageToFetch === 1 || isRefresh) {
            setDisplayedSchemes(res.schemes);
          } else {
            setDisplayedSchemes((prev) => {
              const existingIds = new Set(prev.map((s) => s.id));
              const newItems = res.schemes.filter((s) => !existingIds.has(s.id));
              return [...prev, ...newItems];
            });
          }

          setCurrentPage(res.page);
          setHasMore(Boolean(res.hasMore));
          setTotalCount(res.total);
          if (typeof res.eligibleCount === 'number') {
            setEligibleCount(res.eligibleCount);
          }
        }
      } catch (err) {
        console.log('Server schemes fetch error, falling back to local dataset:', err);
        // Seamless fallback to local dataset if server is unreachable
        if (pageToFetch === 1) {
          const filtered = initialFallbackSchemes.filter((s) => {
            const matchesCat =
              categoryToFetch === 'all'
                ? true
                : categoryToFetch === 'eligible'
                ? Boolean(s.isEligible)
                : s.category === categoryToFetch;
            const q = queryToFetch.toLowerCase().trim();
            const matchesQ =
              !q ||
              s.titleHi.toLowerCase().includes(q) ||
              s.titleEn.toLowerCase().includes(q) ||
              s.benefitHi.toLowerCase().includes(q) ||
              s.benefitEn.toLowerCase().includes(q);
            return matchesCat && matchesQ;
          });
          setDisplayedSchemes(filtered.slice(0, PAGE_SIZE));
          setTotalCount(filtered.length);
          setHasMore(filtered.length > PAGE_SIZE);
        }
      } finally {
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [initialFallbackSchemes, userEmail]
  );

  // 1. Initial Load & category filter change
  useEffect(() => {
    fetchFromServer(1, activeFilter, searchQuery, true);
  }, [activeFilter]);

  // 2. Tab selection / click: re-fetch from server to match against updated profile
  useEffect(() => {
    if (isActive) {
      fetchFromServer(1, activeFilter, searchQuery, true);
    }
  }, [isActive]);

  // 2. Search query debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchFromServer(1, activeFilter, text, true);
    }, 350);
  };

  // 3. Infinite Scroll: Load more on scroll reaching bottom
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore || isRefreshing) return;
    setIsLoadingMore(true);
    fetchFromServer(currentPage + 1, activeFilter, searchQuery, false);
  };

  // 4. Pull to refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFromServer(1, activeFilter, searchQuery, true);
  };

  // Step-by-step internal back action handler (Clear search -> Reset filter -> Tab pop)
  const handleInternalBack = useCallback((): boolean => {
    if (searchQuery.length > 0) {
      setSearchQuery('');
      fetchFromServer(1, activeFilter, '', true);
      return true;
    }
    if (activeFilter !== 'all') {
      setActiveFilter('all');
      return true;
    }
    return false;
  }, [searchQuery, activeFilter, fetchFromServer]);

  useEffect(() => {
    registerBackHandler?.(handleInternalBack);
    return () => registerBackHandler?.(null);
  }, [handleInternalBack, registerBackHandler]);

  // Header above schemes: category pills + live count
  const renderHeader = useMemo(() => {
    return (
      <View>
        {/* Category Filter Pills (Scrolls away with the schemes) */}
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
                  style={[
                    styles.pill,
                    isActive && styles.pillActive,
                    f.id === 'eligible' && styles.pillEligible,
                    f.id === 'eligible' && isActive && styles.pillEligibleActive,
                  ]}
                  onPress={() => setActiveFilter(f.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isActive && styles.pillTextActive,
                      f.id === 'eligible' && !isActive && styles.pillEligibleText,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

      </View>
    );
  }, [activeFilter, isEn]);

  // Footer: Loading spinner when user scrolls, or completion message
  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.blue.primary} />
          <Text style={styles.footerLoaderText}>
            {isEn ? 'Loading more schemes from server...' : 'सर्वर से और योजनाएं लोड हो रही हैं...'}
          </Text>
        </View>
      );
    }

    return null;
  };

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
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                fetchFromServer(1, activeFilter, '', true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.orange.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 2. Server-Driven Paginated List on Scroll ── */}
      <FlatList
        data={displayedSchemes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardItemWrap}>
            <SchemeCard
              scheme={item}
              onViewDocs={onViewDocs}
              currentLanguage={currentLanguage}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.blue.primary, Colors.orange.primary]}
            tintColor={Colors.blue.primary}
          />
        }
        ListEmptyComponent={
          !isRefreshing ? (
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
          ) : null
        }
      />
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

  // 2. Scrollable Area
  listContent: {
    paddingBottom: 90,
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
  pillEligible: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pillEligibleActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
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
  pillEligibleText: {
    color: '#15803D',
    fontWeight: '700',
  },

  // Summary Row
  summaryBar: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  // Card Item Wrapper
  cardItemWrap: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  // Footer Loader on Scroll
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
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

