import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  BackHandler,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { launchImageLibraryAsync, launchCameraAsync } from '../utils/imagePicker';
import { DemoUser } from '../data/demoUsers';
import { UserProfile } from '../types';
import { SupportedLanguage } from '../i18n/translations';
import { PROFILE_ATTRIBUTES, CATEGORY_LABELS } from '../data/profileAttributes';
import apiClient from '../api/client';
import { authApi } from '../api/authApi';


interface ProfileScreenProps {
  onStartReProfiling?: () => void;
  activeDemoUser: DemoUser;
  onOpenUserSwitcher?: () => void;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLogout: () => void;
  onUpdateAvatar?: (newImageSource: any) => void;
  onUpdateProfile?: (updatedProfile: Partial<UserProfile>, updatedName?: string) => void;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
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
  registerBackHandler,
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

  // User details — safely handle completely blank profiles
  const profile = activeDemoUser?.profile || ({} as Partial<UserProfile>);

  // Strictly separated Full Name: Never use username as full name
  const userFullName =
    profile.fullName ||
    (profile.name && profile.name !== activeDemoUser.username && !profile.name.includes('@')
      ? profile.name
      : '') ||
    activeDemoUser.fullName ||
    '';

  const displayName = userFullName || activeDemoUser?.name || '';

  const displayState = isEn
    ? (profile.stateEn || profile.state || '')
    : (profile.stateHi || profile.state || '');

  const displayOccupation = isEn
    ? (profile.occupationEn || profile.occupation || '')
    : (profile.occupationHi || profile.occupation || '');

  const displayIncome = isEn
    ? (profile.annualIncomeEn || profile.annualIncome || (profile as any).annual_family_income || '')
    : (profile.annualIncomeHi || profile.annualIncome || (profile as any).annual_family_income || '');

  const displayHouseType = isEn
    ? (profile.houseTypeEn || profile.houseType || '')
    : (profile.houseTypeHi || profile.houseType || '');

  const displayCategory = isEn
    ? (profile.categoryEn || profile.category || (profile as any).social_category || '')
    : (profile.categoryHi || profile.category || (profile as any).social_category || '');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingMoreDetails, setIsAddingMoreDetails] = useState(false);
  const [activeAddDetailKey, setActiveAddDetailKey] = useState<string | null>(null);
  const [addDetailValue, setAddDetailValue] = useState('');
  const [editDynamicFields, setEditDynamicFields] = useState<Record<string, string>>({});
  const [editName, setEditName] = useState(userFullName);
  const [editState, setEditState] = useState(displayState);
  const [editOccupation, setEditOccupation] = useState(displayOccupation);
  const [editIncome, setEditIncome] = useState(displayIncome);
  const [editHouseType, setEditHouseType] = useState(displayHouseType);
  const [editCategory, setEditCategory] = useState(displayCategory);

  // Change Password Modal state (OTP + Reset)
  const [pwdStep, setPwdStep] = useState<1 | 2 | 3>(1);
  const [pwdEmail, setPwdEmail] = useState(activeDemoUser.email || (profile as any).email || '');
  const [pwdOtp, setPwdOtp] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdShowNew, setPwdShowNew] = useState(false);
  const [pwdShowConfirm, setPwdShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const handlePwdRequestOTP = async () => {
    setPwdError(null);
    setPwdSuccess(null);
    const targetEmail = (pwdEmail || activeDemoUser.email || (profile as any).email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setPwdError(isEn ? 'Please enter a valid email address.' : 'कृपया एक मान्य ईमेल पता दर्ज करें।');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await authApi.forgotPassword(targetEmail);
      setPwdSuccess(
        res.message || (isEn ? 'An OTP has been sent to your email.' : 'आपकी ईमेल पर OTP भेज दिया गया है।')
      );
      setPwdStep(2);
    } catch (err: any) {
      setPwdError(
        err?.response?.data?.message ||
        (isEn ? 'Failed to send OTP. Please try again.' : 'OTP भेजने में विफलता। पुनः प्रयास करें।')
      );
    } finally {
      setPwdLoading(false);
    }
  };

  const handlePwdVerifyOTP = async () => {
    setPwdError(null);
    setPwdSuccess(null);
    const targetEmail = (pwdEmail || activeDemoUser.email || (profile as any).email || '').trim();

    if (!pwdOtp.trim() || pwdOtp.trim().length !== 6) {
      setPwdError(isEn ? 'Please enter the 6-digit OTP code.' : 'कृपया 6-अंकों का OTP कोड दर्ज करें।');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await authApi.verifyOtp(targetEmail, pwdOtp.trim());
      setPwdSuccess(
        res.message || (isEn ? 'OTP verified! Enter your new password below.' : 'OTP सत्यापित हुआ! अपना नया पासवर्ड सेट करें।')
      );
      setPwdStep(3);
    } catch (err: any) {
      setPwdError(
        err?.response?.data?.message ||
        (isEn ? 'Invalid or expired OTP code.' : 'अमान्य या समाप्त OTP कोड।')
      );
    } finally {
      setPwdLoading(false);
    }
  };

  const handlePwdResetPassword = async () => {
    setPwdError(null);
    setPwdSuccess(null);
    const targetEmail = (pwdEmail || activeDemoUser.email || (profile as any).email || '').trim();

    if (!pwdNew || pwdNew.length < 6) {
      setPwdError(isEn ? 'New password must be at least 6 characters.' : 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError(isEn ? 'New password and confirm password do not match.' : 'नया पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते।');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: targetEmail,
        otp: pwdOtp.trim(),
        new_password: pwdNew,
      });
      setPwdSuccess(
        res.message || (isEn ? 'Password updated successfully!' : 'पासवर्ड सफलतापूर्वक बदल दिया गया!')
      );
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdStep(1);
        setPwdOtp('');
        setPwdNew('');
        setPwdConfirm('');
        setPwdSuccess(null);
      }, 1800);
    } catch (err: any) {
      setPwdError(
        err?.response?.data?.message ||
        (isEn ? 'Password update failed. Try again.' : 'पासवर्ड अपडेट विफल रहा। पुनः प्रयास करें।')
      );
    } finally {
      setPwdLoading(false);
    }
  };

  // Step-by-step internal back action handler
  const handleInternalBack = useCallback((): boolean => {

    if (showFullImageViewer) {
      setShowFullImageViewer(false);
      return true;
    }
    if (showPhotoPickerModal) {
      setShowPhotoPickerModal(false);
      return true;
    }
    if (showLanguageModal) {
      setShowLanguageModal(false);
      return true;
    }
    if (showPasswordModal) {
      setShowPasswordModal(false);
      return true;
    }
    if (showPrivacyModal) {
      setShowPrivacyModal(false);
      return true;
    }
    if (activeAddDetailKey) {
      setActiveAddDetailKey(null);
      setAddDetailValue('');
      return true;
    }
    if (isAddingMoreDetails) {
      setIsAddingMoreDetails(false);
      return true;
    }
    if (activeDropdown) {
      setActiveDropdown(null);
      return true;
    }
    if (isEditingProfile) {
      setIsEditingProfile(false);
      return true;
    }
    if (currentView !== 'main') {
      setCurrentView('main');
      return true;
    }
    return false;
  }, [
    showFullImageViewer,
    showPhotoPickerModal,
    showLanguageModal,
    showPasswordModal,
    showPrivacyModal,
    activeAddDetailKey,
    isAddingMoreDetails,
    activeDropdown,
    isEditingProfile,
    currentView,
  ]);

  useEffect(() => {
    registerBackHandler?.(handleInternalBack);
    return () => registerBackHandler?.(null);
  }, [handleInternalBack, registerBackHandler]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleInternalBack);
    return () => sub.remove();
  }, [handleInternalBack]);

  // Photo Picker
  const handleOpenPhotoPicker = () => {
    setShowPhotoPickerModal(true);
  };

  const handleApplyPhoto = async (uri: string) => {
    setUploadToastStatus('updating');
    try {
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('image', {
        uri,
        name: filename,
        type
      } as any);

      const res = await apiClient.post('/api/profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data && res.data.imageUrl) {
        onUpdateAvatar?.({ uri: res.data.imageUrl });
        setUploadToastStatus('success');
      } else {
        throw new Error('No imageUrl returned');
      }
    } catch (err) {
      console.log('Upload error:', err);
      Alert.alert(isEn ? 'Error' : 'त्रुटि', isEn ? 'Failed to upload image' : 'फ़ोटो अपलोड विफल');
      setUploadToastStatus('idle');
    } finally {
      setTimeout(() => setUploadToastStatus('idle'), 2500);
    }
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
    setEditName(userFullName);
    setEditState(displayState);
    setEditOccupation(displayOccupation);
    setEditIncome(displayIncome);
    setEditHouseType(displayHouseType);
    setEditCategory(displayCategory);

    // Copy any dynamic attributes already filled
    const dyn: Record<string, string> = {};
    PROFILE_ATTRIBUTES.forEach((attr) => {
      let val = profile[attr.key];
      if ((val === undefined || val === null || String(val).trim() === '') && attr.key === 'education') {
        val = (profile as any).education_level;
      }
      if (
        val !== undefined &&
        val !== null &&
        String(val).trim() !== ''
      ) {
        dyn[attr.key] = String(val);
      }
    });
    setEditDynamicFields(dyn);

    setActiveDropdown(null);
    setIsEditingProfile(true);
  };

  // Save Profile Details
  const handleSaveProfile = () => {
    const updatedPayload: Partial<UserProfile> = {
      ...editDynamicFields,
      fullName: editName,
      name: editName,
    };
    if (editState) {
      updatedPayload.state = editState;
      updatedPayload.stateHi = editState;
      updatedPayload.stateEn = editState;
    }
    if (editOccupation) {
      updatedPayload.occupation = editOccupation;
      updatedPayload.occupationHi = editOccupation;
      updatedPayload.occupationEn = editOccupation;
    }
    if (editIncome) {
      updatedPayload.annualIncome = editIncome;
      updatedPayload.annualIncomeHi = editIncome;
      updatedPayload.annualIncomeEn = editIncome;
    }
    if (editHouseType) {
      updatedPayload.houseType = editHouseType;
      updatedPayload.houseTypeHi = editHouseType;
      updatedPayload.houseTypeEn = editHouseType;
    }
    if (editCategory) {
      updatedPayload.category = editCategory;
      updatedPayload.categoryHi = editCategory;
      updatedPayload.categoryEn = editCategory;
    }

    onUpdateProfile?.(updatedPayload, editName);
    setIsEditingProfile(false);
    Alert.alert(
      isEn ? 'Success' : 'सफलता',
      isEn ? 'Profile details updated successfully.' : 'प्रोफ़ाइल विवरण सफलतापूर्वक अपडेट हो गया।'
    );
  };

  // Save Single Attribute from Add More Details Modal
  const handleSaveSingleAttribute = (key: string, value: string) => {
    const trimmedVal = value.trim();
    if (!trimmedVal) {
      Alert.alert(
        isEn ? 'Required' : 'आवश्यक',
        isEn ? 'Please enter or select a value.' : 'कृपया मान दर्ज करें या चुनें।'
      );
      return;
    }

    const payload: Partial<UserProfile> = {
      [key]: trimmedVal,
    };

    // If options exist, map bilingual values
    const attr = PROFILE_ATTRIBUTES.find((a) => a.key === key);
    if (attr && attr.options) {
      const match = attr.options.find(
        (o) => o.en.toLowerCase() === trimmedVal.toLowerCase() || o.hi === trimmedVal
      );
      if (match) {
        payload[key + 'En'] = match.en;
        payload[key + 'Hi'] = match.hi;
      }
    }

    onUpdateProfile?.(payload);
    setIsAddingMoreDetails(false);
    setActiveAddDetailKey(null);
    setAddDetailValue('');

    Alert.alert(
      isEn ? 'Saved' : 'सहेजा गया',
      isEn ? 'Profile detail saved successfully.' : 'प्रोफ़ाइल विवरण सफलतापूर्वक सहेजा गया।'
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

  // Compact Dynamic Profile Details Card Renderer
  // Compact Dynamic Profile Details Card Renderer (Only shows specified attributes)
  const renderProfileDetailsCard = () => {
    const coreKeys = ['state', 'occupation', 'annualIncome', 'houseType', 'category'];
    const extraFilledAttributes = PROFILE_ATTRIBUTES.filter((attr) => {
      if (coreKeys.includes(attr.key)) return false;
      const v = profile[attr.key] || (attr.key === 'education' ? (profile as any).education_level : undefined);
      return v !== undefined && v !== null && String(v).trim() !== '';
    });

    // Collect all attributes that are actually specified by the user
    const populatedRows: { label: string; value: string }[] = [];

    if (userFullName && String(userFullName).trim() !== '') {
      populatedRows.push({
        label: isEn ? 'Full Name' : 'पूरा नाम',
        value: String(userFullName).trim(),
      });
    }

    if (displayState && String(displayState).trim() !== '') {
      populatedRows.push({
        label: isEn ? 'State' : 'राज्य',
        value: String(displayState).trim(),
      });
    }

    if (displayOccupation && String(displayOccupation).trim() !== '') {
      populatedRows.push({
        label: isEn ? 'Occupation' : 'व्यवसाय',
        value: String(displayOccupation).trim(),
      });
    }

    if (displayIncome && String(displayIncome).trim() !== '') {
      populatedRows.push({
        label: isEn ? 'Annual Income' : 'वार्षिक आय',
        value: String(displayIncome).trim(),
      });
    }

    if (displayHouseType && String(displayHouseType).trim() !== '') {
      populatedRows.push({
        label: isEn ? 'House Type' : 'मकान का प्रकार',
        value: String(displayHouseType).trim(),
      });
    }

    if (displayCategory && String(displayCategory).trim() !== '') {
      populatedRows.push({
        label: isEn ? 'Category' : 'सामाजिक श्रेणी',
        value: String(displayCategory).trim(),
      });
    }

    // Dynamic additional attributes
    extraFilledAttributes.forEach((attr) => {
      let val = String(profile[attr.key] || '').trim();
      if (!val && attr.key === 'education') {
        val = String((profile as any).education_level || '').trim();
      }
      if (val) {
        populatedRows.push({
          label: isEn ? attr.labelEn : attr.labelHi,
          value: val,
        });
      }
    });

    return (
      <View style={styles.profileDetailsCard}>
        {/* Card Header with Edit Icon */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleBox}>
            <Ionicons name="id-card-outline" size={17} color="#0A2540" />
            <Text style={styles.cardHeaderTitle}>
              {isEn ? 'Profile Details' : 'प्रोफ़ाइल विवरण'}
            </Text>
          </View>

          {populatedRows.length > 0 && (
            <TouchableOpacity
              style={styles.cardEditPill}
              onPress={handleStartEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={13} color="#0A2540" />
              <Text style={styles.cardEditPillText}>
                {isEn ? 'Edit' : 'एडिट करें'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Compact Details Rows (Only specified attributes) */}
        <View style={styles.detailsBody}>
          {populatedRows.length === 0 ? (
            <View style={styles.noDetailsBox}>
              <Ionicons name="information-circle-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.noDetailsText}>
                {isEn ? 'No details added yet' : 'कोई विवरण अभी तक नहीं जोड़ा गया'}
              </Text>
            </View>
          ) : (
            populatedRows.map((row, index) => (
              <View key={index}>
                {index > 0 && <View style={styles.rowDividerInset} />}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bottom Pill/Capsule Button for '+ Add More Details' */}
        <View style={styles.addMoreBtnWrapper}>
          <TouchableOpacity
            style={styles.addMoreCapsuleBtn}
            onPress={() => {
              setActiveAddDetailKey(null);
              setAddDetailValue('');
              setIsAddingMoreDetails(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#0A2540" />
            <Text style={styles.addMoreCapsuleBtnText}>
              {isEn ? '+ Add More Details' : '+ अन्य विवरण जोड़ें'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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

          <View style={styles.rowDivider} />

          {/* Change / Reset Password */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => {
              setPwdStep(1);
              setPwdError(null);
              setPwdSuccess(null);
              setShowPasswordModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.cardRowLeft}>
              <Ionicons name="key-outline" size={20} color="#0A2540" style={styles.cardRowIcon} />
              <View>
                <Text style={styles.cardRowTitle}>{isEn ? 'change / reset password' : 'पासवर्ड बदलें / रीसेट करें'}</Text>
                <Text style={styles.cardRowSub}>{isEn ? 'OTP verification & security' : 'OTP सत्यापन व सुरक्षा'}</Text>
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
        <View style={[styles.heroContent, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }]}>
          {/* Circular Avatar with White Border & Camera Badge */}
          <View style={[styles.avatarContainer, { marginRight: 15 }]}>
            <TouchableOpacity
              onPress={() => setShowFullImageViewer(true)}
              activeOpacity={0.85}
            >
              {activeDemoUser.image || profile.profileImage || (profile as any).imageUrl ? (
                <Image source={activeDemoUser.image || {uri: (profile as any).imageUrl || profile.profileImage}} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={38} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handleOpenPhotoPicker}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="camera" size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroUserName, { textAlign: 'left', marginBottom: 2 }]} numberOfLines={1}>
              {userFullName || (isEn ? 'Name not set' : 'नाम दर्ज नहीं')}
            </Text>
            <Text style={[styles.userOccupationText, { textAlign: 'left', opacity: 0.9, marginBottom: 2 }]} numberOfLines={1}>
              {activeDemoUser.email || profile.email || 'user@example.com'}
            </Text>
            {!!displayOccupation && (
              <Text style={[styles.userOccupationText, { textAlign: 'left', opacity: 0.75, fontSize: 13 }]} numberOfLines={1}>
                {displayOccupation}
              </Text>
            )}
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
  // ==========================================
  // MODAL 2: EDIT PROFILE MODAL (Only shows already-provided details)
  // ==========================================
  const renderEditProfileModal = () => {
    const hasFullName = !!userFullName;
    const hasState = !!displayState;
    const hasOccupation = !!displayOccupation;
    const hasIncome = !!displayIncome;
    const hasHouseType = !!displayHouseType;
    const hasCategory = !!displayCategory;

    const dynamicFilledAttrs = PROFILE_ATTRIBUTES.filter((attr) => {
      if (['state', 'occupation', 'annualIncome', 'houseType', 'category'].includes(attr.key)) return false;
      const val = profile[attr.key] || (attr.key === 'education' ? (profile as any).education_level : undefined);
      return val !== undefined && val !== null && String(val).trim() !== '';
    });

    const hasAnyDetails =
      hasFullName ||
      hasState ||
      hasOccupation ||
      hasIncome ||
      hasHouseType ||
      hasCategory ||
      dynamicFilledAttrs.length > 0;

    return (
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
              {!hasAnyDetails ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Ionicons name="information-circle-outline" size={32} color="#64748B" />
                  <Text
                    style={{
                      fontSize: 13.5,
                      color: '#64748B',
                      textAlign: 'center',
                      marginTop: 8,
                      paddingHorizontal: 20,
                      lineHeight: 20,
                    }}
                  >
                    {isEn
                      ? 'No details have been added yet. Use "+ Add More Details" on your profile card to add your information.'
                      : 'अभी तक कोई विवरण नहीं जोड़ा गया है। प्रोफ़ाइल कार्ड पर "+ अन्य विवरण जोड़ें" बटन का उपयोग करके विवरण जोड़ें।'}
                  </Text>
                </View>
              ) : (
                <>
                  {/* Full Name - only if already provided */}
                  {hasFullName && (
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
                  )}

                  {/* 1. State Dropdown - only if already provided */}
                  {hasState && (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>{isEn ? 'State' : 'राज्य'}</Text>
                      <TouchableOpacity
                        style={[
                          styles.dropdownButton,
                          activeDropdown === 'state' && styles.dropdownButtonActive,
                        ]}
                        onPress={() =>
                          setActiveDropdown(activeDropdown === 'state' ? null : 'state')
                        }
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
                          <ScrollView
                            nestedScrollEnabled
                            style={{ maxHeight: 180 }}
                            showsVerticalScrollIndicator={true}
                          >
                            {STATE_OPTIONS.map((item, idx) => {
                              const val = isEn ? item.en : item.hi;
                              const isSelected =
                                editState === val ||
                                editState.includes(item.en) ||
                                editState.includes(item.hi.split(' ')[0]);
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
                  )}

                  {/* 2. Occupation Dropdown - only if already provided */}
                  {hasOccupation && (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>{isEn ? 'Occupation' : 'व्यवसाय'}</Text>
                      <TouchableOpacity
                        style={[
                          styles.dropdownButton,
                          activeDropdown === 'occupation' && styles.dropdownButtonActive,
                        ]}
                        onPress={() =>
                          setActiveDropdown(activeDropdown === 'occupation' ? null : 'occupation')
                        }
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
                          <ScrollView
                            nestedScrollEnabled
                            style={{ maxHeight: 180 }}
                            showsVerticalScrollIndicator={true}
                          >
                            {OCCUPATION_OPTIONS.map((item, idx) => {
                              const val = isEn ? item.en : item.hi;
                              const isSelected =
                                editOccupation === val ||
                                editOccupation.includes(item.en) ||
                                editOccupation.includes(item.hi.split(' ')[0]);
                              return (
                                <TouchableOpacity
                                  key={idx}
                                  style={[
                                    styles.dropdownMenuItem,
                                    isSelected && styles.dropdownMenuItemActive,
                                    idx === OCCUPATION_OPTIONS.length - 1 && {
                                      borderBottomWidth: 0,
                                    },
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
                  )}

                  {/* 3. Annual Income Dropdown - only if already provided */}
                  {hasIncome && (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>{isEn ? 'Annual Income' : 'वार्षिक आय'}</Text>
                      <TouchableOpacity
                        style={[
                          styles.dropdownButton,
                          activeDropdown === 'income' && styles.dropdownButtonActive,
                        ]}
                        onPress={() =>
                          setActiveDropdown(activeDropdown === 'income' ? null : 'income')
                        }
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
                          <ScrollView
                            nestedScrollEnabled
                            style={{ maxHeight: 180 }}
                            showsVerticalScrollIndicator={true}
                          >
                            {INCOME_OPTIONS.map((item, idx) => {
                              const val = isEn ? item.en : item.hi;
                              const isSelected =
                                editIncome === val ||
                                editIncome.includes(item.en) ||
                                editIncome.includes(item.hi.split(' ')[0]);
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
                  )}

                  {/* 4. House Type Dropdown - only if already provided */}
                  {hasHouseType && (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>{isEn ? 'House Type' : 'मकान का प्रकार'}</Text>
                      <TouchableOpacity
                        style={[
                          styles.dropdownButton,
                          activeDropdown === 'houseType' && styles.dropdownButtonActive,
                        ]}
                        onPress={() =>
                          setActiveDropdown(activeDropdown === 'houseType' ? null : 'houseType')
                        }
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
                          <ScrollView
                            nestedScrollEnabled
                            style={{ maxHeight: 180 }}
                            showsVerticalScrollIndicator={true}
                          >
                            {HOUSE_TYPE_OPTIONS.map((item, idx) => {
                              const val = isEn ? item.en : item.hi;
                              const isSelected =
                                editHouseType === val ||
                                editHouseType.includes(item.en) ||
                                editHouseType.includes(item.hi.split(' ')[0]);
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
                  )}

                  {/* 5. Category - only if already provided */}
                  {hasCategory && (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        {isEn ? 'Social Category' : 'सामाजिक श्रेणी (Category)'}
                      </Text>

                      <View style={styles.categoryChipsRow}>
                        {[
                          { key: 'General', labelHi: 'सामान्य', labelEn: 'General' },
                          { key: 'OBC', labelHi: 'ओबीसी', labelEn: 'OBC' },
                          { key: 'SC', labelHi: 'एससी', labelEn: 'SC' },
                          { key: 'ST', labelHi: 'एसटी', labelEn: 'ST' },
                        ].map((cat) => {
                          const catVal = isEn ? cat.labelEn : cat.labelHi;
                          const isSelected =
                            editCategory.toLowerCase().includes(cat.key.toLowerCase()) ||
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
                        placeholder={
                          isEn ? 'General, OBC, SC, ST' : 'सामान्य, ओबीसी, एससी, एसटी'
                        }
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  )}

                  {/* 6. Dynamic Attributes already provided */}
                  {dynamicFilledAttrs.map((attr) => (
                    <View key={attr.key} style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        {isEn ? attr.labelEn : attr.labelHi}
                      </Text>
                      {attr.type === 'select' && attr.options ? (
                        <View style={{ gap: 6 }}>
                          {attr.options.map((opt, optIdx) => {
                            const optVal = isEn ? opt.en : opt.hi;
                            const isSelected =
                              editDynamicFields[attr.key] === optVal ||
                              editDynamicFields[attr.key] === opt.en ||
                              editDynamicFields[attr.key] === opt.hi;
                            return (
                              <TouchableOpacity
                                key={optIdx}
                                style={[
                                  styles.optionSelectCard,
                                  isSelected && styles.optionSelectCardActive,
                                ]}
                                onPress={() =>
                                  setEditDynamicFields((prev) => ({
                                    ...prev,
                                    [attr.key]: optVal,
                                  }))
                                }
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.optionSelectCardText,
                                    isSelected && styles.optionSelectCardTextActive,
                                  ]}
                                >
                                  {optVal}
                                </Text>
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color="#0A2540"
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <TextInput
                          style={styles.textInput}
                          value={editDynamicFields[attr.key] || ''}
                          onChangeText={(val) =>
                            setEditDynamicFields((prev) => ({
                              ...prev,
                              [attr.key]: val,
                            }))
                          }
                          placeholder={
                            isEn ? `Enter ${attr.labelEn}` : `${attr.labelHi} दर्ज करें`
                          }
                          placeholderTextColor="#94A3B8"
                          keyboardType={attr.type === 'number' ? 'numeric' : 'default'}
                        />
                      )}
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditingProfile(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{isEn ? 'Cancel' : 'रद्द करें'}</Text>
              </TouchableOpacity>

              {hasAnyDetails && (
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleSaveProfile}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSubmitText}>
                    {isEn ? 'Save' : 'सुरक्षित करें'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ==========================================
  // MODAL: ADD MORE DETAILS MODAL / BOTTOM SHEET
  // ==========================================
  const renderAddMoreDetailsModal = () => {
    if (!isAddingMoreDetails) return null;

    const selectedAttr = activeAddDetailKey
      ? PROFILE_ATTRIBUTES.find((a) => a.key === activeAddDetailKey)
      : null;

    return (
      <Modal
        visible={isAddingMoreDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (activeAddDetailKey) {
            setActiveAddDetailKey(null);
            setAddDetailValue('');
          } else {
            setIsAddingMoreDetails(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            {selectedAttr ? (
              <View>
                {/* Header with back */}
                <View style={styles.addDetailHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveAddDetailKey(null);
                      setAddDetailValue('');
                    }}
                    style={styles.addDetailBackBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="arrow-back" size={20} color="#0A2540" />
                  </TouchableOpacity>
                  <Text style={styles.addDetailHeaderTitle}>
                    {isEn ? selectedAttr.labelEn : selectedAttr.labelHi}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveAddDetailKey(null);
                      setIsAddingMoreDetails(false);
                      setAddDetailValue('');
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.addDetailSubtitle}>
                  {isEn
                    ? `Enter or select your ${selectedAttr.labelEn.toLowerCase()}`
                    : `कृपया अपना ${selectedAttr.labelHi} दर्ज करें या चुनें`}
                </Text>

                {/* Body depending on type */}
                <View style={{ marginTop: 12, marginBottom: 18 }}>
                  {selectedAttr.type === 'select' && selectedAttr.options ? (
                    <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled={true}>
                      {selectedAttr.options.map((opt, idx) => {
                        const optVal = isEn ? opt.en : opt.hi;
                        const isSelected =
                          addDetailValue === optVal ||
                          addDetailValue === opt.en ||
                          addDetailValue === opt.hi;
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.optionSelectCard,
                              isSelected && styles.optionSelectCardActive,
                            ]}
                            onPress={() => setAddDetailValue(optVal)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.optionSelectCardText,
                                isSelected && styles.optionSelectCardTextActive,
                              ]}
                            >
                              {optVal}
                            </Text>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={18} color="#0A2540" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <TextInput
                      style={styles.textInput}
                      value={addDetailValue}
                      onChangeText={setAddDetailValue}
                      placeholder={
                        isEn ? `Enter ${selectedAttr.labelEn}` : `${selectedAttr.labelHi} दर्ज करें`
                      }
                      placeholderTextColor="#94A3B8"
                      keyboardType={selectedAttr.type === 'number' ? 'numeric' : 'default'}
                      autoFocus={true}
                    />
                  )}
                </View>

                {/* Save button */}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => {
                      setActiveAddDetailKey(null);
                      setAddDetailValue('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>{isEn ? 'Back' : 'वापस'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSubmitBtn}
                    onPress={() => handleSaveSingleAttribute(selectedAttr.key, addDetailValue)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalSubmitText}>
                      {isEn ? 'Save' : 'सुरक्षित करें'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Attribute Selection List Grouped by Category */
              <View>
                <View style={styles.addDetailHeader}>
                  <Text style={styles.addDetailHeaderTitle}>
                    {isEn ? 'Add More Details' : 'अन्य विवरण जोड़ें'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsAddingMoreDetails(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.addDetailSubtitle}>
                  {isEn
                    ? 'Select an attribute below to add to your profile'
                    : 'अपनी प्रोफ़ाइल में जोड़ने के लिए नीचे दिए गए विवरण में से चुनें'}
                </Text>

                <ScrollView
                  style={{ maxHeight: 380, marginTop: 10, marginBottom: 12 }}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {(['personal', 'location', 'education', 'economic', 'social'] as const).map(
                    (catKey) => {
                      const catAttrs = PROFILE_ATTRIBUTES.filter((a) => a.category === catKey);
                      if (catAttrs.length === 0) return null;
                      const catTitle = isEn
                        ? CATEGORY_LABELS[catKey].en
                        : CATEGORY_LABELS[catKey].hi;

                      return (
                        <View key={catKey} style={{ marginBottom: 14 }}>
                          <Text style={styles.attrCategoryHeaderTitle}>{catTitle}</Text>
                          <View style={styles.attrGridRow}>
                            {catAttrs.map((attr) => {
                              const val =
                                profile[attr.key] !== undefined && profile[attr.key] !== null && String(profile[attr.key]).trim() !== ''
                                  ? profile[attr.key]
                                  : attr.key === 'education'
                                  ? (profile as any).education_level
                                  : attr.key === 'annualIncome'
                                  ? (profile as any).annual_family_income
                                  : attr.key === 'category'
                                  ? (profile as any).social_category
                                  : undefined;
                              const isFilled = val !== undefined && val !== null && String(val).trim() !== '';

                              return (
                                <TouchableOpacity
                                  key={attr.key}
                                  style={[
                                    styles.attrSelectChip,
                                    isFilled && styles.attrSelectChipFilled,
                                  ]}
                                  onPress={() => {
                                    setActiveAddDetailKey(attr.key);
                                    setAddDetailValue(val ? String(val) : '');
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name={isFilled ? 'checkmark-circle' : 'add-circle-outline'}
                                    size={15}
                                    color={isFilled ? '#16A34A' : '#0A2540'}
                                    style={{ marginRight: 6 }}
                                  />
                                  <Text
                                    style={[
                                      styles.attrSelectChipText,
                                      isFilled && styles.attrSelectChipTextFilled,
                                    ]}
                                  >
                                    {isEn ? attr.labelEn : attr.labelHi}
                                  </Text>
                                  {isFilled && (
                                    <Text style={styles.attrFilledTag}>
                                      {isEn ? 'Filled' : 'भरा हुआ'}
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    }
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsAddingMoreDetails(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>{isEn ? 'Close' : 'बंद करें'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // ==========================================
  // MODAL 3: CHANGE / RESET PASSWORD MODAL (OTP Verification & Direct Password Change)
  // ==========================================
  const renderPasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPasswordModal(false)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={[styles.modalCard, { maxWidth: 440, width: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={styles.modalTitle}>
                {isEn ? 'Change / Reset Password' : 'पासवर्ड बदलें / रीसेट करें'}
              </Text>

            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Banners */}
          {pwdError && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8, padding: 10, marginBottom: 12, gap: 8 }}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={{ flex: 1, fontSize: 12, color: '#B91C1C', fontWeight: '600' }}>{pwdError}</Text>
            </View>
          )}

          {pwdSuccess && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 8, padding: 10, marginBottom: 12, gap: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color="#065F46" />
              <Text style={{ flex: 1, fontSize: 12, color: '#065F46', fontWeight: '600' }}>{pwdSuccess}</Text>
            </View>
          )}

          {pwdStep === 1 ? (
            <View>
              <Text style={{ fontSize: 13, color: '#475569', marginBottom: 14, lineHeight: 18 }}>
                {isEn
                  ? 'Send a 6-digit OTP code to your registered email to reset password:'
                  : 'पासवर्ड रीसेट करने के लिए अपने पंजीकृत ईमेल पर 6-अंकीय OTP कोड भेजें:'}
              </Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{isEn ? 'Registered Email' : 'पंजीकृत ईमेल'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 46, gap: 8 }}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, color: '#0F172A' }}
                    value={pwdEmail}
                    onChangeText={setPwdEmail}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, pwdLoading && { opacity: 0.7 }]}
                onPress={handlePwdRequestOTP}
                disabled={pwdLoading}
              >
                <Text style={styles.modalSubmitText}>
                  {isEn ? 'Send OTP Code' : 'OTP कोड भेजें'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : pwdStep === 2 ? (
            <View>
              <Text style={{ fontSize: 13, color: '#475569', marginBottom: 14, lineHeight: 18 }}>
                {isEn
                  ? `OTP sent to ${pwdEmail}. Enter the 6-digit code to verify:`
                  : `OTP ${pwdEmail} पर भेजा गया। सत्यापित करने के लिए 6-अंकीय कोड दर्ज करें:`}
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{isEn ? '6-Digit OTP Code' : '6-अंकीय OTP कोड'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 46, gap: 8 }}>
                  <Ionicons name="key-outline" size={18} color="#94A3B8" />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: '#0F172A', letterSpacing: 4, fontWeight: '700' }}
                    value={pwdOtp}
                    onChangeText={setPwdOtp}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, pwdLoading && { opacity: 0.7 }]}
                onPress={handlePwdVerifyOTP}
                disabled={pwdLoading}
              >
                <Text style={styles.modalSubmitText}>
                  {isEn ? 'Verify OTP' : 'OTP सत्यापित करें'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 12, alignItems: 'center' }}
                onPress={handlePwdRequestOTP}
                disabled={pwdLoading}
              >
                <Text style={{ fontSize: 12, color: '#0A2540', fontWeight: '600' }}>
                  {isEn ? 'Resend OTP Code' : 'OTP दोबारा भेजें'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 13, color: '#475569', marginBottom: 14, lineHeight: 18 }}>
                {isEn
                  ? 'OTP verified! Enter your new password and confirm it below:'
                  : 'OTP सत्यापित हुआ! अपना नया पासवर्ड और कन्फर्म पासवर्ड दर्ज करें:'}
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{isEn ? 'New Password' : 'नया पासवर्ड'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 46, gap: 8 }}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, color: '#0F172A' }}
                    secureTextEntry={!pwdShowNew}
                    value={pwdNew}
                    onChangeText={setPwdNew}
                    placeholder={isEn ? '••••••••' : 'नया पासवर्ड (कम से कम 6 अक्षर)'}
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity onPress={() => setPwdShowNew(!pwdShowNew)}>
                    <Ionicons name={pwdShowNew ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{isEn ? 'Confirm New Password' : 'नया पासवर्ड कन्फर्म करें'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 46, gap: 8 }}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#94A3B8" />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, color: '#0F172A' }}
                    secureTextEntry={!pwdShowConfirm}
                    value={pwdConfirm}
                    onChangeText={setPwdConfirm}
                    placeholder={isEn ? '••••••••' : 'नया पासवर्ड दोबारा दर्ज करें'}
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity onPress={() => setPwdShowConfirm(!pwdShowConfirm)}>
                    <Ionicons name={pwdShowConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, pwdLoading && { opacity: 0.7 }]}
                onPress={handlePwdResetPassword}
                disabled={pwdLoading}
              >
                <Text style={styles.modalSubmitText}>
                  {isEn ? 'Update Password' : 'पासवर्ड अपडेट करें'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
          {activeDemoUser.profile?.avatar || (activeDemoUser.profile as any)?.imageUrl ? (
            <Image
              source={{ uri: activeDemoUser.profile.avatar || (activeDemoUser.profile as any).imageUrl }}
              style={styles.fullImageLarge}
              resizeMode="cover"
            />
          ) : activeDemoUser.image ? (
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
      {renderAddMoreDetailsModal()}
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

  // Profile Details Compact Card (CuraTera Original)
  profileDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#FAFCFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A2540',
  },
  cardEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardEditPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0A2540',
  },
  detailsBody: {
    paddingVertical: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 14,
    minHeight: 26,
  },
  detailLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '58%',
  },
  detailValueEmpty: {
    color: '#94A3B8',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  rowDividerInset: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 14,
  },
  noDetailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  noDetailsText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  addMoreBtnWrapper: {
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  addMoreCapsuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  addMoreCapsuleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A2540',
  },

  // Add More Details Modal & Bottom Sheet styles
  addDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addDetailBackBtn: {
    marginRight: 8,
  },
  addDetailHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A2540',
    flex: 1,
  },
  addDetailSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 8,
  },
  attrCategoryHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  attrGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  attrSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  attrSelectChipFilled: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  attrSelectChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  attrSelectChipTextFilled: {
    color: '#166534',
  },
  attrFilledTag: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
    marginLeft: 4,
  },
  optionSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  optionSelectCardActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0A2540',
  },
  optionSelectCardText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  optionSelectCardTextActive: {
    color: '#0A2540',
    fontWeight: '700',
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

