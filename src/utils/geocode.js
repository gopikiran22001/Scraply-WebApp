const DEFAULT_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse';

function getGeocodeBaseUrl() {
    const configured = String(import.meta.env.VITE_GEOCODE_API_URL || '').trim();
    return configured || DEFAULT_GEOCODE_URL;
}

export async function reverseGeocode(latitude, longitude) {
    const baseUrl = getGeocodeBaseUrl();
    const url = new URL(baseUrl);
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));

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
