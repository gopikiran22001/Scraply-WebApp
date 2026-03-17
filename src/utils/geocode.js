const DEFAULT_REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse';
const DEFAULT_SEARCH_GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';

function getReverseGeocodeBaseUrl() {
    const configured = String(import.meta.env.VITE_GEOCODE_API_URL || '').trim();
    return configured || DEFAULT_REVERSE_GEOCODE_URL;
}

function getSearchGeocodeBaseUrl() {
    const configured = String(import.meta.env.VITE_GEOCODE_SEARCH_API_URL || '').trim();
    return configured || DEFAULT_SEARCH_GEOCODE_URL;
}

export async function reverseGeocode(latitude, longitude) {
    const baseUrl = getReverseGeocodeBaseUrl();
    const url = new URL(baseUrl);
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Geocoding failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.display_name || '';
}

export async function reverseGeocodeWithPostcode(latitude, longitude) {
    const baseUrl = getReverseGeocodeBaseUrl();
    const url = new URL(baseUrl);
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');

    const response = await fetch(url.toString(), {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Geocoding failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Try multiple ways to get postcode
    let postcode = data?.address?.postcode;
    
    // If not found, try to extract from display name
    if (!postcode) {
        postcode = extractPinCodeFromAddress(data?.display_name || '');
    }
    
    return {
        address: data?.display_name || '',
        postcode: postcode || ''
    };
}

export async function searchAddress(query, limit = 5) {
    const sanitizedQuery = String(query || '').trim();
    if (!sanitizedQuery) {
        return [];
    }

    const baseUrl = getSearchGeocodeBaseUrl();
    const url = new URL(baseUrl);
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', sanitizedQuery);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Address search failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((item) => ({
            address: item?.display_name || '',
            latitude: Number(item?.lat),
            longitude: Number(item?.lon),
        }))
        .filter((item) => item.address && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}

export function extractPinCodeFromAddress(address) {
    const normalizedAddress = String(address || '');

    // Prefer 6-digit postcodes, then fallback to 5-digit postcodes.
    const sixDigitMatch = normalizedAddress.match(/\b(\d{6})\b/);
    if (sixDigitMatch?.[1]) {
        return sixDigitMatch[1];
    }

    const fiveDigitMatch = normalizedAddress.match(/\b(\d{5})\b/);
    if (fiveDigitMatch?.[1]) {
        return fiveDigitMatch[1];
    }

    return '';
}
