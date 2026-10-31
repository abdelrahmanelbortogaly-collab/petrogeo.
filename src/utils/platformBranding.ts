import officialPetroLogo from '../assets/images/petrogeo_official_logo_1790753628782.jpg';
import { PlatformBrand, CustomBrandSettings } from '../types';

export type { PlatformBrand, CustomBrandSettings };

export interface BrandConfig {
  brand: PlatformBrand;
  name: string;
  shortName: string;
  tagline: string;
  subTitle: string;
  englishTitle: string;
  icon: string;
  badge: string;
  badgeColor: string;
  primaryColor: string;
  primaryGradient: string;
  logoSrc: string;
  defaultDepartments: string[];
  themeClass: string;
}

export const DEFAULT_BRAND_CONFIGS: Record<PlatformBrand, BrandConfig> = {
  petrogeo: {
    brand: 'petrogeo',
    name: 'PETROGEO PLATFORM',
    shortName: 'PETROGEO',
    tagline: 'البوابة الأكاديمية لطلاب جيولوجيا البترول',
    subTitle: 'قسم الجيولوجيا وهندسة البترول',
    englishTitle: 'Petroleum Geology & Reservoir Engineering Platform',
    icon: '🛢️',
    badge: 'مصر 🇪🇬',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    primaryColor: '#f59e0b',
    primaryGradient: 'from-amber-500 to-amber-600',
    logoSrc: officialPetroLogo,
    defaultDepartments: [
      'قسم الجيولوجيا',
      'قسم جيولوجيا البترول',
      'قسم الجيوفيزياء',
      'هندسة البترول',
    ],
    themeClass: 'petrogeo-theme',
  },
  new_platform: {
    brand: 'new_platform',
    name: 'المنصة الأكاديمية المخصصة',
    shortName: 'ACADEMY',
    tagline: 'المنصة التعليمية المتكاملة للطلاب',
    subTitle: 'بوابة المحاضرات والامتحانات الذكية',
    englishTitle: 'Modern Educational & Academic Platform',
    icon: '🎓',
    badge: 'منصة مخصصة 🚀',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    primaryColor: '#6366f1',
    primaryGradient: 'from-indigo-500 to-indigo-600',
    logoSrc: officialPetroLogo,
    defaultDepartments: [
      'القسم العام',
      'قسم العلوم التخصصية',
      'قسم الهندسة والتكنولوجيا',
      'قسم نظم المعلومات والحاسبات',
    ],
    themeClass: 'custom-theme',
  },
};

const STORAGE_KEY = 'petrogeo_active_brand';

export function getCustomBrandSettings(): CustomBrandSettings | null {
  try {
    const raw = localStorage.getItem('petrogeo_custom_brand_settings');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveCustomBrandSettings(settings: CustomBrandSettings): void {
  try {
    localStorage.setItem('petrogeo_custom_brand_settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('platform-brand-changed', { detail: 'new_platform' }));
  } catch {}
}

export function getActiveBrand(): PlatformBrand {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as PlatformBrand;
    if (saved === 'petrogeo' || saved === 'new_platform') return saved;
  } catch {}
  return 'petrogeo';
}

export function setActiveBrand(brand: PlatformBrand): void {
  try {
    localStorage.setItem(STORAGE_KEY, brand);
    window.dispatchEvent(new CustomEvent('platform-brand-changed', { detail: brand }));
  } catch {}
}

export function getBrandConfig(brand?: PlatformBrand): BrandConfig {
  const active = brand || getActiveBrand();
  return DEFAULT_BRAND_CONFIGS[active] || DEFAULT_BRAND_CONFIGS.petrogeo;
}
