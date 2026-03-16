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
