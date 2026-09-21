import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  Platform,
  TextInput,
  Switch,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import * as ImagePicker from '../utils/imagePicker';
import { Colors } from '../theme/colors';
import { DemoUser } from '../data/demoUsers';
import { UserProfile } from '../types';
import { SupportedLanguage, translations } from '../i18n/translations';

interface ProfileScreenProps {
  onStartReProfiling: () => void;
  activeDemoUser: DemoUser;
  onOpenUserSwitcher: () => void;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLogout: () => void;
  onUpdateAvatar?: (newImageSource: any) => void;
  onUpdateProfile?: (updatedProfile: Partial<UserProfile>, updatedName?: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onStartReProfiling,
  activeDemoUser,
  onOpenUserSwitcher,
  currentLanguage = 'en',
  onLanguageChange,
  onLogout,
  onUpdateAvatar,
  onUpdateProfile,
}) => {
  const isEn = currentLanguage === 'en';
  const t = translations[currentLanguage];

  // Navigation state within profile: Main view vs Full-Page Edit Screen
  const [isEditingFullPage, setIsEditingFullPage] = useState(false);

  // Modals & Settings State
  const [isPhotoSheetVisible, setIsPhotoSheetVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isLangPickerVisible, setIsLangPickerVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [voiceGuidanceEnabled, setVoiceGuidanceEnabled] = useState(true);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const displayName = isEn
    ? (activeDemoUser.nameEn || activeDemoUser.name)
    : (activeDemoUser.nameHi || activeDemoUser.name);

  const profileData = activeDemoUser.profile;

  // Complete Form Edit State (All 10 Citizen Fields)
  const [editName, setEditName] = useState(displayName);
  const [editAge, setEditAge] = useState(String(profileData.age));
  const [editGender, setEditGender] = useState(profileData.gender || 'male');
  const [editState, setEditState] = useState(profileData.stateEn || profileData.state);
  const [editArea, setEditArea] = useState(profileData.areaEn || profileData.area);
  const [editOccupation, setEditOccupation] = useState(profileData.occupationEn || profileData.occupation);
  const [editIncome, setEditIncome] = useState(profileData.annualIncomeEn || profileData.annualIncome);
  const [editCategory, setEditCategory] = useState(profileData.categoryEn || profileData.category);
  const [editHouseType, setEditHouseType] = useState(profileData.houseTypeEn || profileData.houseType);
  const [editIsKisan, setEditIsKisan] = useState(profileData.isKisan);

  // Synchronize edit fields when activeDemoUser changes
  const handleOpenFullPageEdit = () => {
    setEditName(displayName);
    setEditAge(String(profileData.age));
    setEditGender(profileData.gender || 'male');
    setEditState(profileData.stateEn || profileData.state);
    setEditArea(profileData.areaEn || profileData.area);
    setEditOccupation(profileData.occupationEn || profileData.occupation);
    setEditIncome(profileData.annualIncomeEn || profileData.annualIncome);
    setEditCategory(profileData.categoryEn || profileData.category);
    setEditHouseType(profileData.houseTypeEn || profileData.houseType);
    setEditIsKisan(profileData.isKisan);
    setIsEditingFullPage(true);
  };

  // 1. Photo Picker Handlers
  const handlePickFromGallery = async () => {
    setIsPhotoSheetVisible(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (onUpdateAvatar) {
          onUpdateAvatar({ uri });
        }
        showToast(isEn ? 'Profile photo updated successfully!' : 'प्रोफ़ाइल फोटो सफलतापूर्वक अपडेट हो गई!');
      }
    } catch (error) {
      console.warn('ImagePicker gallery error:', error);
    }
  };

  const handleTakePhoto = async () => {
    setIsPhotoSheetVisible(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            isEn ? 'Permission Required' : 'अनुमति आवश्यक है',
            isEn ? 'Camera access is required to take a profile photo.' : 'प्रोफ़ाइल फोटो लेने के लिए कैमरा एक्सेस ज़रूरी है।'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (onUpdateAvatar) {
          onUpdateAvatar({ uri });
        }
        showToast(isEn ? 'Profile photo captured & updated!' : 'नई फोटो ली गई और प्रोफाइल में अपडेट हो गई!');
      }
    } catch (error) {
      console.warn('ImagePicker camera error:', error);
    }
  };

  const handleRemovePhoto = () => {
    setIsPhotoSheetVisible(false);
    if (onUpdateAvatar) {
      onUpdateAvatar(null);
    }
    showToast(isEn ? 'Profile photo removed' : 'प्रोफ़ाइल फोटो हटा दी गई');
  };

  // 2. Save All 10 Citizen Profile Details
  const handleSaveFullProfile = () => {
    const ageNum = parseInt(editAge, 10) || profileData.age;
    if (onUpdateProfile) {
      onUpdateProfile(
        {
          age: ageNum,
          gender: editGender as any,
          genderEn: editGender === 'female' ? 'Female' : editGender === 'other' ? 'Other' : 'Male',
          genderHi: editGender === 'female' ? 'महिला' : editGender === 'other' ? 'अन्य' : 'पुरुष',
          state: editState,
          stateEn: editState,
          stateHi: editState,
          area: editArea,
          areaEn: editArea,
          areaHi: editArea,
          occupation: editOccupation,
          occupationEn: editOccupation,
          occupationHi: editOccupation,
          annualIncome: editIncome,
          annualIncomeEn: editIncome,
          annualIncomeHi: editIncome,
          category: editCategory,
          categoryEn: editCategory,
          categoryHi: editCategory,
          houseType: editHouseType,
          houseTypeEn: editHouseType,
          houseTypeHi: editHouseType,
          isKisan: editIsKisan,
        },
        editName.trim() || displayName
      );
    }
    setIsEditingFullPage(false);
    showToast(isEn ? 'All profile details saved successfully!' : 'सभी विवरण सफलतापूर्वक सुरक्षित हो गए!');
  };

  // 3. Clean Key-Value List Items for Main View
  const profileStats = [
    { label: isEn ? 'Full Name' : 'पूरा नाम', value: displayName },
    { label: isEn ? 'Age' : 'उम्र', value: `${profileData.age} ${isEn ? 'yrs' : 'वर्ष'}` },
    {
      label: isEn ? 'Gender' : 'लिंग',
      value: isEn ? (profileData.genderEn || 'Male') : (profileData.genderHi || 'पुरुष'),
    },
    {
      label: isEn ? 'State' : 'राज्य',
      value: isEn ? (profileData.stateEn || profileData.state) : (profileData.stateHi || profileData.state),
    },
    {
      label: isEn ? 'Area' : 'क्षेत्र',
      value: isEn ? (profileData.areaEn || profileData.area) : (profileData.areaHi || profileData.area),
    },
    {
      label: isEn ? 'Occupation' : 'पेशा / आजीविका',
      value: isEn ? (profileData.occupationEn || profileData.occupation) : (profileData.occupationHi || profileData.occupation),
    },
    {
      label: isEn ? 'Annual Family Income' : 'वार्षिक पारिवारिक आय',
      value: isEn ? (profileData.annualIncomeEn || profileData.annualIncome) : (profileData.annualIncomeHi || profileData.annualIncome),
    },
    {
      label: isEn ? 'Social Category' : 'सामाजिक श्रेणी',
      value: isEn ? (profileData.categoryEn || profileData.category) : (profileData.categoryHi || profileData.category),
    },
    {
      label: isEn ? 'Housing Status' : 'मकान का प्रकार',
      value: isEn ? (profileData.houseTypeEn || profileData.houseType) : (profileData.houseTypeHi || profileData.houseType),
    },
    {
      label: isEn ? 'Farmer Status' : 'किसान स्थिति',
      value: profileData.isKisan
        ? (isEn ? 'Registered Farmer' : 'पंजीकृत किसान')
        : (isEn ? 'Non-Farmer' : 'गैर-किसान'),
    },
  ];

  // ==========================================
  // VIEW 1: DEDICATED FULL-PAGE EDIT SCREEN (सुझाव 3)
  // ==========================================
  if (isEditingFullPage) {
    return (
      <View style={styles.editPageContainer}>
        {/* Top Header Bar */}
        <View style={styles.editPageHeader}>
          <TouchableOpacity
            style={styles.editPageBackBtn}
            onPress={() => setIsEditingFullPage(false)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#0A2540" />
          </TouchableOpacity>
          <Text style={styles.editPageTitle}>
            {isEn ? 'Edit Citizen Profile' : 'प्रोफ़ाइल संपादित करें'}
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.editPageScroll}
          contentContainerStyle={styles.editPageContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Basic Identity */}
          <Text style={styles.formSectionHeader}>
            {isEn ? '1. Personal Information' : '1. व्यक्तिगत जानकारी'}
          </Text>

          {/* Full Name */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Full Name' : 'पूरा नाम'}</Text>
            <TextInput
              style={styles.textInputBox}
              value={editName}
              onChangeText={setEditName}
              placeholder={isEn ? 'Enter citizen name' : 'नागरिक का नाम दर्ज करें'}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Age */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Age (Years)' : 'उम्र (वर्ष)'}</Text>
            <TextInput
              style={styles.textInputBox}
              value={editAge}
              onChangeText={setEditAge}
              keyboardType="numeric"
              placeholder={isEn ? 'e.g. 48' : 'उदा. 48'}
              placeholderTextColor="#94A3B8"
              maxLength={3}
            />
          </View>

          {/* Gender */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Gender' : 'लिंग'}</Text>
            <View style={styles.pillsRow}>
              {[
                { id: 'male', en: 'Male', hi: 'पुरुष' },
                { id: 'female', en: 'Female', hi: 'महिला' },
                { id: 'other', en: 'Other', hi: 'अन्य' },
              ].map((g) => {
                const isSel = editGender === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.pillBtn, isSel && styles.pillBtnActive]}
                    onPress={() => setEditGender(g.id as 'male' | 'female' | 'other')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextActive]}>
                      {isEn ? g.en : g.hi}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 2: Location & Area */}
          <Text style={[styles.formSectionHeader, { marginTop: 24 }]}>
            {isEn ? '2. Location & Residence' : '2. स्थान एवं निवास'}
          </Text>

          {/* State */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'State' : 'राज्य'}</Text>
            <View style={styles.pillsRow}>
              {[
                { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश' },
                { en: 'Bihar', hi: 'बिहार' },
                { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश' },
                { en: 'Delhi NCR', hi: 'दिल्ली' },
                { en: 'Rajasthan', hi: 'राजस्थान' },
                { en: 'Maharashtra', hi: 'महाराष्ट्र' },
              ].map((st, idx) => {
                const val = isEn ? st.en : st.hi;
                const isSel = editState === val || editState === st.en || editState === st.hi;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pillBtn, isSel && styles.pillBtnActive]}
                    onPress={() => setEditState(val)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextActive]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Area */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Area Type' : 'क्षेत्र'}</Text>
            <View style={styles.pillsRow}>
              {[
                { en: 'Rural', hi: 'ग्रामीण' },
                { en: 'Urban', hi: 'शहरी' },
              ].map((ar, idx) => {
                const val = isEn ? ar.en : ar.hi;
                const isSel = editArea.toLowerCase().includes(ar.en.toLowerCase()) || editArea.includes(ar.hi);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pillBtn, isSel && styles.pillBtnActive]}
                    onPress={() => setEditArea(val)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextActive]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 3: Socio-Economic & Welfare */}
          <Text style={[styles.formSectionHeader, { marginTop: 24 }]}>
            {isEn ? '3. Socio-Economic & Welfare Details' : '3. सामाजिक एवं आर्थिक विवरण'}
          </Text>

          {/* Occupation */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Occupation / Livelihood' : 'पेशा / आजीविका'}</Text>
            <View style={styles.pillsRow}>
              {[
                { en: 'Small & Marginal Farmer', hi: 'लघु एवं सीमांत किसान' },
                { en: 'Student', hi: 'विद्यार्थी' },
                { en: 'Street Vendor', hi: 'रेहड़ी-पटरी विक्रेता' },
                { en: 'Daily Wage Laborer', hi: 'दैनिक मजदूर' },
                { en: 'Homemaker', hi: 'गृहणी' },
                { en: 'Self-Employed', hi: 'स्वरोजगार' },
              ].map((occ, idx) => {
                const val = isEn ? occ.en : occ.hi;
                const isSel = editOccupation === val || editOccupation === occ.en || editOccupation === occ.hi;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pillBtn, isSel && styles.pillBtnActive]}
                    onPress={() => {
                      setEditOccupation(val);
                      if (occ.en.includes('Farmer')) {
                        setEditIsKisan(true);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextActive]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Annual Family Income */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Annual Family Income' : 'वार्षिक पारिवारिक आय'}</Text>
            <View style={styles.pillsRow}>
              {[
                { en: 'Below ₹1.20 Lakh (BPL)', hi: '₹1.20 लाख से कम (बीपीएल)' },
                { en: '₹1.20 - ₹1.80 Lakh', hi: '₹1.20 - ₹1.80 लाख' },
                { en: '₹1.80 - ₹2.50 Lakh', hi: '₹1.80 - ₹2.50 लाख' },
                { en: 'Above ₹2.50 Lakh', hi: '₹2.50 लाख से अधिक' },
              ].map((inc, idx) => {
                const val = isEn ? inc.en : inc.hi;
                const isSel = editIncome === val || editIncome === inc.en || editIncome === inc.hi;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pillBtn, isSel && styles.pillBtnActive]}
                    onPress={() => setEditIncome(val)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextActive]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Social Category */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Social Category' : 'सामाजिक श्रेणी'}</Text>
            <View style={styles.pillsRow}>
              {['General', 'OBC', 'SC', 'ST', 'EWS'].map((cat, idx) => {
                const isSel = editCategory.toUpperCase().includes(cat);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pillBtn, isSel && styles.pillBtnActive]}
                    onPress={() => setEditCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Housing Status */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Housing Status' : 'मकान का प्रकार'}</Text>
            <View style={styles.pillsRow}>
              {[
                { en: 'Kutcha House', hi: 'कच्चा मकान' },
                { en: 'Pucca House', hi: 'पक्का मकान' },
                { en: 'Rented', hi: 'किराया' },
              ].map((ht, idx) => {
                const val = isEn ? ht.en : ht.hi;
                const isSel = editHouseType === val || editHouseType === ht.en || editHouseType === ht.hi;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pillBtn, isSel && styles.pillBtnActive]}
                    onPress={() => setEditHouseType(val)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextActive]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Farmer / Land Ownership */}
          <View style={styles.inputFieldBlock}>
            <Text style={styles.inputLabel}>{isEn ? 'Are you a Farmer / Landowner?' : 'क्या आप किसान / भूस्वामी हैं?'}</Text>
            <View style={styles.pillsRow}>
              {[
                { bool: true, en: 'Yes (Farmer)', hi: 'हाँ (किसान)' },
                { bool: false, en: 'No', hi: 'नहीं' },
              ].map((fk, idx) => {
                const isSel = editIsKisan === fk.bool;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pillBtn, isSel && styles.pillBtnActive]}
                    onPress={() => setEditIsKisan(fk.bool)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextActive]}>
                      {isEn ? fk.en : fk.hi}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.fullPageSaveBtn}
            onPress={handleSaveFullProfile}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
            <Text style={styles.fullPageSaveBtnText}>
              {isEn ? 'Save Changes' : 'विवरण सुरक्षित करें'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // VIEW 2: MAIN PROFILE VIEW (ABHA GovTech Standard)
  // ==========================================
  return (
    <View style={styles.container}>
      {/* Success Toast Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Citizen Identity Header (Clean GovTech - Zero Clutter, No DigiLocker Text) */}
        <View style={styles.identitySection}>
          <View style={styles.identityTopRow}>
            {/* 80x80 Circular Photo with Camera Edit Badge */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={() => setIsPhotoSheetVisible(true)}
                activeOpacity={0.85}
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

              {/* Camera Icon Badge */}
              <TouchableOpacity
                style={styles.cameraBadge}
                onPress={() => setIsPhotoSheetVisible(true)}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.identityInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userSubtitle}>
                {isEn
                  ? (profileData.occupationEn || profileData.occupation)
                  : (profileData.occupationHi || profileData.occupation)}
                {' • '}
                {isEn
                  ? (profileData.stateEn || profileData.state)
                  : (profileData.stateHi || profileData.state)}
              </Text>
            </View>
          </View>

          {/* Switch Citizen Profile Action Bar */}
          <TouchableOpacity
            style={styles.switchUserBar}
            onPress={onOpenUserSwitcher}
            activeOpacity={0.75}
          >
            <View style={styles.switchUserBarLeft}>
              <Ionicons name="swap-horizontal" size={17} color={Colors.orange.primary} />
              <Text style={styles.switchUserBarText}>
                {isEn ? 'Switch Citizen Profile (Demo)' : 'नागरिक प्रोफाइल बदलें (डेमो)'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 2. Socio-Economic Profile (Clean Native Key-Value List) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {isEn ? 'Socio-Economic Profile' : 'सामाजिक-आर्थिक विवरण'}
            </Text>
            <TouchableOpacity
              style={styles.editLinkBtn}
              onPress={handleOpenFullPageEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={15} color={Colors.orange.primary} />
              <Text style={styles.editLinkText}>
                {isEn ? 'Edit' : 'संपादित करें'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Clean Native Key-Value Rows */}
          <View style={styles.nativeList}>
            {profileStats.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.nativeRow,
                  idx === profileStats.length - 1 && styles.nativeRowLast,
                ]}
              >
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue} numberOfLines={1}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Mitra AI Re-calculate Action */}
          <TouchableOpacity
            style={styles.reProfileButton}
            onPress={onStartReProfiling}
            activeOpacity={0.75}
          >
            <Ionicons name="sparkles" size={16} color="#0A2540" />
            <Text style={styles.reProfileButtonText}>
              {isEn ? 'Re-calculate Eligibility with Mitra AI' : 'पात्रता दोबारा जांचें (Mitra AI)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Settings Action Row */}
        <View style={styles.sectionBlock}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => setIsSettingsModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.settingsLeftContent}>
              <View style={styles.settingsIconBadge}>
                <Ionicons name="settings-sharp" size={18} color="#0A2540" />
              </View>
              <Text style={styles.settingsRowTitle}>
                {isEn ? 'Settings' : 'सेटिंग्स'}
              </Text>
            </View>

            <View style={styles.settingsRightContent}>
              <Text style={styles.settingsCurrentValue}>
                {isEn ? 'English' : 'हिन्दी'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Account Action: Clean Logout Row */}
        <View style={styles.sectionBlock}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={() => setIsLogoutModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.logoutLeftContent}>
              <Ionicons name="log-out-outline" size={20} color={Colors.orange.primary} />
              <Text style={styles.logoutRowTitle}>{t.logout}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 5. Photo Update & Crop Action Sheet Modal */}
      <Modal
        visible={isPhotoSheetVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPhotoSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setIsPhotoSheetVisible(false)}
        >
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {isEn ? 'Change Profile Photo' : 'प्रोफ़ाइल फोटो बदलें'}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {isEn
                ? 'Select a photo from your camera or gallery to crop and set.'
                : 'क्रॉप करके लगाने के लिए कैमरे या गैलरी से फोटो चुनें।'}
            </Text>

            {/* Actions */}
            <TouchableOpacity
              style={styles.sheetActionRow}
              onPress={handleTakePhoto}
              activeOpacity={0.75}
            >
              <View style={styles.sheetIconCircle}>
                <Ionicons name="camera-outline" size={20} color="#0A2540" />
              </View>
              <View style={styles.sheetActionTexts}>
                <Text style={styles.sheetActionTitle}>
                  {isEn ? 'Take Photo' : 'कैमरा से फोटो लें'}
                </Text>
                <Text style={styles.sheetActionDesc}>
                  {isEn ? 'Use camera to take a new selfie' : 'सीधे नया पासपोर्ट फोटो खींचें'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetActionRow}
              onPress={handlePickFromGallery}
              activeOpacity={0.75}
            >
              <View style={styles.sheetIconCircle}>
                <Ionicons name="images-outline" size={20} color="#0A2540" />
              </View>
              <View style={styles.sheetActionTexts}>
                <Text style={styles.sheetActionTitle}>
                  {isEn ? 'Choose from Gallery' : 'गैलरी से चुनें'}
                </Text>
                <Text style={styles.sheetActionDesc}>
                  {isEn ? 'Select & crop from phone library' : 'फ़ोन से फ़ोटो चुनकर 1:1 में क्रॉप करें'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {activeDemoUser.image && (
              <TouchableOpacity
                style={[styles.sheetActionRow, { borderBottomWidth: 0 }]}
                onPress={handleRemovePhoto}
                activeOpacity={0.75}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </View>
                <View style={styles.sheetActionTexts}>
                  <Text style={[styles.sheetActionTitle, { color: '#DC2626' }]}>
                    {isEn ? 'Remove Photo' : 'फोटो हटाएं'}
                  </Text>
                  <Text style={styles.sheetActionDesc}>
                    {isEn ? 'Reset to default avatar' : 'डिफ़ॉल्ट अवतार पर सेट करें'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetCancelButton}
              onPress={() => setIsPhotoSheetVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCancelButtonText}>
                {isEn ? 'Cancel' : 'रद्द करें'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 6. Clean Official Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconBadge}>
              <Ionicons name="log-out-outline" size={32} color={Colors.orange.primary} />
            </View>

            <Text style={styles.logoutModalTitle}>
              {isEn ? 'Log Out of YojnaMitra?' : 'योजना मित्र से लॉग आउट करें?'}
            </Text>
            <Text style={styles.logoutModalMessage}>
              {isEn
                ? 'You will be returned to the sign-in screen. Your saved schemes and profile data will remain safe.'
                : 'आप वापस लॉगिन स्क्रीन पर चले जाएंगे। आपकी सुरक्षित योजनाएं और प्रोफाइल डेटा पूरी तरह सुरक्षित रहेगा।'}
            </Text>

            <View style={styles.logoutModalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsLogoutModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>
                  {isEn ? 'Cancel' : 'रद्द करें'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutButton}
                onPress={() => {
                  setIsLogoutModalVisible(false);
                  onLogout();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmLogoutButtonText}>
                  {isEn ? 'Log Out' : 'लॉग आउट'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. Real-App Style Settings Modal (Clean List of Simple Text Rows) */}
      <Modal
        visible={isSettingsModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.settingsFullContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          {Platform.OS === 'android' && (
            <View style={{ height: StatusBar.currentHeight || 28, backgroundColor: '#FFFFFF' }} />
          )}

          {/* Top Bar with Back Arrow */}
          <View style={styles.settingsTopBar}>
            <TouchableOpacity
              style={styles.settingsBackBtn}
              onPress={() => setIsSettingsModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#0A2540" />
            </TouchableOpacity>
            <Text style={styles.settingsTopBarTitle}>
              {isEn ? 'Settings' : 'सेटिंग्स'}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={styles.settingsScrollView}
            contentContainerStyle={styles.settingsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: PREFERENCES */}
            <Text style={styles.settingsGroupHeader}>
              {isEn ? 'PREFERENCES' : 'प्राथमिकताएं'}
            </Text>
            <View style={styles.settingsListBox}>
              {/* Row: App Language */}
              <TouchableOpacity
                style={styles.settingItemRow}
                onPress={() => setIsLangPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="language-outline" size={20} color="#0A2540" />
                  </View>
                  <Text style={styles.settingItemTitle}>
                    {isEn ? 'App Language' : 'ऐप की भाषा'}
                  </Text>
                </View>
                <View style={styles.settingItemRight}>
                  <Text style={styles.settingItemValue}>
                    {currentLanguage === 'hi' ? 'हिन्दी' : 'English'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <View style={styles.settingDivider} />

              {/* Row: Push Notifications */}
              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="notifications-outline" size={20} color="#0A2540" />
                  </View>
                  <Text style={styles.settingItemTitle}>
                    {isEn ? 'Notifications' : 'सूचनाएं'}
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(val) => {
                    setNotificationsEnabled(val);
                    showToast(val
                      ? (isEn ? 'Notifications enabled' : 'सूचनाएं चालू कर दी गईं')
                      : (isEn ? 'Notifications muted' : 'सूचनाएं बंद कर दी गईं')
                    );
                  }}
                  trackColor={{ false: '#CBD5E1', true: Colors.orange.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingDivider} />

              {/* Row: Mitra AI Voice Audio */}
              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="volume-high-outline" size={20} color="#0A2540" />
                  </View>
                  <Text style={styles.settingItemTitle}>
                    {isEn ? 'Mitra AI Voice Guidance' : 'मित्र AI वाचन सहायता'}
                  </Text>
                </View>
                <Switch
                  value={voiceGuidanceEnabled}
                  onValueChange={(val) => {
                    setVoiceGuidanceEnabled(val);
                    showToast(val
                      ? (isEn ? 'Voice guidance enabled' : 'वॉइस गाइडेंस चालू')
                      : (isEn ? 'Voice guidance muted' : 'वॉइस गाइडेंस बंद')
                    );
                  }}
                  trackColor={{ false: '#CBD5E1', true: Colors.orange.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingDivider} />

              {/* Row: Clear Cache */}
              <TouchableOpacity
                style={styles.settingItemRow}
                onPress={() => {
                  showToast(isEn ? 'App cache cleared successfully!' : 'अस्थायी कैश डेटा साफ़ किया गया!');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="trash-outline" size={20} color="#0A2540" />
                  </View>
                  <Text style={styles.settingItemTitle}>
                    {isEn ? 'Clear Cache' : 'कैश डेटा साफ़ करें'}
                  </Text>
                </View>
                <View style={styles.settingItemRight}>
                  <Text style={styles.settingItemValueMuted}>14 MB</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Section 2: HELP & SUPPORT */}
            <Text style={styles.settingsGroupHeader}>
              {isEn ? 'HELP & SUPPORT' : 'सहायता एवं संपर्क'}
            </Text>
            <View style={styles.settingsListBox}>
              {/* Row: Citizen Helpline */}
              <TouchableOpacity
                style={styles.settingItemRow}
                onPress={() => Linking.openURL('tel:1551')}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="call-outline" size={20} color="#0A2540" />
                  </View>
                  <Text style={styles.settingItemTitle}>
                    {isEn ? 'Citizen Helpline (1551)' : 'किसान व नागरिक हेल्पलाइन (1551)'}
                  </Text>
                </View>
                <View style={styles.settingItemRight}>
                  <Text style={styles.settingItemValueHighlight}>1551</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <View style={styles.settingDivider} />

              {/* Row: Privacy Policy */}
              <TouchableOpacity
                style={styles.settingItemRow}
                onPress={() => {
                  showToast(isEn ? 'Official GovTech Data Privacy (MeitY)' : 'भारत सरकार डेटा गोपनीयता (MeitY)');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#0A2540" />
                  </View>
                  <Text style={styles.settingItemTitle}>
                    {isEn ? 'Privacy Policy' : 'गोपनीयता नीति'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.settingDivider} />

              {/* Row: Terms of Service */}
              <TouchableOpacity
                style={styles.settingItemRow}
                onPress={() => {
                  showToast(isEn ? 'GovTech Terms & Guidelines' : 'नागरिक सेवा नियम व शर्तें');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="document-text-outline" size={20} color="#0A2540" />
                  </View>
                  <Text style={styles.settingItemTitle}>
                    {isEn ? 'Terms of Service' : 'सेवा की शर्तें'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Section 3: APP INFO */}
            <Text style={styles.settingsGroupHeader}>
              {isEn ? 'ABOUT' : 'ऐप विवरण'}
            </Text>
            <View style={styles.settingsListBox}>
              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="information-circle-outline" size={20} color="#0A2540" />
                  </View>
                  <Text style={styles.settingItemTitle}>
                    {isEn ? 'App Version' : 'वर्ज़न'}
                  </Text>
                </View>
                <Text style={styles.settingItemValueMuted}>
                  v1.2.0 (GovTech India)
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 8. Native-Style Language Selection Dialog */}
      <Modal
        visible={isLangPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLangPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsLangPickerVisible(false)}
        >
          <View style={styles.langDialogCard}>
            <Text style={styles.langDialogTitle}>
              {isEn ? 'Select Language' : 'भाषा चुनें'}
            </Text>

            {/* Option 1: Hindi */}
            <TouchableOpacity
              style={styles.langDialogOption}
              onPress={() => {
                onLanguageChange('hi');
                setIsLangPickerVisible(false);
                showToast('भाषा बदलकर हिन्दी कर दी गई!');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.langDialogRadio}>
                {currentLanguage === 'hi' && <View style={styles.langDialogRadioInner} />}
              </View>
              <View style={styles.langDialogOptionTexts}>
                <Text style={[styles.langDialogOptionTitle, currentLanguage === 'hi' && styles.langDialogOptionTitleActive]}>
                  हिन्दी
                </Text>
                <Text style={styles.langDialogOptionSub}>Hindi</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.langDialogDivider} />

            {/* Option 2: English */}
            <TouchableOpacity
              style={styles.langDialogOption}
              onPress={() => {
                onLanguageChange('en');
                setIsLangPickerVisible(false);
                showToast('Language changed to English!');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.langDialogRadio}>
                {currentLanguage === 'en' && <View style={styles.langDialogRadioInner} />}
              </View>
              <View style={styles.langDialogOptionTexts}>
                <Text style={[styles.langDialogOptionTitle, currentLanguage === 'en' && styles.langDialogOptionTitleActive]}>
                  English
                </Text>
                <Text style={styles.langDialogOptionSub}>अंग्रेजी</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.langDialogActions}>
              <TouchableOpacity
                style={styles.langDialogCancelBtn}
                onPress={() => setIsLangPickerVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.langDialogCancelText}>
                  {isEn ? 'Cancel' : 'रद्द करें'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 90,
  },

  // Success Toast Banner
  toastBanner: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 99,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },

  // 1. Citizen Identity Header
  identitySection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    borderWidth: 2.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEmojiText: {
    fontSize: 36,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orange.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  switchUserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchUserBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchUserBarText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.orange.primary,
  },

  // 2. Section Block
  sectionBlock: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: 0.1,
  },
  editLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  editLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.orange.primary,
  },

  // Native List Rows
  nativeList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  nativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  nativeRowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '55%',
    textAlign: 'right',
  },

  // Re-calculate Button
  reProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  reProfileButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0A2540',
  },

  // Settings Row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 6,
  },
  settingsLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  settingsRowSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  settingsRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsCurrentValue: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  // Real-App Settings Full-Screen Modal
  settingsFullContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  settingsTopBar: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  settingsBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTopBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A2540',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  settingsScrollView: {
    flex: 1,
  },
  settingsScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  settingsGroupHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 18,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  settingsListBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 52,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItemTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingItemValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0A2540',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  settingItemValueMuted: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  settingItemValueHighlight: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.orange.primary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 52,
  },

  // Native-Style Language Dialog
  langDialogCard: {
    width: '84%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  langDialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 16,
  },
  langDialogOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  langDialogRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langDialogRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.orange.primary,
  },
  langDialogOptionTexts: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langDialogOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  langDialogOptionTitleActive: {
    color: Colors.orange.primary,
    fontWeight: '800',
  },
  langDialogOptionSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  langDialogDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  langDialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  langDialogCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  langDialogCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },

  // Logout Row
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 10,
  },
  logoutLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.orange.primary,
  },

  // Photo Action Sheet Modal
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 16,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sheetActionTexts: {
    flex: 1,
  },
  sheetActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  sheetActionDesc: {
    fontSize: 11.5,
    color: '#64748B',
  },
  sheetCancelButton: {
    marginTop: 16,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },

  // Logout Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  logoutIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoutModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  logoutModalMessage: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  logoutModalButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmLogoutButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLogoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ==========================================
  // STYLES FOR DEDICATED FULL-PAGE EDIT SCREEN
  // ==========================================
  editPageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  editPageBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2540',
  },
  editPageScroll: {
    flex: 1,
  },
  editPageContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  formSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inputFieldBlock: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  textInputBox: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  pillBtnActive: {
    borderColor: '#0A2540',
    backgroundColor: '#0A2540',
  },
  pillBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fullPageSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange.primary,
    borderRadius: 12,
    height: 48,
    marginTop: 20,
    marginBottom: 20,
  },
  fullPageSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
