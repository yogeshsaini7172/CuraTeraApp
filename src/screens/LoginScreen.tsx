import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { SupportedLanguage } from '../i18n/translations';
import AuthStore from '../store/AuthStore';
import { authApi } from '../api/authApi';
import { getAuth, GoogleAuthProvider, signInWithCredential, getIdToken } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  // IMPORTANT: You must get this from your Firebase Console (Authentication > Sign-in method > Google > Web SDK configuration)
  webClientId: '186943676690-s4tdf4hvfecoq2ldt1j24vei736uof3u.apps.googleusercontent.com',
});

interface LoginScreenProps {
  onLoginSuccess: (userName: string, email: string) => void;
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  currentLanguage = 'hi',
  onLanguageChange,
}) => {
  const isEn = currentLanguage === 'en';
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password State (3 Steps: 1. Request OTP -> 2. Verify OTP -> 3. Set New & Confirm Password)
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Stores pending Google idToken when user needs to take action (404/409)
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  // 'not_found' = login but no account | 'already_exists' = signup but account exists
  const [googleActionNeeded, setGoogleActionNeeded] = useState<'not_found' | 'already_exists' | null>(null);

  const lastBackPressRef = useRef<number>(0);

  // Step-by-step back navigation on Login Screen
  useEffect(() => {
    const onBackPress = () => {
      // Step 1: If on Signup or Forgot Password form, step back to Login form!
      if (authMode === 'signup' || authMode === 'forgot_password') {
        setAuthMode('login');
        setForgotStep(1);
        setErrorMessage(null);
        setSuccessMessage(null);
        setGoogleActionNeeded(null);
        setPendingGoogleToken(null);
        return true;
      }

      // Step 2: On Login form, double-tap back within 2 seconds to exit gracefully
      const now = Date.now();
      if (lastBackPressRef.current && now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          isEn ? 'Press back again to exit' : 'ऐप बंद करने के लिए दोबारा बैक दबाएं',
          ToastAndroid.SHORT
        );
      }
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [authMode, isEn]);

  const handleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // --- Basic validation ---
    if (authMode === 'signup' && !fullName.trim()) {
      setErrorMessage(isEn ? 'Please enter your name.' : 'कृपया अपना नाम दर्ज करें।');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(isEn ? 'Please enter a valid email.' : 'कृपया एक मान्य ईमेल पता दर्ज करें।');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage(isEn ? 'Password must be at least 6 characters.' : 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }

    setIsLoading(true);
    try {
      let session;
      if (authMode === 'signup') {
        session = await AuthStore.signup({ email, password, full_name: fullName.trim() });
      } else {
        session = await AuthStore.login({ email, password }, fullName.trim() || undefined);
      }
      // Success — pass displayName + email up to App.tsx
      onLoginSuccess(session.user.displayName, session.user.email);
    } catch (err: any) {
      // Extract backend error message if available
      const msg =
        err?.response?.data?.message ||
        (isEn ? 'Something went wrong. Please try again.' : 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(isEn ? 'Please enter your registered email address.' : 'कृपया अपना पंजीकृत ईमेल पता दर्ज करें।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSuccessMessage(
        res.message || (isEn ? 'An OTP has been sent to your email.' : 'आपकी ईमेल पर OTP भेज दिया गया है।')
      );
      setForgotStep(2);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (isEn ? 'Failed to send OTP. Please try again.' : 'OTP भेजने में विफलता। पुनः प्रयास करें।');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage(isEn ? 'Please enter the 6-digit OTP code.' : 'कृपया 6-अंकों का OTP कोड दर्ज करें।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(email.trim(), otpCode.trim());
      setSuccessMessage(
        res.message || (isEn ? 'OTP verified successfully! Set your new password below.' : 'OTP सत्यापित हुआ! अपना नया पासवर्ड सेट करें।')
      );
      setForgotStep(3);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (isEn ? 'Invalid or expired OTP code. Please try again.' : 'अमान्य या समाप्त OTP कोड। पुनः प्रयास करें।');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage(isEn ? 'New password must be at least 6 characters.' : 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(isEn ? 'New password and confirm password do not match.' : 'नया पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: email.trim(),
        otp: otpCode.trim(),
        new_password: newPassword,
      });
      setSuccessMessage(
        res.message || (isEn ? 'Password updated successfully! Redirecting to Sign In...' : 'पासवर्ड सफलतापूर्वक बदल दिया गया! लॉग इन पर वापस जा रहे हैं...')
      );
      setTimeout(() => {
        setAuthMode('login');
        setPassword('');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotStep(1);
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (isEn ? 'Password update failed. Please try again.' : 'पासवर्ड अपडेट विफल रहा। पुनः प्रयास करें।');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };



  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleActionNeeded(null);
    setPendingGoogleToken(null);
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Sign out first so account chooser always appears (fresh pick every time)
      await GoogleSignin.signOut();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error('No ID token found');

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const firebaseAuth = getAuth();
      await signInWithCredential(firebaseAuth, googleCredential);

      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        const firebaseIdToken = await getIdToken(currentUser);
        const session = await AuthStore.firebaseLogin(firebaseIdToken, 'auto');
        onLoginSuccess(session.user.displayName, session.user.email);
      }

    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === 'IN_PROGRESS') {
        // silent — user cancelled
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setErrorMessage(isEn ? 'Play Services not available.' : 'Play Services उपलब्ध नहीं हैं।');
      } else if (error?.response?.status === 404) {
        // Login mode: no account found — store Firebase token and show action buttons
        const cu = getAuth().currentUser;
        if (cu) setPendingGoogleToken(await getIdToken(cu));
        setGoogleActionNeeded('not_found');
      } else if (error?.response?.status === 409) {
        // Signup mode: account already exists — show switch-to-login option
        const cu = getAuth().currentUser;
        if (cu) setPendingGoogleToken(await getIdToken(cu));
        setGoogleActionNeeded('already_exists');
      } else {
        setErrorMessage(
          error?.response?.data?.message ||
          (isEn ? 'Google Sign-In failed. Please try again.' : 'Google साइन-इन विफल रहा।')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Called when user taps "Sign up with Google" after getting 404 on login screen
  const handleGoogleSignupFromLogin = async () => {
    if (!pendingGoogleToken) return;
    setIsLoading(true);
    setGoogleActionNeeded(null);
    try {
      const session = await AuthStore.firebaseLogin(pendingGoogleToken, 'signup');
      onLoginSuccess(session.user.displayName, session.user.email);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
        (isEn ? 'Registration failed. Try again.' : 'रजिस्ट्रेशन विफल रहा।')
      );
    } finally {
      setIsLoading(false);
      setPendingGoogleToken(null);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >

        {/* Top Language Switcher Bar */}
        {onLanguageChange && (
          <View style={styles.topLangRow}>
            <TouchableOpacity
              style={styles.langSwitchBtn}
              onPress={() => onLanguageChange(isEn ? 'hi' : 'en')}
              activeOpacity={0.8}
            >
              <Ionicons name="language" size={15} color={Colors.blue.primary} />
              <Text style={styles.langSwitchBtnText}>
                {isEn ? 'हिन्दी' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 1. Minimal & Clean Brand Hero */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/CuraTera_Logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
          <Text style={styles.brandTitle}>CuraTera</Text>
          <Text style={styles.brandSubtitle}>
            {isEn ? 'Empowering Citizens, Seamlessly.' : 'नागरिक कल्याण एवं योजना सहायक'}
          </Text>
        </View>

        {/* 2. Authentication Card */}
        <View style={styles.authCard}>
          {/* Segmented Mode Switcher (Hide in Forgot Password mode) */}
          {authMode !== 'forgot_password' ? (
            <View style={styles.modeTabsWrapper}>
              <TouchableOpacity
                style={[styles.modeTab, authMode === 'login' && styles.modeTabActive]}
                onPress={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    authMode === 'login' && styles.modeTabTextActive,
                  ]}
                >
                  {isEn ? 'Sign In' : 'लॉग इन'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, authMode === 'signup' && styles.modeTabActive]}
                onPress={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    authMode === 'signup' && styles.modeTabTextActive,
                  ]}
                >
                  {isEn ? 'Register' : 'साइन अप'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.forgotHeaderRow}>
              <TouchableOpacity
                onPress={() => {
                  setAuthMode('login');
                  setForgotStep(1);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                style={styles.forgotBackBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.blue.dark} />
              </TouchableOpacity>
              <Text style={styles.forgotHeaderTitle}>
                {isEn ? 'Reset Password' : 'पासवर्ड रीसेट करें'}
              </Text>
            </View>
          )}

          {/* Inline Error Message */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.orange.primary} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Inline Success Banner */}
          {successMessage && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          )}

          {/* Smart Banner: Login → No Account Found */}
          {googleActionNeeded === 'not_found' && (
            <View style={styles.googleActionBanner}>
              <View style={styles.googleActionHeader}>
                <Ionicons name="alert-circle-outline" size={17} color="#92400E" />
                <Text style={styles.googleActionTitle}>
                  {isEn ? 'No account found with this Google ID.' : 'इस Google अकाउंट से कोई खाता नहीं मिला।'}
                </Text>
              </View>
              <Text style={styles.googleActionSub}>
                {isEn ? 'What would you like to do?' : 'आप क्या करना चाहते हैं?'}
              </Text>
              <View style={styles.googleActionButtons}>
                <TouchableOpacity
                  style={styles.googleActionBtnPrimary}
                  onPress={handleGoogleSignupFromLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="person-add-outline" size={13} color="#fff" />
                  <Text style={styles.googleActionBtnPrimaryText}>
                    {isEn ? 'Sign up with Google' : 'Google से Register करें'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.googleActionBtnSecondary}
                  onPress={() => {
                    setGoogleActionNeeded(null);
                    setPendingGoogleToken(null);
                    setAuthMode('signup');
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create-outline" size={13} color="#92400E" />
                  <Text style={styles.googleActionBtnSecondaryText}>
                    {isEn ? 'Sign up Manually' : 'Email से Register करें'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Smart Banner: Signup → Already Registered */}
          {googleActionNeeded === 'already_exists' && (
            <View style={[styles.googleActionBanner, { borderColor: '#6EE7B7', backgroundColor: '#ECFDF5' }]}>
              <View style={styles.googleActionHeader}>
                <Ionicons name="checkmark-circle-outline" size={17} color="#065F46" />
                <Text style={[styles.googleActionTitle, { color: '#065F46' }]}>
                  {isEn ? 'Already registered with this Google account.' : 'यह Google अकाउंट पहले से रजिस्टर है।'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.googleActionBtnPrimary, { backgroundColor: '#059669', marginTop: 10 }]}
                onPress={() => {
                  setGoogleActionNeeded(null);
                  setPendingGoogleToken(null);
                  setAuthMode('login');
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={13} color="#fff" />
                <Text style={styles.googleActionBtnPrimaryText}>
                  {isEn ? 'Go to Sign In' : 'Sign In पर जाएं'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================= NORMAL SIGNIN / SIGNUP FORM ================= */}
          {authMode !== 'forgot_password' && (
            <>
              {authMode === 'signup' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {isEn ? 'Full Name' : 'पूरा नाम'}
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={18} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder={isEn ? 'John Doe' : 'अपना पूरा नाम दर्ज करें'}
                      placeholderTextColor="#94A3B8"
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (errorMessage) setErrorMessage(null);
                      }}
                    />
                  </View>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {isEn ? 'Email Address' : 'ईमेल पता'}
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder={isEn ? 'name@example.com' : 'नाम@example.com'}
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.fieldLabel}>
                    {isEn ? 'Password' : 'पासवर्ड'}
                  </Text>
                  {authMode === 'login' && (
                    <TouchableOpacity
                      onPress={() => {
                        setAuthMode('forgot_password');
                        setForgotStep(1);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.forgotPasswordLinkText}>
                        {isEn ? 'Forgot Password?' : 'पासवर्ड भूल गए?'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder={isEn ? '••••••••' : 'पासवर्ड (कम से कम 6 अक्षर)'}
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[styles.primaryAuthButton, isLoading && { opacity: 0.75 }]}
                onPress={handleAuth}
                activeOpacity={0.88}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white.pure} size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryAuthButtonText}>
                      {authMode === 'login'
                        ? (isEn ? 'Sign In' : 'लॉग इन करें')
                        : (isEn ? 'Create Account' : 'खाता बनाएं')}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white.pure} />
                  </>
                )}
              </TouchableOpacity>

              {/* Simple Clean Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{isEn ? 'OR' : 'या'}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In */}
              <TouchableOpacity
                style={styles.googleAuthButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                  style={{ width: 18, height: 18 }}
                />
                <Text style={styles.googleAuthButtonText}>
                  {isEn ? 'Continue with Google' : 'Google के साथ आगे बढ़ें'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ================= FORGOT PASSWORD FORM ================= */}
          {authMode === 'forgot_password' && (
            <View style={{ marginTop: 4 }}>
              {forgotStep === 1 ? (
                <>
                  <Text style={styles.forgotInstructionText}>
                    {isEn
                      ? 'Enter your registered email address. We will send a 6-digit OTP code to reset your password.'
                      : 'अपना पंजीकृत ईमेल पता दर्ज करें। हम आपका पासवर्ड रीसेट करने के लिए 6-अंकीय OTP कोड भेजेंगे।'}
                  </Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      {isEn ? 'Registered Email' : 'पंजीकृत ईमेल'}
                    </Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={18} color="#94A3B8" />
                      <TextInput
                        style={styles.textInput}
                        placeholder={isEn ? 'name@example.com' : 'नाम@example.com'}
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errorMessage) setErrorMessage(null);
                        }}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryAuthButton, isLoading && { opacity: 0.75 }]}
                    onPress={handleRequestOTP}
                    activeOpacity={0.88}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white.pure} size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryAuthButtonText}>
                          {isEn ? 'Send OTP Code' : 'OTP कोड भेजें'}
                        </Text>
                        <Ionicons name="paper-plane-outline" size={18} color={Colors.white.pure} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : forgotStep === 2 ? (
                <>
                  <Text style={styles.forgotInstructionText}>
                    {isEn
                      ? `OTP sent to ${email}. Enter the 6-digit code to verify:`
                      : `OTP ${email} पर भेजा गया। सत्यापित करने के लिए 6-अंकीय कोड दर्ज करें:`}
                  </Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      {isEn ? '6-Digit OTP Code' : '6-अंकीय OTP कोड'}
                    </Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="key-outline" size={18} color="#94A3B8" />
                      <TextInput
                        style={[styles.textInput, { letterSpacing: 4, fontWeight: '700' }]}
                        placeholder="123456"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otpCode}
                        onChangeText={(text) => {
                          setOtpCode(text);
                          if (errorMessage) setErrorMessage(null);
                        }}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryAuthButton, isLoading && { opacity: 0.75 }]}
                    onPress={handleVerifyOTP}
                    activeOpacity={0.88}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white.pure} size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryAuthButtonText}>
                          {isEn ? 'Verify OTP' : 'OTP सत्यापित करें'}
                        </Text>
                        <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white.pure} />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ marginTop: 14, alignItems: 'center' }}
                    onPress={handleRequestOTP}
                    disabled={isLoading}
                  >
                    <Text style={{ fontSize: 12, color: Colors.blue.dark, fontWeight: '600' }}>
                      {isEn ? 'Resend OTP Code' : 'OTP दोबारा भेजें'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.forgotInstructionText}>
                    {isEn
                      ? 'OTP verified! Enter your new password and confirm it below:'
                      : 'OTP सत्यापित हो गया! अपना नया पासवर्ड और कन्फर्म पासवर्ड दर्ज करें:'}
                  </Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      {isEn ? 'New Password' : 'नया पासवर्ड'}
                    </Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
                      <TextInput
                        style={styles.textInput}
                        placeholder={isEn ? '••••••••' : 'नया पासवर्ड (कम से कम 6 अक्षर)'}
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          if (errorMessage) setErrorMessage(null);
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword((prev) => !prev)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={19}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      {isEn ? 'Confirm New Password' : 'नया पासवर्ड कन्फर्म करें'}
                    </Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#94A3B8" />
                      <TextInput
                        style={styles.textInput}
                        placeholder={isEn ? '••••••••' : 'नया पासवर्ड दोबारा दर्ज करें'}
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (errorMessage) setErrorMessage(null);
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={19}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryAuthButton, isLoading && { opacity: 0.75 }]}
                    onPress={handleResetPassword}
                    activeOpacity={0.88}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white.pure} size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryAuthButtonText}>
                          {isEn ? 'Update Password' : 'पासवर्ड अपडेट करें'}
                        </Text>
                        <Ionicons name="checkmark-done-circle-outline" size={18} color={Colors.white.pure} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}


              {/* Back to Sign In button */}
              <TouchableOpacity
                style={styles.backToLoginRow}
                onPress={() => {
                  setAuthMode('login');
                  setForgotStep(1);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                <Ionicons name="arrow-back" size={14} color="#64748B" />
                <Text style={styles.backToLoginText}>
                  {isEn ? 'Back to Sign In' : 'साइन इन पर वापस जाएं'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Secure Footer */}
        <View style={styles.trustFooter}>
          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#05326eff" />
            <Text style={styles.secureBadgeText}>
              Powered by Avensoft
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? 28 : 56,
    paddingBottom: Platform.OS === 'android' ? 140 : 60,
    paddingHorizontal: 20,
  },


  // Top Language Bar
  topLangRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  langSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  langSwitchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },

  // Auth Card
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },

  // Segmented Tabs
  modeTabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#1E293B',
    fontWeight: '700',
  },

  // Inline Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },

  // Form Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },

  // Primary Button
  primaryAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.blue.dark,
    height: 50,
    borderRadius: 12,
    marginTop: 8,
    elevation: 3,
    shadowColor: Colors.blue.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  primaryAuthButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },

  // Google Button
  googleAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 50,
    borderRadius: 12,
    marginBottom: 4,
  },
  googleAuthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Trust Footer
  trustFooter: {
    alignItems: 'center',
    marginTop: 24,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  secureBadgeText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
  },

  // Smart Google Action Banner styles
  googleActionBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  googleActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  googleActionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  googleActionSub: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 10,
    marginLeft: 24,
  },
  googleActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  googleActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 5,
  },
  googleActionBtnPrimaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  googleActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 5,
  },
  googleActionBtnSecondaryText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },

  // Forgot Password Styles
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPasswordLinkText: {
    fontSize: 12,
    color: Colors.blue.dark,
    fontWeight: '700',
  },
  forgotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  forgotBackBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  forgotHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  forgotInstructionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  backToLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 6,
  },
  backToLoginText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});

