import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import { Upload, Trash2, MapPin, FileText } from 'lucide-react';
import ListboxSelect from '../../components/ListboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';
import { reverseGeocode, reverseGeocodeWithPostcode, searchAddress } from '../../utils/geocode';

const CATEGORIES = [
    'PLASTIC',
    'PAPER',
    'METAL',
    'ELECTRONICS',
    'GLASS',
    'ORGANIC',
    'MIXED'
];

const REQUEST_TYPES = [
    { value: 'PICKUP', label: 'Pickup Request' },
    { value: 'DUMP', label: 'Dump Report' }
];

export default function RequestPickup() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    const requestedType = new URLSearchParams(location.search).get('type');
    const routeType = location.pathname.includes('report-dump') ? 'DUMP' : 'PICKUP';
    const initialType = String(requestedType || routeType).toLowerCase() === 'dump' ? 'DUMP' : 'PICKUP';
    const [requestType, setRequestType] = useState(initialType);

    const [image, setImage] = useState(null);
    const [formData, setFormData] = useState({
        category: 'MIXED',
        description: '',
        address: '',
        pinCode: '',
        latitude: '',
        longitude: '',
        landmark: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [searchingAddress, setSearchingAddress] = useState(false);
    const [addressResults, setAddressResults] = useState([]);
    const [typedAddress, setTypedAddress] = useState('');

    const handleLocationSelect = ({ address, latitude, longitude }) => {
        setFormData((prev) => {
            const newLatitude = latitude ?? prev.latitude;
            const newLongitude = longitude ?? prev.longitude;
            const newAddress = address || prev.address;

            // Extract pincode from coordinates if available
            if (newLatitude && newLongitude) {
                reverseGeocodeWithPostcode(newLatitude, newLongitude)
                    .then(({ postcode }) => {
                        if (postcode) {
                            setFormData((current) => ({ ...current, pinCode: postcode }));
                        }
                    })
                    .catch((error) => {
                        console.error('Error reverse geocoding for pincode:', error);
                    });
            }

            return {
                ...prev,
                address: newAddress,
                latitude: newLatitude,
                longitude: newLongitude,
            };
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(URL.createObjectURL(e.target.files[0]));
            setImageFile(e.target.files[0]);
        }
    };

    useEffect(() => {
        const query = typedAddress.trim();
        if (query.length < 3) {
            setAddressResults([]);
            return;
        }

        let active = true;
        const timer = setTimeout(async () => {
            setSearchingAddress(true);
            try {
                const results = await searchAddress(query);
                if (active) {
                    setAddressResults(results);
                }
            } catch (error) {
                if (active) {
                    setAddressResults([]);
                }
            } finally {
                if (active) {
                    setSearchingAddress(false);
                }
            }
        }, 350);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [typedAddress]);

    const resolveLocationData = async () => {
        let { address, latitude, longitude, pinCode } = formData;

        if ((!latitude || !longitude) && address.trim()) {
            const matches = await searchAddress(address, 1);
            const bestMatch = Array.isArray(matches) && matches.length > 0 ? matches[0] : null;
            if (bestMatch) {
                latitude = bestMatch.latitude;
                longitude = bestMatch.longitude;
                address = bestMatch.address || address;
            }
        }

        if (latitude && longitude) {
            const reverse = await reverseGeocodeWithPostcode(latitude, longitude);
            if (reverse?.postcode) {
                pinCode = reverse.postcode;
            }
            if (!address && reverse?.address) {
                address = reverse.address;
            }
        }

        return { address, latitude, longitude, pinCode };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile) {
            addToast('Image is required by the backend for pickup requests', 'error');
            return;
        }

        setLoading(true);
        try {
            const resolved = await resolveLocationData();

            if (!resolved.latitude || !resolved.longitude) {
                addToast('Please use current location or select an address suggestion to continue.', 'error');
                setLoading(false);
                return;
            }

            if (!resolved.pinCode) {
                addToast('Unable to detect pincode for this location. Please choose a more specific address.', 'error');
                setLoading(false);
                return;
            }

            setFormData((prev) => ({
                ...prev,
                address: resolved.address || prev.address,
                latitude: resolved.latitude,
                longitude: resolved.longitude,
                pinCode: resolved.pinCode,
            }));

            const payload = new FormData();
            payload.append('category', formData.category);
            payload.append('description', formData.description);
            payload.append('address', resolved.address || formData.address);
            payload.append('pinCode', Number(resolved.pinCode));
            payload.append('latitude', Number(resolved.latitude));
            payload.append('longitude', Number(resolved.longitude));
            if (requestType === 'DUMP' && formData.landmark) {
                payload.append('landmark', formData.landmark);
            }
            payload.append('image', imageFile);

            const endpoint = requestType === 'DUMP' ? '/illegals/' : '/pickups/';
            await api.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            addToast(requestType === 'DUMP' ? 'Dump report submitted successfully!' : 'Pickup request submitted successfully!', 'success');
            navigate(requestType === 'DUMP' ? '/citizen/dashboard' : '/citizen/pickups');
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to submit request'), 'error');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Request</h1>

            <div className="card p-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <ListboxSelect
                            label="Request Type"
                            value={requestType}
                            onChange={setRequestType}
                            options={REQUEST_TYPES}
                        />
                    </div>

                    <div>
                        <ListboxSelect
                            label="Category"
                            value={formData.category}
                            onChange={(val) => setFormData({ ...formData, category: val })}
                            options={CATEGORIES}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <textarea
                                rows="4"
                                required
                                className="input-field pl-10 py-3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={requestType === 'DUMP' ? 'Describe the dumped waste and surroundings' : 'Describe what should be picked up'}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Enter address or landmark"
                                className="input-field pl-10"
                                required
                                value={formData.address}
                                onChange={(e) => {
                                    const address = e.target.value;
                                    setTypedAddress(address);
                                    setFormData((prev) => ({
                                        ...prev,
                                        address,
                                        latitude: '',
                                        longitude: '',
                                        pinCode: '',
                                    }));
                                }}
                            />
                            <button
                                type="button"
                                disabled={locationLoading}
                                onClick={() => {
                                    if (navigator.geolocation) {
                                        setLocationLoading(true);
                                        navigator.geolocation.getCurrentPosition(
                                            async (position) => {
                                                const { latitude, longitude } = position.coords;
                                                try {
                                                    const address = await reverseGeocode(latitude, longitude);
                                                    handleLocationSelect({
                                                        address,
                                                        latitude,
                                                        longitude,
                                                    });
                                                    addToast('Location fetched successfully', 'success');
                                                } catch (error) {
                                                    console.error('Error fetching address:', error);
                                                    handleLocationSelect({
                                                        address: formData.address,
                                                        latitude,
                                                        longitude,
                                                    });
                                                    addToast('Coordinates fetched, but address lookup failed', 'info');
                                                } finally {
                                                    setLocationLoading(false);
                                                }
                                            },
                                            (error) => {
                                                console.error(error);
                                                addToast('Unable to retrieve your location', 'error');
                                                setLocationLoading(false);
                                            }
                                        );
                                    } else {
                                        addToast('Geolocation is not supported by your browser', 'error');
                                    }
                                }}
                                className="absolute right-2 top-2 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                            >
                                {locationLoading ? 'Fetching...' : 'Use Current Location'}
                            </button>
                        </div>

                        {searchingAddress ? (
                            <p className="mt-2 text-xs text-gray-500">Searching addresses...</p>
                        ) : null}

                        {addressResults.length > 0 ? (
                            <div className="mt-2 border border-gray-200 rounded-lg max-h-44 overflow-auto">
                                {addressResults.map((result, index) => (
                                    <button
                                        key={`${result.latitude}-${result.longitude}-${index}`}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        onClick={() => {
                                            setTypedAddress('');
                                            setAddressResults([]);
                                            handleLocationSelect({
                                                address: result.address,
                                                latitude: result.latitude,
                                                longitude: result.longitude,
                                            });
                                        }}
                                    >
                                        {result.address}
                                    </button>
                                ))}
                            </div>
                            ) : null}
                    </div>

                    {requestType === 'DUMP' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.landmark}
                                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                                placeholder="Near bus stop / market / etc."
                            />
                        </div>
                    ) : null}


                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo (Required)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                            {image ? (
                                <div className="relative h-48 w-full">
                                    <img src={image} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setImage(null);
                                            setImageFile(null);
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click or drag image here</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn btn-primary w-full py-3 text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Submitting...' : requestType === 'DUMP' ? 'Submit Dump Report' : 'Submit Pickup Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
