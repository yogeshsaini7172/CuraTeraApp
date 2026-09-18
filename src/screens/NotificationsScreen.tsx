import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupportedLanguage } from '../i18n/translations';

interface NotificationItem {
  id: string;
  categoryEn: string;
  categoryHi: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  timeEn: string;
  timeHi: string;
  isRead: boolean;
  type: 'dbt' | 'health' | 'alert' | 'housing';
}

interface NotificationsScreenProps {
  onBack: () => void;
  currentLanguage: SupportedLanguage;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    categoryEn: 'DBT Payment',
    categoryHi: 'डीबीटी भुगतान',
    titleEn: '17th Installment Credited',
    titleHi: '17वीं किस्त खाते में जमा',
    descEn: '₹2,000 direct benefit transfer has been credited to your Aadhaar-linked bank account.',
    descHi: '₹2,000 की सम्मान निधि राशि आपके आधार से जुड़े बैंक खाते में सीधे ट्रांसफर कर दी गई है।',
    timeEn: 'Today, 10:30 AM',
    timeHi: 'आज, 10:30 AM',
    isRead: false,
    type: 'dbt',
  },
  {
    id: 'notif-2',
    categoryEn: 'Health Card',
    categoryHi: 'स्वास्थ्य कार्ड',
    titleEn: 'Ayushman Golden Card Ready',
    titleHi: 'आयुष्मान गोल्डन कार्ड तैयार',
    descEn: 'Your digital health card is ready to download. ₹5 Lakh cashless treatment cover is active.',
    descHi: 'आपका डिजिटल स्वास्थ्य कार्ड डाउनलोड के लिए तैयार है। ₹5 लाख का कैशलेस इलाज कवर सक्रिय है।',
    timeEn: 'Yesterday',
    timeHi: 'कल',
    isRead: false,
    type: 'health',
  },
  {
    id: 'notif-3',
    categoryEn: 'Important Alert',
    categoryHi: 'महत्वपूर्ण अलर्ट',
    titleEn: 'Aadhaar E-KYC Verification',
    titleHi: 'आधार ई-केवाईसी सत्यापन',
    descEn: 'Verify your Aadhaar e-KYC before 30th September to continue receiving direct financial benefits.',
    descHi: 'सरकारी योजनाओं का निर्बाध लाभ पाने के लिए 30 सितंबर से पहले अपनी आधार ई-केवाईसी अवश्य पूरी करें।',
    timeEn: '14 Sep',
    timeHi: '14 सितंबर',
    isRead: true,
    type: 'alert',
  },
  {
    id: 'notif-4',
    categoryEn: 'Housing Support',
    categoryHi: 'आवास योजना',
    titleEn: 'House Geotagging Approved',
    titleHi: 'आवास जियोटैगिंग स्वीकृत',
    descEn: 'Your foundation inspection has been verified by the Block Development Office.',
    descHi: 'आपके पक्के मकान की नींव का स्थलीय निरीक्षण खंड विकास अधिकारी द्वारा स्वीकृत कर दिया गया है।',
    timeEn: '10 Sep',
    timeHi: '10 सितंबर',
    isRead: true,
    type: 'housing',
  },
];

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  currentLanguage,
}) => {
  const isEn = currentLanguage === 'en';
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const displayedList = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0A2540" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isEn ? 'Notifications' : 'सूचनाएं'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markReadText}>
              {isEn ? 'Mark all read' : 'सभी पढ़ें'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Filter Pills: All / Unread */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'all' && styles.filterPillTextActive,
            ]}
          >
            {isEn ? 'All' : 'सभी'} ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'unread' && styles.filterPillActive]}
          onPress={() => setActiveFilter('unread')}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'unread' && styles.filterPillTextActive,
            ]}
          >
            {isEn ? 'Unread' : 'अपठित'} ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Native Clean Notification List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedList.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>
              {isEn ? 'No Notifications' : 'कोई सूचना नहीं है'}
            </Text>
            <Text style={styles.emptyStateSub}>
              {isEn
                ? "You're all caught up with your government scheme updates."
                : 'आपकी सभी सरकारी योजनाओं की सूचनाएं अद्यतित हैं।'}
            </Text>
          </View>
        ) : (
          <View style={styles.nativeList}>
            {displayedList.map((item, idx) => {
              const category = isEn ? item.categoryEn : item.categoryHi;
              const title = isEn ? item.titleEn : item.titleHi;
              const desc = isEn ? item.descEn : item.descHi;
              const time = isEn ? item.timeEn : item.timeHi;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notificationRow,
                    idx === displayedList.length - 1 && styles.notificationRowLast,
                    !item.isRead && styles.notificationRowUnread,
                  ]}
                  onPress={() => handleToggleRead(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.rowMain}>
                    {/* Category & Timestamp Line */}
                    <View style={styles.rowMetaLine}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{category}</Text>
                      </View>
                      <Text style={styles.timeText}>{time}</Text>
                    </View>

                    {/* Title */}
                    <Text style={[styles.titleText, !item.isRead && styles.titleTextBold]}>
                      {title}
                    </Text>

                    {/* Description */}
                    <Text style={styles.descText}>{desc}</Text>
                  </View>

                  {/* Unread Blue Dot */}
                  {!item.isRead && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A2540',
  },
  unreadBadge: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    backgroundColor: '#FFFFFF',
  },
  filterPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0A2540',
    borderColor: '#0A2540',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  nativeList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 16,
    paddingRight: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  notificationRowUnread: {
    backgroundColor: '#FAFCFF',
  },
  notificationRowLast: {
    borderBottomWidth: 0,
  },
  rowMain: {
    flex: 1,
  },
  rowMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  timeText: {
    fontSize: 11.5,
    color: '#94A3B8',
    flexShrink: 0,
    marginLeft: 8,
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  titleTextBold: {
    fontWeight: '700',
    color: '#0A2540',
  },
  descText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1565C0',
    marginLeft: 10,
    marginTop: 6,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});
