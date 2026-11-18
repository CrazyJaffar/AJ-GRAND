import React, { useMemo, useState } from 'react';
import { ChevronDown, Calendar, MessageCircle } from 'lucide-react';

type FaqCategory = 'All' | 'Rental Terms' | 'Move-In Process' | 'Building Rules';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'All'>;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'zero-brokerage',
    category: 'Rental Terms',
    question: 'Are there any brokerage or middleman fees?',
    answer:
      'No. AJ GRAND is leased directly by the building owners with zero brokerage charges. All viewings, terms, and rental agreements are handled transparently in person.',
  },
  {
    id: 'rent-deposit-terms',
    category: 'Rental Terms',
    question: 'How are monthly rent, security deposit, and lease duration finalized?',
    answer:
      'Monthly rent, refundable security deposit, and standard residential lease terms are shared directly during your visit or phone/WhatsApp enquiry based on the specific floor and unit you choose, and documented clearly in a formal rental agreement.',
  },
  {
    id: 'available-floors-units',
    category: 'Rental Terms',
    question: 'Which floors and apartment configurations are available for rent?',
    answer:
      'Five newly completed residences are offered for rent: Ground Floor (2 BHK · 600 sq.ft.), Second Floor (2 BHK · 600 sq.ft. and Luxury 1 BHK · 450 sq.ft.), and Third Floor (2 BHK · 600 sq.ft. and Luxury 1 BHK · 450 sq.ft.). The First Floor is the owner’s private residence and is never listed for rent.',
  },
  {
    id: 'unit-inclusions',
    category: 'Rental Terms',
    question: 'What furnishings and fixtures are included in 2 BHK and Luxury 1 BHK homes?',
    answer:
      'All 2 BHK units are semi-furnished with bedroom wardrobes, kitchen storage, false ceilings, two bathrooms (attached Western + common Indian), utility space, and large L-shape/bay windows. Luxury 1 BHK units feature dual open balconies (living room and bedroom), a 19 × 6 ft kitchen, utility area, and an attached Western bathroom. Every residence also receives a dedicated aluminum shoe rack.',
  },
  {
    id: 'visit-and-booking',
    category: 'Move-In Process',
    question: 'What is the step-by-step process to inspect and move into a residence?',
    answer:
      'Schedule a private viewing via our enquiry form, Call Now, or WhatsApp. After touring your preferred floor and unit, confirm your move-in date directly with the owner, complete KYC verification and the rental agreement, and receive keys for first-occupancy move-in.',
  },
  {
    id: 'kyc-documents',
    category: 'Move-In Process',
    question: 'What documentation is required before key handover?',
    answer:
      'Standard tenant KYC verification—government-issued photo identification (such as Aadhaar or Passport) and basic employment or family verification details—is required for all adult occupants when signing the residential rental agreement.',
  },
  {
    id: 'first-occupancy-readiness',
    category: 'Move-In Process',
    question: 'Are the residences brand new and move-in ready?',
    answer:
      'Yes. Every home at AJ GRAND is first-occupancy, freshly painted with new granite countertops, ceramic tiles, recessed bedroom niche storage, and newly tested electrical and plumbing fixtures.',
  },
  {
    id: 'water-and-security',
    category: 'Building Rules',
    question: 'How are water supply, power eco-systems, and security managed?',
    answer:
      'AJ GRAND maintains triple-source 24/7 water availability (an on-site private water well preventing shortages, borewell water, and Cauvery supply), solar infrastructure, rainwater harvesting, and continuous CCTV surveillance across the entrance, parking bays, and common areas.',
  },
  {
    id: 'parking-waste-corridors',
    category: 'Building Rules',
    question: 'What building rules apply to parking, corridors, and shared amenities?',
    answer:
      'Covered ground-level parking is allocated within the gated compound. To keep common corridors tidy, footwear should be stored in each residence’s dedicated aluminum shoe rack. Residents are also asked to follow waste segregation (supporting our on-site sewage treatment system), keep the rooftop Terrace Garden clean, and maintain quiet residential hours.',
  },
  {
    id: 'owner-occupied-benefits',
    category: 'Building Rules',
    question: 'Who maintains the building and resolves day-to-day maintenance requests?',
    answer:
      'Because the building owners reside privately on the First Floor, common-area cleanliness, water systems, security, and any maintenance needs are addressed promptly in a calm, respectful community beside green defence land.',
  },
];

interface FaqSectionProps {
  onScheduleVisit: () => void;
  onWhatsApp: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  onScheduleVisit,
  onWhatsApp,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('All');
  const [openId, setOpenId] = useState<string>(FAQ_ITEMS[0].id);

  const visibleItems = useMemo(() => {
    if (selectedCategory === 'All') return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const handleCategoryChange = (cat: FaqCategory) => {
    setSelectedCategory(cat);
    const firstMatch =
      cat === 'All' ? FAQ_ITEMS[0] : FAQ_ITEMS.find((item) => item.category === cat);
    if (firstMatch) {
      setOpenId(firstMatch.id);
    }
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#f5f3f0] border-b border-[#e8e2d9]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Editorial Intro & Direct Decision CTAs */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
              Tenant Guide
            </p>
            <h2 className="font-editorial text-3xl md:text-[2.5rem] leading-[1.15] tracking-[-0.015em] text-[#1a1918]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm md:text-base text-[#4d463c] mt-4 leading-[1.7]">
              Clear answers on direct owner leasing, move-in readiness, and community standards so
              you can decide and schedule your viewing with confidence.
            </p>

            <div className="mt-7 bg-[#fbf9f6] border border-[#e8e2d9] rounded-[6px] p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#725b38]">
                Have a Specific Question?
              </p>
              <p className="text-xs text-[#4d463c] leading-[1.6]">
                Speak directly with the AJ GRAND management to confirm unit availability or book an
                in-person walkthrough.
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onScheduleVisit}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors min-h-[44px] cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Site Visit</span>
                </button>
                <button
                  type="button"
                  onClick={onWhatsApp}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#ffffff] text-[#1a1918] border border-[#d1c5b8] rounded-[4px] hover:border-[#725b38] transition-colors min-h-[44px] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#725b38]" />
                  <span>Ask on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Category Filter & Accordion */}
          <div className="lg:col-span-8 space-y-6">
            <div
              role="group"
              aria-label="Filter FAQ by topic"
              className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#fbf9f6] border border-[#e8e2d9] rounded-[4px]"
            >
              {(['All', 'Rental Terms', 'Move-In Process', 'Building Rules'] as const).map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3.5 py-2 text-xs font-semibold tracking-[0.04em] rounded-[3px] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                      selectedCategory === category
                        ? 'bg-[#1a1918] text-[#fbf9f6]'
                        : 'text-[#4d463c] hover:text-[#1a1918]'
                    }`}
                  >
                    {category}
                  </button>
                )
              )}
            </div>

            <div className="bg-[#fbf9f6] border border-[#e8e2d9] rounded-[6px] divide-y divide-[#e8e2d9]">
              {visibleItems.map((item, idx) => {
                const isOpen = openId === item.id;
                const panelId = `faq-panel-${item.id}`;
                const buttonId = `faq-btn-${item.id}`;

                return (
                  <div key={item.id} className="transition-colors">
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenId(isOpen ? '' : item.id)}
                        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-[#ffffff]/70 transition-colors cursor-pointer"
                      >
                        <div className="space-y-1">
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.09em] text-[#725b38] tabular-nums">
                            {String(idx + 1).padStart(2, '0')} · {item.category}
                          </span>
                          <span className="block font-editorial text-xl md:text-[1.35rem] leading-[1.3] text-[#1a1918]">
                            {item.question}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-[#725b38] shrink-0 mt-1 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </h3>

                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="px-6 pb-6 pt-1 text-sm md:text-[15px] leading-[1.7] text-[#4d463c]"
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
