import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Check } from 'lucide-react';
import {
  BUILDING_EXTERIOR_IMAGE,
  COMMON_BUILDING_AMENITIES,
  TEMPORARY_INTERIOR_IMAGES,
} from '../data/properties';
import { ResilientImage } from './ResilientImage';

const GALLERY_ITEMS = [
  {
    ...BUILDING_EXTERIOR_IMAGE,
    label: 'Exterior Elevation & Covered Parking',
  },
  {
    ...TEMPORARY_INTERIOR_IMAGES.twoBhkLiving,
    label: '2 BHK Living Room & False Ceiling',
  },
  {
    ...TEMPORARY_INTERIOR_IMAGES.twoBhkBedroom,
    label: '2 BHK Bedroom Wardrobes & Niche Storage',
  },
  {
    ...TEMPORARY_INTERIOR_IMAGES.twoBhkKitchen,
    label: 'Modular Kitchen Storage & Granite Counter',
  },
  {
    ...TEMPORARY_INTERIOR_IMAGES.oneBhkLivingBalcony,
    label: 'Luxury 1 BHK Living & Open Balcony',
  },
  {
    ...TEMPORARY_INTERIOR_IMAGES.oneBhkBedroomBalcony,
    label: 'Luxury 1 BHK Bedroom, Balcony & Western Bath',
  },
];

export const AmenitiesAndGallerySection: React.FC = () => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const activeItem = lightboxIdx !== null ? GALLERY_ITEMS[lightboxIdx] : null;

  const handlePrev = () => {
    setLightboxIdx((prev) =>
      prev === null ? null : (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length
    );
  };

  const handleNext = () => {
    setLightboxIdx((prev) =>
      prev === null ? null : (prev + 1) % GALLERY_ITEMS.length
    );
  };

  return (
    <section id="amenities" className="py-16 md:py-24 bg-[#fbf9f6] border-b border-[#e8e2d9]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        {/* Common Building Amenities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-16 md:mb-24">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
              Building Essentials
            </p>
            <h2 className="font-editorial text-3xl md:text-[2.5rem] leading-[1.15] text-[#1a1918]">
              Thoughtful Amenities Across Every Floor
            </h2>
            <p className="text-sm md:text-base text-[#4d463c] mt-4 leading-[1.7]">
              Every residence at AJ GRAND pairs brand-new first-occupancy finishes with dependable
              everyday infrastructure and the serenity of adjacent green defence land.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {COMMON_BUILDING_AMENITIES.map((amenity, index) => (
              <div
                key={amenity.title}
                className="bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38] tabular-nums">
                    0{index + 1}.
                  </span>
                  <Check className="w-4 h-4 text-[#725b38] shrink-0" />
                </div>
                <h3 className="font-editorial text-xl text-[#1a1918] mb-1.5">
                  {amenity.title}
                </h3>
                <p className="text-sm text-[#4d463c] leading-[1.6]">{amenity.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Curated Architectural & Interior Gallery */}
        <div id="gallery">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
                Visual Archive
              </p>
              <h2 className="font-editorial text-3xl md:text-[2.5rem] leading-[1.15] text-[#1a1918]">
                Exterior &amp; Interior Finishes
              </h2>
            </div>
            <p className="text-xs text-[#605e5c] max-w-md">
              Featuring the completed AJ GRAND facade alongside representative interior views of our
              2 BHK and Luxury 1 BHK layouts. Tap any frame to enlarge.
            </p>
          </div>

          {/* Horizontal swipe rail on mobile, balanced architectural grid on desktop */}
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory">
            {GALLERY_ITEMS.map((item, idx) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className="group min-w-[78vw] sm:min-w-[48vw] md:min-w-0 snap-start text-left bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] overflow-hidden shadow-warm-ambient hover:shadow-warm-hover transition-all cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#eae8e5]">
                  <ResilientImage
                    src={item.url}
                    alt={item.alt}
                    fallbackTitle={item.label}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-3 right-3 w-8 h-8 rounded-[4px] bg-[#1a1918]/75 text-[#fbf9f6] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="px-4 py-3.5 border-t border-[#e8e2d9]">
                  <p className="text-xs font-semibold text-[#1a1918]">{item.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.label}
          className="fixed inset-0 z-50 bg-[#1a1918]/92 flex items-center justify-center p-4 md:p-8"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#fbf9f6] border border-[#e8e2d9] rounded-[6px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e8e2d9]">
              <p className="font-editorial text-xl text-[#1a1918]">{activeItem.label}</p>
              <button
                type="button"
                aria-label="Close gallery preview"
                onClick={() => setLightboxIdx(null)}
                className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] border border-[#e8e2d9] text-[#1a1918] hover:bg-[#f5f3f0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-[4/3] max-h-[70vh] w-full bg-[#1a1918]">
              <ResilientImage
                src={activeItem.url}
                alt={activeItem.alt}
                fallbackTitle={activeItem.label}
                lazy={false}
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                aria-label="Previous image"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-[4px] bg-[#fbf9f6]/90 text-[#1a1918] flex items-center justify-center hover:bg-[#c5a880] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-[4px] bg-[#fbf9f6]/90 text-[#1a1918] flex items-center justify-center hover:bg-[#c5a880] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3 bg-[#f5f3f0] text-xs text-[#4d463c] flex items-center justify-between">
              <span>{activeItem.caption}</span>
              <span className="tabular-nums font-semibold">
                {(lightboxIdx ?? 0) + 1} / {GALLERY_ITEMS.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
