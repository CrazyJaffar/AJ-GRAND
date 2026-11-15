import React from 'react';
import { SiteConfig } from '../config/siteConfig';
import {
  ConsentStatus,
  hasAnyTrackingConfigured,
} from '../utils/analytics';

interface ConsentBannerProps {
  config: SiteConfig;
  consent: ConsentStatus;
  onConsentChoice: (choice: 'granted' | 'denied') => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  config,
  consent,
  onConsentChoice,
}) => {
  // Only show consent banner when tracking IDs are actually configured and choice is pending
  if (!hasAnyTrackingConfigured(config) || consent !== 'pending') {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Analytics and cookie preferences"
      className="fixed bottom-16 md:bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 bg-[#ffffff] border border-[#d1c5b8] rounded-[6px] p-5 shadow-warm-hover"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.09em] text-[#725b38] mb-1.5">
        Privacy &amp; Analytics Consent
      </p>
      <p className="text-xs text-[#4d463c] leading-[1.6] mb-4">
        AJ GRAND uses analytics and advertising measurement tags only with your permission to
        improve property enquiry responses.
      </p>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onConsentChoice('granted')}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[4px] hover:bg-[#725b38] transition-colors cursor-pointer min-h-[38px]"
        >
          Accept Analytics
        </button>
        <button
          type="button"
          onClick={() => onConsentChoice('denied')}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] bg-[#f5f3f0] text-[#4d463c] border border-[#e8e2d9] rounded-[4px] hover:text-[#1a1918] transition-colors cursor-pointer min-h-[38px]"
        >
          Essential Only
        </button>
      </div>
    </div>
  );
};
