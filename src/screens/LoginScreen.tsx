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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { SupportedLanguage } from '../i18n/translations';
import AuthStore from '../store/AuthStore';

interface LoginScreenProps {
  onLoginSuccess: (userName: string, email: string) => void;
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
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    setErrorMessage(null);

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

  const handleGoogleSignIn = () => {
    setErrorMessage(null);
    onLoginSuccess('Ramesh Kumar', 'demo@example.com');
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
                {isEn ? 'Sign In' : 'लॉग इन'}
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
                {isEn ? 'Register' : 'साइन अप'}
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
            <Text style={styles.fieldLabel}>
              {isEn ? 'Password' : 'पासवर्ड'}
            </Text>
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
              {isEn ? 'Sign in with Google' : 'Google के साथ आगे बढ़ें'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Secure Footer */}
        <View style={styles.trustFooter}>
          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
            <Text style={styles.secureBadgeText}>
              Secured by Avensoft • Encryption
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
    paddingBottom: 32,
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
});
