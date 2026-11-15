import React from 'react';
import { SiteConfig, getGoogleMapsDirectionsUrl } from '../config/siteConfig';

interface FooterProps {
  config: SiteConfig;
  onNavigateSection: (sectionId: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  config,
  onNavigateSection,
  onOpenAdmin,
}) => {
  const mapsUrl = getGoogleMapsDirectionsUrl(config);

  return (
    <footer className="bg-[#1a1918] text-[#f2f0ed] pb-20 md:pb-0">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#f2f0ed]/15">
          <div className="md:col-span-5">
            <p className="font-editorial text-3xl tracking-[0.06em] text-[#fbf9f6]">
              {config.brandName}
            </p>
            <p className="font-editorial italic text-lg text-[#e0c298] mt-1">
              {config.tagline}
            </p>
            <p className="text-sm text-[#f2f0ed]/75 mt-4 leading-[1.7] max-w-md">
              Built in honor of {config.brandMeaning}, AJ GRAND offers five thoughtfully appointed
              2 BHK and Luxury 1 BHK residences in a calm North Bengaluru neighborhood beside
              defence land.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#e0c298] mb-4">
              Navigation
            </p>
            <ul className="space-y-2.5 text-sm text-[#f2f0ed]/80">
              {[
                { label: 'Available Residences', id: 'residences' },
                { label: 'Floor-Wise Overview', id: 'floors' },
                { label: 'Building Amenities', id: 'amenities' },
                { label: 'Modi Garden Location', id: 'location' },
                { label: 'Schedule Site Visit', id: 'enquire' },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigateSection(item.id)}
                    className="hover:text-[#e0c298] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#e0c298] mb-4">
              Address &amp; Direct Contact
            </p>
            <p className="text-sm text-[#f2f0ed]/85 leading-[1.7]">
              {config.address.fullAddress}
            </p>
            <p className="text-xs text-[#f2f0ed]/65 mt-2">
              Google Maps Plus Code: {config.address.plusCode}
            </p>
            <div className="mt-4 space-y-1.5 text-sm">
              {config.contact.businessPhone && (
                <p>
                  <a
                    href={`tel:${config.contact.businessPhone}`}
                    className="text-[#e0c298] hover:underline"
                  >
                    Phone: {config.contact.businessPhone}
                  </a>
                </p>
              )}
              {config.contact.businessEmail && (
                <p>
                  <a
                    href={`mailto:${config.contact.businessEmail}`}
                    className="text-[#e0c298] hover:underline"
                  >
                    Email: {config.contact.businessEmail}
                  </a>
                </p>
              )}
              <p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e0c298] hover:underline"
                >
                  Open Directions in Google Maps
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#f2f0ed]/60">
          <p>
            © {new Date().getFullYear()} AJ GRAND · 1 BHK &amp; 2 BHK Residences for Rent in
            Kaval Bairasandra, Modi Garden, Bengaluru.
          </p>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="text-[#f2f0ed]/50 hover:text-[#e0c298] transition-colors cursor-pointer"
          >
            Owner Portal
          </button>
        </div>
      </div>
    </footer>
  );
};
