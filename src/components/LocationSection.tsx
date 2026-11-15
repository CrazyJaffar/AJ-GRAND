import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsEmbedUrl,
  SiteConfig,
} from '../config/siteConfig';

interface LocationSectionProps {
  config: SiteConfig;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ config }) => {
  const directionsUrl = getGoogleMapsDirectionsUrl(config);
  const embedUrl = getGoogleMapsEmbedUrl(config);

  return (
    <section id="location" className="py-16 md:py-24 bg-[#f5f3f0] border-b border-[#e8e2d9]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Address & Neighborhood Details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
                Location &amp; Connectivity
              </p>
              <h2 className="font-editorial text-3xl md:text-[2.5rem] leading-[1.15] text-[#1a1918] mb-5">
                Modi Garden, Kaval Bairasandra
              </h2>
              <p className="text-sm md:text-base text-[#4d463c] leading-[1.7] mb-7">
                Set in a serene residential pocket of North Bengaluru beside peaceful defence land,
                AJ GRAND balances quiet neighbourhood greenery with convenient access to Hebbal,
                Nagawara, Manyata Tech Park, RT Nagar, and Central Bengaluru.
              </p>

              <div className="bg-[#fbf9f6] border border-[#e8e2d9] rounded-[6px] p-6 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38] mb-1">
                    Property Address
                  </p>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm md:text-base font-medium text-[#1a1918] hover:text-[#725b38] transition-colors inline-flex items-start gap-2"
                  >
                    <MapPin className="w-4 h-4 text-[#725b38] shrink-0 mt-1" />
                    <span>{config.address.fullAddress}</span>
                  </a>
                </div>

                <div className="pt-3 border-t border-[#e8e2d9] flex items-center justify-between text-xs">
                  <span className="text-[#605e5c] uppercase tracking-[0.08em] font-semibold">
                    Google Maps Plus Code
                  </span>
                  <span className="font-semibold text-[#1a1918] tabular-nums">
                    {config.address.plusCode}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors min-h-[44px]"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions</span>
              </a>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#ffffff] text-[#1a1918] border border-[#d1c5b8] rounded-[4px] hover:border-[#725b38] transition-colors min-h-[44px]"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Embedded Google Maps Frame */}
          <div className="lg:col-span-7 flex">
            <div className="w-full bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] p-2.5 shadow-warm-ambient flex flex-col">
              <div className="relative w-full min-h-[340px] lg:flex-1 rounded-[4px] overflow-hidden bg-[#eae8e5]">
                <iframe
                  title="AJ GRAND Location Map — 34 Garden Main Road, Modi Garden, Kaval Bairasandra, Bengaluru"
                  src={embedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[340px] lg:min-h-[420px] border-0"
                />
              </div>
              <div className="pt-2.5 px-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#605e5c]">
                <span>34, Garden Main Road, Modi Garden, Bengaluru 560006</span>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#725b38] hover:underline"
                >
                  {config.address.plusCode}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
