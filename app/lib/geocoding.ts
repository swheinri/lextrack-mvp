export type GeocodeAddressInput = {
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  label?: string | null;
};

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  lat: number;
  lon: number;
  displayName: string;
  formatted: string;
  confidence: number | null;
  source: 'geoapify';
};

function normalizePart(value: unknown): string {
  return String(value ?? '').trim();
}

function buildAddressText(input: GeocodeAddressInput | string): string {
  if (typeof input === 'string') return input.trim();

  const streetLine = [input.street, input.houseNumber]
    .map(normalizePart)
    .filter(Boolean)
    .join(' ');

  return [
    normalizePart(input.addressLine1),
    streetLine,
    normalizePart(input.addressLine2),
    normalizePart(input.postalCode),
    normalizePart(input.city),
    normalizePart(input.state),
    normalizePart(input.country),
  ]
    .filter(Boolean)
    .join(', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function geocodeAddress(
  input: GeocodeAddressInput | string
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();

  if (!apiKey) {
    console.warn('[geocoding] GEOAPIFY_API_KEY fehlt. Standort bleibt nicht lokalisiert.');
    return null;
  }

  const text = buildAddressText(input);

  if (!text) {
    console.warn('[geocoding] Keine Adresse angegeben. Standort bleibt nicht lokalisiert.');
    return null;
  }

  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.searchParams.set('text', text);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('lang', 'de');
  url.searchParams.set('apiKey', apiKey);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(
        '[geocoding] Geoapify Anfrage fehlgeschlagen:',
        response.status,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    const result = Array.isArray(data?.results) ? data.results[0] : null;

    if (!result) {
      console.warn('[geocoding] Kein Geoapify Treffer fuer:', text);
      return null;
    }

    const latitude =
      typeof result.lat === 'number'
        ? result.lat
        : typeof result.latitude === 'number'
          ? result.latitude
          : null;

    const longitude =
      typeof result.lon === 'number'
        ? result.lon
        : typeof result.longitude === 'number'
          ? result.longitude
          : null;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.warn('[geocoding] Geoapify Treffer ohne Koordinaten fuer:', text);
      return null;
    }

    const formatted =
      typeof result.formatted === 'string' && result.formatted.trim()
        ? result.formatted.trim()
        : text;

    const confidence =
      typeof result.rank?.confidence === 'number'
        ? result.rank.confidence
        : typeof result.confidence === 'number'
          ? result.confidence
          : null;

    return {
      latitude,
      longitude,
      lat: latitude,
      lon: longitude,
      displayName: formatted,
      formatted,
      confidence,
      source: 'geoapify',
    };
  } catch (error) {
    console.warn('[geocoding] Geoapify Anfrage konnte nicht ausgefuehrt werden:', error);
    return null;
  }
}

export const geocodeLocationAddress = geocodeAddress;
