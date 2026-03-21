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

function isPhotonAPI(urlStr) {
    try {
        return new URL(urlStr).hostname.includes('photon');
    } catch {
        return false;
    }
}

function formatPhotonAddress(props) {
    if (!props) return '';
    return [
        props.name,
        props.housenumber,
        props.street,
        props.locality,
        props.district,
        props.city,
        props.county,
        props.state,
        props.postcode,
        props.country
    ]
        .filter(Boolean)
        .join(', ');
}

export async function reverseGeocode(latitude, longitude) {
    const baseUrl = getReverseGeocodeBaseUrl();
    const url = new URL(baseUrl);
    const isPhoton = isPhotonAPI(baseUrl);

    if (!isPhoton) {
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
    }
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
    
    if (isPhoton) {
        const props = data.features?.[0]?.properties;
        return formatPhotonAddress(props);
    }
    
    return data?.display_name || '';
}

export async function reverseGeocodeWithPostcode(latitude, longitude) {
    const baseUrl = getReverseGeocodeBaseUrl();
    const url = new URL(baseUrl);
    const isPhoton = isPhotonAPI(baseUrl);

    if (!isPhoton) {
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('zoom', '18');
    }
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
    let address = '';
    let postcode = '';

    if (isPhoton) {
        const props = data.features?.[0]?.properties;
        address = formatPhotonAddress(props);
        postcode = props?.postcode;
    } else {
        address = data?.display_name || '';
        postcode = data?.address?.postcode;
    }

    if (!postcode) {
        postcode = extractPinCodeFromAddress(address);
    }

    return {
        address: address || '',
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
    const isPhoton = isPhotonAPI(baseUrl);

    if (!isPhoton) {
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
    }
    url.searchParams.set('q', sanitizedQuery);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Address search failed with status ${response.status}`);
    }

    const data = await response.json();

    if (isPhoton) {
        if (!Array.isArray(data.features)) return [];
        return data.features
            .map((f) => ({
                address: formatPhotonAddress(f.properties),
                latitude: Number(f.geometry?.coordinates?.[1]),
                longitude: Number(f.geometry?.coordinates?.[0]),
            }))
            .filter((item) => item.address && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    }

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
