import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Property } from '../data/properties';
import { SiteConfig } from '../config/siteConfig';

interface EnquiryRecord {
  id: string;
  fullName: string;
  mobileNumber: string;
  interestedBhk: '1 BHK' | '2 BHK';
  preferredFloor: string;
  preferredVisitDate: string;
  message: string;
  sourcePropertyId: string | null;
  sourcePropertyName: string | null;
  status: 'New' | 'Contacted' | 'Visit Scheduled' | 'Closed';
  createdAt: string;
}

interface AdminDashboardProps {
  properties: Property[];
  config: SiteConfig;
  onBackHome: () => void;
  onDataUpdated: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  properties,
  config,
  onBackHome,
  onDataUpdated,
}) => {
  const [passcode, setPasscode] = useState('');
  const [authenticatedPasscode, setAuthenticatedPasscode] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<{
    adminPasscodeConfigured: boolean;
    enquiryWebhookConfigured: boolean;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'enquiries' | 'properties' | 'settings'>('enquiries');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Editable property state keyed by property ID
  const [propertyDrafts, setPropertyDrafts] = useState<
    Record<
      string,
      {
        rentAmount: string;
        securityDeposit: string;
        dimensions: string;
        availabilityDate: string;
        availabilityStatus: 'Available for Rent' | 'Reserved' | 'Leased';
        description: string;
        imageUrlsText: string;
      }
    >
  >({});

  // Editable contact settings
  const [contactDraft, setContactDraft] = useState({
    businessPhone: config.contact.businessPhone,
    whatsappNumber: config.contact.whatsappNumber,
    businessEmail: config.contact.businessEmail,
    websiteUrl: config.contact.websiteUrl,
    googleMapsUrl: config.maps.googleMapsUrl,
  });

  const hydrateDrafts = (propsList: Property[], cfg: SiteConfig) => {
    const drafts: typeof propertyDrafts = {};
    for (const p of propsList) {
      drafts[p.id] = {
        rentAmount: p.rentAmount || '',
        securityDeposit: p.securityDeposit || '',
        dimensions: p.dimensions || '',
        availabilityDate: p.availabilityDate || '',
        availabilityStatus: p.availabilityStatus,
        description: p.description,
        imageUrlsText: p.images.map((i) => i.url).join('\n'),
      };
    }
    setPropertyDrafts(drafts);
    setContactDraft({
      businessPhone: cfg.contact.businessPhone,
      whatsappNumber: cfg.contact.whatsappNumber,
      businessEmail: cfg.contact.businessEmail,
      websiteUrl: cfg.contact.websiteUrl,
      googleMapsUrl: cfg.maps.googleMapsUrl,
    });
  };

  const fetchDashboard = async (code: string) => {
    setLoading(true);
    setAuthError(null);
    setSetupRequired(false);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'x-admin-passcode': code },
      });
      const data = (await res.json()) as {
        enquiries?: EnquiryRecord[];
        integrationStatus?: {
          adminPasscodeConfigured: boolean;
          enquiryWebhookConfigured: boolean;
        };
        error?: string;
        setupRequired?: boolean;
      };

      if (!res.ok) {
        if (data.setupRequired) {
          setSetupRequired(true);
        }
        setAuthError(data.error || 'Authentication failed.');
        return;
      }

      setAuthenticatedPasscode(code);
      setEnquiries(data.enquiries || []);
      setIntegrationStatus(data.integrationStatus || null);
      hydrateDrafts(properties, config);
    } catch {
      setAuthError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError('Please enter your admin passcode.');
      return;
    }
    await fetchDashboard(passcode.trim());
  };

  const handleEnquiryStatusChange = async (
    enquiryId: string,
    nextStatus: EnquiryRecord['status']
  ) => {
    if (!authenticatedPasscode) return;
    setStatusMessage(null);
    const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': authenticatedPasscode,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      setEnquiries((prev) =>
        prev.map((item) => (item.id === enquiryId ? { ...item, status: nextStatus } : item))
      );
      setStatusMessage('Enquiry status updated.');
    }
  };

  const handleSaveProperty = async (propertyId: string) => {
    if (!authenticatedPasscode) return;
    const draft = propertyDrafts[propertyId];
    if (!draft) return;
    setStatusMessage(null);

    const imageUrls = draft.imageUrlsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch(`/api/admin/properties/${propertyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': authenticatedPasscode,
      },
      body: JSON.stringify({
        rentAmount: draft.rentAmount,
        securityDeposit: draft.securityDeposit,
        dimensions: draft.dimensions,
        availabilityDate: draft.availabilityDate,
        availabilityStatus: draft.availabilityStatus,
        description: draft.description,
        imageUrls,
      }),
    });

    if (res.ok) {
      await onDataUpdated();
      setStatusMessage(`Saved updates for ${propertyId}.`);
    }
  };

  const handleSaveContactConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedPasscode) return;
    setStatusMessage(null);
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': authenticatedPasscode,
      },
      body: JSON.stringify(contactDraft),
    });
    if (res.ok) {
      await onDataUpdated();
      setStatusMessage('Contact & location settings updated.');
    }
  };

  if (!authenticatedPasscode) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] p-7 md:p-9 shadow-warm-ambient">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#605e5c] hover:text-[#1a1918] mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AJ GRAND</span>
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <Lock className="w-5 h-5 text-[#725b38]" />
            <h1 className="font-editorial text-3xl text-[#1a1918]">Owner Portal</h1>
          </div>
          <p className="text-sm text-[#4d463c] mb-6">
            Protected administrative dashboard for managing the 5 rental units and viewing incoming
            tenant enquiries.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-passcode"
                className="block text-xs font-semibold uppercase tracking-[0.09em] text-[#4d463c] mb-2"
              >
                Admin Passcode
              </label>
              <input
                id="admin-passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter ADMIN_PASSCODE"
                className="w-full px-4 py-3 text-sm bg-[#ffffff] border border-[#e8e2d9] rounded-[4px] focus:border-[#c5a880] focus:outline-none min-h-[46px]"
              />
            </div>

            {authError && (
              <div className="p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-[4px] text-xs text-[#93000a] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>{authError}</p>
                  {setupRequired && (
                    <p className="mt-1.5 text-[#1a1918]">
                      To enable the Owner Portal, set <code>ADMIN_PASSCODE</code> in your
                      environment Secrets or <code>.env</code> file and restart the server.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors min-h-[46px] cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Unlock Owner Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6] py-10">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#e8e2d9] mb-8">
          <div>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#725b38] hover:text-[#1a1918] mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Site</span>
            </button>
            <h1 className="font-editorial text-3xl md:text-4xl text-[#1a1918]">
              AJ GRAND Owner Portal
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {(
              [
                { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
                { id: 'properties', label: 'Properties (5)' },
                { id: 'settings', label: 'Contact & Integrations' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] rounded-[4px] border transition-colors cursor-pointer min-h-[40px] ${
                  activeTab === tab.id
                    ? 'bg-[#1a1918] text-[#fbf9f6] border-[#1a1918]'
                    : 'bg-[#ffffff] text-[#4d463c] border-[#e8e2d9] hover:text-[#1a1918]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 bg-[#f4efea] border border-[#c5a880] rounded-[4px] flex items-center gap-2.5 text-sm text-[#1a1918]">
            <CheckCircle2 className="w-4 h-4 text-[#725b38]" />
            <span>{statusMessage}</span>
          </div>
        )}

        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-2xl text-[#1a1918]">
                Recorded Enquiries
              </h2>
              <button
                type="button"
                onClick={() => fetchDashboard(authenticatedPasscode)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-[#e8e2d9] bg-[#ffffff] rounded-[4px] hover:bg-[#f5f3f0] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {enquiries.length === 0 ? (
              <div className="bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-10 text-center text-sm text-[#605e5c]">
                No enquiries submitted yet. Submissions from the public enquiry form will appear
                here with timestamps and source residence details.
              </div>
            ) : (
              <div className="space-y-3">
                {enquiries.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    <div className="md:col-span-4">
                      <p className="font-semibold text-[#1a1918]">{item.fullName}</p>
                      <p className="text-sm text-[#725b38] tabular-nums">{item.mobileNumber}</p>
                      <p className="text-xs text-[#605e5c] mt-1 tabular-nums">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="md:col-span-5 text-xs text-[#4d463c] space-y-1">
                      <p>
                        <strong>Interest:</strong> {item.interestedBhk} · {item.preferredFloor}
                      </p>
                      {item.sourcePropertyName && (
                        <p>
                          <strong>Source Unit:</strong> {item.sourcePropertyName}
                        </p>
                      )}
                      {item.preferredVisitDate && (
                        <p>
                          <strong>Preferred Visit:</strong> {item.preferredVisitDate}
                        </p>
                      )}
                      {item.message && (
                        <p className="text-[#1a1918] pt-1">&ldquo;{item.message}&rdquo;</p>
                      )}
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <select
                        aria-label={`Status for ${item.fullName}`}
                        value={item.status}
                        onChange={(e) =>
                          handleEnquiryStatusChange(
                            item.id,
                            e.target.value as EnquiryRecord['status']
                          )
                        }
                        className="px-3 py-2 text-xs font-semibold bg-[#f5f3f0] border border-[#d1c5b8] rounded-[4px]"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Visit Scheduled">Visit Scheduled</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6">
            <p className="text-sm text-[#4d463c]">
              Update rental pricing, deposit, availability status, or interior photo URLs for any of
              the 5 rental units. Unspecified rent, deposit, or dates remain hidden from the public
              website.
            </p>
            {properties.map((prop) => {
              const draft = propertyDrafts[prop.id];
              if (!draft) return null;
              return (
                <div
                  key={prop.id}
                  className="bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e2d9] pb-3">
                    <div>
                      <h3 className="font-editorial text-2xl text-[#1a1918]">{prop.name}</h3>
                      <p className="text-xs text-[#605e5c]">
                        {prop.floorLabel} · {prop.bhkConfiguration}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveProperty(prop.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[4px] hover:bg-[#725b38] cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                        Monthly Rent (blank = hidden)
                      </label>
                      <input
                        type="text"
                        value={draft.rentAmount}
                        onChange={(e) =>
                          setPropertyDrafts((prev) => ({
                            ...prev,
                            [prop.id]: { ...draft, rentAmount: e.target.value },
                          }))
                        }
                        placeholder="e.g. ₹28,000 / month"
                        className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                        Security Deposit (blank = hidden)
                      </label>
                      <input
                        type="text"
                        value={draft.securityDeposit}
                        onChange={(e) =>
                          setPropertyDrafts((prev) => ({
                            ...prev,
                            [prop.id]: { ...draft, securityDeposit: e.target.value },
                          }))
                        }
                        placeholder="e.g. ₹1,50,000"
                        className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                        Dimensions (blank = hidden)
                      </label>
                      <input
                        type="text"
                        value={draft.dimensions}
                        onChange={(e) =>
                          setPropertyDrafts((prev) => ({
                            ...prev,
                            [prop.id]: { ...draft, dimensions: e.target.value },
                          }))
                        }
                        placeholder="e.g. 1,050 sq.ft."
                        className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                        Availability Status
                      </label>
                      <select
                        value={draft.availabilityStatus}
                        onChange={(e) =>
                          setPropertyDrafts((prev) => ({
                            ...prev,
                            [prop.id]: {
                              ...draft,
                              availabilityStatus: e.target
                                .value as Property['availabilityStatus'],
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                      >
                        <option value="Available for Rent">Available for Rent</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Leased">Leased</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={draft.description}
                        onChange={(e) =>
                          setPropertyDrafts((prev) => ({
                            ...prev,
                            [prop.id]: { ...draft, description: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                        Image Paths (one URL per line)
                      </label>
                      <textarea
                        rows={3}
                        value={draft.imageUrlsText}
                        onChange={(e) =>
                          setPropertyDrafts((prev) => ({
                            ...prev,
                            [prop.id]: { ...draft, imageUrlsText: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs font-mono border border-[#e8e2d9] rounded-[4px]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleSaveContactConfig}
              className="lg:col-span-7 bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] p-6 space-y-4"
            >
              <h2 className="font-editorial text-2xl text-[#1a1918]">
                Contact &amp; Location Configuration
              </h2>
              <p className="text-xs text-[#605e5c]">
                Environment variables (<code>VITE_BUSINESS_PHONE</code>,{' '}
                <code>VITE_WHATSAPP_NUMBER</code>) override these fields if set at build time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                    Business Mobile Number
                  </label>
                  <input
                    type="text"
                    value={contactDraft.businessPhone}
                    onChange={(e) =>
                      setContactDraft((p) => ({ ...p, businessPhone: e.target.value }))
                    }
                    placeholder="+91 ..."
                    className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                    WhatsApp Business Number
                  </label>
                  <input
                    type="text"
                    value={contactDraft.whatsappNumber}
                    onChange={(e) =>
                      setContactDraft((p) => ({ ...p, whatsappNumber: e.target.value }))
                    }
                    placeholder="91XXXXXXXXXX"
                    className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                    Business Email
                  </label>
                  <input
                    type="email"
                    value={contactDraft.businessEmail}
                    onChange={(e) =>
                      setContactDraft((p) => ({ ...p, businessEmail: e.target.value }))
                    }
                    placeholder="leasing@..."
                    className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={contactDraft.websiteUrl}
                    onChange={(e) =>
                      setContactDraft((p) => ({ ...p, websiteUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={contactDraft.googleMapsUrl}
                    onChange={(e) =>
                      setContactDraft((p) => ({ ...p, googleMapsUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#e8e2d9] rounded-[4px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[4px] hover:bg-[#725b38] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Contact Settings</span>
              </button>
            </form>

            <div className="lg:col-span-5 bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-6 space-y-3">
              <h2 className="font-editorial text-2xl text-[#1a1918]">
                Ad Tracking &amp; Backend Status
              </h2>
              <dl className="divide-y divide-[#e8e2d9] text-xs">
                {[
                  ['Enquiry Storage (Server)', 'Active (data/store.json)'],
                  [
                    'Enquiry Webhook',
                    integrationStatus?.enquiryWebhookConfigured
                      ? 'Configured'
                      : 'Optional (ENQUIRY_WEBHOOK_URL)',
                  ],
                  [
                    'Google Analytics 4',
                    config.tracking.ga4MeasurementId ? 'Configured' : 'Set VITE_GA4_MEASUREMENT_ID',
                  ],
                  [
                    'Google Ads Conversion',
                    config.tracking.googleAdsId ? 'Configured' : 'Set VITE_GOOGLE_ADS_ID',
                  ],
                  [
                    'Google Tag Manager',
                    config.tracking.gtmContainerId ? 'Configured' : 'Set VITE_GTM_CONTAINER_ID',
                  ],
                  [
                    'Meta Pixel',
                    config.tracking.metaPixelId ? 'Configured' : 'Set VITE_META_PIXEL_ID',
                  ],
                  [
                    'Google Maps Embed Key',
                    config.maps.googleMapsApiKey
                      ? 'Configured'
                      : 'Using standard embed (optional VITE_GOOGLE_MAPS_API_KEY)',
                  ],
                ].map(([label, val]) => (
                  <div key={label} className="py-2.5 flex justify-between gap-4">
                    <dt className="text-[#605e5c]">{label}</dt>
                    <dd className="font-semibold text-[#1a1918] text-right">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
