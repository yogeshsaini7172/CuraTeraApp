import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { DEMO_USERS, DemoUser } from '../data/demoUsers';
import { SupportedLanguage } from '../i18n/translations';

interface UserSwitcherModalProps {
  visible: boolean;
  activeUserId: string;
  onSelectUser: (user: DemoUser) => void;
  onClose: () => void;
  currentLanguage?: SupportedLanguage;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({
  visible,
  activeUserId,
  onSelectUser,
  onClose,
  currentLanguage = 'hi',
}) => {
  const isEn = currentLanguage === 'en';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>
                {isEn ? 'Switch Citizen Profile' : 'नागरिक प्रोफाइल बदलें'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={Colors.white.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {isEn
              ? 'Select a profile to experience dynamic scheme eligibility, tailored documents, and Mitra AI recommendations.'
              : 'अलग-अलग योजनाओं की पात्रता और दस्तावेजों का अनुभव करने के लिए प्रोफाइल चुनें।'}
          </Text>

          {/* User List */}
          <View style={styles.userList}>
            {DEMO_USERS.map((user) => {
              const isSelected = user.id === activeUserId;

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userCard,
                    isSelected && styles.userCardSelected,
                  ]}
                  onPress={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  {user.image ? (
                    <Image
                      source={user.image}
                      style={styles.userPhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.avatarEmoji}>{user.avatar}</Text>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {isEn ? (user.nameEn || user.name) : (user.nameHi || user.name)}
                    </Text>
                    <Text style={styles.userTagline}>
                      {isEn ? (user.taglineEn || user.tagline) : (user.taglineHi || user.tagline)}
                    </Text>
                  </View>

                  {isSelected ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>
                        {isEn ? 'Active' : 'सक्रिय'}
                      </Text>
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Colors.orange.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.white.pure,
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: Colors.blue.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.blue.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.blue.dark,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.white.muted,
    lineHeight: 18,
    marginBottom: 16,
  },
  userList: {
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.white.border,
  },
  userCardSelected: {
    borderColor: Colors.blue.primary,
    backgroundColor: Colors.blue.light,
  },
  userPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.blue.dark,
  },
  userTagline: {
    fontSize: 11,
    color: Colors.white.muted,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: Colors.blue.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.blue.primary,
  },
});
