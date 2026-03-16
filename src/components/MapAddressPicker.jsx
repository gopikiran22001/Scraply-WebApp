import React, { useMemo, useState } from 'react';
import L from 'leaflet';
import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPinned, Search } from 'lucide-react';
import { reverseGeocode, searchAddress } from '../utils/geocode';

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const FOCUS_ZOOM = 16;

const mapMarkerIcon = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function RecenterMap({ position }) {
    const map = useMap();

    if (position) {
        map.setView(position, FOCUS_ZOOM);
    }

    return null;
}

function ClickSelector({ onPick }) {
    useMapEvents({
        click(event) {
            const { lat, lng } = event.latlng;
            onPick({ latitude: lat, longitude: lng });
        },
    });

    return null;
}

export default function MapAddressPicker({
    address,
    latitude,
    longitude,
    onLocationSelect,
}) {
    const [searchValue, setSearchValue] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [resolving, setResolving] = useState(false);

    const selectedPosition = useMemo(() => {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return [lat, lng];
        }
        return null;
    }, [latitude, longitude]);

    const center = selectedPosition || DEFAULT_CENTER;
    const zoom = selectedPosition ? FOCUS_ZOOM : DEFAULT_ZOOM;

    const resolveAndSelect = async ({ latitude: nextLat, longitude: nextLng, fallbackAddress = '' }) => {
        setResolving(true);
        try {
            const resolvedAddress = await reverseGeocode(nextLat, nextLng);
            onLocationSelect({
                address: resolvedAddress || fallbackAddress,
                latitude: nextLat,
                longitude: nextLng,
            });
        } catch (error) {
            onLocationSelect({
                address: fallbackAddress,
                latitude: nextLat,
                longitude: nextLng,
            });
        } finally {
            setResolving(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchValue.trim()) {
            setResults([]);
            return;
        }

        setSearching(true);
        try {
            const addresses = await searchAddress(searchValue);
            setResults(addresses);
        } catch (error) {
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Address</label>
                <form className="flex gap-2" onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search by area, street, landmark"
                        className="input-field"
                    />
                    <button
                        type="submit"
                        disabled={searching}
                        className="btn btn-secondary min-w-28 flex items-center justify-center gap-2"
                    >
                        <Search className="h-4 w-4" />
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {results.length > 0 ? (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-auto">
                    {results.map((result, index) => (
                        <button
                            key={`${result.latitude}-${result.longitude}-${index}`}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                                resolveAndSelect({
                                    latitude: result.latitude,
                                    longitude: result.longitude,
                                    fallbackAddress: result.address,
                                });
                                setResults([]);
                                setSearchValue(result.address);
                            }}
                        >
                            {result.address}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <MapContainer center={center} zoom={zoom} className="h-72 w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClickSelector onPick={({ latitude: nextLat, longitude: nextLng }) => resolveAndSelect({ latitude: nextLat, longitude: nextLng })} />
                    {selectedPosition ? <Marker position={selectedPosition} icon={mapMarkerIcon} /> : null}
                    <RecenterMap position={selectedPosition} />
                </MapContainer>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPinned className="h-4 w-4" />
                Search in the bar or click on map to choose address. {resolving ? 'Resolving address...' : ''}
            </p>

            {address ? (
                <p className="text-xs text-gray-600 bg-gray-50 rounded-md px-3 py-2">
                    Selected: {address}
                </p>
            ) : null}
        </div>
    );
}
