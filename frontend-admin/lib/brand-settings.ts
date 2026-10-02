'use client';

export interface BrandSettings {
  officialName: string;
  primaryDisplay: string;
  secondarySignature: string;
  tagline: string;
  whatsappNumber: string;
  supportPhone: string;
  supportEmail: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  storeAddress: string;
  storeCity: string;
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  officialName: 'KHADIJAH-TUL-QUBRAH BY Meer&Mus',
  primaryDisplay: 'KHADIJAH-TUL-QUBRAH',
  secondarySignature: 'BY Meer&Mus',
  tagline: 'STAY HONEST , STAND LONG',
  whatsappNumber: '+923000000000',
  supportPhone: '+923000000000',
  supportEmail: 'info@khadijatulqubrah.com',
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  tiktokUrl: 'https://tiktok.com',
  youtubeUrl: 'https://youtube.com',
  storeAddress: 'Main Boutique & Workshop, Jampur',
  storeCity: 'Jampur, Punjab, Pakistan',
};

const STORAGE_KEY = 'khadijah_brand_settings';

export function getBrandSettings(): BrandSettings {
  if (typeof window === 'undefined') return DEFAULT_BRAND_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_BRAND_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load brand settings', e);
  }
  return DEFAULT_BRAND_SETTINGS;
}

export function saveBrandSettings(settings: BrandSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('khadijah_brand_settings_updated', { detail: settings }));
  } catch (e) {
    console.error('Failed to save brand settings', e);
  }
}
