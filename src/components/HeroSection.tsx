import React from 'react';
import { Phone, MessageCircle, ArrowRight, MapPin } from 'lucide-react';
import { BUILDING_EXTERIOR_IMAGE } from '../data/properties';
import { SiteConfig } from '../config/siteConfig';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  config: SiteConfig;
  onExploreResidences: () => void;
  onScheduleVisit: () => void;
  onCallNow: () => void;
  onWhatsApp: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  config,
  onExploreResidences,
  onScheduleVisit,
  onCallNow,
  onWhatsApp,
}) => {
  return (
    <section
      id="top"
      className="bg-[#fbf9f6] border-b border-[#e8e2d9]"
    >
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 py-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Editorial Left Column */}
          <div className="lg:col-span-7 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-5">
                34, Garden Main Road · Modi Garden · Kaval Bairasandra, Bengaluru
              </p>

              <h1 className="font-editorial text-[clamp(2.25rem,4.2vw,3.75rem)] leading-[1.08] tracking-[-0.02em] text-[#1a1918] mb-6 max-w-2xl">
                Your New Home.
                <br />
                Your First Memories.
              </h1>

              <p className="text-base md:text-lg leading-[1.75] text-[#4d463c] max-w-xl mb-8">
                AJ GRAND is a newly constructed G+3 boutique residential building offering five
                private first-occupancy rental homes — semi-furnished 2 BHK residences and
                dual-balcony Luxury 1 BHK residences beside peaceful defence land in North Bengaluru.
              </p>

              {/* Primary + Supporting Action Row */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <button
                  type="button"
                  onClick={onExploreResidences}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors whitespace-nowrap shrink-0 min-h-[46px] cursor-pointer"
                >
                  <span>Explore 5 Residences</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onScheduleVisit}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#c5a880] text-[#1a1918] rounded-[4px] hover:bg-[#e0c298] transition-colors whitespace-nowrap shrink-0 min-h-[46px] cursor-pointer"
                >
                  Schedule Site Visit
                </button>
              </div>

              {/* Direct Call & WhatsApp Conversion Strip */}
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-[#e8e2d9]">
                <button
                  type="button"
                  onClick={onCallNow}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] border border-[#d1c5b8] bg-[#ffffff] text-[#1a1918] rounded-[4px] hover:border-[#725b38] hover:bg-[#f5f3f0] transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#725b38]" />
                  <span>Call Now</span>
                </button>

                <button
                  type="button"
                  onClick={onWhatsApp}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] border border-[#d1c5b8] bg-[#ffffff] text-[#1a1918] rounded-[4px] hover:border-[#725b38] hover:bg-[#f5f3f0] transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#725b38]" />
                  <span>WhatsApp Enquiry</span>
                </button>

                <span className="inline-flex items-center gap-1.5 text-xs text-[#605e5c] pl-1">
                  <MapPin className="w-3.5 h-3.5 text-[#725b38]" />
                  <span>Plus Code: {config.address.plusCode}</span>
                </span>
              </div>
            </div>

            {/* Residence & Building Brief to balance vertical cadence with facade photo */}
            <div className="mt-8 bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e8e2d9]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38]">
                  At-a-Glance Residence Brief
                </p>
                <p className="text-xs text-[#4d463c]">
                  Direct Owner Leasing · Zero Brokerage
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="font-editorial text-xl text-[#1a1918]">
                    2 BHK Semi-Furnished
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#725b38] mt-0.5">
                    Ground · Second · Third Floor
                  </p>
                  <p className="text-xs leading-[1.65] text-[#4d463c] mt-2">
                    Bedroom &amp; kitchen wardrobes, recessed false ceiling, two bathrooms
                    (attached Western + common Indian), granite &amp; fresh paint.
                  </p>
                </div>

                <div>
                  <p className="font-editorial text-xl text-[#1a1918]">
                    Luxury 1 BHK
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#725b38] mt-0.5">
                    Second · Third Floor
                  </p>
                  <p className="text-xs leading-[1.65] text-[#4d463c] mt-2">
                    Dual open balconies (living area + separate bedroom balcony), dedicated
                    kitchen, utility area, and attached Western bathroom.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e8e2d9] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#4d463c]">
                <div>
                  <span className="block font-semibold text-[#1a1918]">Parking &amp; Water</span>
                  <span>Covered car bay &amp; 24/7 supply</span>
                </div>
                <div>
                  <span className="block font-semibold text-[#1a1918]">Neighbourhood</span>
                  <span>Quiet lane beside defence land</span>
                </div>
                <div>
                  <span className="block font-semibold text-[#1a1918]">Building Profile</span>
                  <span>1st Floor is Owner&apos;s Residence</span>
                </div>
              </div>
            </div>

            {/* Subtle heritage dedication */}
            <p className="mt-6 text-xs tracking-[0.04em] text-[#605e5c]">
              AJ GRAND — Crafted in honor of {config.brandMeaning} · Private boutique leasing with zero brokerage
            </p>
          </div>

          {/* Architectural Facade Photograph Column (Actual Uploaded Building Photo) */}
          <div className="lg:col-span-5 flex">
            <div className="w-full bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-3 shadow-warm-ambient flex flex-col">
              <div className="relative w-full aspect-[3/4] lg:aspect-auto lg:flex-1 min-h-[380px] lg:min-h-[500px] overflow-hidden rounded-[4px] bg-[#eae8e5]">
                <ResilientImage
                  src={BUILDING_EXTERIOR_IMAGE.url}
                  alt={BUILDING_EXTERIOR_IMAGE.alt}
                  fallbackTitle="AJ GRAND Facade"
                  lazy={false}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1a1918]/80 via-[#1a1918]/35 to-transparent p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#e0c298]">
                    Newly Constructed G+3 Elevation
                  </p>
                  <p className="font-editorial text-lg text-[#fbf9f6] mt-0.5">
                    34, Garden Main Road, Modi Garden
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Architectural Highlights Strip */}
        <div className="mt-10 md:mt-14 grid grid-cols-2 lg:grid-cols-4 border border-[#e8e2d9] bg-[#f5f3f0] rounded-[4px] divide-y lg:divide-y-0 lg:divide-x divide-[#e8e2d9]">
          <div className="p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38]">
              Available Collection
            </p>
            <p className="font-editorial text-2xl text-[#1a1918] mt-1 tabular-nums">
              5 Private Homes
            </p>
            <p className="text-xs text-[#605e5c] mt-1">
              Three 2 BHK &amp; two Luxury 1 BHK units
            </p>
          </div>

          <div className="p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38]">
              Residency Standard
            </p>
            <p className="font-editorial text-2xl text-[#1a1918] mt-1">
              First Occupancy
            </p>
            <p className="text-xs text-[#605e5c] mt-1">
              Brand-new interiors with fresh painting
            </p>
          </div>

          <div className="p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38]">
              Material Craft
            </p>
            <p className="font-editorial text-2xl text-[#1a1918] mt-1">
              Granite &amp; Joinery
            </p>
            <p className="text-xs text-[#605e5c] mt-1">
              Fitted wardrobes, niche storage &amp; false ceilings
            </p>
          </div>

          <div className="p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38]">
              Location Calm
            </p>
            <p className="font-editorial text-2xl text-[#1a1918] mt-1">
              Beside Defence Land
            </p>
            <p className="text-xs text-[#605e5c] mt-1">
              Covered car parking &amp; 24/7 water supply
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
