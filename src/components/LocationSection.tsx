import React, { useCallback, useEffect, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';
import {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsEmbedUrl,
  SiteConfig,
} from '../config/siteConfig';

interface LocationSectionProps {
  config: SiteConfig;
}

interface ResolvedPlaceItem {
  id: string;
  name: string;
  address: string;
  location: google.maps.LatLngLiteral;
  rating?: number | null;
}

const NEARBY_CATEGORIES = [
  { id: 'metro', label: 'Metro Stations', query: 'Metro station near Modi Garden Kaval Bairasandra Bengaluru' },
  { id: 'tech', label: 'Tech Parks', query: 'IT Tech Park near Hebbal Nagawara Bengaluru' },
  { id: 'hospital', label: 'Hospitals', query: 'Hospital near Kaval Bairasandra RT Nagar Bengaluru' },
  { id: 'market', label: 'Supermarkets', query: 'Supermarket grocery near Modi Garden Kaval Bairasandra Bengaluru' },
  { id: 'school', label: 'Schools', query: 'School near Kaval Bairasandra Modi Garden Bengaluru' },
] as const;

function isQuotaError(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return (
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('429') ||
    text.includes('Quota')
  );
}

const InteractiveMapContent: React.FC<{ config: SiteConfig }> = ({ config }) => {
  const map = useMap();
  const coreLib = useMapsLibrary('core');
  const placesLib = useMapsLibrary('places');

  const [propertyMarkerRef, propertyMarker] = useAdvancedMarkerRef();
  const [propertyPlace, setPropertyPlace] = useState<ResolvedPlaceItem | null>(null);
  const [propertyInfoOpen, setPropertyInfoOpen] = useState(true);
  const [resolvingProperty, setResolvingProperty] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<ResolvedPlaceItem[]>([]);
  const [selectedNearby, setSelectedNearby] = useState<ResolvedPlaceItem | null>(null);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Dynamically resolve AJ GRAND coordinates from Google Maps Places API (New)
  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;

    const resolvePropertyLocation = async () => {
      setResolvingProperty(true);
      try {
        const queries = [
          '2J82+FV Bengaluru',
          '34 Garden Main Road, Modi Garden, Kaval Bairasandra, Bengaluru, Karnataka 560006',
        ];
        for (const textQuery of queries) {
          const { places } = await placesLib.Place.searchByText({
            textQuery,
            fields: ['id', 'displayName', 'formattedAddress', 'location'],
            maxResultCount: 1,
          });
          const first = places?.[0];
          if (first?.location && !cancelled) {
            const latLng = {
              lat: first.location.lat(),
              lng: first.location.lng(),
            };
            setPropertyPlace({
              id: first.id || 'aj-grand-location',
              name: 'AJ GRAND',
              address: first.formattedAddress || config.address.fullAddress,
              location: latLng,
            });
            if (map) {
              map.panTo(latLng);
              map.setZoom(16);
            }
            break;
          }
        }
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      } finally {
        if (!cancelled) {
          setResolvingProperty(false);
        }
      }
    };

    void resolvePropertyLocation();
    return () => {
      cancelled = true;
    };
  }, [placesLib, map, config.address.fullAddress]);

  const handleSelectNearbyCategory = useCallback(
    async (category: (typeof NEARBY_CATEGORIES)[number]) => {
      if (!placesLib) return;
      if (activeCategory === category.id) {
        setActiveCategory(null);
        setNearbyPlaces([]);
        setSelectedNearby(null);
        if (map && propertyPlace) {
          map.panTo(propertyPlace.location);
          map.setZoom(16);
        }
        return;
      }

      setActiveCategory(category.id);
      setLoadingNearby(true);
      setPlacesError(null);
      setSelectedNearby(null);

      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: category.query,
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating'],
          maxResultCount: 5,
          ...(propertyPlace
            ? {
                locationBias: {
                  center: propertyPlace.location,
                  radius: 5000,
                },
              }
            : {}),
        });

        const resolved: ResolvedPlaceItem[] = (places || [])
          .filter((p) => Boolean(p.location))
          .map((p, idx) => ({
            id: p.id || `${category.id}-${idx}`,
            name: p.displayName || category.label,
            address: p.formattedAddress || '',
            location: {
              lat: p.location!.lat(),
              lng: p.location!.lng(),
            },
            rating: typeof p.rating === 'number' ? p.rating : null,
          }));

        setNearbyPlaces(resolved);

        if (map && resolved.length > 0 && coreLib) {
          const bounds = new coreLib.LatLngBounds();
          if (propertyPlace) {
            bounds.extend(propertyPlace.location);
          }
          resolved.forEach((item) => bounds.extend(item.location));
          map.fitBounds(bounds, 56);
        }
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setPlacesError('Unable to load nearby places right now.');
      } finally {
        setLoadingNearby(false);
      }
    },
    [placesLib, coreLib, activeCategory, map, propertyPlace]
  );

  return (
    <div className="space-y-3">
      {/* Neighbourhood Explorer Controls (Places API New) */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#725b38] mr-1">
          Explore Nearby:
        </span>
        {NEARBY_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              disabled={!placesLib || loadingNearby}
              onClick={() => handleSelectNearbyCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#1a1918] text-[#fbf9f6] border-[#1a1918]'
                  : 'bg-[#fbf9f6] text-[#4d463c] border-[#e8e2d9] hover:border-[#c5a880] hover:text-[#1a1918]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
        {(resolvingProperty || loadingNearby) && (
          <Loader2 className="w-3.5 h-3.5 text-[#725b38] animate-spin ml-1" />
        )}
      </div>

      {/* Interactive Google Map Canvas with explicit height */}
      <div className="relative w-full h-[360px] lg:h-[430px] rounded-[4px] overflow-hidden bg-[#eae8e5]">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: 13.0169, lng: 77.6022 }}
          defaultZoom={15}
          gestureHandling="greedy"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {propertyPlace && (
            <>
              <AdvancedMarker
                ref={propertyMarkerRef}
                position={propertyPlace.location}
                title="AJ GRAND · 34 Garden Main Road, Modi Garden"
                onClick={() => setPropertyInfoOpen(true)}
              >
                <Pin background="#1a1918" borderColor="#c5a880" glyphColor="#c5a880" scale={1.15} />
              </AdvancedMarker>

              {propertyInfoOpen && propertyMarker && (
                <InfoWindow
                  anchor={propertyMarker}
                  maxWidth={250}
                  onCloseClick={() => setPropertyInfoOpen(false)}
                >
                  <div className="text-xs text-[#1a1918] space-y-1 p-0.5">
                    <p className="font-semibold text-sm">AJ GRAND</p>
                    <p className="text-[#4d463c] leading-snug">{propertyPlace.address}</p>
                    <p className="text-[11px] text-[#725b38] font-semibold">
                      Plus Code: {config.address.plusCode}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {nearbyPlaces.map((place) => (
            <AdvancedMarker
              key={place.id}
              position={place.location}
              title={place.name}
              onClick={() => setSelectedNearby(place)}
            >
              <Pin background="#725b38" borderColor="#fbf9f6" glyphColor="#fbf9f6" scale={0.95} />
            </AdvancedMarker>
          ))}

          {selectedNearby && (
            <InfoWindow
              position={selectedNearby.location}
              maxWidth={240}
              onCloseClick={() => setSelectedNearby(null)}
            >
              <div className="text-xs text-[#1a1918] space-y-1 p-0.5">
                <p className="font-semibold">{selectedNearby.name}</p>
                {selectedNearby.address && (
                  <p className="text-[#4d463c] leading-snug">{selectedNearby.address}</p>
                )}
                {typeof selectedNearby.rating === 'number' && (
                  <p className="text-[11px] font-semibold text-[#725b38] tabular-nums">
                    Rating: {selectedNearby.rating.toFixed(1)} / 5
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {placesError && <p className="text-xs text-[#93000a] px-1">{placesError}</p>}

      {nearbyPlaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-1 pt-1">
          {nearbyPlaces.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => {
                setSelectedNearby(place);
                if (map) {
                  map.panTo(place.location);
                  map.setZoom(16);
                }
              }}
              className="text-left p-2.5 bg-[#fbf9f6] border border-[#e8e2d9] rounded-[4px] hover:border-[#c5a880] transition-colors cursor-pointer"
            >
              <p className="text-xs font-semibold text-[#1a1918] truncate">{place.name}</p>
              {place.address && (
                <p className="text-[11px] text-[#605e5c] truncate mt-0.5">{place.address}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const LocationSection: React.FC<LocationSectionProps> = ({ config }) => {
  const directionsUrl = getGoogleMapsDirectionsUrl(config);
  const embedUrl = getGoogleMapsEmbedUrl(config);
  const mapsApiKey = config.maps.googleMapsApiKey;

  return (
    <section id="location" className="py-16 md:py-24 bg-[#fbf9f6] border-b border-[#e8e2d9]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Address & Neighborhood Details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#725b38] mb-3">
                Location &amp; Connectivity
              </p>
              <h2 className="font-editorial text-3xl md:text-[2.5rem] leading-[1.15] text-[#1a1918] mb-5">
                Modi Garden, Kaval Bairasandra
              </h2>
              <p className="text-sm md:text-base text-[#4d463c] leading-[1.7] mb-7">
                Set in a serene residential pocket of North Bengaluru beside peaceful defence land,
                AJ GRAND balances quiet neighbourhood greenery with convenient access to Hebbal,
                Nagawara, Manyata Tech Park, RT Nagar, and Central Bengaluru.
              </p>

              <div className="bg-[#f4efea] border border-[#e8e2d9] rounded-[6px] p-6 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b38] mb-1">
                    Property Address
                  </p>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm md:text-base font-medium text-[#1a1918] hover:text-[#725b38] transition-colors inline-flex items-start gap-2"
                  >
                    <MapPin className="w-4 h-4 text-[#725b38] shrink-0 mt-1" />
                    <span>{config.address.fullAddress}</span>
                  </a>
                </div>

                <div className="pt-3 border-t border-[#e8e2d9] flex items-center justify-between text-xs">
                  <span className="text-[#605e5c] uppercase tracking-[0.08em] font-semibold">
                    Google Maps Plus Code
                  </span>
                  <span className="font-semibold text-[#1a1918] tabular-nums">
                    {config.address.plusCode}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors min-h-[44px]"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions</span>
              </a>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#ffffff] text-[#1a1918] border border-[#d1c5b8] rounded-[4px] hover:border-[#725b38] transition-colors min-h-[44px]"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Interactive Google Maps Platform Frame */}
          <div className="lg:col-span-7 flex">
            <div className="w-full bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] p-3 shadow-warm-ambient flex flex-col justify-between">
              {mapsApiKey ? (
                <APIProvider
                  apiKey={mapsApiKey}
                  libraries={['places', 'marker']}
                  language="en"
                  region="IN"
                >
                  <InteractiveMapContent config={config} />
                </APIProvider>
              ) : (
                <div className="relative w-full h-[360px] lg:h-[430px] rounded-[4px] overflow-hidden bg-[#eae8e5]">
                  <iframe
                    title="AJ GRAND Location Map — 34 Garden Main Road, Modi Garden, Kaval Bairasandra, Bengaluru"
                    src={embedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              <div className="pt-3 px-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#605e5c]">
                <span>34, Garden Main Road, Modi Garden, Bengaluru 560006</span>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#725b38] hover:underline"
                >
                  {config.address.plusCode}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
