import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Calendar,
  Check,
  MapPin,
} from 'lucide-react';
import { COMMON_BUILDING_AMENITIES, Property } from '../data/properties';
import { SiteConfig } from '../config/siteConfig';
import { ResilientImage } from './ResilientImage';

interface PropertyDetailViewProps {
  property: Property;
  allProperties: Property[];
  config: SiteConfig;
  onBackToListing: () => void;
  onSelectOtherProperty: (property: Property) => void;
  onCallNow: (property: Property) => void;
  onWhatsApp: (property: Property) => void;
  onScheduleVisit: (property: Property) => void;
}

export const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({
  property,
  allProperties,
  config,
  onBackToListing,
  onSelectOtherProperty,
  onCallNow,
  onWhatsApp,
  onScheduleVisit,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = property.images[activeImageIndex] || property.images[0];

  const otherResidences = allProperties.filter((p) => p.id !== property.id);

  return (
    <div className="bg-[#fbf9f6] min-h-screen">
      {/* Breadcrumb & Back Navigation */}
      <div className="border-b border-[#e8e2d9] bg-[#f5f3f0]">
        <div className="max-w-[1320px] mx-auto px-5 md:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToListing}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#1a1918] hover:text-[#725b38] transition-colors cursor-pointer min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All 5 Residences</span>
          </button>

          <div className="text-xs text-[#605e5c] flex items-center gap-2">
            <span>{property.floorLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{property.bhkConfiguration}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#725b38]">{property.availabilityStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Detail Grid */}
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: Gallery & Architectural Specifications */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-3 shadow-warm-ambient">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[4px] bg-[#eae8e5]">
                <ResilientImage
                  src={activeImage?.url || ''}
                  alt={activeImage?.alt || property.name}
                  fallbackTitle={property.name}
                  lazy={false}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 px-1 text-xs text-[#605e5c]">
                <span>{activeImage?.caption}</span>
                <span className="tabular-nums">
                  {activeImageIndex + 1} / {property.images.length}
                </span>
              </div>

              {/* Thumbnail Strip */}
              <div className="mt-3 grid grid-cols-4 gap-2.5">
                {property.images.map((img, idx) => (
                  <button
                    key={`${property.id}-img-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}: ${img.caption}`}
                    className={`aspect-[4/3] overflow-hidden rounded-[4px] border-2 transition-all cursor-pointer ${
                      idx === activeImageIndex
                        ? 'border-[#725b38] opacity-100'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <ResilientImage
                      src={img.url}
                      alt={img.alt}
                      fallbackTitle={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Residence Story & Detailed Specification */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-2">
                  Residence Overview
                </p>
                <h1 className="font-editorial text-3xl md:text-5xl leading-[1.12] text-[#1a1918] mb-4">
                  {property.name}
                </h1>
                <p className="text-base leading-[1.75] text-[#4d463c]">
                  {property.description}
                </p>
              </div>

              {/* Architectural Specifications Grid */}
              <div className="bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-6 md:p-8">
                <h2 className="font-editorial text-2xl text-[#1a1918] mb-5">
                  Architectural &amp; Layout Specifications
                </h2>
                <dl className="divide-y divide-[#e8e2d9] text-sm">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="text-[#605e5c]">Floor Level</dt>
                    <dd className="font-medium text-[#1a1918]">{property.floorLabel}</dd>
                  </div>
                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="text-[#605e5c]">Configuration</dt>
                    <dd className="font-medium text-[#1a1918]">{property.bhkConfiguration}</dd>
                  </div>
                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="text-[#605e5c]">Furnishing</dt>
                    <dd className="font-medium text-[#1a1918] sm:text-right max-w-md">
                      {property.furnishing}
                    </dd>
                  </div>
                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="text-[#605e5c]">Bathroom Configuration</dt>
                    <dd className="font-medium text-[#1a1918] sm:text-right">
                      {property.bathroomConfiguration.join(' · ')}
                    </dd>
                  </div>
                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="text-[#605e5c]">Balcony &amp; Ventilation</dt>
                    <dd className="font-medium text-[#1a1918] sm:text-right max-w-md">
                      {property.balconyInformation}
                    </dd>
                  </div>
                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="text-[#605e5c]">Finishes &amp; Occupancy</dt>
                    <dd className="font-medium text-[#1a1918] sm:text-right">
                      {property.finishes.join(' · ')}
                    </dd>
                  </div>
                  {property.dimensions && (
                    <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                      <dt className="text-[#605e5c]">Total Area</dt>
                      <dd className="font-medium text-[#1a1918] tabular-nums">
                        {property.dimensions}
                      </dd>
                    </div>
                  )}
                  {property.availabilityDate && (
                    <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                      <dt className="text-[#605e5c]">Available From</dt>
                      <dd className="font-medium text-[#1a1918] tabular-nums">
                        {property.availabilityDate}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Room-by-Room Dimensions & Area Schedule */}
              <div className="bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] p-6 md:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
                  <h2 className="font-editorial text-2xl text-[#1a1918]">
                    Room-by-Room Dimensions &amp; Area Schedule
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.09em] text-[#725b38] tabular-nums">
                    Total: {property.totalSqFt} sq.ft.
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#e8e2d9] text-[11px] font-semibold uppercase tracking-[0.09em] text-[#605e5c]">
                        <th className="py-2.5 pr-4">Space</th>
                        <th className="py-2.5 px-4">Dimensions</th>
                        <th className="py-2.5 pl-4 text-right">Area (sq.ft.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8e2d9]">
                      {property.roomMeasurements.map((item) => (
                        <tr key={`${property.id}-${item.room}`}>
                          <td className="py-3 pr-4">
                            <span className="font-medium text-[#1a1918]">{item.room}</span>
                            {item.note && (
                              <span className="block text-xs text-[#605e5c] mt-0.5">
                                {item.note}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#4d463c] tabular-nums whitespace-nowrap">
                            {item.dimensionsFt}
                          </td>
                          <td className="py-3 pl-4 text-right font-medium text-[#1a1918] tabular-nums whitespace-nowrap">
                            {item.areaSqFt} sq.ft.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#d1c5b8] bg-[#f5f3f0]">
                        <td className="py-3 px-2 font-semibold text-[#1a1918]" colSpan={2}>
                          Total Residence Area ({property.bhkConfiguration})
                        </td>
                        <td className="py-3 px-2 text-right font-editorial text-xl text-[#1a1918] tabular-nums whitespace-nowrap">
                          {property.totalSqFt} sq.ft.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Residence Features Checklist */}
              <div>
                <h2 className="font-editorial text-2xl text-[#1a1918] mb-5">
                  Included Residence Features
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.amenities.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 p-4 bg-[#ffffff] border border-[#e8e2d9] rounded-[4px]"
                    >
                      <Check className="w-4 h-4 text-[#725b38] shrink-0 mt-0.5" />
                      <span className="text-sm text-[#1a1918]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Building Privileges */}
              <div className="border-t border-[#e8e2d9] pt-8">
                <h2 className="font-editorial text-2xl text-[#1a1918] mb-4">
                  Shared AJ GRAND Building Amenities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COMMON_BUILDING_AMENITIES.map((amenity) => (
                    <div key={amenity.title} className="text-sm">
                      <p className="font-semibold text-[#1a1918]">{amenity.title}</p>
                      <p className="text-xs text-[#605e5c] mt-0.5">{amenity.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sticky Conversion Card */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            <div className="bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-6 md:p-8 shadow-warm-ambient">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-2">
                {property.availabilityStatus}
              </p>
              <h2 className="font-editorial text-3xl text-[#1a1918] mb-2">
                {property.name}
              </h2>
              <p className="text-xs text-[#605e5c] flex items-start gap-1.5 mb-6">
                <MapPin className="w-3.5 h-3.5 text-[#725b38] shrink-0 mt-0.5" />
                <span>{config.address.fullAddress}</span>
              </p>

              {/* Rent & Deposit (displayed only when configured by owner) */}
              {(property.rentAmount || property.securityDeposit) && (
                <div className="mb-6 p-4 bg-[#ffffff] border border-[#e8e2d9] rounded-[4px] space-y-2">
                  {property.rentAmount && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs uppercase tracking-[0.08em] text-[#605e5c]">
                        Monthly Rent
                      </span>
                      <span className="font-editorial text-2xl text-[#1a1918] tabular-nums">
                        {property.rentAmount}
                      </span>
                    </div>
                  )}
                  {property.securityDeposit && (
                    <div className="flex items-baseline justify-between pt-2 border-t border-[#e8e2d9]">
                      <span className="text-xs uppercase tracking-[0.08em] text-[#605e5c]">
                        Security Deposit
                      </span>
                      <span className="text-sm font-semibold text-[#1a1918] tabular-nums">
                        {property.securityDeposit}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onCallNow(property)}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors min-h-[48px] cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => onWhatsApp(property)}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#c5a880] text-[#1a1918] rounded-[4px] hover:bg-[#e0c298] transition-colors min-h-[48px] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Enquiry</span>
                </button>

                <button
                  type="button"
                  onClick={() => onScheduleVisit(property)}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#ffffff] text-[#1a1918] border border-[#d1c5b8] rounded-[4px] hover:border-[#725b38] transition-colors min-h-[48px] cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#725b38]" />
                  <span>Schedule Site Visit</span>
                </button>
              </div>

              <p className="mt-5 text-xs text-[#605e5c] leading-[1.6]">
                Direct owner leasing · No brokerage charges · First-occupancy newly constructed home.
              </p>
            </div>

            {/* Other Residences Switcher */}
            <div className="bg-[#fbf9f6] border border-[#e8e2d9] rounded-[6px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#725b38] mb-4">
                Other Available Residences
              </p>
              <div className="divide-y divide-[#e8e2d9]">
                {otherResidences.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(0);
                      onSelectOtherProperty(unit);
                    }}
                    className="w-full py-3 text-left flex items-center justify-between gap-3 hover:text-[#725b38] transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-editorial text-lg text-[#1a1918]">{unit.name}</p>
                      <p className="text-xs text-[#605e5c]">{unit.availabilityStatus}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#725b38]">
                      Inspect
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
