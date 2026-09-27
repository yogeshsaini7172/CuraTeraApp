export type AttributeType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface ProfileAttribute {
  key: string;
  labelEn: string;
  labelHi: string;
  type: AttributeType;
  category: 'personal' | 'location' | 'education' | 'economic' | 'social';
  options?: { hi: string; en: string }[];
}

export const PROFILE_ATTRIBUTES: ProfileAttribute[] = [
  {
    key: 'gender',
    labelEn: 'Gender',
    labelHi: 'लिंग',
    type: 'select',
    category: 'personal',
    options: [
      { hi: 'पुरुष (Male)', en: 'Male' },
      { hi: 'महिला (Female)', en: 'Female' },
      { hi: 'अन्य (Other)', en: 'Other' }
    ]
  },
  {
    key: 'age',
    labelEn: 'Age',
    labelHi: 'आयु',
    type: 'number',
    category: 'personal'
  },
  {
    key: 'state',
    labelEn: 'State',
    labelHi: 'राज्य',
    type: 'select',
    category: 'location',
    options: [
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
    ]
  },
  {
    key: 'district',
    labelEn: 'District',
    labelHi: 'ज़िला',
    type: 'text',
    category: 'location'
  },
  {
    key: 'village',
    labelEn: 'Village/City',
    labelHi: 'गाँव/शहर',
    type: 'text',
    category: 'location'
  },
  {
    key: 'education',
    labelEn: 'Education Level',
    labelHi: 'शिक्षा का स्तर',
    type: 'select',
    category: 'education',
    options: [
      { hi: 'अनपढ़ (Illiterate)', en: 'Illiterate' },
      { hi: '10वीं पास (10th Pass)', en: '10th Pass' },
      { hi: '12वीं पास (12th Pass)', en: '12th Pass' },
      { hi: 'स्नातक (Graduate)', en: 'Graduate' },
      { hi: 'स्नातकोत्तर (Post Graduate)', en: 'Post Graduate' }
    ]
  },
  {
    key: 'college',
    labelEn: 'College/School',
    labelHi: 'कॉलेज/स्कूल',
    type: 'text',
    category: 'education'
  },
  {
    key: 'course',
    labelEn: 'Course',
    labelHi: 'कोर्स',
    type: 'text',
    category: 'education'
  },
  {
    key: 'occupation',
    labelEn: 'Occupation',
    labelHi: 'व्यवसाय',
    type: 'select',
    category: 'economic',
    options: [
      { hi: 'लघु एवं सीमांत किसान (Farmer)', en: 'Small & Marginal Farmer' },
      { hi: 'दैनिक मजदूर (Daily Wage Worker)', en: 'Daily Wage Worker' },
      { hi: 'छोटा व्यापारी / दुकानदार (Vendor)', en: 'Small Shopkeeper / Vendor' },
      { hi: 'महिला स्व-सहायता समूह (SHG)', en: 'Self Help Group Worker' },
      { hi: 'विद्यार्थी (Student)', en: 'Student' },
      { hi: 'गृहिणी (Homemaker)', en: 'Homemaker' },
      { hi: 'निजी / सरकारी नौकरी (Salaried)', en: 'Salaried Employee' },
      { hi: 'स्वरोजगार / कारीगर (Artisan)', en: 'Self-employed / Artisan' },
      { hi: 'बेरोजगार (Unemployed)', en: 'Unemployed' },
    ]
  },
  {
    key: 'annualIncome',
    labelEn: 'Annual Income',
    labelHi: 'वार्षिक आय',
    type: 'select',
    category: 'economic',
    options: [
      { hi: '₹1.00 लाख से कम (BPL श्रेणी)', en: 'Below ₹1.00 Lakh (BPL)' },
      { hi: '₹1.00 - ₹2.00 लाख (कम आय)', en: '₹1.00 - ₹2.00 Lakh' },
      { hi: '₹2.00 - ₹3.50 लाख', en: '₹2.00 - ₹3.50 Lakh' },
      { hi: '₹3.50 - ₹5.00 लाख', en: '₹3.50 - ₹5.00 Lakh' },
      { hi: '₹5.00 लाख से अधिक', en: 'Above ₹5.00 Lakh' },
    ]
  },
  {
    key: 'houseType',
    labelEn: 'House Type',
    labelHi: 'मकान का प्रकार',
    type: 'select',
    category: 'economic',
    options: [
      { hi: 'कच्चा मकान (Kutcha)', en: 'Kutcha House' },
      { hi: 'अर्ध-पक्का मकान (Semi-Pucca)', en: 'Semi-Pucca House' },
      { hi: 'पक्का मकान (Pucca)', en: 'Pucca House' },
      { hi: 'किराये का मकान (Rented)', en: 'Rented House' },
      { hi: 'बेघर (Homeless)', en: 'Homeless / No House' },
    ]
  },
  {
    key: 'category',
    labelEn: 'Social Category',
    labelHi: 'सामाजिक श्रेणी',
    type: 'select',
    category: 'social',
    options: [
      { hi: 'सामान्य (General)', en: 'General' },
      { hi: 'ओबीसी (OBC)', en: 'OBC' },
      { hi: 'एससी (SC)', en: 'SC' },
      { hi: 'एसटी (ST)', en: 'ST' },
      { hi: 'अल्पसंख्यक (Minority)', en: 'Minority' },
    ]
  }
];

export const CATEGORY_LABELS = {
  personal: { en: 'Personal Information', hi: 'व्यक्तिगत जानकारी' },
  location: { en: 'Location', hi: 'स्थान' },
  education: { en: 'Education', hi: 'शिक्षा' },
  economic: { en: 'Economic Information', hi: 'आर्थिक जानकारी' },
  social: { en: 'Social Information', hi: 'सामाजिक जानकारी' }
};
