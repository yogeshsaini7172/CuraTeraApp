import { UserProfile } from '../types';

export interface DemoUser {
  id: string;
  username?: string;
  email?: string;
  fullName?: string;
  name: string;
  nameHi: string;
  nameEn: string;
  avatar: string;
  image: any;
  tagline: string;
  taglineHi: string;
  taglineEn: string;
  profile: UserProfile;
  eligibleSchemeIds: string[];
}

export const DEMO_USERS: DemoUser[] = [];
export const CITIZEN_AVATARS: Record<string, any> = {};
