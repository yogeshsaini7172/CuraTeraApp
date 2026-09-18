import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { SchemeCategory } from '../types';
import { SupportedLanguage } from '../i18n/translations';

interface CategoryGridProps {
  categories: SchemeCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  currentLanguage?: SupportedLanguage;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  currentLanguage = 'hi',
}) => {
  const isEn = currentLanguage === 'en';

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      directionalLockEnabled={true}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const title = isEn ? cat.titleEn : cat.titleHi;
        const iconThemeColor = Colors.orange.primary;

        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.card,
              isSelected && styles.cardSelected,
            ]}
            onPress={() => onSelectCategory(cat.id)}
            activeOpacity={0.75}
          >
            {/* Pure Clean GovTech Icon in Orange */}
            <View style={styles.iconWrap}>
              <Ionicons
                name={(isSelected ? cat.iconFilled : cat.iconOutline) as any}
                size={24}
                color={isSelected ? Colors.white.pure : iconThemeColor}
              />
            </View>
            {/* Unified Category Title */}
            <Text
              style={[
                styles.title,
                isSelected && styles.titleSelected,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white.pure,
    minWidth: 72,
    gap: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardSelected: {
    borderColor: Colors.orange.primary,
    backgroundColor: Colors.orange.primary,
  },
  iconWrap: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  titleSelected: {
    color: Colors.white.pure,
    fontWeight: '700',
  },
});
