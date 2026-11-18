import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Phone,
  MessageCircle,
  Mail,
  Send,
  Upload,
  Trash2,
  ImagePlus,
  RotateCcw,
  Star,
  Search,
  Inbox,
  Building2,
  Settings,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Crop,
  Maximize2,
} from 'lucide-react';
import { Property } from '../data/properties';
import { SiteConfig } from '../config/siteConfig';
import {
  ImageFitMode,
  STANDARD_PROPERTY_IMAGE_HEIGHT,
  STANDARD_PROPERTY_IMAGE_WIDTH,
  normalizePropertyImageFile,
} from '../utils/imageResize';
import { ResilientImage } from './ResilientImage';

interface ChannelDeliveryResult {
  status: 'sent' | 'not_configured' | 'failed';
  detail: string;
  attemptedAt: string;
}

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
  notifications?: {
    email?: ChannelDeliveryResult;
    whatsapp?: ChannelDeliveryResult;
    webhook?: ChannelDeliveryResult;
  };
}

interface IntegrationStatus {
  adminPasscodeConfigured: boolean;
  notificationEmail: string;
  emailProviderConfigured: boolean;
  whatsappCloudConfigured: boolean;
  enquiryWebhookConfigured: boolean;
}

interface PropertyDraft {
  rentAmount: string;
  securityDeposit: string;
  dimensions: string;
  availabilityDate: string;
  availabilityStatus: 'Available for Rent' | 'Reserved' | 'Leased';
  description: string;
  imageUrls: string[];
}

interface AdminDashboardProps {
  properties: Property[];
  config: SiteConfig;
  onBackHome: () => void;
  onDataUpdated: () => Promise<void>;
}

type AdminTab = 'enquiries' | 'properties' | 'settings';
type EnquiryFilter = 'All' | EnquiryRecord['status'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  properties,
  config,
  onBackHome,
  onDataUpdated,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [authenticatedPasscode, setAuthenticatedPasscode] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('enquiries');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    properties[0]?.id || 'ground-floor-2bhk'
  );
  const [enquiryFilter, setEnquiryFilter] = useState<EnquiryFilter>('All');
  const [enquiryQuery, setEnquiryQuery] = useState('');

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPropertyId, setSavingPropertyId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode>('cover');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetIndexRef = useRef<number | null>(null);

  const [propertyDrafts, setPropertyDrafts] = useState<Record<string, PropertyDraft>>({});
  const [contactDraft, setContactDraft] = useState({
    businessPhone: config.contact.businessPhone,
    whatsappNumber: config.contact.whatsappNumber,
    businessEmail: config.contact.businessEmail,
    notificationEmail: 'ajservices2132@gmail.com',
    websiteUrl: config.contact.websiteUrl,
    googleMapsUrl: config.maps.googleMapsUrl,
  });

  const hydrateDrafts = (
    propsList: Property[],
    cfg: SiteConfig,
    overrides?: Record<string, { imageUrls?: string[]; rentAmount?: string | null; securityDeposit?: string | null; dimensions?: string | null; availabilityDate?: string | null; availabilityStatus?: Property['availabilityStatus']; description?: string }>,
    notifEmail?: string
  ) => {
    const drafts: Record<string, PropertyDraft> = {};
    for (const p of propsList) {
      const ov = overrides?.[p.id];
      drafts[p.id] = {
        rentAmount: (ov?.rentAmount !== undefined ? ov.rentAmount : p.rentAmount) || '',
        securityDeposit:
          (ov?.securityDeposit !== undefined ? ov.securityDeposit : p.securityDeposit) || '',
        dimensions: (ov?.dimensions !== undefined ? ov.dimensions : p.dimensions) || '',
        availabilityDate:
          (ov?.availabilityDate !== undefined ? ov.availabilityDate : p.availabilityDate) || '',
        availabilityStatus: ov?.availabilityStatus || p.availabilityStatus,
        description: ov?.description || p.description,
        imageUrls: Array.isArray(ov?.imageUrls)
          ? ov.imageUrls
          : p.images.map((i) => i.url),
      };
    }
    setPropertyDrafts(drafts);
    setContactDraft({
      businessPhone: cfg.contact.businessPhone,
      whatsappNumber: cfg.contact.whatsappNumber,
      businessEmail: cfg.contact.businessEmail,
      notificationEmail: notifEmail || 'ajservices2132@gmail.com',
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
        propertyOverrides?: Record<
          string,
          {
            imageUrls?: string[];
            rentAmount?: string | null;
            securityDeposit?: string | null;
            dimensions?: string | null;
            availabilityDate?: string | null;
            availabilityStatus?: Property['availabilityStatus'];
            description?: string;
          }
        >;
        configOverrides?: { notificationEmail?: string };
        integrationStatus?: IntegrationStatus;
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
      hydrateDrafts(
        properties,
        config,
        data.propertyOverrides,
        data.integrationStatus?.notificationEmail || data.configOverrides?.notificationEmail
      );
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

  const handleLockPortal = () => {
    setAuthenticatedPasscode(null);
    setPasscode('');
    setNotice(null);
  };

  const handleEnquiryStatusChange = async (
    enquiryId: string,
    nextStatus: EnquiryRecord['status']
  ) => {
    if (!authenticatedPasscode) return;
    setNotice(null);
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
      setNotice({ type: 'success', text: `Enquiry status updated to "${nextStatus}".` });
    } else {
      setNotice({ type: 'error', text: 'Could not update enquiry status.' });
    }
  };

  const persistPropertyImages = async (
    propertyId: string,
    nextUrls: string[],
    successText: string
  ) => {
    if (!authenticatedPasscode) return;
    const res = await fetch(`/api/admin/properties/${propertyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': authenticatedPasscode,
      },
      body: JSON.stringify({ imageUrls: nextUrls }),
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errData.error || 'Failed to update gallery.');
    }

    setPropertyDrafts((prev) => {
      const current = prev[propertyId];
      if (!current) return prev;
      return {
        ...prev,
        [propertyId]: { ...current, imageUrls: nextUrls },
      };
    });
    await onDataUpdated();
    setNotice({ type: 'success', text: successText });
  };

  const uploadSingleNormalizedFile = async (propertyId: string, file: File): Promise<string> => {
    if (!authenticatedPasscode) {
      throw new Error('Admin session locked.');
    }
    const normalized = await normalizePropertyImageFile(file, imageFitMode);
    const uploadRes = await fetch(`/api/admin/properties/${propertyId}/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': authenticatedPasscode,
      },
      body: JSON.stringify({ dataUrl: normalized.dataUrl }),
    });

    const data = (await uploadRes.json()) as { ok?: boolean; url?: string; error?: string };
    if (!uploadRes.ok || !data.url) {
      throw new Error(data.error || `Failed to upload "${file.name}".`);
    }
    return data.url;
  };

  const handleUploadNewPhotos = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0 || !authenticatedPasscode) return;
    const draft = propertyDrafts[selectedPropertyId];
    if (!draft) return;

    setUploadingImage(true);
    setNotice(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        const url = await uploadSingleNormalizedFile(selectedPropertyId, file);
        uploadedUrls.push(url);
      }
      const nextUrls = [...draft.imageUrls, ...uploadedUrls];
      await persistPropertyImages(
        selectedPropertyId,
        nextUrls,
        `Uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} normalized to ${STANDARD_PROPERTY_IMAGE_WIDTH} × ${STANDARD_PROPERTY_IMAGE_HEIGHT} px.`
      );
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to upload photos.',
      });
    } finally {
      setUploadingImage(false);
      if (addFileInputRef.current) {
        addFileInputRef.current.value = '';
      }
    }
  };

  const handleReplacePhotoAtSlot = async (file: File, index: number) => {
    if (!authenticatedPasscode) return;
    const draft = propertyDrafts[selectedPropertyId];
    if (!draft || index < 0 || index >= draft.imageUrls.length) return;

    setReplacingIndex(index);
    setNotice(null);
    try {
      const newUrl = await uploadSingleNormalizedFile(selectedPropertyId, file);
      const nextUrls = draft.imageUrls.map((url, idx) => (idx === index ? newUrl : url));
      await persistPropertyImages(
        selectedPropertyId,
        nextUrls,
        `Photo #${index + 1} replaced and standardized to ${STANDARD_PROPERTY_IMAGE_WIDTH} × ${STANDARD_PROPERTY_IMAGE_HEIGHT} px.`
      );
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to replace photo.',
      });
    } finally {
      setReplacingIndex(null);
      replaceTargetIndexRef.current = null;
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhotoAtSlot = async (index: number) => {
    const draft = propertyDrafts[selectedPropertyId];
    if (!draft) return;
    const nextUrls = draft.imageUrls.filter((_, idx) => idx !== index);
    setNotice(null);
    try {
      await persistPropertyImages(
        selectedPropertyId,
        nextUrls,
        `Deleted photo #${index + 1} from this unit's gallery.`
      );
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to delete photo.',
      });
    }
  };

  const handleMovePhoto = async (index: number, targetIndex: number) => {
    const draft = propertyDrafts[selectedPropertyId];
    if (!draft || targetIndex < 0 || targetIndex >= draft.imageUrls.length) return;
    const nextUrls = [...draft.imageUrls];
    const [moved] = nextUrls.splice(index, 1);
    nextUrls.splice(targetIndex, 0, moved);
    try {
      await persistPropertyImages(
        selectedPropertyId,
        nextUrls,
        targetIndex === 0 ? 'Updated primary cover photo.' : 'Updated gallery photo order.'
      );
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to reorder photos.',
      });
    }
  };

  const handleRestoreStarterPhotos = async () => {
    if (!authenticatedPasscode) return;
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/properties/${selectedPropertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': authenticatedPasscode,
        },
        body: JSON.stringify({ resetImages: true }),
      });
      if (!res.ok) throw new Error('Failed to restore starter photos.');
      await onDataUpdated();
      await fetchDashboard(authenticatedPasscode);
      setNotice({
        type: 'success',
        text: 'Restored starter representative interior photos for this residence.',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to restore starter photos.',
      });
    }
  };

  const handleSavePropertyDetails = async (propertyId: string) => {
    if (!authenticatedPasscode) return;
    const draft = propertyDrafts[propertyId];
    if (!draft) return;
    setSavingPropertyId(propertyId);
    setNotice(null);

    try {
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
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save property updates.');
      }

      await onDataUpdated();
      setNotice({ type: 'success', text: 'Saved pricing, status, and residence details.' });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save property details.',
      });
    } finally {
      setSavingPropertyId(null);
    }
  };

  const handleSaveContactConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedPasscode) return;
    setNotice(null);
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
      await fetchDashboard(authenticatedPasscode);
      setNotice({ type: 'success', text: 'Contact & alert notification settings updated.' });
    } else {
      setNotice({ type: 'error', text: 'Could not save contact settings.' });
    }
  };

  const handleSendTestEmail = async () => {
    if (!authenticatedPasscode) return;
    setTestingEmail(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'x-admin-passcode': authenticatedPasscode },
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        result?: { detail?: string };
      };
      if (res.ok && data.ok) {
        setNotice({
          type: 'success',
          text: data.result?.detail || 'Test alert email sent successfully.',
        });
      } else {
        setNotice({
          type: 'error',
          text: data.error || 'Could not send test email. Check SMTP_PASS or RESEND_API_KEY.',
        });
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error while sending test email.' });
    } finally {
      setTestingEmail(false);
    }
  };

  const filteredEnquiries = useMemo(() => {
    const q = enquiryQuery.trim().toLowerCase();
    return enquiries.filter((item) => {
      if (enquiryFilter !== 'All' && item.status !== enquiryFilter) return false;
      if (!q) return true;
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.mobileNumber.includes(q) ||
        item.preferredFloor.toLowerCase().includes(q) ||
        item.interestedBhk.toLowerCase().includes(q) ||
        (item.sourcePropertyName || '').toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    });
  }, [enquiries, enquiryFilter, enquiryQuery]);

  const metrics = useMemo(() => {
    const newCount = enquiries.filter((e) => e.status === 'New').length;
    const visitCount = enquiries.filter((e) => e.status === 'Visit Scheduled').length;
    const availableCount = properties.filter(
      (p) => (propertyDrafts[p.id]?.availabilityStatus || p.availabilityStatus) === 'Available for Rent'
    ).length;
    return {
      totalEnquiries: enquiries.length,
      newCount,
      visitCount,
      availableCount,
    };
  }, [enquiries, properties, propertyDrafts]);

  const activeProperty =
    properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const activeDraft = activeProperty ? propertyDrafts[activeProperty.id] : undefined;

  if (!authenticatedPasscode) {
    return (
      <div className="min-h-screen bg-[#f6f4f0] flex flex-col justify-center items-center p-5">
        <div className="w-full max-w-[440px] bg-[#ffffff] border border-[#e5dfd5] rounded-[8px] p-8 md:p-10">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#605e5c] hover:text-[#1a1918] mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AJ GRAND</span>
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-2">
            Private Management
          </p>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-[#725b38]" />
            <h1 className="font-editorial text-3xl text-[#1a1918]">AJ GRAND Owner Portal</h1>
          </div>
          <p className="text-sm text-[#4d463c] leading-[1.6] mb-7">
            Manage incoming tenant leads, upload and resize unit photographs, and update rental
            availability across all five residences.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="admin-passcode"
                className="block text-xs font-semibold uppercase tracking-[0.09em] text-[#4d463c] mb-2"
              >
                Admin Passcode
              </label>
              <div className="relative">
                <input
                  id="admin-passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter admin passcode"
                  autoComplete="current-password"
                  className="w-full pl-4 pr-11 py-3 text-sm bg-[#ffffff] border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none min-h-[46px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode((s) => !s)}
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#605e5c] hover:text-[#1a1918] p-1 cursor-pointer"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3.5 bg-[#fff1f0] border border-[#f5c2c0] rounded-[6px] text-xs text-[#93000a] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>{authError}</p>
                  {setupRequired && (
                    <p className="mt-1.5 text-[#1a1918]">
                      Set <code>ADMIN_PASSCODE</code> in Secrets or <code>.env</code> and restart
                      the server.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[6px] hover:bg-[#725b38] disabled:opacity-60 transition-colors min-h-[46px] cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Unlock Owner Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminTab; label: string; count?: string; icon: React.ReactNode }[] = [
    {
      id: 'enquiries',
      label: 'Enquiries',
      count: String(enquiries.length),
      icon: <Inbox className="w-4 h-4" />,
    },
    {
      id: 'properties',
      label: 'Residences & Photos',
      count: '5',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Alerts & Contact',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const activeBreadcrumbLabel =
    activeTab === 'enquiries'
      ? 'Enquiries'
      : activeTab === 'properties'
        ? `Residences & Photos / ${activeProperty?.name || ''}`
        : 'Alerts & Contact';

  return (
    <div className="min-h-screen bg-[#f6f4f0] text-[#1a1918] flex flex-col lg:flex-row">
      {/* Hidden replacement file input scoped strictly to Admin Portal */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const idx = replaceTargetIndexRef.current;
          if (file && idx !== null) {
            void handleReplacePhotoAtSlot(file, idx);
          }
        }}
      />

      {/* Modern Workspace Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:w-[264px] lg:shrink-0 lg:flex-col lg:justify-between bg-[#ffffff] border-r border-[#e5dfd5] p-5 sticky top-0 h-screen">
        <div className="space-y-8">
          <div>
            <p className="font-editorial text-2xl tracking-[0.02em] text-[#1a1918]">AJ GRAND</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#725b38] mt-0.5">
              Owner Workspace
            </p>
          </div>

          <nav aria-label="Admin Navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-[6px] transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1a1918] text-[#fbf9f6]'
                      : 'text-[#4d463c] hover:bg-[#f6f4f0] hover:text-[#1a1918]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`text-xs tabular-nums ${
                        isActive ? 'text-[#e0c298]' : 'text-[#605e5c]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 pt-5 border-t border-[#e5dfd5]">
          <div className="text-xs space-y-1">
            <p className="text-[#605e5c]">Owner Email Alerts</p>
            <p className="font-medium text-[#1a1918] truncate">
              {integrationStatus?.notificationEmail || 'ajservices2132@gmail.com'}
            </p>
            <p className="text-[11px] text-[#725b38] font-medium">
              {integrationStatus?.emailProviderConfigured
                ? 'SMTP Delivery Active'
                : 'Email Setup Needed'}
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onBackHome}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold border border-[#dfd8cd] bg-[#ffffff] text-[#1a1918] rounded-[6px] hover:bg-[#f6f4f0] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#725b38]" />
              <span>View Public Site</span>
            </button>
            <button
              type="button"
              onClick={handleLockPortal}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-[#605e5c] hover:text-[#1a1918] rounded-[6px] hover:bg-[#f6f4f0] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Portal</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="bg-[#ffffff] border-b border-[#e5dfd5] px-5 md:px-8 py-4 sticky top-0 z-20">
          <div className="max-w-[1160px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-[#605e5c]">
                <span className="lg:hidden font-editorial text-base text-[#1a1918]">AJ GRAND</span>
                <span className="lg:hidden" aria-hidden="true">/</span>
                <span className="truncate">{activeBreadcrumbLabel}</span>
              </div>
              <h1 className="font-editorial text-2xl text-[#1a1918] mt-0.5 truncate">
                {activeTab === 'enquiries' && 'Lead & Enquiry Management'}
                {activeTab === 'properties' && 'Residences & Photo Studio'}
                {activeTab === 'settings' && 'Contact Channels & Alerts'}
              </h1>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => fetchDashboard(authenticatedPasscode)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-[#dfd8cd] bg-[#ffffff] text-[#1a1918] rounded-[6px] hover:bg-[#f6f4f0] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={onBackHome}
                className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1a1918] text-[#fbf9f6] rounded-[6px] whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Site</span>
              </button>
            </div>
          </div>

          {/* Mobile / Tablet Segmented Tab Bar */}
          <div className="lg:hidden mt-3 flex items-center gap-1 p-1 bg-[#f6f4f0] border border-[#e5dfd5] rounded-[6px] overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[4px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#1a1918] text-[#fbf9f6]'
                    : 'text-[#4d463c] hover:text-[#1a1918]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-5 md:p-8">
          <div className="max-w-[1160px] mx-auto space-y-6">
            {notice && (
              <div
                role="status"
                className={`p-4 rounded-[6px] border flex items-center justify-between gap-4 text-sm ${
                  notice.type === 'success'
                    ? 'bg-[#f4efea] border-[#c5a880] text-[#1a1918]'
                    : 'bg-[#fff1f0] border-[#f5c2c0] text-[#93000a]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {notice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#725b38] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{notice.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="text-xs font-semibold uppercase tracking-[0.06em] opacity-75 hover:opacity-100 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* TAB 1: ENQUIRIES */}
            {activeTab === 'enquiries' && (
              <div className="space-y-6">
                {/* 4-Column Metric Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 bg-[#ffffff] border border-[#e5dfd5] rounded-[8px] divide-y lg:divide-y-0 lg:divide-x divide-[#e5dfd5]">
                  <div className="p-5">
                    <p className="text-xs text-[#605e5c]">Total Enquiries</p>
                    <p className="font-editorial text-3xl text-[#1a1918] mt-1 tabular-nums">
                      {metrics.totalEnquiries}
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-[#605e5c]">New / Uncontacted</p>
                    <p className="font-editorial text-3xl text-[#725b38] mt-1 tabular-nums">
                      {metrics.newCount}
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-[#605e5c]">Visits Scheduled</p>
                    <p className="font-editorial text-3xl text-[#1a1918] mt-1 tabular-nums">
                      {metrics.visitCount}
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-[#605e5c]">Units Available</p>
                    <p className="font-editorial text-3xl text-[#1a1918] mt-1 tabular-nums">
                      {metrics.availableCount} / 5
                    </p>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="bg-[#ffffff] border border-[#e5dfd5] rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#605e5c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={enquiryQuery}
                      onChange={(e) => setEnquiryQuery(e.target.value)}
                      placeholder="Search applicant name, phone, floor..."
                      className="w-full pl-10 pr-4 py-2 text-sm bg-[#f6f4f0] border border-[#e5dfd5] rounded-[6px] focus:bg-[#ffffff] focus:border-[#725b38] focus:outline-none min-h-[40px]"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-[#f6f4f0] border border-[#e5dfd5] rounded-[6px] overflow-x-auto">
                    {(['All', 'New', 'Contacted', 'Visit Scheduled', 'Closed'] as const).map(
                      (statusTab) => (
                        <button
                          key={statusTab}
                          type="button"
                          onClick={() => setEnquiryFilter(statusTab)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            enquiryFilter === statusTab
                              ? 'bg-[#1a1918] text-[#fbf9f6]'
                              : 'text-[#4d463c] hover:text-[#1a1918]'
                          }`}
                        >
                          {statusTab}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Enquiries List */}
                {filteredEnquiries.length === 0 ? (
                  <div className="bg-[#ffffff] border border-[#e5dfd5] rounded-[8px] p-12 text-center">
                    <p className="font-editorial text-2xl text-[#1a1918]">
                      {enquiries.length === 0
                        ? 'No rental enquiries recorded yet'
                        : 'No enquiries match this search or filter'}
                    </p>
                    <p className="text-sm text-[#605e5c] mt-2 max-w-md mx-auto">
                      {enquiries.length === 0
                        ? `Submissions from visitors are saved here and emailed directly to ${integrationStatus?.notificationEmail || 'ajservices2132@gmail.com'}.`
                        : 'Clear your search query or switch back to All Enquiries.'}
                    </p>
                    {enquiries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEnquiryFilter('All');
                          setEnquiryQuery('');
                        }}
                        className="mt-5 px-4 py-2 text-xs font-semibold bg-[#1a1918] text-[#fbf9f6] rounded-[6px] cursor-pointer"
                      >
                        Show All Enquiries
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#ffffff] border border-[#e5dfd5] rounded-[8px] divide-y divide-[#e5dfd5]">
                    {filteredEnquiries.map((item) => {
                      const replyWhatsAppHref = `https://wa.me/91${item.mobileNumber}?text=${encodeURIComponent(
                        `Hello ${item.fullName}, thank you for enquiring about AJ GRAND (${item.interestedBhk} · ${item.preferredFloor}). When would you like to schedule your visit?`
                      )}`;
                      const emailForwardHref = `mailto:${encodeURIComponent(
                        integrationStatus?.notificationEmail || 'ajservices2132@gmail.com'
                      )}?subject=${encodeURIComponent(
                        `AJ GRAND Enquiry: ${item.fullName} (${item.interestedBhk})`
                      )}&body=${encodeURIComponent(
                        `Name: ${item.fullName}\nMobile: +91 ${item.mobileNumber}\nInterest: ${item.interestedBhk} (${item.preferredFloor})\nVisit Date: ${item.preferredVisitDate || 'Not specified'}\nMessage: ${item.message || 'None'}`
                      )}`;

                      return (
                        <div
                          key={item.id}
                          className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center hover:bg-[#fbf9f6] transition-colors"
                        >
                          <div className="lg:col-span-4 space-y-1.5">
                            <p className="font-semibold text-base text-[#1a1918]">
                              {item.fullName}
                            </p>
                            <p className="text-sm font-medium text-[#725b38] tabular-nums">
                              +91 {item.mobileNumber}
                            </p>
                            <p className="text-xs text-[#605e5c] tabular-nums">
                              {new Date(item.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2">
                              <a
                                href={`tel:+91${item.mobileNumber}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1a1918] text-[#fbf9f6] rounded-[4px] hover:bg-[#725b38] whitespace-nowrap"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call</span>
                              </a>
                              <a
                                href={replyWhatsAppHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#c5a880] text-[#1a1918] rounded-[4px] hover:bg-[#e0c298] whitespace-nowrap"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                              <a
                                href={emailForwardHref}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#dfd8cd] bg-[#ffffff] text-[#1a1918] rounded-[4px] hover:bg-[#f6f4f0] whitespace-nowrap"
                              >
                                <Mail className="w-3 h-3 text-[#725b38]" />
                                <span>Email</span>
                              </a>
                            </div>
                          </div>

                          <div className="lg:col-span-5 text-xs text-[#4d463c] space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-[#1a1918]">
                              <span className="font-semibold">{item.interestedBhk}</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.preferredFloor}</span>
                            </div>
                            {item.sourcePropertyName && (
                              <p>
                                <span className="text-[#605e5c]">Source Residence:</span>{' '}
                                {item.sourcePropertyName}
                              </p>
                            )}
                            {item.preferredVisitDate && (
                              <p className="tabular-nums">
                                <span className="text-[#605e5c]">Preferred Visit:</span>{' '}
                                {item.preferredVisitDate}
                              </p>
                            )}
                            {item.message && (
                              <p className="text-[#1a1918] pt-1 leading-[1.5]">
                                &ldquo;{item.message}&rdquo;
                              </p>
                            )}
                            {item.notifications && (
                              <p className="pt-1 text-[11px] text-[#605e5c]">
                                Email Alert:{' '}
                                <span className="font-medium text-[#1a1918]">
                                  {item.notifications.email?.status === 'sent'
                                    ? 'Sent'
                                    : item.notifications.email?.status === 'failed'
                                      ? `Failed (${item.notifications.email.detail})`
                                      : 'Not configured'}
                                </span>{' '}
                                · WhatsApp Push:{' '}
                                <span className="font-medium text-[#1a1918]">
                                  {item.notifications.whatsapp?.status === 'sent'
                                    ? 'Sent'
                                    : item.notifications.whatsapp?.status === 'failed'
                                      ? 'Failed'
                                      : 'Not configured'}
                                </span>
                              </p>
                            )}
                          </div>

                          <div className="lg:col-span-3 flex lg:justify-end">
                            <select
                              aria-label={`Status for ${item.fullName}`}
                              value={item.status}
                              onChange={(e) =>
                                handleEnquiryStatusChange(
                                  item.id,
                                  e.target.value as EnquiryRecord['status']
                                )
                              }
                              className="px-3.5 py-2 text-xs font-semibold bg-[#f6f4f0] border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none min-h-[38px]"
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Visit Scheduled">Visit Scheduled</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: RESIDENCES & PHOTO STUDIO */}
            {activeTab === 'properties' && activeProperty && activeDraft && (
              <div className="space-y-6">
                {/* 5-Residence Selector Bar (First Floor is never included) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {properties.map((unit) => {
                    const draft = propertyDrafts[unit.id];
                    const isSelected = unit.id === selectedPropertyId;
                    const photoCount = draft?.imageUrls.length ?? unit.images.length;
                    const statusText = draft?.availabilityStatus || unit.availabilityStatus;
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => setSelectedPropertyId(unit.id)}
                        className={`text-left p-4 rounded-[8px] border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a1918] text-[#fbf9f6] border-[#1a1918]'
                            : 'bg-[#ffffff] text-[#1a1918] border-[#e5dfd5] hover:border-[#c5a880]'
                        }`}
                      >
                        <p
                          className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                            isSelected ? 'text-[#e0c298]' : 'text-[#725b38]'
                          }`}
                        >
                          {unit.floorLabel}
                        </p>
                        <p className="font-editorial text-lg mt-0.5 truncate">
                          {unit.bhkConfiguration}
                        </p>
                        <p
                          className={`text-[11px] mt-1.5 tabular-nums ${
                            isSelected ? 'text-[#dfd8cd]' : 'text-[#605e5c]'
                          }`}
                        >
                          {photoCount} photo{photoCount === 1 ? '' : 's'} · {statusText}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Home Workspace */}
                <div className="bg-[#ffffff] border border-[#e5dfd5] rounded-[8px] p-6 md:p-8 space-y-8">
                  {/* Photo Upload & Gallery Management Section */}
                  <div className="space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5dfd5]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38]">
                          Photo Manager · {activeProperty.floorLabel}
                        </p>
                        <h2 className="font-editorial text-2xl md:text-3xl text-[#1a1918] mt-0.5">
                          {activeProperty.name}
                        </h2>
                        <p className="text-xs text-[#605e5c] mt-1 tabular-nums">
                          Every uploaded photo is automatically sized to{' '}
                          <strong className="text-[#1a1918]">
                            {STANDARD_PROPERTY_IMAGE_WIDTH} × {STANDARD_PROPERTY_IMAGE_HEIGHT} px
                            (4:3)
                          </strong>{' '}
                          to match existing gallery frames across all listings.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <div
                          role="group"
                          aria-label="Photo framing mode"
                          className="inline-flex items-center gap-1 p-1 bg-[#f6f4f0] border border-[#e5dfd5] rounded-[6px]"
                        >
                          <button
                            type="button"
                            onClick={() => setImageFitMode('cover')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-[4px] whitespace-nowrap cursor-pointer ${
                              imageFitMode === 'cover'
                                ? 'bg-[#1a1918] text-[#fbf9f6]'
                                : 'text-[#4d463c] hover:text-[#1a1918]'
                            }`}
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Fill 4:3</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageFitMode('contain')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-[4px] whitespace-nowrap cursor-pointer ${
                              imageFitMode === 'contain'
                                ? 'bg-[#1a1918] text-[#fbf9f6]'
                                : 'text-[#4d463c] hover:text-[#1a1918]'
                            }`}
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Fit Whole</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleRestoreStarterPhotos}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-[#dfd8cd] bg-[#ffffff] text-[#4d463c] rounded-[6px] hover:text-[#1a1918] hover:bg-[#f6f4f0] whitespace-nowrap cursor-pointer min-h-[38px]"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Starter Photos</span>
                        </button>
                      </div>
                    </div>

                    {/* Drag-and-drop & File Picker Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        if (e.dataTransfer.files?.length) {
                          void handleUploadNewPhotos(e.dataTransfer.files);
                        }
                      }}
                      className={`border-2 border-dashed rounded-[8px] p-6 text-center transition-colors ${
                        isDraggingOver
                          ? 'border-[#725b38] bg-[#f4efea]'
                          : 'border-[#dfd8cd] bg-[#fbf9f6]'
                      }`}
                    >
                      <input
                        ref={addFileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            void handleUploadNewPhotos(e.target.files);
                          }
                        }}
                      />
                      <div className="flex flex-col items-center gap-2.5">
                        {uploadingImage ? (
                          <Loader2 className="w-6 h-6 text-[#725b38] animate-spin" />
                        ) : (
                          <ImagePlus className="w-6 h-6 text-[#725b38]" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#1a1918]">
                            {uploadingImage
                              ? 'Resizing & uploading photos...'
                              : `Upload Photos for ${activeProperty.name}`}
                          </p>
                          <p className="text-xs text-[#605e5c] mt-0.5">
                            Drag and drop JPG, PNG, or WebP photos here, or browse from your device.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={() => addFileInputRef.current?.click()}
                          className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[6px] hover:bg-[#725b38] disabled:opacity-60 cursor-pointer min-h-[40px]"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Select Photos to Upload</span>
                        </button>
                      </div>
                    </div>

                    {/* Visual 4:3 Photo Grid */}
                    {activeDraft.imageUrls.length === 0 ? (
                      <div className="p-8 bg-[#f6f4f0] border border-[#e5dfd5] rounded-[6px] text-center text-sm text-[#605e5c]">
                        All photos removed for this home. Upload new photos above or click{' '}
                        <strong>Restore Starter Photos</strong>.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {activeDraft.imageUrls.map((url, idx) => {
                          const isReplacing = replacingIndex === idx;
                          return (
                            <div
                              key={`${activeProperty.id}-${url}-${idx}`}
                              className="border border-[#e5dfd5] bg-[#fbf9f6] rounded-[6px] overflow-hidden flex flex-col"
                            >
                              <div className="relative aspect-[4/3] w-full bg-[#eae8e5] overflow-hidden">
                                <ResilientImage
                                  src={url}
                                  alt={`${activeProperty.name} photo ${idx + 1}`}
                                  fallbackTitle={`Photo ${idx + 1}`}
                                  lazy={false}
                                  className="w-full h-full object-cover"
                                />
                                {isReplacing && (
                                  <div className="absolute inset-0 bg-[#1a1918]/70 flex items-center justify-center text-xs font-semibold text-[#fbf9f6] gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Updating...</span>
                                  </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1a1918]/80 via-[#1a1918]/30 to-transparent px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-[#fbf9f6]">
                                  <span className="tabular-nums">
                                    {idx === 0 ? 'Cover Photo (#1)' : `Gallery #${idx + 1}`}
                                  </span>
                                  <span className="text-[#e0c298] tabular-nums">4:3</span>
                                </div>
                              </div>

                              {/* Per-Photo Action Controls */}
                              <div className="p-2.5 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    disabled={isReplacing}
                                    onClick={() => {
                                      replaceTargetIndexRef.current = idx;
                                      replaceFileInputRef.current?.click();
                                    }}
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold bg-[#ffffff] border border-[#dfd8cd] text-[#1a1918] rounded-[4px] hover:border-[#725b38] hover:bg-[#f4efea] cursor-pointer whitespace-nowrap"
                                  >
                                    <Upload className="w-3 h-3 text-[#725b38]" />
                                    <span>Replace</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePhotoAtSlot(idx)}
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold bg-[#ffffff] border border-[#f2d0ce] text-[#93000a] rounded-[4px] hover:bg-[#fff1f0] cursor-pointer whitespace-nowrap"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>

                                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#e5dfd5]">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMovePhoto(idx, idx - 1)}
                                      aria-label={`Move photo ${idx + 1} left`}
                                      className="p-1.5 text-[#4d463c] hover:text-[#1a1918] disabled:opacity-30 rounded-[4px] hover:bg-[#eae8e5] cursor-pointer"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === activeDraft.imageUrls.length - 1}
                                      onClick={() => handleMovePhoto(idx, idx + 1)}
                                      aria-label={`Move photo ${idx + 1} right`}
                                      className="p-1.5 text-[#4d463c] hover:text-[#1a1918] disabled:opacity-30 rounded-[4px] hover:bg-[#eae8e5] cursor-pointer"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMovePhoto(idx, 0)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#725b38] hover:text-[#1a1918] cursor-pointer"
                                    >
                                      <Star className="w-3 h-3" />
                                      <span>Set Cover</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Pricing, Availability & Description Form */}
                  <div className="pt-8 border-t border-[#e5dfd5] space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-editorial text-2xl text-[#1a1918]">
                          Pricing, Status &amp; Description
                        </h3>
                        <p className="text-xs text-[#605e5c] mt-0.5">
                          Leave rent, deposit, or availability date blank to keep them hidden on the
                          public website.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={savingPropertyId === activeProperty.id}
                        onClick={() => handleSavePropertyDetails(activeProperty.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[6px] hover:bg-[#725b38] disabled:opacity-60 cursor-pointer min-h-[42px]"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>
                          {savingPropertyId === activeProperty.id
                            ? 'Saving...'
                            : 'Save Residence Details'}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                          Monthly Rent
                        </label>
                        <input
                          type="text"
                          value={activeDraft.rentAmount}
                          onChange={(e) =>
                            setPropertyDrafts((prev) => ({
                              ...prev,
                              [activeProperty.id]: {
                                ...activeDraft,
                                rentAmount: e.target.value,
                              },
                            }))
                          }
                          placeholder="Blank = hidden"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#ffffff] border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                          Security Deposit
                        </label>
                        <input
                          type="text"
                          value={activeDraft.securityDeposit}
                          onChange={(e) =>
                            setPropertyDrafts((prev) => ({
                              ...prev,
                              [activeProperty.id]: {
                                ...activeDraft,
                                securityDeposit: e.target.value,
                              },
                            }))
                          }
                          placeholder="Blank = hidden"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#ffffff] border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                          Quoted Area
                        </label>
                        <input
                          type="text"
                          value={activeDraft.dimensions}
                          onChange={(e) =>
                            setPropertyDrafts((prev) => ({
                              ...prev,
                              [activeProperty.id]: {
                                ...activeDraft,
                                dimensions: e.target.value,
                              },
                            }))
                          }
                          placeholder="600 sq.ft."
                          className="w-full px-3.5 py-2.5 text-sm bg-[#ffffff] border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                          Availability Status
                        </label>
                        <select
                          value={activeDraft.availabilityStatus}
                          onChange={(e) =>
                            setPropertyDrafts((prev) => ({
                              ...prev,
                              [activeProperty.id]: {
                                ...activeDraft,
                                availabilityStatus: e.target
                                  .value as Property['availabilityStatus'],
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 text-sm bg-[#ffffff] border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none"
                        >
                          <option value="Available for Rent">Available for Rent</option>
                          <option value="Reserved">Reserved</option>
                          <option value="Leased">Leased</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                          Available From Date
                        </label>
                        <input
                          type="text"
                          value={activeDraft.availabilityDate}
                          onChange={(e) =>
                            setPropertyDrafts((prev) => ({
                              ...prev,
                              [activeProperty.id]: {
                                ...activeDraft,
                                availabilityDate: e.target.value,
                              },
                            }))
                          }
                          placeholder="Blank = hidden"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#ffffff] border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                          Residence Description
                        </label>
                        <textarea
                          rows={3}
                          value={activeDraft.description}
                          onChange={(e) =>
                            setPropertyDrafts((prev) => ({
                              ...prev,
                              [activeProperty.id]: {
                                ...activeDraft,
                                description: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 text-sm bg-[#ffffff] border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SETTINGS & ALERTS */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleSaveContactConfig}
                  className="lg:col-span-7 bg-[#ffffff] border border-[#e5dfd5] rounded-[8px] p-6 md:p-7 space-y-5"
                >
                  <div>
                    <h2 className="font-editorial text-2xl text-[#1a1918]">
                      Contact &amp; Alert Configuration
                    </h2>
                    <p className="text-xs text-[#605e5c] mt-1">
                      Build-time environment variables (<code>VITE_BUSINESS_PHONE</code>,{' '}
                      <code>VITE_WHATSAPP_NUMBER</code>) take priority if set.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                        Business Mobile Number
                      </label>
                      <input
                        type="text"
                        value={contactDraft.businessPhone}
                        onChange={(e) =>
                          setContactDraft((p) => ({ ...p, businessPhone: e.target.value }))
                        }
                        placeholder="+91 ..."
                        className="w-full px-3.5 py-2.5 text-sm border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                        WhatsApp Business Number
                      </label>
                      <input
                        type="text"
                        value={contactDraft.whatsappNumber}
                        onChange={(e) =>
                          setContactDraft((p) => ({ ...p, whatsappNumber: e.target.value }))
                        }
                        placeholder="91XXXXXXXXXX"
                        className="w-full px-3.5 py-2.5 text-sm border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                        Public Business Email
                      </label>
                      <input
                        type="email"
                        value={contactDraft.businessEmail}
                        onChange={(e) =>
                          setContactDraft((p) => ({ ...p, businessEmail: e.target.value }))
                        }
                        placeholder="leasing@..."
                        className="w-full px-3.5 py-2.5 text-sm border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                        Enquiry Alert Email (Owner)
                      </label>
                      <input
                        type="email"
                        value={contactDraft.notificationEmail}
                        onChange={(e) =>
                          setContactDraft((p) => ({ ...p, notificationEmail: e.target.value }))
                        }
                        placeholder="ajservices2132@gmail.com"
                        className="w-full px-3.5 py-2.5 text-sm border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                        Public Website URL
                      </label>
                      <input
                        type="url"
                        value={contactDraft.websiteUrl}
                        onChange={(e) =>
                          setContactDraft((p) => ({ ...p, websiteUrl: e.target.value }))
                        }
                        placeholder="https://..."
                        className="w-full px-3.5 py-2.5 text-sm border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#605e5c] mb-1.5">
                        Google Maps URL
                      </label>
                      <input
                        type="url"
                        value={contactDraft.googleMapsUrl}
                        onChange={(e) =>
                          setContactDraft((p) => ({ ...p, googleMapsUrl: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 text-sm border border-[#dfd8cd] rounded-[6px] focus:border-[#725b38] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] rounded-[6px] hover:bg-[#725b38] cursor-pointer min-h-[42px]"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Contact Settings</span>
                    </button>
                    <button
                      type="button"
                      disabled={testingEmail}
                      onClick={handleSendTestEmail}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#c5a880] text-[#1a1918] rounded-[6px] hover:bg-[#e0c298] disabled:opacity-60 cursor-pointer min-h-[42px]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{testingEmail ? 'Sending...' : 'Send Test Email Alert'}</span>
                    </button>
                  </div>
                </form>

                <div className="lg:col-span-5 bg-[#ffffff] border border-[#e5dfd5] rounded-[8px] p-6 md:p-7 space-y-4">
                  <h2 className="font-editorial text-2xl text-[#1a1918]">
                    System &amp; Alert Status
                  </h2>
                  <dl className="divide-y divide-[#e5dfd5] text-xs">
                    {[
                      ['Enquiry Storage', 'Active (Server JSON)'],
                      ['Unit Photo Storage', 'Active (4:3 / 1200 × 900 px)'],
                      [
                        'Alert Email Recipient',
                        integrationStatus?.notificationEmail || 'ajservices2132@gmail.com',
                      ],
                      [
                        'Email Delivery (Gmail SMTP)',
                        integrationStatus?.emailProviderConfigured
                          ? 'Active & Ready'
                          : 'Add SMTP_PASS or RESEND_API_KEY',
                      ],
                      [
                        'WhatsApp Cloud Auto-Push',
                        integrationStatus?.whatsappCloudConfigured
                          ? 'Active & Ready'
                          : 'Optional (WHATSAPP_CLOUD_TOKEN)',
                      ],
                      [
                        'Enquiry Webhook',
                        integrationStatus?.enquiryWebhookConfigured
                          ? 'Configured'
                          : 'Optional (ENQUIRY_WEBHOOK_URL)',
                      ],
                      [
                        'Google Analytics 4',
                        config.tracking.ga4MeasurementId
                          ? 'Configured'
                          : 'Set VITE_GA4_MEASUREMENT_ID',
                      ],
                      [
                        'Google Ads Conversion',
                        config.tracking.googleAdsId
                          ? 'Configured'
                          : 'Set VITE_GOOGLE_ADS_ID',
                      ],
                      [
                        'Meta Pixel',
                        config.tracking.metaPixelId
                          ? 'Configured'
                          : 'Set VITE_META_PIXEL_ID',
                      ],
                    ].map(([label, val]) => (
                      <div key={label} className="py-3 flex justify-between gap-4">
                        <dt className="text-[#605e5c]">{label}</dt>
                        <dd className="font-semibold text-[#1a1918] text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
