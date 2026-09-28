import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { SupportedLanguage } from '../i18n/translations';
import { Scheme } from '../types';
import { SCHEMES } from '../data/schemesData';

interface NotificationItem {
  id: string;
  schemeId?: string;
  category: 'schemes' | 'alert';
  titleEn: string;
  titleHi: string;
  highlightEn: string;
  highlightHi: string;
  descEn: string;
  descHi: string;
  timeEn: string;
  timeHi: string;
  isRead: boolean;
}

interface NotificationsScreenProps {
  onBack: () => void;
  currentLanguage: SupportedLanguage;
  onSelectScheme?: (scheme: Scheme) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  currentLanguage,
  onSelectScheme,
}) => {
  const isEn = currentLanguage === 'en';
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'schemes' | 'alert'>('all');

  const handlePressNotification = (item: NotificationItem) => {
    // 1. Mark as read immediately in local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );

    // 2. Open the scheme details page of the notification
    if (item.schemeId && onSelectScheme) {
      const found = SCHEMES.find((s) => s.id === item.schemeId);
      if (found) {
        onSelectScheme(found);
      }
    }
  };

  // Simple native confirmation dialog to delete notification
  const handleOpenDelete = (item: NotificationItem) => {
    Alert.alert(
      isEn ? 'Delete Notification' : 'सूचना हटाएं',
      isEn ? 'Do you want to delete this notification?' : 'क्या आप इस सूचना को हटाना चाहते हैं?',
      [
        {
          text: isEn ? 'Cancel' : 'रद्द करें',
          style: 'cancel',
        },
        {
          text: isEn ? 'Delete' : 'हटाएं',
          style: 'destructive',
          onPress: () => {
            setNotifications((prev) => prev.filter((n) => n.id !== item.id));
          },
        },
      ]
    );
  };

  const displayedList = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  return (
    <View style={styles.container}>
      {/* 1. Header: Back Arrow + Title */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={isEn ? 'Back' : 'पीछे'}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEn ? 'Notifications' : 'सूचनाएं'}
        </Text>
      </View>

      {/* 2. Simple Filter Pills: All, Schemes, Alerts */}
      <View style={styles.filterPillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          <TouchableOpacity
            style={[styles.pill, activeTab === 'all' && styles.pillActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, activeTab === 'all' && styles.pillTextActive]}>
              {isEn ? 'All' : 'सभी'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, activeTab === 'schemes' && styles.pillActive]}
            onPress={() => setActiveTab('schemes')}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, activeTab === 'schemes' && styles.pillTextActive]}>
              {isEn ? 'Schemes' : 'योजनाएं'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, activeTab === 'alert' && styles.pillActive]}
            onPress={() => setActiveTab('alert')}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, activeTab === 'alert' && styles.pillTextActive]}>
              {isEn ? 'Alerts' : 'अलर्ट'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 3. Simple Cards List */}
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {isEn ? 'No Notifications' : 'कोई सूचना नहीं है'}
            </Text>
          </View>
        ) : (
          displayedList.map((item) => {
            const highlight = isEn ? item.highlightEn : item.highlightHi;
            const title = isEn ? item.titleEn : item.titleHi;
            const desc = isEn ? item.descEn : item.descHi;
            const time = isEn ? item.timeEn : item.timeHi;

            const isItemRead = item.isRead;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  !isItemRead ? styles.cardUnread : styles.cardRead,
                ]}
                onPress={() => handlePressNotification(item)}
                activeOpacity={0.85}
              >
                {/* Bold Dot on Unread */}
                {!isItemRead && <View style={styles.boldDot} />}

                {/* Main Text Content */}
                <View style={styles.contentColumn}>
                  <Text style={styles.messageText}>
                    <Text style={styles.messageHighlight}>{highlight}</Text>
                    {title}
                  </Text>
                  {desc ? <Text style={styles.subText}>{desc}</Text> : null}
                </View>

                {/* Right Side: Time + Three Dots */}
                <View style={styles.rightColumn}>
                  <Text style={styles.timeText}>{time}</Text>
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => handleOpenDelete(item)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.5}
                  >
                    <Ionicons name="ellipsis-vertical" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 14,
  },
  backBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  // 2. Filter Pills
  filterPillsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  pillActive: {
    backgroundColor: '#0A2540',
    borderColor: '#0A2540',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 3. Simple Cards Feed
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
  },
  cardUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  cardRead: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },

  // Bold Dot
  boldDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0284C7',
    marginTop: 5,
    marginRight: 10,
  },

  // Content
  contentColumn: {
    flex: 1,
    paddingRight: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  messageHighlight: {
    fontWeight: '800',
    color: '#0F172A',
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },

  // Right column
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 2,
    gap: 12,
  },
  timeText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  moreBtn: {
    padding: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
});
