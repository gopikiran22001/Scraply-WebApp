import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import { Upload, Trash2, MapPin, FileText } from 'lucide-react';
import ListboxSelect from '../../components/ListboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';
import { extractPinCodeFromAddress, reverseGeocode } from '../../utils/geocode';

const CATEGORIES = [
    'PLASTIC',
    'PAPER',
    'METAL',
    'ELECTRONICS',
    'GLASS',
    'ORGANIC',
    'MIXED'
];

export default function RequestPickup() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [image, setImage] = useState(null);
    const [formData, setFormData] = useState({
        category: 'MIXED',
        description: '',
        address: '',
        pinCode: '',
        latitude: '',
        longitude: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(URL.createObjectURL(e.target.files[0]));
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile) {
            addToast('Image is required by the backend for pickup requests', 'error');
            return;
        }

        if (!formData.pinCode) {
            addToast('Unable to detect pincode from the address. Please include a valid postal code in the address.', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = new FormData();
            payload.append('category', formData.category);
            payload.append('description', formData.description);
            payload.append('address', formData.address);
            payload.append('pinCode', Number(formData.pinCode));
            payload.append('latitude', Number(formData.latitude));
            payload.append('longitude', Number(formData.longitude));
            payload.append('image', imageFile);

            await api.post('/pickups/', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            addToast('Pickup request submitted successfully!', 'success');
            navigate('/citizen/pickups');
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to submit pickup request'), 'error');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule a Pickup</h1>

            <div className="card p-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <ListboxSelect
                                label="Category"
                                value={formData.category}
                                onChange={(val) => setFormData({ ...formData, category: val })}
                                options={CATEGORIES}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={formData.pinCode}
                                readOnly
                                placeholder="Auto-detected from address"
                            />
                        </div>
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
                                placeholder="Describe what should be picked up"
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
                                    setFormData((prev) => ({
                                        ...prev,
                                        address,
                                        pinCode: extractPinCodeFromAddress(address),
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
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        address,
                                                        pinCode: extractPinCodeFromAddress(address),
                                                        latitude,
                                                        longitude,
                                                    }));
                                                    addToast('Location fetched successfully', 'success');
                                                } catch (error) {
                                                    console.error('Error fetching address:', error);
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        latitude,
                                                        longitude,
                                                    }));
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
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                required
                                className="input-field"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                required
                                className="input-field"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            />
                        </div>
                    </div>

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
                            {loading ? 'Submitting...' : 'Confirm Pickup Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
