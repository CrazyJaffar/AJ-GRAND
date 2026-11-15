import React, { useMemo, useState } from 'react';
import { ArrowUpRight, MessageCircle, Calendar } from 'lucide-react';
import { Property } from '../data/properties';
import { ResilientImage } from './ResilientImage';

interface PropertyListingsSectionProps {
  properties: Property[];
  onViewDetails: (property: Property) => void;
  onWhatsAppProperty: (property: Property) => void;
  onScheduleVisitProperty: (property: Property) => void;
}

type BhkFilter = 'ALL' | '2 BHK' | '1 BHK';
type FloorFilter = 'ALL' | 'Ground Floor' | 'Second Floor' | 'Third Floor';

export const PropertyListingsSection: React.FC<PropertyListingsSectionProps> = ({
  properties,
  onViewDetails,
  onWhatsAppProperty,
  onScheduleVisitProperty,
}) => {
  const [bhkFilter, setBhkFilter] = useState<BhkFilter>('ALL');
  const [floorFilter, setFloorFilter] = useState<FloorFilter>('ALL');

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Safeguard: First floor can never be rendered in listings
      if (p.floorNumber !== 0 && p.floorNumber !== 2 && p.floorNumber !== 3) {
        return false;
      }
      if (bhkFilter !== 'ALL' && p.bhkFilterKey !== bhkFilter) {
        return false;
      }
      if (floorFilter !== 'ALL' && p.floorLabel !== floorFilter) {
        return false;
      }
      return true;
    });
  }, [properties, bhkFilter, floorFilter]);

  return (
    <section id="residences" className="py-16 md:py-24 bg-[#fbf9f6] border-b border-[#e8e2d9]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        {/* Section Header + Interactive Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
              Curated Rental Portfolio
            </p>
            <h2 className="font-editorial text-3xl md:text-[2.75rem] leading-[1.15] tracking-[-0.015em] text-[#1a1918]">
              Five Newly Completed Residences
            </h2>
            <p className="text-sm md:text-base text-[#4d463c] mt-3 max-w-2xl">
              Select a residence to inspect interior finishes, bathroom and balcony layouts, and
              book an in-person viewing directly with the building owner.
            </p>
          </div>

          {/* Functional Segmented Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              role="group"
              aria-label="Filter by apartment configuration"
              className="inline-flex items-center gap-1 p-1 bg-[#f5f3f0] border border-[#e8e2d9] rounded-[4px]"
            >
              {(
                [
                  { id: 'ALL', label: 'All Units (5)' },
                  { id: '2 BHK', label: '2 BHK (3)' },
                  { id: '1 BHK', label: 'Luxury 1 BHK (2)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBhkFilter(tab.id)}
                  className={`px-3.5 py-2 text-xs font-semibold tracking-[0.04em] rounded-[3px] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                    bhkFilter === tab.id
                      ? 'bg-[#1a1918] text-[#fbf9f6]'
                      : 'text-[#4d463c] hover:text-[#1a1918]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              role="group"
              aria-label="Filter by floor"
              className="inline-flex items-center gap-1 p-1 bg-[#f5f3f0] border border-[#e8e2d9] rounded-[4px] overflow-x-auto"
            >
              {(
                [
                  { id: 'ALL', label: 'All Floors' },
                  { id: 'Ground Floor', label: 'Ground' },
                  { id: 'Second Floor', label: 'Second' },
                  { id: 'Third Floor', label: 'Third' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFloorFilter(tab.id)}
                  className={`px-3 py-2 text-xs font-semibold tracking-[0.04em] rounded-[3px] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                    floorFilter === tab.id
                      ? 'bg-[#c5a880] text-[#1a1918]'
                      : 'text-[#4d463c] hover:text-[#1a1918]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Property Grid */}
        {filteredProperties.length === 0 ? (
          <div className="bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-10 text-center">
            <p className="font-editorial text-2xl text-[#1a1918]">
              No residences match this filter combination.
            </p>
            <p className="text-sm text-[#605e5c] mt-2">
              Ground Floor offers a 2 BHK unit, while Second and Third Floors offer both 2 BHK and
              Luxury 1 BHK residences.
            </p>
            <button
              type="button"
              onClick={() => {
                setBhkFilter('ALL');
                setFloorFilter('ALL');
              }}
              className="mt-5 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[4px] cursor-pointer"
            >
              Show All 5 Residences
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-8">
            {filteredProperties.map((property) => {
              const primaryImage = property.images[0];
              return (
                <article
                  key={property.id}
                  className="group bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] overflow-hidden shadow-warm-ambient hover:shadow-warm-hover transition-all duration-200 hover:-translate-y-1 flex flex-col"
                >
                  {/* 4:3 Architectural Image Frame */}
                  <button
                    type="button"
                    onClick={() => onViewDetails(property)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-[#eae8e5] text-left cursor-pointer block"
                    aria-label={`View details for ${property.name}`}
                  >
                    <ResilientImage
                      src={primaryImage?.url || ''}
                      alt={primaryImage?.alt || property.name}
                      fallbackTitle={property.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  {/* Card Body */}
                  <div className="p-6 md:p-7 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#725b38] mb-2">
                        <span>{property.floorLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{property.bhkConfiguration}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {Math.round(property.totalSqFt)} sq.ft.
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{property.availabilityStatus}</span>
                      </div>

                      <h3 className="font-editorial text-2xl leading-[1.2] text-[#1a1918] mb-3">
                        <button
                          type="button"
                          onClick={() => onViewDetails(property)}
                          className="text-left hover:text-[#725b38] transition-colors cursor-pointer"
                        >
                          {property.name}
                        </button>
                      </h3>

                      <p className="text-sm leading-[1.65] text-[#4d463c] line-clamp-3 mb-5">
                        {property.description}
                      </p>

                      {/* Key Architectural Specs */}
                      <dl className="border-t border-[#e8e2d9] pt-4 space-y-2 text-xs text-[#4d463c]">
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#605e5c]">Total Area</dt>
                          <dd className="font-medium text-[#1a1918] text-right tabular-nums">
                            {property.dimensions || `${property.totalSqFt} sq.ft.`}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#605e5c]">Bathrooms</dt>
                          <dd className="font-medium text-[#1a1918] text-right">
                            {property.bhkConfiguration === '2 BHK'
                              ? '2 Baths (1 Western, 1 Indian)'
                              : '1 Attached Western Bath'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#605e5c]">Occupancy</dt>
                          <dd className="font-medium text-[#1a1918] text-right">
                            First Occupancy · Fresh Painting
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#605e5c]">
                            {property.bhkConfiguration === '2 BHK' ? 'Furnishing' : 'Balconies'}
                          </dt>
                          <dd className="font-medium text-[#1a1918] text-right">
                            {property.bhkConfiguration === '2 BHK'
                              ? 'Semi-Furnished & Wardrobes'
                              : '2 Open Balconies (Living + Bedroom)'}
                          </dd>
                        </div>

                        {/* Configurable Rent / Deposit — hidden until updated by owner */}
                        {property.rentAmount && (
                          <div className="flex justify-between gap-4 pt-2 border-t border-[#e8e2d9]/70">
                            <dt className="text-[#605e5c]">Monthly Rent</dt>
                            <dd className="font-editorial text-lg text-[#1a1918] tabular-nums">
                              {property.rentAmount}
                            </dd>
                          </div>
                        )}
                        {property.securityDeposit && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-[#605e5c]">Security Deposit</dt>
                            <dd className="font-medium text-[#1a1918] tabular-nums">
                              {property.securityDeposit}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Card Action Footer */}
                    <div className="mt-6 pt-5 border-t border-[#e8e2d9] flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => onViewDetails(property)}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors cursor-pointer min-h-[44px]"
                      >
                        <span>View Details</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => onWhatsAppProperty(property)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#1a1918] bg-[#ffffff] border border-[#e8e2d9] rounded-[4px] hover:border-[#c5a880] hover:bg-[#f5f3f0] transition-colors whitespace-nowrap cursor-pointer min-h-[42px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#725b38]" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onScheduleVisitProperty(property)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#1a1918] bg-[#ffffff] border border-[#e8e2d9] rounded-[4px] hover:border-[#c5a880] hover:bg-[#f5f3f0] transition-colors whitespace-nowrap cursor-pointer min-h-[42px]"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#725b38]" />
                          <span>Book Visit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
