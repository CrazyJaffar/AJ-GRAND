import { useCallback, useEffect, useState } from 'react';
import {
  buildTelHref,
  buildWhatsAppHref,
} from './config/siteConfig';
import { Property } from './data/properties';
import { useSiteState } from './hooks/useSiteState';
import {
  ConsentStatus,
  getStoredConsent,
  initializeTrackingIfConsented,
  setStoredConsent,
  trackEvent,
} from './utils/analytics';
import { updatePageSeo } from './utils/seo';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PropertyListingsSection } from './components/PropertyListingsSection';
import { FloorOverviewSection } from './components/FloorOverviewSection';
import { AmenitiesAndGallerySection } from './components/AmenitiesAndGallerySection';
import { LocationSection } from './components/LocationSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { EnquirySection } from './components/EnquirySection';
import { PropertyDetailView } from './components/PropertyDetailView';
import { Footer } from './components/Footer';
import { MobileStickyBar } from './components/MobileStickyBar';
import { ConsentBanner } from './components/ConsentBanner';
import { ContactModal } from './components/ContactModal';
import { AdminDashboard } from './components/AdminDashboard';
import { GeminiConciergeChat } from './components/GeminiConciergeChat';

function resolveRouteFromPath(pathname: string): {
  view: 'home' | 'detail' | 'admin';
  slug: string | null;
} {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/admin') {
    return { view: 'admin', slug: null };
  }
  if (clean.startsWith('/residences/')) {
    return { view: 'detail', slug: clean.replace('/residences/', '') };
  }
  return { view: 'home', slug: null };
}

export default function App() {
  const { siteConfig, properties, refreshPublicData } = useSiteState();
  const [route, setRoute] = useState(() =>
    resolveRouteFromPath(window.location.pathname)
  );
  const [selectedPropertyForEnquiry, setSelectedPropertyForEnquiry] =
    useState<Property | null>(null);
  const [contactModalState, setContactModalState] = useState<{
    mode: 'call' | 'whatsapp' | null;
    property: Property | null;
  }>({ mode: null, property: null });
  const [consent, setConsent] = useState<ConsentStatus>(() => getStoredConsent());
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const activeProperty =
    route.view === 'detail' && route.slug
      ? properties.find((p) => p.slug === route.slug) || null
      : null;

  const navigateTo = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(resolveRouteFromPath(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Browser back / forward navigation support
  useEffect(() => {
    const onPopState = () => {
      setRoute(resolveRouteFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Initialize tracking when consent is granted and update SEO per route
  useEffect(() => {
    if (consent === 'granted') {
      initializeTrackingIfConsented(siteConfig);
    }

    if (route.view === 'admin') {
      updatePageSeo({
        title: 'Owner Portal | AJ GRAND',
        description: 'Administrative portal for AJ GRAND rental management.',
        path: '/admin',
        config: siteConfig,
      });
      return;
    }

    if (route.view === 'detail' && activeProperty) {
      updatePageSeo({
        title: `${activeProperty.name} for Rent in Kaval Bairasandra | AJ GRAND`,
        description: `${activeProperty.name} at AJ GRAND, Modi Garden, Bengaluru. ${activeProperty.furnishing}. First occupancy with covered car parking.`,
        path: `/residences/${activeProperty.slug}`,
        config: siteConfig,
        property: activeProperty,
      });
      trackEvent('page_view', siteConfig, {
        path: `/residences/${activeProperty.slug}`,
        dedupeKey: `page_view:/residences/${activeProperty.slug}`,
      });
      trackEvent('view_property_details', siteConfig, {
        propertyId: activeProperty.id,
        propertyName: activeProperty.name,
        bhk: activeProperty.bhkConfiguration,
        floor: activeProperty.floorLabel,
        dedupeKey: `view_property:${activeProperty.id}`,
      });
      return;
    }

    updatePageSeo({
      title: 'AJ GRAND | Luxury 1 BHK & 2 BHK Flats for Rent in Kaval Bairasandra, Bengaluru',
      description:
        'AJ GRAND offers newly constructed luxury 1 BHK and semi-furnished 2 BHK homes for rent near Modi Garden, Kaval Bairasandra, Bengaluru. First occupancy with covered parking.',
      path: '/',
      config: siteConfig,
    });
    trackEvent('page_view', siteConfig, {
      path: '/',
      dedupeKey: 'page_view:/',
    });
  }, [route, activeProperty, siteConfig, consent]);

  const scrollToHomeSection = useCallback(
    (sectionId: string) => {
      const performScroll = () => {
        if (sectionId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      if (route.view !== 'home') {
        window.history.pushState({}, '', '/');
        setRoute({ view: 'home', slug: null });
        setTimeout(performScroll, 60);
      } else {
        performScroll();
      }
    },
    [route.view]
  );

  const handleViewDetails = (property: Property) => {
    navigateTo(`/residences/${property.slug}`);
  };

  const handleCallNow = (property: Property | null = activeProperty) => {
    trackEvent('click_call_now', siteConfig, {
      propertyId: property?.id,
      propertyName: property?.name || 'AJ GRAND',
      bhk: property?.bhkConfiguration,
      dedupeKey: `call:${property?.id || 'global'}`,
    });

    const telHref = buildTelHref(siteConfig.contact.businessPhone);
    if (telHref) {
      window.location.href = telHref;
      return;
    }
    setContactModalState({ mode: 'call', property });
  };

  const handleWhatsApp = (property: Property | null = activeProperty) => {
    trackEvent('click_whatsapp', siteConfig, {
      propertyId: property?.id,
      propertyName: property?.name || 'AJ GRAND',
      bhk: property?.bhkConfiguration,
      dedupeKey: `whatsapp:${property?.id || 'global'}`,
    });

    const waHref = buildWhatsAppHref(
      siteConfig.contact.whatsappNumber,
      property?.name
    );
    if (waHref) {
      window.location.assign(waHref);
      return;
    }
    setContactModalState({ mode: 'whatsapp', property });
  };

  const handleScheduleVisit = (property: Property | null = null) => {
    if (property) {
      setSelectedPropertyForEnquiry(property);
    }
    trackEvent('schedule_site_visit', siteConfig, {
      propertyId: property?.id,
      propertyName: property?.name || 'AJ GRAND General',
      bhk: property?.bhkConfiguration,
      dedupeKey: `intent_visit:${property?.id || 'global'}`,
    });
    scrollToHomeSection('enquire');
  };

  const handleConsentChoice = (choice: 'granted' | 'denied') => {
    setStoredConsent(choice);
    setConsent(choice);
    if (choice === 'granted') {
      initializeTrackingIfConsented(siteConfig);
    }
  };

  if (route.view === 'admin') {
    return (
      <AdminDashboard
        properties={properties}
        config={siteConfig}
        onBackHome={() => navigateTo('/')}
        onDataUpdated={refreshPublicData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-[#1b1c1a] flex flex-col">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Navbar
        onNavigateHomeSection={scrollToHomeSection}
        onScheduleVisitClick={() => handleScheduleVisit(activeProperty)}
        onOpenAdmin={() => navigateTo('/admin')}
      />

      <main className="flex-1">
        {route.view === 'detail' && activeProperty ? (
          <PropertyDetailView
            property={activeProperty}
            allProperties={properties}
            config={siteConfig}
            onBackToListing={() => scrollToHomeSection('residences')}
            onSelectOtherProperty={handleViewDetails}
            onCallNow={(prop) => handleCallNow(prop)}
            onWhatsApp={(prop) => handleWhatsApp(prop)}
            onScheduleVisit={(prop) => handleScheduleVisit(prop)}
          />
        ) : (
          <>
            <HeroSection
              config={siteConfig}
              onExploreResidences={() => scrollToHomeSection('residences')}
              onScheduleVisit={() => handleScheduleVisit(null)}
              onCallNow={() => handleCallNow(null)}
              onWhatsApp={() => handleWhatsApp(null)}
            />

            <PropertyListingsSection
              properties={properties}
              onViewDetails={handleViewDetails}
              onWhatsAppProperty={(prop) => handleWhatsApp(prop)}
              onScheduleVisitProperty={(prop) => handleScheduleVisit(prop)}
            />

            <FloorOverviewSection
              properties={properties}
              onSelectProperty={handleViewDetails}
            />

            <AmenitiesAndGallerySection />

            <LocationSection config={siteConfig} />

            <TestimonialsSection />

            <FaqSection
              onScheduleVisit={() => handleScheduleVisit(null)}
              onWhatsApp={() => handleWhatsApp(null)}
            />

            <EnquirySection
              config={siteConfig}
              selectedProperty={selectedPropertyForEnquiry}
              onCallNow={() => handleCallNow(selectedPropertyForEnquiry)}
              onWhatsApp={(prop) => handleWhatsApp(prop)}
            />
          </>
        )}
      </main>

      <Footer
        config={siteConfig}
        onNavigateSection={scrollToHomeSection}
      />

      <MobileStickyBar
        onCallNow={() => handleCallNow(activeProperty)}
        onWhatsApp={() => handleWhatsApp(activeProperty)}
        onEnquireNow={() => handleScheduleVisit(activeProperty)}
      />

      <ConsentBanner
        config={siteConfig}
        consent={consent}
        onConsentChoice={handleConsentChoice}
      />

      <ContactModal
        mode={contactModalState.mode}
        property={contactModalState.property}
        onClose={() => setContactModalState({ mode: null, property: null })}
        onProceedToEnquiry={() =>
          handleScheduleVisit(contactModalState.property)
        }
      />

      <GeminiConciergeChat
        onScheduleVisit={() => handleScheduleVisit(activeProperty)}
      />
    </div>
  );
}
