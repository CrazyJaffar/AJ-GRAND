/**
 * Centralized site configuration for AJ GRAND.
 * All contact details, map settings, and marketing pixel/tracking IDs
 * can be updated via environment variables (.env) or directly in this file.
 * Unspecified values remain empty so nothing fabricated is ever displayed.
 */

export interface SiteConfig {
  brandName: string;
  brandMeaning: string;
  tagline: string;
  address: {
    street: string;
    locality: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    fullAddress: string;
    plusCode: string;
  };
  contact: {
    businessPhone: string;
    whatsappNumber: string;
    businessEmail: string;
    websiteUrl: string;
  };
  maps: {
    googleMapsUrl: string;
    googleMapsApiKey: string;
  };
  tracking: {
    ga4MeasurementId: string;
    googleAdsId: string;
    googleAdsConversionLabel: string;
    gtmContainerId: string;
    metaPixelId: string;
  };
}

const env = import.meta.env;

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: 'AJ GRAND',
  brandMeaning: 'Ayesha & Jaffar',
  tagline: 'Your New Home. Your First Memories.',
  address: {
    street: '34, Garden Main Road, Modi Garden',
    locality: 'Kaval Bairasandra',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560006',
    country: 'India',
    fullAddress: '34, Garden Main Road, Modi Garden, Kaval Bairasandra, Bengaluru, Karnataka 560006, India',
    plusCode: '2J82+FV Bengaluru',
  },
  contact: {
    businessPhone: (env.VITE_BUSINESS_PHONE || '').trim(),
    whatsappNumber: (env.VITE_WHATSAPP_NUMBER || '').trim(),
    businessEmail: (env.VITE_BUSINESS_EMAIL || '').trim(),
    websiteUrl: (env.VITE_WEBSITE_URL || '').trim(),
  },
  maps: {
    googleMapsUrl:
      (env.VITE_GOOGLE_MAPS_URL || '').trim() ||
      'https://www.google.com/maps/search/?api=1&query=2J82%2BFV+Bengaluru',
    googleMapsApiKey: (env.VITE_GOOGLE_MAPS_API_KEY || '').trim(),
  },
  tracking: {
    ga4MeasurementId: (env.VITE_GA4_MEASUREMENT_ID || '').trim(),
    googleAdsId: (env.VITE_GOOGLE_ADS_ID || '').trim(),
    googleAdsConversionLabel: (env.VITE_GOOGLE_ADS_CONVERSION_LABEL || '').trim(),
    gtmContainerId: (env.VITE_GTM_CONTAINER_ID || '').trim(),
    metaPixelId: (env.VITE_META_PIXEL_ID || '').trim(),
  },
};

export function sanitizePhoneDigits(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

export function sanitizeWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildTelHref(phone: string): string | null {
  const cleaned = sanitizePhoneDigits(phone);
  return cleaned ? `tel:${cleaned}` : null;
}

export function buildWhatsAppMessage(propertyLabel?: string): string {
  if (propertyLabel) {
    return `Hello AJ GRAND, I am interested in the ${propertyLabel} property. Please share the rental details and availability.`;
  }
  return 'Hello AJ GRAND, I would like to enquire about available rental homes at Modi Garden, Kaval Bairasandra, Bengaluru. Please share details and viewing availability.';
}

export function buildWhatsAppHref(whatsappNumber: string, propertyLabel?: string): string | null {
  const digits = sanitizeWhatsAppDigits(whatsappNumber);
  if (!digits) return null;
  const text = encodeURIComponent(buildWhatsAppMessage(propertyLabel));
  return `https://wa.me/${digits}?text=${text}`;
}

export function getGoogleMapsDirectionsUrl(config: SiteConfig): string {
  if (config.maps.googleMapsUrl) {
    return config.maps.googleMapsUrl;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    config.address.fullAddress
  )}`;
}

export function getGoogleMapsEmbedUrl(config: SiteConfig): string {
  const query = encodeURIComponent('34, Garden Main Road, Modi Garden, Kaval Bairasandra, Bengaluru 560006');
  if (config.maps.googleMapsApiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
      config.maps.googleMapsApiKey
    )}&q=${query}&zoom=16`;
  }
  return `https://maps.google.com/maps?q=${query}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
}
