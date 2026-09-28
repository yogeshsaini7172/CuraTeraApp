import { Scheme, SchemeCategory, DocumentItem } from '../types';
import { Colors } from '../theme/colors';

// 6 Flagship Scheme Categories
export const CATEGORIES: SchemeCategory[] = [
  {
    id: 'farming',
    titleHi: 'किसान कल्याण',
    titleEn: 'Farmer Welfare',
    schemeCount: 14,
    iconOutline: 'leaf-outline',
    iconFilled: 'leaf',
    accentColor: Colors.orange.primary,
  },
  {
    id: 'housing',
    titleHi: 'पक्का आवास',
    titleEn: 'Housing Support',
    schemeCount: 6,
    iconOutline: 'home-outline',
    iconFilled: 'home',
    accentColor: Colors.orange.primary,
  },
  {
    id: 'health',
    titleHi: 'स्वास्थ्य व इलाज',
    titleEn: 'Health & Medical',
    schemeCount: 8,
    iconOutline: 'heart-outline',
    iconFilled: 'heart',
    accentColor: Colors.orange.primary,
  },
  {
    id: 'education',
    titleHi: 'शिक्षा व छात्रवृत्ति',
    titleEn: 'Education & Girls',
    schemeCount: 11,
    iconOutline: 'school-outline',
    iconFilled: 'school',
    accentColor: Colors.orange.primary,
  },
  {
    id: 'pension',
    titleHi: 'पेंशन व सुरक्षा',
    titleEn: 'Pension & Security',
    schemeCount: 5,
    iconOutline: 'people-outline',
    iconFilled: 'people',
    accentColor: Colors.orange.primary,
  },
  {
    id: 'business',
    titleHi: 'रोजगार व लोन',
    titleEn: 'Business & Loans',
    schemeCount: 9,
    iconOutline: 'briefcase-outline',
    iconFilled: 'briefcase',
    accentColor: Colors.orange.primary,
  },
];

// Flagship Government Schemes Database with Full Spectrum Theme Palette
export const SCHEMES: Scheme[] = [];
