import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

type ResidentFilter = 'All' | '2 BHK' | 'Luxury 1 BHK';

interface ResidentTestimonial {
  id: string;
  name: string;
  role: string;
  unitLabel: string;
  unitType: Exclude<ResidentFilter, 'All'>;
  headline: string;
  quote: string;
  highlight: string;
}

const RESIDENT_TESTIMONIALS: ResidentTestimonial[] = [
  {
    id: 'res-arjun-meera',
    name: 'Arjun & Meera Kulkarni',
    role: 'Engineering Lead & Product Designer',
    unitLabel: 'Second Floor · 2 BHK (600 sq.ft.)',
    unitType: '2 BHK',
    headline: 'Bright cross-ventilation and zero brokerage hassle',
    quote:
      'Finding a freshly constructed home in Kaval Bairasandra directly from the owners saved us a full month of brokerage. The L-shape windows bring in steady morning light, and having covered ground-floor parking right below made our move-in effortless.',
    highlight: 'Direct Owner Lease · Covered Parking',
  },
  {
    id: 'res-sana-fathima',
    name: 'Dr. Sana Fathima',
    role: 'Dental Consultant',
    unitLabel: 'Third Floor · Luxury 1 BHK (450 sq.ft.)',
    unitType: 'Luxury 1 BHK',
    headline: 'Two open balconies on a remarkably quiet lane',
    quote:
      'Having separate balconies off both the living area and bedroom gives the 1 BHK an airy feel you rarely get in Bengaluru. Because the lane sits beside green defence land, evenings on the third floor are peaceful even though RT Nagar and Hebbal are minutes away.',
    highlight: 'Dual Open Balconies · Quiet Lane',
  },
  {
    id: 'res-karthik-nair',
    name: 'Karthik & Divya Nair',
    role: 'Operations Manager & Educator',
    unitLabel: 'Ground Floor · 2 BHK (600 sq.ft.)',
    unitType: '2 BHK',
    headline: 'Reliable water supply and practical storage throughout',
    quote:
      'Water security was our top priority when relocating. Between the on-site well, borewell, and Cauvery line, pressure has never dipped once. The fitted wardrobes, granite kitchen counter, and dedicated corridor shoe rack keep daily living very organized.',
    highlight: '3-Source 24/7 Water · Fitted Wardrobes',
  },
  {
    id: 'res-rohan-deshmukh',
    name: 'Rohan Deshmukh',
    role: 'Senior Data Analyst, Manyata Tech Park',
    unitLabel: 'Second Floor · Luxury 1 BHK (450 sq.ft.)',
    unitType: 'Luxury 1 BHK',
    headline: 'Easy commute to Manyata with thoughtful kitchen layout',
    quote:
      'My daily commute to Manyata Tech Park via Nagawara takes under 20 minutes. The 19-foot kitchen counter with a separate utility balcony makes cooking practical, and CCTV coverage across the entrance gave my family immediate peace of mind.',
    highlight: '19 × 6 ft Kitchen · CCTV Security',
  },
  {
    id: 'res-prakash-lakshmi',
    name: 'Prakash & Lakshmi Rao',
    role: 'Chartered Accountant Family',
    unitLabel: 'Third Floor · 2 BHK (600 sq.ft.)',
    unitType: '2 BHK',
    headline: 'Well-kept common areas and attentive owner management',
    quote:
      'Because the owners live on the First Floor, every small detail—from corridor cleanliness to the rooftop Terrace Garden and rainwater harvesting upkeep—is handled promptly and respectfully. Everything feels built for long-term comfort.',
    highlight: 'Owner-Managed Building · Terrace Garden',
  },
  {
    id: 'res-ananya-bose',
    name: 'Ananya Bose',
    role: 'UX Researcher',
    unitLabel: 'Third Floor · Luxury 1 BHK (450 sq.ft.)',
    unitType: 'Luxury 1 BHK',
    headline: 'Fresh first-occupancy finishes and clean ventilation',
    quote:
      'Stepping into a brand-new, freshly painted apartment with large windows and zero dampness made all the difference. From booking the site visit online to signing the transparent rental agreement, the entire process was straightforward.',
    highlight: 'First Occupancy · Transparent Terms',
  },
];

export const TestimonialsSection: React.FC = () => {
  const [filter, setFilter] = useState<ResidentFilter>('All');
  const [startIndex, setStartIndex] = useState(0);

  const filteredItems = useMemo(() => {
    if (filter === 'All') return RESIDENT_TESTIMONIALS;
    return RESIDENT_TESTIMONIALS.filter((item) => item.unitType === filter);
  }, [filter]);

  const cardsPerPage = Math.min(3, filteredItems.length);
  const maxStart = Math.max(0, filteredItems.length - cardsPerPage);
  const safeStart = Math.min(startIndex, maxStart);

  const visibleCards = useMemo(() => {
    return filteredItems.slice(safeStart, safeStart + cardsPerPage);
  }, [filteredItems, safeStart, cardsPerPage]);

  const handleFilterChange = (next: ResidentFilter) => {
    setFilter(next);
    setStartIndex(0);
  };

  const handlePrev = () => {
    if (filteredItems.length <= cardsPerPage) return;
    setStartIndex((prev) => (prev <= 0 ? maxStart : prev - 1));
  };

  const handleNext = () => {
    if (filteredItems.length <= cardsPerPage) return;
    setStartIndex((prev) => (prev >= maxStart ? 0 : prev + 1));
  };

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="py-16 md:py-24 bg-[#ffffff] border-b border-[#e8e2d9]"
    >
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        {/* Section Header + Filter & Carousel Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 md:mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
              Resident Feedback
            </p>
            <h2
              id="testimonials-heading"
              className="font-editorial text-3xl md:text-[2.5rem] leading-[1.15] tracking-[-0.015em] text-[#1a1918] text-balance"
            >
              Trusted by Residents Choosing Calm Living
            </h2>
            <p className="text-sm md:text-base text-[#4d463c] mt-3 leading-[1.7]">
              Firsthand impressions from families and working professionals across our 2 BHK and
              Luxury 1 BHK residences at AJ GRAND, Modi Garden.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
            {/* Unit Type Filter */}
            <div
              role="group"
              aria-label="Filter resident feedback by apartment type"
              className="inline-flex items-center gap-1 p-1 bg-[#f5f3f0] border border-[#e8e2d9] rounded-[4px]"
            >
              {(['All', '2 BHK', 'Luxury 1 BHK'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleFilterChange(option)}
                  className={`px-3.5 py-2 text-xs font-semibold tracking-[0.04em] rounded-[3px] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                    filter === option
                      ? 'bg-[#1a1918] text-[#fbf9f6]'
                      : 'text-[#4d463c] hover:text-[#1a1918]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Carousel Controls */}
            {filteredItems.length > cardsPerPage && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#605e5c] tabular-nums mr-1">
                  {String(safeStart + 1).padStart(2, '0')}–
                  {String(safeStart + visibleCards.length).padStart(2, '0')} /{' '}
                  {String(filteredItems.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous resident testimonials"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] border border-[#d1c5b8] bg-[#fbf9f6] text-[#1a1918] hover:border-[#725b38] hover:bg-[#f4efea] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next resident testimonials"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] border border-[#d1c5b8] bg-[#fbf9f6] text-[#1a1918] hover:border-[#725b38] hover:bg-[#f4efea] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Responsive 3-Card Grid / Carousel Viewport */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCards.map((item, idx) => (
            <article
              key={item.id}
              className={`bg-[#fbf9f6] border border-[#e8e2d9] rounded-[6px] p-6 md:p-7 flex flex-col justify-between transition-colors hover:border-[#c5a880] ${
                idx === 2 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div
                    className="flex items-center gap-0.5 text-[#725b38]"
                    aria-label="5 out of 5 rating"
                  >
                    {[0, 1, 2, 3, 4].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className="w-3.5 h-3.5 fill-[#c5a880] text-[#c5a880]"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-[#d1c5b8] shrink-0" aria-hidden="true" />
                </div>

                <h3 className="font-editorial text-xl md:text-[1.35rem] leading-[1.3] text-[#1a1918] mb-3">
                  {item.headline}
                </h3>

                <p className="text-sm text-[#4d463c] leading-[1.7]">{item.quote}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#e8e2d9] space-y-1.5">
                <p className="text-sm font-semibold text-[#1a1918]">{item.name}</p>
                <p className="text-xs text-[#605e5c]">
                  {item.role}
                  <span aria-hidden="true"> · </span>
                  <span className="text-[#725b38] font-medium">{item.unitLabel}</span>
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#725b38]">
                  {item.highlight}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Slide Position Indicators */}
        {filteredItems.length > cardsPerPage && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: maxStart + 1 }).map((_, idx) => {
              const isCurrent = idx === safeStart;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStartIndex(idx)}
                  aria-label={`Show testimonial set ${idx + 1}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    isCurrent ? 'w-7 bg-[#1a1918]' : 'w-2 bg-[#d1c5b8] hover:bg-[#725b38]'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
