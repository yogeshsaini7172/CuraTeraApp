// Data contracts and TypeScript interfaces for YojnaMitra

export type NavTab = 'home' | 'schemes' | 'mitra' | 'docs' | 'profile';

export interface Scheme {
  id: string;
  titleHi: string;
  titleEn: string;
  category: 'farming' | 'housing' | 'health' | 'education' | 'pension' | 'business';
  categoryLabelHi: string;
  categoryLabelEn: string;
  ministryHi: string;
  ministryEn: string;
  benefitHi: string;
  benefitEn: string;
  benefitAmount: string; // e.g. "₹1,20,000" or "₹6,000 / year"
  benefitAmountHi?: string;
  benefitAmountEn?: string;
  isEligible: boolean;   // 100% eligible match
  matchPercentage: number; // e.g. 100 or 85
  whyEligibleHi: string;  // e.g. "कच्चा मकान ✓ | BPL कार्ड ✓ | ग्रामीण ✓"
  whyEligibleEn: string;  // e.g. "Kutcha House ✓ | BPL Card ✓ | Rural Resident ✓"
  descriptionHi: string;
  descriptionEn: string;
  requiredDocsHi: string[];
  requiredDocsEn: string[];
  officialUrl: string;
  helplinePhone: string;
}

export interface SchemeCategory {
  id: Scheme['category'];
  titleHi: string;
  titleEn: string;
  schemeCount: number;
  iconOutline: string;
  iconFilled: string;
  accentColor: string;
}

export interface DocumentItem {
  id: string;
  titleHi: string;
  titleEn: string;
  descriptionHi: string;
  descriptionEn: string;
  isAvailable: boolean; // checked / saved or not
  howToGetHi: string;   // Guide on how to make this document at CSC/Tehsil
  howToGetEn: string;
  docCategory?: 'identity' | 'bank' | 'land' | 'income' | 'ration' | 'other';
  documentNumber?: string;
  maskedNumber?: string;
  unlockedSchemeIds?: string[];
  imageUri?: string;
  verifiedAt?: string;
}

export interface UserProfile {
  name: string;
  age: number;
  state: string;
  stateHi?: string;
  stateEn?: string;
  area: string;
  areaHi?: string;
  areaEn?: string;
  occupation: string;
  occupationHi?: string;
  occupationEn?: string;
  annualIncome: string;
  annualIncomeHi?: string;
  annualIncomeEn?: string;
  category: string;
  categoryHi?: string;
  categoryEn?: string;
  houseType: string;
  houseTypeHi?: string;
  houseTypeEn?: string;
  isKisan: boolean;
  gender?: 'male' | 'female' | 'other';
  genderHi?: string;
  genderEn?: string;
}
