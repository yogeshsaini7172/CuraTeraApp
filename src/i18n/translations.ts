export type SupportedLanguage = 'hi' | 'en';

export interface Translations {
  appNameHi: string;
  appNameEn: string;
  appTagline: string;
  homeTab: string;
  schemesTab: string;
  mitraTab: string;
  docsTab: string;
  profileTab: string;
  greetingPrefix: string;
  eligibleSchemesCount: (count: number) => string;
  roleCitizen: string;
  roleSahayak: string;
  settings: string;
  languageSelect: string;
  logout: string;
  notificationsTitle: string;
  noNotifications: string;
  
  // Home Screen
  voiceAssistantBadge: string;
  voiceAssistantTitle: string;
  voiceAssistantExample: string;
  startVoiceButton: string;
  categoriesHeading: string;
  recommendedHeading: string;
  viewAll: string;
  kisanHelplineTitle: string;
  kisanHelplineDesc: string;
  callNow: string;

  // Schemes Screen
  searchPlaceholder: string;
  allFilter: string;
  eligibleFilter: string;
  schemesFound: (count: number) => string;

  // Scheme Card
  directBenefitLabel: string;
  listenBtn: string;
  viewDocsBtn: string;
  applyPortalBtn: string;
  eligibleBadgeText: string;
  checkEligibilityText: string;

  // Documents
  docsScreenTitle: string;
  docsScreenSub: string;
  availableBadge: string;
  pendingBadge: string;
  howToMakeLabel: string;
  cscHelpTitle: string;
  cscHelpDesc: string;
  callHelplinePrefix: string;

  // Switcher
  switchProfileTitle: string;
  activeBadge: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  hi: {
    appNameHi: 'CuraTera',
    appNameEn: 'CuraTera',
    appTagline: 'हर नागरिक का डिजिटल साथी • भारत सरकार',
    homeTab: 'होम',
    schemesTab: 'योजनाएं',
    mitraTab: 'CuraTera AI',
    docsTab: 'कागजात',
    profileTab: 'प्रोफाइल',
    greetingPrefix: 'नमस्ते',
    eligibleSchemesCount: (count) => `🟢 ${count} पात्र योजनाएं`,
    roleCitizen: 'नागरिक मोड (स्वयं)',
    roleSahayak: 'सहायक / CSC मोड',
    settings: 'ऐप सेटिंग्स',
    languageSelect: 'ऐप की भाषा',
    logout: 'लॉग आउट करें',
    notificationsTitle: 'महत्वपूर्ण सूचनाएं',
    noNotifications: 'कोई नई सूचना नहीं है',

    voiceAssistantBadge: '🎙️ वॉइस असिस्टेंट',
    voiceAssistantTitle: 'बोलकर योजनाएं खोजें',
    voiceAssistantExample: 'बोलें: "मुझे पक्का मकान चाहिए" या "किसान योजना"',
    startVoiceButton: 'CuraTera से बात करें',
    categoriesHeading: '🏛️ प्रमुख सरकारी श्रेणियां',
    recommendedHeading: '✨ आपके लिए 100% पात्र योजनाएं',
    viewAll: 'सभी देखें ↗',
    kisanHelplineTitle: '📞 सरकारी किसान हेल्पलाइन: 1551',
    kisanHelplineDesc: 'किसी भी सरकारी योजना या फसल समस्या के लिए निःशुल्क कॉल करें।',
    callNow: 'अभी कॉल करें',

    searchPlaceholder: 'योजना का नाम, लाभ या मंत्रालय खोजें...',
    allFilter: 'सभी योजनाएं',
    eligibleFilter: '🟢 100% पात्र',
    schemesFound: (count) => `${count} सरकारी योजनाएं उपलब्ध`,

    directBenefitLabel: 'सीधा आर्थिक लाभ:',
    listenBtn: 'सुनें',
    viewDocsBtn: 'कागजात देखें',
    applyPortalBtn: 'ऑफिशियल पोर्टल ↗',
    eligibleBadgeText: '100% पात्र',
    checkEligibilityText: 'पात्रता जांचें',

    docsScreenTitle: '📄 जरूरी सरकारी दस्तावेज',
    docsScreenSub: 'सरकारी योजनाओं में आवेदन के लिए आवश्यक प्रमाण पत्र',
    availableBadge: '✓ उपलब्ध है',
    pendingBadge: '⏳ बनवाना बाकी है',
    howToMakeLabel: '💡 कैसे बनवाएं:',
    cscHelpTitle: '💡 आवेदन में मदद चाहिए?',
    cscHelpDesc: 'आप इन सभी कागजातों के साथ नजदीकी CSC केंद्र पर जाकर मात्र ₹30-50 के सरकारी शुल्क में ऑनलाइन आवेदन करवा सकते हैं।',
    callHelplinePrefix: 'हेल्पलाइन पर कॉल करें: ',

    switchProfileTitle: 'नागरिक प्रोफाइल चुनें',
    activeBadge: 'सक्रिय',
  },
  en: {
    appNameHi: 'CuraTera',
    appNameEn: 'CuraTera',
    appTagline: 'Empowering Every Citizen • Govt of India',
    homeTab: 'Home',
    schemesTab: 'Schemes',
    mitraTab: 'CuraTera AI',
    docsTab: 'Documents',
    profileTab: 'Profile',
    greetingPrefix: 'Welcome',
    eligibleSchemesCount: (count) => `🟢 ${count} Eligible Schemes`,
    roleCitizen: 'Citizen Mode (Self)',
    roleSahayak: 'Assistant / CSC Mode',
    settings: 'App Settings',
    languageSelect: 'App Language',
    logout: 'Log Out',
    notificationsTitle: 'Important Notifications',
    noNotifications: 'No new notifications',

    voiceAssistantBadge: '🎙️ Voice Assistant',
    voiceAssistantTitle: 'Discover Schemes by Speaking',
    voiceAssistantExample: 'Say: "I need housing scheme" or "Farmer welfare"',
    startVoiceButton: 'Talk to Mitra AI',
    categoriesHeading: '🏛️ Flagship Welfare Categories',
    recommendedHeading: '✨ 100% Eligible Schemes for You',
    viewAll: 'View All ↗',
    kisanHelplineTitle: '📞 National Citizen Helpline: 1551',
    kisanHelplineDesc: 'Toll-free helpline for government schemes, farmer queries, and grievance redressal.',
    callNow: 'Call Now',

    searchPlaceholder: 'Search scheme name, ministry or benefits...',
    allFilter: 'All Schemes',
    eligibleFilter: '🟢 100% Eligible',
    schemesFound: (count) => `${count} Government Schemes Found`,

    directBenefitLabel: 'Direct Welfare Benefit:',
    listenBtn: 'Listen',
    viewDocsBtn: 'Required Docs',
    applyPortalBtn: 'Official Portal ↗',
    eligibleBadgeText: '100% Eligible',
    checkEligibilityText: 'Check Eligibility',

    docsScreenTitle: '📄 Essential Government Documents',
    docsScreenSub: 'Checklist of verified documents required for welfare schemes',
    availableBadge: '✓ Available',
    pendingBadge: '⏳ Pending / Required',
    howToMakeLabel: '💡 How to obtain:',
    cscHelpTitle: '💡 Need Assistance with Application?',
    cscHelpDesc: 'Carry these documents to your nearest Common Service Center (CSC) or e-Seva Kendra to complete digital application for nominal ₹30-50 fee.',
    callHelplinePrefix: 'Call National Helpline: ',

    switchProfileTitle: 'Select Citizen Profile (Demo Persona)',
    activeBadge: 'Active Profile',
  },
};
