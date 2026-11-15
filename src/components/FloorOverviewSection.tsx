import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { BUILDING_FLOORS, Property } from '../data/properties';

interface FloorOverviewSectionProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export const FloorOverviewSection: React.FC<FloorOverviewSectionProps> = ({
  properties,
  onSelectProperty,
}) => {
  return (
    <section id="floors" className="py-16 md:py-24 bg-[#f5f3f0] border-b border-[#e8e2d9]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        <div className="max-w-2xl mb-10 md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
            Architectural Elevation
          </p>
          <h2 className="font-editorial text-3xl md:text-[2.75rem] leading-[1.15] tracking-[-0.015em] text-[#1a1918]">
            Floor-by-Floor Building Overview
          </h2>
          <p className="text-sm md:text-base text-[#4d463c] mt-3">
            AJ GRAND is thoughtfully composed across four levels (G+3), maintaining a quiet,
            owner-occupied atmosphere with five private homes available for rent.
          </p>
        </div>

        <div className="space-y-4">
          {BUILDING_FLOORS.map((floor) => {
            const floorUnits = floor.unitIds
              .map((id) => properties.find((p) => p.id === id))
              .filter((p): p is Property => Boolean(p));

            return (
              <div
                key={floor.floorNumber}
                className={`border rounded-[6px] p-6 md:p-8 transition-colors ${
                  floor.isOwnerResidence
                    ? 'bg-[#eae8e5]/70 border-[#d1c5b8]'
                    : 'bg-[#fbf9f6] border-[#e8e2d9]'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38]">
                      Level 0{floor.floorNumber}
                    </p>
                    <h3 className="font-editorial text-2xl md:text-3xl text-[#1a1918] mt-1">
                      {floor.floorTitle}
                    </h3>
                    <p className="text-xs md:text-sm text-[#605e5c] mt-1.5">
                      {floor.subtitle}
                    </p>
                  </div>

                  <div className="lg:col-span-8">
                    {floor.isOwnerResidence ? (
                      <div className="flex items-center gap-3 py-4 px-5 border border-[#d1c5b8] bg-[#f5f3f0] rounded-[4px] text-[#4d463c]">
                        <Lock className="w-4 h-4 text-[#725b38] shrink-0" />
                        <p className="text-sm">
                          Private Owner&apos;s Residence — Not available for rent. This ensures
                          attentive building upkeep and peaceful community standards.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {floorUnits.map((unit) => (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => onSelectProperty(unit)}
                            className="group text-left p-5 bg-[#f4efea] border border-[#e8e2d9] rounded-[4px] hover:border-[#c5a880] hover:bg-[#ffffff] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                          >
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#725b38] tabular-nums">
                                {unit.bhkConfiguration} · {Math.round(unit.totalSqFt)} sq.ft. · {unit.availabilityStatus}
                              </p>
                              <p className="font-editorial text-xl text-[#1a1918] mt-1">
                                {unit.name}
                              </p>
                              <p className="text-xs text-[#605e5c] mt-1">
                                {unit.bhkConfiguration === '2 BHK'
                                  ? 'Semi-furnished · 2 Baths · False ceiling'
                                  : '2 Open balconies · Utility · Western bath'}
                              </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-[#725b38] shrink-0 transition-transform group-hover:translate-x-1" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
