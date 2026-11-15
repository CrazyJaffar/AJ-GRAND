import React from 'react';
import { X, Phone, MessageCircle, Calendar } from 'lucide-react';
import { Property } from '../data/properties';
import { buildWhatsAppMessage } from '../config/siteConfig';

interface ContactModalProps {
  mode: 'call' | 'whatsapp' | null;
  property: Property | null;
  onClose: () => void;
  onProceedToEnquiry: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  mode,
  property,
  onClose,
  onProceedToEnquiry,
}) => {
  if (!mode) return null;

  const sampleWhatsAppMessage = buildWhatsAppMessage(property?.name);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Direct contact information"
      className="fixed inset-0 z-50 bg-[#1a1918]/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#fbf9f6] border border-[#e8e2d9] rounded-[6px] p-6 md:p-8 shadow-warm-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            {mode === 'call' ? (
              <Phone className="w-5 h-5 text-[#725b38]" />
            ) : (
              <MessageCircle className="w-5 h-5 text-[#725b38]" />
            )}
            <h3 className="font-editorial text-2xl text-[#1a1918]">
              {mode === 'call' ? 'Direct Phone Line' : 'WhatsApp Property Enquiry'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 inline-flex items-center justify-center border border-[#e8e2d9] rounded-[4px] text-[#4d463c] hover:text-[#1a1918] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#4d463c] leading-[1.65] mb-5">
          {mode === 'call'
            ? 'Our direct business telephone number is pending configuration in the owner portal. Please submit your number via the viewing request form and our team will call you promptly.'
            : 'Our WhatsApp Business number is pending configuration in the owner portal. Below is the pre-populated enquiry message prepared for this residence — submit your enquiry below to receive an instant response.'}
        </p>

        {mode === 'whatsapp' && (
          <div className="mb-5 p-4 bg-[#f4efea] border border-[#e8e2d9] rounded-[4px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#725b38] mb-1.5">
              Prepared WhatsApp Message
            </p>
            <p className="text-xs text-[#1a1918] leading-[1.6] italic">
              &ldquo;{sampleWhatsAppMessage}&rdquo;
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onProceedToEnquiry();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors cursor-pointer min-h-[44px]"
          >
            <Calendar className="w-4 h-4" />
            <span>Request Callback / Visit</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] border border-[#d1c5b8] bg-[#ffffff] text-[#1a1918] rounded-[4px] hover:bg-[#f5f3f0] transition-colors cursor-pointer min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
