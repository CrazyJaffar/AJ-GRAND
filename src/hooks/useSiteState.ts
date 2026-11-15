import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SITE_CONFIG, SiteConfig } from '../config/siteConfig';
import { INITIAL_PROPERTIES, Property } from '../data/properties';

interface PublicPropertyOverride {
  description?: string;
  rentAmount?: string | null;
  securityDeposit?: string | null;
  dimensions?: string | null;
  availabilityDate?: string | null;
  availabilityStatus?: 'Available for Rent' | 'Reserved' | 'Leased';
  imageUrls?: string[];
}

interface PublicConfigOverride {
  businessPhone?: string;
  whatsappNumber?: string;
  businessEmail?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
}

export function useSiteState() {
  const [propertyOverrides, setPropertyOverrides] = useState<
    Record<string, PublicPropertyOverride>
  >({});
  const [configOverrides, setConfigOverrides] = useState<PublicConfigOverride>({});
  const [loaded, setLoaded] = useState(false);

  const refreshPublicData = useCallback(async () => {
    try {
      const res = await fetch('/api/public-data');
      if (!res.ok) return;
      const data = (await res.json()) as {
        propertyOverrides?: Record<string, PublicPropertyOverride>;
        configOverrides?: PublicConfigOverride;
      };
      if (data.propertyOverrides) {
        setPropertyOverrides(data.propertyOverrides);
      }
      if (data.configOverrides) {
        setConfigOverrides(data.configOverrides);
      }
    } catch {
      // Fall back silently to static INITIAL_PROPERTIES and DEFAULT_SITE_CONFIG
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refreshPublicData();
  }, [refreshPublicData]);

  const siteConfig: SiteConfig = useMemo(() => {
    return {
      ...DEFAULT_SITE_CONFIG,
      contact: {
        businessPhone:
          DEFAULT_SITE_CONFIG.contact.businessPhone ||
          configOverrides.businessPhone ||
          '',
        whatsappNumber:
          DEFAULT_SITE_CONFIG.contact.whatsappNumber ||
          configOverrides.whatsappNumber ||
          '',
        businessEmail:
          DEFAULT_SITE_CONFIG.contact.businessEmail ||
          configOverrides.businessEmail ||
          '',
        websiteUrl:
          DEFAULT_SITE_CONFIG.contact.websiteUrl ||
          configOverrides.websiteUrl ||
          '',
      },
      maps: {
        ...DEFAULT_SITE_CONFIG.maps,
        googleMapsUrl:
          configOverrides.googleMapsUrl || DEFAULT_SITE_CONFIG.maps.googleMapsUrl,
      },
    };
  }, [configOverrides]);

  const properties: Property[] = useMemo(() => {
    return INITIAL_PROPERTIES.map((prop) => {
      const ov = propertyOverrides[prop.id];
      if (!ov) return prop;

      const updatedImages =
        Array.isArray(ov.imageUrls) && ov.imageUrls.length > 0
          ? ov.imageUrls.map((url, idx) => ({
              url,
              alt: prop.images[idx]?.alt || `${prop.name} interior view ${idx + 1}`,
              caption: prop.images[idx]?.caption || `${prop.name} · View ${idx + 1}`,
              isTemporaryPlaceholder: false,
            }))
          : prop.images;

      return {
        ...prop,
        description: ov.description || prop.description,
        rentAmount: ov.rentAmount !== undefined ? ov.rentAmount : prop.rentAmount,
        securityDeposit:
          ov.securityDeposit !== undefined ? ov.securityDeposit : prop.securityDeposit,
        dimensions: ov.dimensions !== undefined ? ov.dimensions : prop.dimensions,
        availabilityDate:
          ov.availabilityDate !== undefined
            ? ov.availabilityDate
            : prop.availabilityDate,
        availabilityStatus: ov.availabilityStatus || prop.availabilityStatus,
        images: updatedImages,
      };
    });
  }, [propertyOverrides]);

  return {
    siteConfig,
    properties,
    loaded,
    refreshPublicData,
  };
}
