import React from 'react';
import { Phone, MessageCircle, Calendar } from 'lucide-react';

interface MobileStickyBarProps {
  onCallNow: () => void;
  onWhatsApp: () => void;
  onEnquireNow: () => void;
}

export const MobileStickyBar: React.FC<MobileStickyBarProps> = ({
  onCallNow,
  onWhatsApp,
  onEnquireNow,
}) => {
  return (
    <>
      {/* Mobile sticky action bar (height ~58px, <= 15% viewport cap) */}
      <div
        role="region"
        aria-label="Quick contact actions"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-[#fbf9f6]/98 backdrop-blur-sm border-t border-[#e8e2d9] px-3 py-1.5"
      >
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onCallNow}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 text-xs font-semibold bg-[#1a1918] text-[#fbf9f6] rounded-[4px] whitespace-nowrap cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Call Now</span>
          </button>

          <button
            type="button"
            onClick={onWhatsApp}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 text-xs font-semibold bg-[#c5a880] text-[#1a1918] rounded-[4px] whitespace-nowrap cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onEnquireNow}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 text-xs font-semibold bg-[#ffffff] text-[#1a1918] border border-[#d1c5b8] rounded-[4px] whitespace-nowrap cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#725b38]" />
            <span>Enquire</span>
          </button>
        </div>
      </div>

      {/* Desktop floating WhatsApp button */}
      <button
        type="button"
        onClick={onWhatsApp}
        aria-label="Enquire on WhatsApp"
        className="hidden md:inline-flex fixed bottom-6 right-6 z-40 items-center gap-2.5 px-5 py-3 bg-[#1a1918] text-[#fbf9f6] border border-[#c5a880] rounded-[6px] shadow-warm-hover hover:bg-[#725b38] transition-colors cursor-pointer min-h-[46px]"
      >
        <MessageCircle className="w-4 h-4 text-[#e0c298]" />
        <span className="text-xs font-semibold uppercase tracking-[0.08em] whitespace-nowrap">
          WhatsApp Enquiry
        </span>
      </button>
    </>
  );
};
