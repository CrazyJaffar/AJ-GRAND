import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { Property } from '../data/properties';
import { SiteConfig, sanitizeWhatsAppDigits } from '../config/siteConfig';
import { trackEvent } from '../utils/analytics';

interface EnquirySectionProps {
  config: SiteConfig;
  selectedProperty: Property | null;
  onCallNow: () => void;
  onWhatsApp: (property?: Property | null) => void;
}

export const EnquirySection: React.FC<EnquirySectionProps> = ({
  config,
  selectedProperty,
  onCallNow,
  onWhatsApp,
}) => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [interestedBhk, setInterestedBhk] = useState<'1 BHK' | '2 BHK'>(
    selectedProperty?.bhkFilterKey || '2 BHK'
  );
  const [preferredFloor, setPreferredFloor] = useState<string>(
    selectedProperty?.floorLabel || 'Any Available Floor'
  );
  const [preferredVisitDate, setPreferredVisitDate] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [formStarted, setFormStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submittedWhatsAppUrl, setSubmittedWhatsAppUrl] = useState<string | null>(null);
  const [lastSubmittedSignature, setLastSubmittedSignature] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProperty) {
      setInterestedBhk(selectedProperty.bhkFilterKey);
      setPreferredFloor(selectedProperty.floorLabel);
    }
  }, [selectedProperty]);

  const todayIso = new Date().toISOString().split('T')[0];

  const handleFirstInteraction = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent('start_enquiry_form', config, {
        propertyId: selectedProperty?.id,
        propertyName: selectedProperty?.name,
        bhk: interestedBhk,
      });
    }
  };

  const validateClient = (): string | null => {
    if (fullName.trim().length < 2) {
      return 'Please enter your full name.';
    }
    const digits = mobileNumber.replace(/\D/g, '');
    const normalized =
      digits.length === 12 && digits.startsWith('91')
        ? digits.slice(2)
        : digits.length === 11 && digits.startsWith('0')
          ? digits.slice(1)
          : digits;
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    if (preferredFloor === 'First Floor') {
      return 'First Floor is the private owner residence and is not available for rent.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const validationError = validateClient();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const signature = `${mobileNumber.trim()}|${interestedBhk}|${preferredFloor}|${preferredVisitDate}`;
    if (lastSubmittedSignature === signature) {
      setSuccessMsg(
        'Your enquiry has already been submitted. Our property team will contact you shortly.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobileNumber: mobileNumber.trim(),
          interestedBhk,
          preferredFloor,
          preferredVisitDate,
          message: message.trim(),
          sourcePropertyId: selectedProperty?.id || null,
          sourcePropertyName: selectedProperty?.name || null,
          website: honeypot,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setErrorMsg(data.error || 'Unable to submit enquiry right now. Please try again.');
        return;
      }

      setLastSubmittedSignature(signature);
      setSuccessMsg(
        data.message ||
          'Thank you. Your enquiry has been recorded and our team will contact you shortly.'
      );

      const waDigits = sanitizeWhatsAppDigits(config.contact.whatsappNumber);
      if (waDigits) {
        const waText = [
          `Hello AJ GRAND, I just submitted an enquiry on your website.`,
          `Name: ${fullName.trim()}`,
          `Mobile: ${mobileNumber.trim()}`,
          `Interested: ${interestedBhk} (${preferredFloor})`,
          selectedProperty?.name ? `Residence: ${selectedProperty.name}` : '',
          preferredVisitDate ? `Preferred Visit Date: ${preferredVisitDate}` : '',
          message.trim() ? `Message: ${message.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        setSubmittedWhatsAppUrl(
          `https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}`
        );
      } else {
        setSubmittedWhatsAppUrl(null);
      }

      trackEvent('submit_enquiry_success', config, {
        propertyId: selectedProperty?.id,
        propertyName: selectedProperty?.name || `${preferredFloor} ${interestedBhk}`,
        bhk: interestedBhk,
        floor: preferredFloor,
        dedupeKey: `submit:${signature}`,
      });

      if (preferredVisitDate) {
        trackEvent('schedule_site_visit', config, {
          propertyId: selectedProperty?.id,
          propertyName: selectedProperty?.name || `${preferredFloor} ${interestedBhk}`,
          bhk: interestedBhk,
          floor: preferredFloor,
          dedupeKey: `visit:${signature}`,
        });
      }

      setFullName('');
      setMobileNumber('');
      setPreferredVisitDate('');
      setMessage('');
    } catch {
      setErrorMsg('Network error while sending enquiry. Please verify your connection or reach us via Call / WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="enquire" className="py-16 md:py-24 bg-[#fbf9f6] border-b border-[#e8e2d9]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Editorial Conversion Column */}
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
              Private Viewings &amp; Leasing
            </p>
            <h2 className="font-editorial text-3xl md:text-[2.75rem] leading-[1.15] text-[#1a1918] mb-5">
              Schedule Your Private Residence Visit
            </h2>
            <p className="text-sm md:text-base text-[#4d463c] leading-[1.7] mb-8">
              Share your preferred configuration, floor, and visit date below. All enquiries are
              handled directly by the AJ GRAND building management with zero brokerage fees.
            </p>

            <div className="bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#725b38]">
                Direct Channels
              </p>
              <p className="text-sm text-[#4d463c]">
                Prefer immediate assistance? Reach us directly by phone or WhatsApp for viewing slots
                and lease terms.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={onCallNow}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors min-h-[44px] cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => onWhatsApp(selectedProperty)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#ffffff] text-[#1a1918] border border-[#d1c5b8] rounded-[4px] hover:border-[#725b38] transition-colors min-h-[44px] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#725b38]" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              onFocus={handleFirstInteraction}
              noValidate
              className="bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] p-6 md:p-9 shadow-warm-ambient"
            >
              {selectedProperty && (
                <div className="mb-6 pb-4 border-b border-[#e8e2d9] flex items-center justify-between gap-4 text-xs">
                  <span className="text-[#605e5c]">
                    Enquiring about:{' '}
                    <strong className="text-[#1a1918]">{selectedProperty.name}</strong>
                  </span>
                  <span className="text-[#725b38] font-semibold uppercase tracking-[0.08em]">
                    {selectedProperty.availabilityStatus}
                  </span>
                </div>
              )}

              {/* Honeypot spam trap */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="enquiry-website">Website</label>
                <input
                  id="enquiry-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="full-name"
                    className="block text-xs font-semibold uppercase tracking-[0.09em] text-[#4d463c] mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 text-sm bg-[#ffffff] text-[#1a1918] border border-[#e8e2d9] rounded-[4px] focus:border-[#c5a880] focus:outline-none min-h-[46px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mobile-number"
                    className="block text-xs font-semibold uppercase tracking-[0.09em] text-[#4d463c] mb-2"
                  >
                    Mobile Number *
                  </label>
                  <input
                    id="mobile-number"
                    type="tel"
                    inputMode="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-3 text-sm bg-[#ffffff] text-[#1a1918] border border-[#e8e2d9] rounded-[4px] focus:border-[#c5a880] focus:outline-none min-h-[46px] tabular-nums"
                  />
                </div>

                <div>
                  <label
                    htmlFor="interested-property"
                    className="block text-xs font-semibold uppercase tracking-[0.09em] text-[#4d463c] mb-2"
                  >
                    Interested Property *
                  </label>
                  <select
                    id="interested-property"
                    value={interestedBhk}
                    onChange={(e) => setInterestedBhk(e.target.value as '1 BHK' | '2 BHK')}
                    className="w-full px-4 py-3 text-sm bg-[#ffffff] text-[#1a1918] border border-[#e8e2d9] rounded-[4px] focus:border-[#c5a880] focus:outline-none min-h-[46px]"
                  >
                    <option value="2 BHK">2 BHK (Semi-Furnished)</option>
                    <option value="1 BHK">Luxury 1 BHK (Dual Balcony)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="preferred-floor"
                    className="block text-xs font-semibold uppercase tracking-[0.09em] text-[#4d463c] mb-2"
                  >
                    Preferred Floor *
                  </label>
                  <select
                    id="preferred-floor"
                    value={preferredFloor}
                    onChange={(e) => setPreferredFloor(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-[#ffffff] text-[#1a1918] border border-[#e8e2d9] rounded-[4px] focus:border-[#c5a880] focus:outline-none min-h-[46px]"
                  >
                    <option value="Any Available Floor">Any Available Floor</option>
                    <option value="Ground Floor">Ground Floor (2 BHK only)</option>
                    <option value="Second Floor">Second Floor (2 BHK / Luxury 1 BHK)</option>
                    <option value="Third Floor">Third Floor (2 BHK / Luxury 1 BHK)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="preferred-visit-date"
                    className="block text-xs font-semibold uppercase tracking-[0.09em] text-[#4d463c] mb-2"
                  >
                    Preferred Visit Date
                  </label>
                  <input
                    id="preferred-visit-date"
                    type="date"
                    min={todayIso}
                    value={preferredVisitDate}
                    onChange={(e) => setPreferredVisitDate(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-[#ffffff] text-[#1a1918] border border-[#e8e2d9] rounded-[4px] focus:border-[#c5a880] focus:outline-none min-h-[46px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="additional-message"
                    className="block text-xs font-semibold uppercase tracking-[0.09em] text-[#4d463c] mb-2"
                  >
                    Additional Message
                  </label>
                  <textarea
                    id="additional-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your preferred move-in timeline, family/working profile, or any questions..."
                    className="w-full px-4 py-3 text-sm bg-[#ffffff] text-[#1a1918] border border-[#e8e2d9] rounded-[4px] focus:border-[#c5a880] focus:outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="mt-5 p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-[4px] flex items-start gap-3 text-sm text-[#93000a]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  role="status"
                  className="mt-5 p-4 bg-[#f4efea] border border-[#c5a880] rounded-[4px] space-y-3 text-sm text-[#1a1918]"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#725b38] shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                  {submittedWhatsAppUrl && (
                    <div className="pl-7">
                      <a
                        href={submittedWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[4px] hover:bg-[#725b38] transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#e0c298]" />
                        <span>Also Send Summary on WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-[#605e5c]">
                  Your details are used strictly to coordinate your AJ GRAND viewing enquiry.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] disabled:opacity-60 transition-colors whitespace-nowrap min-h-[46px] cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Rental Enquiry</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
