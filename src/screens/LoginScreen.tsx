import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { SupportedLanguage } from '../i18n/translations';

interface LoginScreenProps {
  onLoginSuccess: (userName: string) => void;
  onDemoLogin: () => void;
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onDemoLogin,
  currentLanguage = 'hi',
  onLanguageChange,
}) => {
  const isEn = currentLanguage === 'en';
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuth = () => {
    setErrorMessage(null);

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

    const displayName = fullName.trim() || email.split('@')[0];
    onLoginSuccess(displayName);
  };

  const handleGoogleSignIn = () => {
    setErrorMessage(null);
    onLoginSuccess('Ramesh Kumar');
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
      >
        {/* Top Language Switcher Bar */}
        {onLanguageChange && (
          <View style={styles.topLangRow}>
            <TouchableOpacity
              style={styles.langSwitchBtn}
              onPress={() => onLanguageChange(isEn ? 'hi' : 'en')}
              activeOpacity={0.8}
            >
              <Ionicons name="language" size={15} color="#FFFFFF" />
              <Text style={styles.langSwitchBtnText}>
                {isEn ? 'हिन्दी में देखें' : 'Switch to English'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 1. Minimal & Clean Brand Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/YojnaLogo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.brandTitle}>YojnaMitra</Text>
          <Text style={styles.brandSubtitle}>
            {isEn ? 'Citizen Welfare & Schemes Assistant' : 'नागरिक कल्याण एवं योजना सहायक'}
          </Text>
        </View>

        {/* 2. Authentication Card */}
        <View style={styles.authCard}>
          {/* Segmented Mode Switcher */}
          <View style={styles.modeTabsWrapper}>
            <TouchableOpacity
              style={[styles.modeTab, authMode === 'login' && styles.modeTabActive]}
              onPress={() => {
                setAuthMode('login');
                setErrorMessage(null);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeTabText,
                  authMode === 'login' && styles.modeTabTextActive,
                ]}
              >
                {isEn ? 'Log In' : 'लॉग इन'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, authMode === 'signup' && styles.modeTabActive]}
              onPress={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeTabText,
                  authMode === 'signup' && styles.modeTabTextActive,
                ]}
              >
                {isEn ? 'Sign Up' : 'साइन अप'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inline Error Message */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.orange.primary} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          {authMode === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {isEn ? 'Full Name' : 'पूरा नाम'}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={Colors.blue.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder={isEn ? 'Your name' : 'अपना पूरा नाम दर्ज करें'}
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
              <Ionicons name="mail-outline" size={18} color={Colors.blue.primary} />
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
            <Text style={styles.fieldLabel}>
              {isEn ? 'Password' : 'पासवर्ड'}
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.blue.primary} />
              <TextInput
                style={styles.textInput}
                placeholder={isEn ? 'Password (6+ characters)' : 'पासवर्ड (कम से कम 6 अक्षर)'}
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
                  color={Colors.orange.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryAuthButton}
            onPress={handleAuth}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryAuthButtonText}>
              {authMode === 'login'
                ? (isEn ? 'Log In' : 'लॉग इन करें')
                : (isEn ? 'Sign Up' : 'खाता बनाएं')}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white.pure} />
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
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleAuthButtonText}>
              {isEn ? 'Continue with Google' : 'Google के साथ आगे बढ़ें'}
            </Text>
          </TouchableOpacity>

          {/* Quick Demo Mode */}
          <TouchableOpacity
            style={styles.demoAuthButton}
            onPress={onDemoLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={17} color={Colors.orange.primary} />
            <Text style={styles.demoAuthButtonText}>
              {isEn ? 'Explore Demo as Citizen' : 'डेमो नागरिक के रूप में देखें'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Minimal Clean Footer */}
        <View style={styles.trustFooter}>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: '#FF9933' }]} />
            <View style={[styles.dot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.dot, { backgroundColor: '#138808' }]} />
          </View>
          <View style={styles.trustBadgeRow}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.orange.primary} />
            <Text style={styles.trustFooterText}>
              {isEn ? 'GovTech Secured • 100% Protected' : 'GovTech सुरक्षित • 100% डेटा सुरक्षा'}
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
    backgroundColor: Colors.blue.dark,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? 28 : 56,
    paddingBottom: 32,
    paddingHorizontal: 20,
    justifyContent: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  langSwitchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadgeContainer: {
    padding: 3,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 10,
  },
  logoBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.white.pure,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoImage: {
    width: 66,
    height: 66,
    marginTop: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white.pure,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 4,
    textAlign: 'center',
  },

  // Auth Card
  authCard: {
    backgroundColor: Colors.white.pure,
    borderRadius: 22,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },

  // Segmented Tabs
  modeTabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: Colors.blue.dark,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: Colors.white.pure,
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
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.white.textDark,
    paddingVertical: 0,
  },

  // Primary Button
  primaryAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.blue.dark,
    height: 48,
    borderRadius: 12,
    marginTop: 4,
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryAuthButtonText: {
    color: Colors.white.pure,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },

  // Google Button
  googleAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white.pure,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    height: 46,
    borderRadius: 12,
    marginBottom: 10,
  },
  googleAuthButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Demo Button
  demoAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.2,
    borderColor: Colors.orange.primary,
    height: 46,
    borderRadius: 12,
  },
  demoAuthButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.orange.primary,
  },

  // Trust Footer
  trustFooter: {
    alignItems: 'center',
    marginTop: 18,
    gap: 6,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustFooterText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.70)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
