import { Property } from '../data/properties';
import { SiteConfig } from '../config/siteConfig';

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

function upsertPropertyJsonLd(property: Property | null, config: SiteConfig): void {
  const existing = document.getElementById('aj-property-jsonld');
  if (!property) {
    existing?.remove();
    return;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: `${property.name} at ${config.brandName}`,
    description: property.description,
    floorLevel: property.floorLabel,
    numberOfRooms: property.bhkConfiguration === '2 BHK' ? 2 : 1,
    amenityFeature: property.amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address.street,
      addressLocality: `${config.address.locality}, ${config.address.city}`,
      addressRegion: config.address.state,
      postalCode: config.address.postalCode,
      addressCountry: config.address.country,
    },
  };

  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'aj-property-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

export function updatePageSeo(params: {
  title: string;
  description: string;
  path: string;
  config: SiteConfig;
  property?: Property | null;
}): void {
  const { title, description, path, config, property = null } = params;
  document.title = title;

  const baseUrl = config.contact.websiteUrl || window.location.origin;
  const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${path}`;

  upsertMetaTag('name', 'description', description);
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertCanonical(canonicalUrl);
  upsertPropertyJsonLd(property, config);
}
