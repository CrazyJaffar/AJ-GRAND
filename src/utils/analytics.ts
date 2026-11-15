import { SiteConfig } from '../config/siteConfig';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

export type TrackingAction =
  | 'page_view'
  | 'view_property_details'
  | 'click_call_now'
  | 'click_whatsapp'
  | 'start_enquiry_form'
  | 'submit_enquiry_success'
  | 'schedule_site_visit';

const CONSENT_STORAGE_KEY = 'aj_grand_tracking_consent_v1';
const firedEventKeys = new Set<string>();
let initializedTrackers = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => void;
    };
    _fbq?: unknown;
  }
}

export function getStoredConsent(): ConsentStatus {
  try {
    const val = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === 'granted' || val === 'denied') return val;
  } catch {
    // Ignore storage access restrictions
  }
  return 'pending';
}

export function setStoredConsent(status: 'granted' | 'denied'): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, status);
  } catch {
    // Ignore storage access restrictions
  }
}

export function hasAnyTrackingConfigured(config: SiteConfig): boolean {
  const t = config.tracking;
  return Boolean(
    t.ga4MeasurementId || t.googleAdsId || t.gtmContainerId || t.metaPixelId
  );
}

/**
 * Dynamically initializes GA4, Google Ads, GTM, and Meta Pixel
 * ONLY when tracking IDs are provided AND user consent is granted.
 */
export function initializeTrackingIfConsented(config: SiteConfig): void {
  if (initializedTrackers) return;
  if (getStoredConsent() !== 'granted') return;

  const { ga4MeasurementId, googleAdsId, gtmContainerId, metaPixelId } = config.tracking;

  if (!ga4MeasurementId && !googleAdsId && !gtmContainerId && !metaPixelId) {
    return;
  }

  initializedTrackers = true;

  // Google Tag Manager
  if (gtmContainerId && !document.getElementById('aj-gtm-script')) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const gtmScript = document.createElement('script');
    gtmScript.id = 'aj-gtm-script';
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmContainerId)}`;
    document.head.appendChild(gtmScript);
  }

  // Google Analytics 4 / Google Ads gtag.js
  const primaryGoogleTag = ga4MeasurementId || googleAdsId;
  if (primaryGoogleTag && !document.getElementById('aj-gtag-script')) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    if (ga4MeasurementId) {
      window.gtag('config', ga4MeasurementId, { send_page_view: false });
    }
    if (googleAdsId) {
      window.gtag('config', googleAdsId);
    }

    const gtagScript = document.createElement('script');
    gtagScript.id = 'aj-gtag-script';
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryGoogleTag)}`;
    document.head.appendChild(gtagScript);
  }

  // Meta Pixel
  if (metaPixelId && !document.getElementById('aj-fbq-script')) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        n.queue.push(args);
      }
    } as unknown as NonNullable<Window['fbq']> & { queue: unknown[] };
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    window.fbq = n;
    window._fbq = n;

    const fbScript = document.createElement('script');
    fbScript.id = 'aj-fbq-script';
    fbScript.async = true;
    fbScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(fbScript);

    window.fbq('init', metaPixelId);
  }
}

export interface TrackEventPayload {
  propertyId?: string;
  propertyName?: string;
  bhk?: string;
  floor?: string;
  path?: string;
  dedupeKey?: string;
}

/**
 * Dispatches conversion and behavioral events across configured Google and Meta channels.
 * Enforces deduplication via dedupeKey so duplicate ad conversion events are prevented.
 */
export function trackEvent(
  action: TrackingAction,
  config: SiteConfig,
  payload: TrackEventPayload = {}
): void {
  if (getStoredConsent() !== 'granted') return;
  if (!hasAnyTrackingConfigured(config)) return;

  initializeTrackingIfConsented(config);

  const dedupeKey =
    payload.dedupeKey ||
    `${action}:${payload.propertyId || payload.path || 'global'}`;

  // Prevent duplicate conversion firings for the same action/entity in a session
  if (firedEventKeys.has(dedupeKey)) {
    return;
  }
  firedEventKeys.add(dedupeKey);

  const eventParams = {
    property_id: payload.propertyId,
    property_name: payload.propertyName,
    bhk_type: payload.bhk,
    floor: payload.floor,
    page_path: payload.path || window.location.pathname,
  };

  // GTM dataLayer push
  if (config.tracking.gtmContainerId && window.dataLayer) {
    window.dataLayer.push({
      event: action,
      ...eventParams,
    });
  }

  // GA4 & Google Ads
  if (window.gtag) {
    if (config.tracking.ga4MeasurementId) {
      if (action === 'page_view') {
        window.gtag('event', 'page_view', {
          page_path: eventParams.page_path,
          page_title: document.title,
        });
      } else {
        window.gtag('event', action, eventParams);
      }
    }

    // Google Ads conversion for high-intent lead events
    if (
      config.tracking.googleAdsId &&
      config.tracking.googleAdsConversionLabel &&
      (action === 'submit_enquiry_success' ||
        action === 'click_call_now' ||
        action === 'click_whatsapp' ||
        action === 'schedule_site_visit')
    ) {
      window.gtag('event', 'conversion', {
        send_to: `${config.tracking.googleAdsId}/${config.tracking.googleAdsConversionLabel}`,
      });
    }
  }

  // Meta Pixel
  if (config.tracking.metaPixelId && window.fbq) {
    switch (action) {
      case 'page_view':
        window.fbq('track', 'PageView');
        break;
      case 'view_property_details':
        window.fbq('track', 'ViewContent', {
          content_name: payload.propertyName,
          content_category: payload.bhk,
          content_ids: payload.propertyId ? [payload.propertyId] : undefined,
        });
        break;
      case 'click_call_now':
      case 'click_whatsapp':
        window.fbq('track', 'Contact', {
          content_name: payload.propertyName || 'AJ GRAND General',
          method: action === 'click_call_now' ? 'phone' : 'whatsapp',
        });
        break;
      case 'start_enquiry_form':
        window.fbq('track', 'InitiateCheckout', {
          content_name: payload.propertyName || 'Enquiry Form',
        });
        break;
      case 'submit_enquiry_success':
        window.fbq('track', 'Lead', {
          content_name: payload.propertyName || 'Rental Enquiry',
          content_category: payload.bhk,
        });
        break;
      case 'schedule_site_visit':
        window.fbq('track', 'Schedule', {
          content_name: payload.propertyName || 'Site Visit',
        });
        break;
    }
  }
}
