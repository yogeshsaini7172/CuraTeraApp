import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  TextInput,
  Switch,
  Linking,
  Share,
  Modal,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { launchImageLibraryAsync, launchCameraAsync } from '../utils/imagePicker';
import { DemoUser } from '../data/demoUsers';
import { UserProfile } from '../types';
import { SupportedLanguage } from '../i18n/translations';

interface ProfileScreenProps {
  onStartReProfiling?: () => void;
  activeDemoUser: DemoUser;
  onOpenUserSwitcher?: () => void;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLogout: () => void;
  onUpdateAvatar?: (newImageSource: any) => void;
  onUpdateProfile?: (updatedProfile: Partial<UserProfile>, updatedName?: string) => void;
}

type ScreenView = 'main' | 'profile_detail' | 'setting';
type DropdownField = 'state' | 'occupation' | 'income' | 'houseType' | null;

const STATE_OPTIONS = [
  { hi: 'उत्तर प्रदेश (UP)', en: 'Uttar Pradesh (UP)' },
  { hi: 'बिहार (Bihar)', en: 'Bihar' },
  { hi: 'मध्य प्रदेश (MP)', en: 'Madhya Pradesh (MP)' },
  { hi: 'राजस्थान (Rajasthan)', en: 'Rajasthan' },
  { hi: 'महाराष्ट्र (Maharashtra)', en: 'Maharashtra' },
  { hi: 'हरियाणा (Haryana)', en: 'Haryana' },
  { hi: 'पंजाब (Punjab)', en: 'Punjab' },
  { hi: 'गुजरात (Gujarat)', en: 'Gujarat' },
  { hi: 'पश्चिम बंगाल (West Bengal)', en: 'West Bengal' },
  { hi: 'झारखंड (Jharkhand)', en: 'Jharkhand' },
  { hi: 'छत्तीसगढ़ (Chhattisgarh)', en: 'Chhattisgarh' },
  { hi: 'ओडिशा (Odisha)', en: 'Odisha' },
  { hi: 'उत्तराखंड (Uttarakhand)', en: 'Uttarakhand' },
  { hi: 'दिल्ली (Delhi)', en: 'Delhi' },
];

const OCCUPATION_OPTIONS = [
  { hi: 'लघु एवं सीमांत किसान (Farmer)', en: 'Small & Marginal Farmer' },
  { hi: 'दैनिक मजदूर (Daily Wage Worker)', en: 'Daily Wage Worker' },
  { hi: 'छोटा व्यापारी / दुकानदार (Vendor)', en: 'Small Shopkeeper / Vendor' },
  { hi: 'महिला स्व-सहायता समूह (SHG)', en: 'Self Help Group Worker' },
  { hi: 'विद्यार्थी (Student)', en: 'Student' },
  { hi: 'गृहिणी (Homemaker)', en: 'Homemaker' },
  { hi: 'निजी / सरकारी नौकरी (Salaried)', en: 'Salaried Employee' },
  { hi: 'स्वरोजगार / कारीगर (Artisan)', en: 'Self-employed / Artisan' },
  { hi: 'बेरोजगार (Unemployed)', en: 'Unemployed' },
];

const INCOME_OPTIONS = [
  { hi: '₹1.00 लाख से कम (BPL श्रेणी)', en: 'Below ₹1.00 Lakh (BPL)' },
  { hi: '₹1.00 - ₹2.00 लाख (कम आय)', en: '₹1.00 - ₹2.00 Lakh' },
  { hi: '₹2.00 - ₹3.50 लाख', en: '₹2.00 - ₹3.50 Lakh' },
  { hi: '₹3.50 - ₹5.00 लाख', en: '₹3.50 - ₹5.00 Lakh' },
  { hi: '₹5.00 लाख से अधिक', en: 'Above ₹5.00 Lakh' },
];

const HOUSE_TYPE_OPTIONS = [
  { hi: 'कच्चा मकान (Kutcha)', en: 'Kutcha House' },
  { hi: 'अर्ध-पक्का मकान (Semi-Pucca)', en: 'Semi-Pucca House' },
  { hi: 'पक्का मकान (Pucca)', en: 'Pucca House' },
  { hi: 'किराये का मकान (Rented)', en: 'Rented House' },
  { hi: 'बेघर (Homeless)', en: 'Homeless / No House' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  activeDemoUser,
  currentLanguage = 'hi',
  onLanguageChange,
  onLogout,
  onUpdateAvatar,
  onUpdateProfile,
}) => {
  const isEn = currentLanguage === 'en';
  const [currentView, setCurrentView] = useState<ScreenView>('main');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFullImageViewer, setShowFullImageViewer] = useState(false);
  const [showPhotoPickerModal, setShowPhotoPickerModal] = useState(false);
  const [uploadToastStatus, setUploadToastStatus] = useState<'idle' | 'updating' | 'success'>('idle');

  const [activeDropdown, setActiveDropdown] = useState<DropdownField>(null);

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // User details
  const displayName = isEn
    ? (activeDemoUser.nameEn || activeDemoUser.name)
    : (activeDemoUser.nameHi || activeDemoUser.name);

  const displayState = isEn
    ? (activeDemoUser.profile.stateEn || activeDemoUser.profile.state)
    : (activeDemoUser.profile.stateHi || activeDemoUser.profile.state);

  const displayOccupation = isEn
    ? (activeDemoUser.profile.occupationEn || activeDemoUser.profile.occupation)
    : (activeDemoUser.profile.occupationHi || activeDemoUser.profile.occupation);

  const displayIncome = isEn
    ? (activeDemoUser.profile.annualIncomeEn || activeDemoUser.profile.annualIncome)
    : (activeDemoUser.profile.annualIncomeHi || activeDemoUser.profile.annualIncome);

  const displayHouseType = isEn
    ? (activeDemoUser.profile.houseTypeEn || activeDemoUser.profile.houseType)
    : (activeDemoUser.profile.houseTypeHi || activeDemoUser.profile.houseType);

  const displayCategory = isEn
    ? (activeDemoUser.profile.categoryEn || activeDemoUser.profile.category || 'General')
    : (activeDemoUser.profile.categoryHi || activeDemoUser.profile.category || 'सामान्य');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editState, setEditState] = useState(displayState);
  const [editOccupation, setEditOccupation] = useState(displayOccupation);
  const [editIncome, setEditIncome] = useState(displayIncome);
  const [editHouseType, setEditHouseType] = useState(displayHouseType);
  const [editCategory, setEditCategory] = useState(displayCategory);

  // Photo Picker
  const handleOpenPhotoPicker = () => {
    setShowPhotoPickerModal(true);
  };

  const handleApplyPhoto = (uri: string) => {
    // Show Updating toast with App Logo + small text
    setUploadToastStatus('updating');
    setTimeout(() => {
      onUpdateAvatar?.({ uri });
      setUploadToastStatus('success');
      setTimeout(() => {
        setUploadToastStatus('idle');
      }, 2500);
    }, 800);
  };

  const handleLaunchCamera = async () => {
    setShowPhotoPickerModal(false);
    try {
      const res = await launchCameraAsync({
        cropping: true,
        freeStyleCropEnabled: true,
        isEn,
      });
      if (!res.canceled && res.assets && res.assets.length > 0 && res.assets[0].uri) {
        handleApplyPhoto(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Camera error:', e);
    }
  };

  const handleLaunchGallery = async () => {
    setShowPhotoPickerModal(false);
    try {
      const res = await launchImageLibraryAsync({
        cropping: true,
        freeStyleCropEnabled: true,
        isEn,
      });
      if (!res.canceled && res.assets && res.assets.length > 0 && res.assets[0].uri) {
        handleApplyPhoto(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Gallery error:', e);
    }
  };

  const handleRemovePhoto = () => {
    setShowPhotoPickerModal(false);
    onUpdateAvatar?.(null);
  };

  // Share App Handler
  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'CuraTera App',
        message: isEn
          ? 'Check your government scheme eligibility with CuraTera app: https://curatera.app'
          : 'सरकारी योजनाओं की पात्रता और सहायता के लिए CuraTera ऐप देखें: https://curatera.app',
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  // Change Password Submission
  const handleChangePasswordSubmit = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(
        isEn ? 'Error' : 'त्रुटि',
        isEn ? 'Please fill in all password fields.' : 'कृपया सभी पासवर्ड फ़ील्ड भरें।'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        isEn ? 'Error' : 'त्रुटि',
        isEn ? 'New password and confirm password do not match.' : 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।'
      );
      return;
    }
    Alert.alert(
      isEn ? 'Success' : 'सफलता',
      isEn ? 'Password changed successfully.' : 'पासवर्ड सफलतापूर्वक बदल दिया गया है।'
    );
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Open Edit Form
  const handleStartEdit = () => {
    setEditName(displayName);
    setEditState(displayState);
    setEditOccupation(displayOccupation);
    setEditIncome(displayIncome);
    setEditHouseType(displayHouseType);
    setEditCategory(displayCategory);
    setActiveDropdown(null);
    setIsEditingProfile(true);
  };

  // Save Profile Details
  const handleSaveProfile = () => {
    onUpdateProfile?.(
      {
        state: editState,
        stateHi: editState,
        stateEn: editState,
        occupation: editOccupation,
        occupationHi: editOccupation,
        occupationEn: editOccupation,
        annualIncome: editIncome,
        annualIncomeHi: editIncome,
        annualIncomeEn: editIncome,
        houseType: editHouseType,
        houseTypeHi: editHouseType,
        houseTypeEn: editHouseType,
        category: editCategory,
        categoryHi: editCategory,
        categoryEn: editCategory,
      },
      editName
    );
    setIsEditingProfile(false);
    Alert.alert(
      isEn ? 'Success' : 'सफलता',
      isEn ? 'Profile details updated successfully.' : 'प्रोफ़ाइल विवरण सफलतापूर्वक अपडेट हो गया।'
    );
  };

  // Logout Confirmation Handler
  const handleLogoutPress = () => {
    Alert.alert(
      isEn ? 'Log out' : 'लॉग आउट',
      isEn ? 'Are you sure you want to log out of CuraTera?' : 'क्या आप CuraTera से लॉग आउट करना चाहते हैं?',
      [
        {
          text: isEn ? 'Cancel' : 'रद्द करें',
          style: 'cancel',
        },
        {
          text: isEn ? 'Logout' : 'लॉग आउट',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  // Simple Profile Details Card Renderer
  const renderProfileDetailsCard = () => (
    <View style={styles.profileDetailsCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderTitleBox}>
          <Ionicons name="id-card-outline" size={19} color="#0A2540" />
          <Text style={styles.cardHeaderTitle}>
            {isEn ? 'Profile Details' : 'प्रोफ़ाइल विवरण'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cardEditPill}
          onPress={handleStartEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={14} color="#0A2540" />
          <Text style={styles.cardEditPillText}>
            {isEn ? 'Edit' : 'एडिट करें'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsBody}>
        {/* Full Name */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{isEn ? 'Full Name' : 'पूरा नाम'}</Text>
          <Text style={styles.detailValue}>{displayName}</Text>
        </View>

        <View style={styles.rowDividerInset} />

        {/* State */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{isEn ? 'State' : 'राज्य'}</Text>
          <Text style={styles.detailValue}>{displayState}</Text>
        </View>

        <View style={styles.rowDividerInset} />

        {/* Occupation */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{isEn ? 'Occupation' : 'व्यवसाय'}</Text>
          <Text style={styles.detailValue}>{displayOccupation}</Text>
        </View>

        <View style={styles.rowDividerInset} />

        {/* Annual Income */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{isEn ? 'Annual Income' : 'वार्षिक आय'}</Text>
          <Text style={styles.detailValue}>{displayIncome}</Text>
        </View>

        <View style={styles.rowDividerInset} />

        {/* House Type */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{isEn ? 'House Type' : 'मकान का प्रकार'}</Text>
          <Text style={styles.detailValue}>{displayHouseType}</Text>
        </View>

        <View style={styles.rowDividerInset} />

        {/* Social Category */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{isEn ? 'Category' : 'सामाजिक श्रेणी'}</Text>
          <Text style={styles.detailValue}>{displayCategory}</Text>
        </View>
      </View>
    </View>
  );

  // ==========================================
  // VIEW 2: PROFILE DETAIL (Sub-screen fallback)
  // ==========================================
  const renderProfileDetailView = () => (
    <>
      <View style={styles.subHeaderBar}>
        <TouchableOpacity
          style={styles.subHeaderBackBtn}
          onPress={() => setCurrentView('main')}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0A2540" />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>
          {isEn ? 'Profile Details' : 'प्रोफ़ाइल विवरण'}
        </Text>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.mainContentContainer}>
        {renderProfileDetailsCard()}
      </ScrollView>
    </>
  );

  // ==========================================
  // VIEW 3: SETTING (Sub-screen)
  // ==========================================
  const renderSettingView = () => (
    <>
      <View style={styles.subHeaderBar}>
        <TouchableOpacity
          style={styles.subHeaderBackBtn}
          onPress={() => setCurrentView('main')}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0A2540" />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>
          {isEn ? 'Setting' : 'सेटिंग'}
        </Text>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.settingsContainer}>
        <View style={styles.cardGroup}>
          {/* App Language */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRowLeft}>
              <Ionicons name="language-outline" size={20} color="#0A2540" style={styles.cardRowIcon} />
              <View>
                <Text style={styles.cardRowTitle}>{isEn ? 'App language' : 'ऐप की भाषा'}</Text>
                <Text style={styles.cardRowSub}>
                  {currentLanguage === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Notification */}
          <View style={styles.cardRow}>
            <View style={styles.cardRowLeft}>
              <Ionicons name="notifications-outline" size={20} color="#0A2540" style={styles.cardRowIcon} />
              <View>
                <Text style={styles.cardRowTitle}>{isEn ? 'notification' : 'सूचनाएं (Notification)'}</Text>
                <Text style={styles.cardRowSub}>
                  {notificationsEnabled ? (isEn ? 'Enabled' : 'चालू') : (isEn ? 'Disabled' : 'बंद')}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: '#0A2540' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Citizen Helpline */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => Linking.openURL('tel:1800115526')}
            activeOpacity={0.7}
          >
            <View style={styles.cardRowLeft}>
              <Ionicons name="call-outline" size={20} color="#0A2540" style={styles.cardRowIcon} />
              <View>
                <Text style={styles.cardRowTitle}>{isEn ? 'citizen helpline' : 'नागरिक हेल्पलाइन'}</Text>
                <Text style={styles.cardRowSub}>1800-115-526 (Toll Free)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setShowPrivacyModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#0A2540" style={styles.cardRowIcon} />
              <View>
                <Text style={styles.cardRowTitle}>{isEn ? 'privacy policy' : 'गोपनीयता नीति'}</Text>
                <Text style={styles.cardRowSub}>{isEn ? 'Data protection & rules' : 'सुरक्षित डेटा व नियम'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ==========================================
  // VIEW 1: MAIN PROFILE SCREEN (CuraTera Identity)
  // ==========================================
  const renderMainView = () => (
    <>
      {/* 1. CuraTera Signature Deep Navy Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          {/* Circular Avatar with White Border & Camera Badge */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={() => setShowFullImageViewer(true)}
              activeOpacity={0.85}
            >
              {activeDemoUser.image ? (
                <Image source={activeDemoUser.image} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={38} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Camera badge for changing photo */}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handleOpenPhotoPicker}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="camera" size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* User Name and Occupation (Verified Citizen removed as requested) */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroUserName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userOccupationText} numberOfLines={1}>
              {displayOccupation}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Menu Cards & Action Body */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.mainContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple Profile Details Card */}
        {renderProfileDetailsCard()}

        {/* Group 1: Setting & Change Password */}
        <View style={styles.cardGroup}>
          {/* Setting */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setCurrentView('setting')}
            activeOpacity={0.7}
          >
            <View style={styles.cardRowLeft}>
              <Ionicons name="settings-outline" size={20} color="#0A2540" style={styles.cardRowIcon} />
              <Text style={styles.cardRowTitle}>{isEn ? 'Setting' : 'सेटिंग'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Change Password */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#0A2540" style={styles.cardRowIcon} />
              <Text style={styles.cardRowTitle}>{isEn ? 'Change Password' : 'पासवर्ड बदलें'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Group 2: Share App */}
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.cardRow}
            onPress={handleShareApp}
            activeOpacity={0.7}
          >
            <View style={styles.cardRowLeft}>
              <Ionicons name="share-social-outline" size={20} color="#0A2540" style={styles.cardRowIcon} />
              <Text style={styles.cardRowTitle}>{isEn ? 'Share App' : 'ऐप शेयर करें'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 3. CuraTera Refined Red Outline Logout Button */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity
            style={styles.redLogoutBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={19} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.redLogoutBtnText}>{isEn ? 'Logout' : 'लॉग आउट'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ==========================================
  // MODAL 1: APP LANGUAGE SELECT MODAL
  // ==========================================
  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.languageModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>
                {isEn ? 'Select App Language' : 'ऐप की भाषा चुनें'}
              </Text>
              <Text style={styles.languageModalSub}>
                {isEn ? 'Choose your preferred language' : 'अपनी पसंदीदा भाषा चुनें'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.modalCloseIconBtn}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.languageOptionsContainer}>
            {/* Hindi Option */}
            <TouchableOpacity
              style={[
                styles.languageOptionCard,
                currentLanguage === 'hi' && styles.languageOptionCardActive,
              ]}
              onPress={() => {
                onLanguageChange('hi');
                setShowLanguageModal(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.languageOptionLeft}>
                <View
                  style={[
                    styles.langScriptCircle,
                    currentLanguage === 'hi' && styles.langScriptCircleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langScriptText,
                      currentLanguage === 'hi' && styles.langScriptTextActive,
                    ]}
                  >
                    अ
                  </Text>
                </View>
                <View>
                  <Text
                    style={[
                      styles.langOptionTitle,
                      currentLanguage === 'hi' && styles.langOptionTitleActive,
                    ]}
                  >
                    हिन्दी
                  </Text>
                  <Text style={styles.langOptionSub}>Hindi</Text>
                </View>
              </View>

              <View
                style={[
                  styles.langRadioCircle,
                  currentLanguage === 'hi' && styles.langRadioCircleActive,
                ]}
              >
                {currentLanguage === 'hi' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* English Option */}
            <TouchableOpacity
              style={[
                styles.languageOptionCard,
                currentLanguage === 'en' && styles.languageOptionCardActive,
              ]}
              onPress={() => {
                onLanguageChange('en');
                setShowLanguageModal(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.languageOptionLeft}>
                <View
                  style={[
                    styles.langScriptCircle,
                    currentLanguage === 'en' && styles.langScriptCircleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langScriptText,
                      currentLanguage === 'en' && styles.langScriptTextActive,
                    ]}
                  >
                    A
                  </Text>
                </View>
                <View>
                  <Text
                    style={[
                      styles.langOptionTitle,
                      currentLanguage === 'en' && styles.langOptionTitleActive,
                    ]}
                  >
                    English
                  </Text>
                  <Text style={styles.langOptionSub}>English</Text>
                </View>
              </View>

              <View
                style={[
                  styles.langRadioCircle,
                  currentLanguage === 'en' && styles.langRadioCircleActive,
                ]}
              >
                {currentLanguage === 'en' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ==========================================
  // MODAL 2: EDIT PROFILE MODAL
  // ==========================================
  const renderEditProfileModal = () => (
    <Modal
      visible={isEditingProfile}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsEditingProfile(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {isEn ? 'Edit Profile Details' : 'प्रोफ़ाइल विवरण संपादित करें'}
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            style={{ maxHeight: 420, marginBottom: 14 }}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{isEn ? 'Full Name' : 'पूरा नाम'}</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder={isEn ? 'Enter Name' : 'नाम दर्ज करें'}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* 1. State Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{isEn ? 'State' : 'राज्य'}</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  activeDropdown === 'state' && styles.dropdownButtonActive,
                ]}
                onPress={() => setActiveDropdown(activeDropdown === 'state' ? null : 'state')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dropdownValueText,
                    !editState && styles.dropdownPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {editState || (isEn ? 'Select State' : 'राज्य चुनें')}
                </Text>
                <Ionicons
                  name={activeDropdown === 'state' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={activeDropdown === 'state' ? '#0A2540' : '#64748B'}
                />
              </TouchableOpacity>

              {activeDropdown === 'state' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                    {STATE_OPTIONS.map((item, idx) => {
                      const val = isEn ? item.en : item.hi;
                      const isSelected = editState === val || editState.includes(item.en) || editState.includes(item.hi.split(' ')[0]);
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.dropdownMenuItem,
                            isSelected && styles.dropdownMenuItemActive,
                            idx === STATE_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          onPress={() => {
                            setEditState(val);
                            setActiveDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownMenuItemText,
                              isSelected && styles.dropdownMenuItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {val}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color="#0A2540" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* 2. Occupation Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{isEn ? 'Occupation' : 'व्यवसाय'}</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  activeDropdown === 'occupation' && styles.dropdownButtonActive,
                ]}
                onPress={() => setActiveDropdown(activeDropdown === 'occupation' ? null : 'occupation')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dropdownValueText,
                    !editOccupation && styles.dropdownPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {editOccupation || (isEn ? 'Select Occupation' : 'व्यवसाय चुनें')}
                </Text>
                <Ionicons
                  name={activeDropdown === 'occupation' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={activeDropdown === 'occupation' ? '#0A2540' : '#64748B'}
                />
              </TouchableOpacity>

              {activeDropdown === 'occupation' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                    {OCCUPATION_OPTIONS.map((item, idx) => {
                      const val = isEn ? item.en : item.hi;
                      const isSelected = editOccupation === val || editOccupation.includes(item.en) || editOccupation.includes(item.hi.split(' ')[0]);
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.dropdownMenuItem,
                            isSelected && styles.dropdownMenuItemActive,
                            idx === OCCUPATION_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          onPress={() => {
                            setEditOccupation(val);
                            setActiveDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownMenuItemText,
                              isSelected && styles.dropdownMenuItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {val}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color="#0A2540" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* 3. Annual Income Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{isEn ? 'Annual Income' : 'वार्षिक आय'}</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  activeDropdown === 'income' && styles.dropdownButtonActive,
                ]}
                onPress={() => setActiveDropdown(activeDropdown === 'income' ? null : 'income')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dropdownValueText,
                    !editIncome && styles.dropdownPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {editIncome || (isEn ? 'Select Annual Income' : 'वार्षिक आय चुनें')}
                </Text>
                <Ionicons
                  name={activeDropdown === 'income' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={activeDropdown === 'income' ? '#0A2540' : '#64748B'}
                />
              </TouchableOpacity>

              {activeDropdown === 'income' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                    {INCOME_OPTIONS.map((item, idx) => {
                      const val = isEn ? item.en : item.hi;
                      const isSelected = editIncome === val || editIncome.includes(item.en) || editIncome.includes(item.hi.split(' ')[0]);
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.dropdownMenuItem,
                            isSelected && styles.dropdownMenuItemActive,
                            idx === INCOME_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          onPress={() => {
                            setEditIncome(val);
                            setActiveDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownMenuItemText,
                              isSelected && styles.dropdownMenuItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {val}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color="#0A2540" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* 4. House Type Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{isEn ? 'House Type' : 'मकान का प्रकार'}</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  activeDropdown === 'houseType' && styles.dropdownButtonActive,
                ]}
                onPress={() => setActiveDropdown(activeDropdown === 'houseType' ? null : 'houseType')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dropdownValueText,
                    !editHouseType && styles.dropdownPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {editHouseType || (isEn ? 'Select House Type' : 'मकान का प्रकार चुनें')}
                </Text>
                <Ionicons
                  name={activeDropdown === 'houseType' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={activeDropdown === 'houseType' ? '#0A2540' : '#64748B'}
                />
              </TouchableOpacity>

              {activeDropdown === 'houseType' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                    {HOUSE_TYPE_OPTIONS.map((item, idx) => {
                      const val = isEn ? item.en : item.hi;
                      const isSelected = editHouseType === val || editHouseType.includes(item.en) || editHouseType.includes(item.hi.split(' ')[0]);
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.dropdownMenuItem,
                            isSelected && styles.dropdownMenuItemActive,
                            idx === HOUSE_TYPE_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          onPress={() => {
                            setEditHouseType(val);
                            setActiveDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownMenuItemText,
                              isSelected && styles.dropdownMenuItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {val}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color="#0A2540" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Category / सामाजिक श्रेणी */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{isEn ? 'Social Category' : 'सामाजिक श्रेणी (Category)'}</Text>
              
              {/* Quick Select Category Chips */}
              <View style={styles.categoryChipsRow}>
                {[
                  { key: 'General', labelHi: 'सामान्य', labelEn: 'General' },
                  { key: 'OBC', labelHi: 'ओबीसी', labelEn: 'OBC' },
                  { key: 'SC', labelHi: 'एससी', labelEn: 'SC' },
                  { key: 'ST', labelHi: 'एसटी', labelEn: 'ST' },
                ].map((cat) => {
                  const catVal = isEn ? cat.labelEn : cat.labelHi;
                  const isSelected = editCategory.toLowerCase().includes(cat.key.toLowerCase()) || 
                                     editCategory.toLowerCase().includes(cat.labelHi.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipActive,
                      ]}
                      onPress={() => setEditCategory(catVal)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextActive,
                        ]}
                      >
                        {isEn ? cat.labelEn : cat.labelHi}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.textInput}
                value={editCategory}
                onChangeText={setEditCategory}
                placeholder={isEn ? 'General, OBC, SC, ST' : 'सामान्य, ओबीसी, एससी, एसटी'}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </ScrollView>

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsEditingProfile(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>{isEn ? 'Cancel' : 'रद्द करें'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSaveProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitText}>{isEn ? 'Save' : 'सुरक्षित करें'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ==========================================
  // MODAL 3: CHANGE PASSWORD MODAL
  // ==========================================
  const renderPasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPasswordModal(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {isEn ? 'Change Password' : 'पासवर्ड बदलें'}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{isEn ? 'Current Password' : 'वर्तमान पासवर्ड'}</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{isEn ? 'New Password' : 'नया पासवर्ड'}</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{isEn ? 'Confirm New Password' : 'नया पासवर्ड दोबारा दर्ज करें'}</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowPasswordModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>{isEn ? 'Cancel' : 'रद्द करें'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleChangePasswordSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitText}>{isEn ? 'Update' : 'अपडेट करें'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ==========================================
  // MODAL 4: PRIVACY POLICY MODAL
  // ==========================================
  const renderPrivacyModal = () => (
    <Modal
      visible={showPrivacyModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {isEn ? 'Privacy Policy' : 'गोपनीयता नीति'}
          </Text>
          <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
            <Text style={{ fontSize: 13.5, color: '#475569', lineHeight: 20 }}>
              {isEn
                ? 'CuraTera is committed to protecting citizen privacy. Your personal information, land records, and document details are encrypted and used solely for matching government welfare schemes.'
                : 'CuraTera नागरिकों की गोपनीयता की रक्षा के लिए पूरी तरह प्रतिबद्ध है। आपकी व्यक्तिगत जानकारी और दस्तावेज़ पूर्णतः सुरक्षित व एन्क्रिप्टेड हैं और इनका उपयोग केवल सरकारी योजनाओं की पात्रता जांचने के लिए किया जाता है।'}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.modalSubmitBtn}
            onPress={() => setShowPrivacyModal(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.modalSubmitText}>{isEn ? 'Close' : 'बंद करें'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ==========================================
  // MODAL 5: FULL SCREEN IMAGE VIEWER
  // ==========================================
  const renderFullImageViewerModal = () => (
    <Modal
      visible={showFullImageViewer}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFullImageViewer(false)}
    >
      <View style={styles.fullImageBackdrop}>
        {/* Top Header Bar with Close and Edit */}
        <View style={styles.fullImageHeader}>
          <TouchableOpacity
            style={styles.fullImageCloseBtn}
            onPress={() => setShowFullImageViewer(false)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.fullImageHeaderTitle} numberOfLines={1}>
            {displayName}
          </Text>

          <TouchableOpacity
            style={styles.fullImageEditBtn}
            onPress={() => {
              setShowFullImageViewer(false);
              handleOpenPhotoPicker();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Center Large Image */}
        <View style={styles.fullImageCenterContainer}>
          {activeDemoUser.image ? (
            <Image
              source={activeDemoUser.image}
              style={styles.fullImageLarge}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fullImagePlaceholder}>
              <Ionicons name="person" size={120} color="#94A3B8" />
            </View>
          )}
        </View>

        {/* Bottom Bar with Change Photo Action */}
        <View style={styles.fullImageBottomBar}>
          <TouchableOpacity
            style={styles.fullImageChangePhotoBtn}
            onPress={() => {
              setShowFullImageViewer(false);
              handleOpenPhotoPicker();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.fullImageChangePhotoText}>
              {isEn ? 'Change Profile Photo' : 'फ़ोटो बदलें'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ==========================================
  // MODAL 6: PHOTO PICKER BOTTOM SHEET MODAL
  // ==========================================
  const renderPhotoPickerModal = () => (
    <Modal
      visible={showPhotoPickerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPhotoPickerModal(false)}
    >
      <View style={styles.photoPickerBackdrop}>
        <TouchableOpacity
          style={styles.photoPickerBackdropTouchable}
          activeOpacity={1}
          onPress={() => setShowPhotoPickerModal(false)}
        />
        <View style={styles.photoPickerCard}>
          {/* Drag Handle */}
          <View style={styles.photoPickerDragHandle} />

          {/* Header */}
          <View style={styles.photoPickerHeader}>
            <Text style={styles.photoPickerTitle}>
              {isEn ? 'Change Profile Photo' : 'प्रोफ़ाइल फ़ोटो बदलें'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowPhotoPickerModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.photoPickerCloseBtn}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Clean Neutral Action Rows */}
          <View style={styles.photoPickerOptions}>
            {/* Camera */}
            <TouchableOpacity
              style={styles.photoPickerOptionItem}
              onPress={handleLaunchCamera}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={22} color="#0F172A" />
              <Text style={styles.photoPickerOptionTitle}>
                {isEn ? 'Camera' : 'कैमरा'}
              </Text>
            </TouchableOpacity>

            <View style={styles.photoPickerDivider} />

            {/* Gallery */}
            <TouchableOpacity
              style={styles.photoPickerOptionItem}
              onPress={handleLaunchGallery}
              activeOpacity={0.7}
            >
              <Ionicons name="image-outline" size={22} color="#0F172A" />
              <Text style={styles.photoPickerOptionTitle}>
                {isEn ? 'Gallery' : 'फ़ोन गैलरी'}
              </Text>
            </TouchableOpacity>

            {/* Remove Photo */}
            {activeDemoUser.image && (
              <>
                <View style={styles.photoPickerDivider} />
                <TouchableOpacity
                  style={styles.photoPickerOptionItem}
                  onPress={handleRemovePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={22} color="#64748B" />
                  <Text style={[styles.photoPickerOptionTitle, { color: '#64748B' }]}>
                    {isEn ? 'Remove Current Photo' : 'फ़ोटो हटाएं'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.photoPickerCancelBtn}
            onPress={() => setShowPhotoPickerModal(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.photoPickerCancelText}>
              {isEn ? 'Cancel' : 'रद्द करें'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ==========================================
  // ROOT COMPONENT RETURN
  // ==========================================
  return (
    <View style={styles.container}>
      {currentView === 'main' && renderMainView()}
      {currentView === 'profile_detail' && renderProfileDetailView()}
      {currentView === 'setting' && renderSettingView()}

      {/* Common Modals */}
      {renderFullImageViewerModal()}
      {renderPhotoPickerModal()}
      {renderLanguageModal()}
      {renderEditProfileModal()}
      {renderPasswordModal()}
      {renderPrivacyModal()}

      {/* Upload Toast (App Icon + Small Text, NO other icons) */}
      {uploadToastStatus !== 'idle' && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastPill}>
            <Image
              source={require('../../assets/CuraTera_Logo.png')}
              style={styles.toastAppLogo}
              resizeMode="cover"
            />
            <Text style={styles.toastText}>
              {uploadToastStatus === 'updating'
                ? (isEn ? 'Updating photo...' : 'फ़ोटो अपडेट हो रही है...')
                : (isEn ? 'Photo updated successfully' : 'फ़ोटो सफलतापूर्वक अपडेट हो गई')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // CuraTera Deep Navy Brand Hero Banner
  heroBanner: {
    backgroundColor: '#0A2540',
    paddingTop: Platform.OS === 'android' ? 24 : 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E293B',
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  heroUserName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  verifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
  },
  userOccupationText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },

  // Content Area
  contentScroll: {
    flex: 1,
  },
  mainContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },

  // Profile Details Simple Card (CuraTera Original)
  profileDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#FAFCFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A2540',
  },
  cardEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardEditPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A2540',
  },
  detailsBody: {
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: '58%',
  },
  rowDividerInset: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },

  // Grouped Card Styling (CuraTera Original)
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  cardRowIcon: {
    marginRight: 14,
    width: 22,
    textAlign: 'center',
  },
  cardRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardRowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 52,
  },

  // Red Outline Logout Button
  logoutWrapper: {
    marginTop: 28,
    paddingHorizontal: 4,
  },
  redLogoutBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redLogoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Sub-Screen Header
  subHeaderBar: {
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
  subHeaderBackBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Sub-Screen Form / Settings Content
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  settingsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: '#0F172A',
  },
  saveBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0A2540',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#0A2540',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Language Modal Specific Styles
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  languageModalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseIconBtn: {
    padding: 4,
  },
  languageOptionsContainer: {
    gap: 12,
    marginBottom: 8,
  },
  languageOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  languageOptionCardActive: {
    borderColor: '#0A2540',
    backgroundColor: '#F0F7FF',
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langScriptCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langScriptCircleActive: {
    backgroundColor: '#0A2540',
  },
  langScriptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  langScriptTextActive: {
    color: '#FFFFFF',
  },
  langOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  langOptionTitleActive: {
    color: '#0A2540',
  },
  langOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  langRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  langRadioCircleActive: {
    borderColor: '#0A2540',
    backgroundColor: '#0A2540',
  },

  // Category Quick Select Chips
  categoryChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    borderColor: '#0A2540',
    backgroundColor: '#0A2540',
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  // Dropdown Button & Menu Styles
  dropdownButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonActive: {
    borderColor: '#0A2540',
    backgroundColor: '#F8FAFC',
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  dropdownPlaceholderText: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownMenuItemText: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  dropdownMenuItemTextActive: {
    color: '#0A2540',
    fontWeight: '700',
  },

  // Full Screen Image Viewer Styles
  fullImageBackdrop: {
    flex: 1,
    backgroundColor: '#050C18',
    justifyContent: 'space-between',
  },
  fullImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 24 : 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0A2540',
  },
  fullImageCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fullImageHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  fullImageEditBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fullImageCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullImageLarge: {
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E293B',
  },
  fullImagePlaceholder: {
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
  },
  fullImageBottomBar: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 28 : 46,
    alignItems: 'center',
  },
  fullImageChangePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    backgroundColor: '#0A2540',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fullImageChangePhotoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Photo Picker Bottom Sheet Modal Styles
  photoPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.6)',
    justifyContent: 'flex-end',
  },
  photoPickerBackdropTouchable: {
    flex: 1,
  },
  photoPickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 24 : 40,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  photoPickerDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  photoPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoPickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2540',
  },
  photoPickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerOptions: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  photoPickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    gap: 14,
  },
  photoPickerOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  photoPickerDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 50,
  },
  photoPickerCancelBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },

  // Album-Style Photo Crop Styles
  albumCropContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  albumCropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 24 : 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  albumHeaderCloseBtn: {
    padding: 4,
  },
  albumHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  albumHeaderDoneBtn: {
    padding: 4,
  },
  albumCenterStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  albumPhotoStage: {
    width: 330,
    height: 390,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  albumFullPhoto: {
    width: '100%',
    height: '100%',
  },
  albumDimmedMask: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  albumCropBox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  albumGridLineH1: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  albumGridLineH2: {
    position: 'absolute',
    top: '66.66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  albumGridLineV1: {
    position: 'absolute',
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  albumGridLineV2: {
    position: 'absolute',
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  albumCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#FFFFFF',
  },
  albumCornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  albumCornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
  },
  albumCornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  albumCornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
  },
  albumResizeTouchZone: {
    width: 40,
    height: 40,
    bottom: -6,
    right: -6,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  albumGuideText: {
    marginTop: 18,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  albumBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 42,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 16,
  },
  albumCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  albumSaveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },

  // Toast Overlay (App Icon + Small Text)
  toastOverlay: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 36 : 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 999,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A2540',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toastAppLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

});

