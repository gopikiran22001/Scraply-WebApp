import React, { useState } from 'react';
import { Camera, MapPin, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import ListboxSelect from '../../components/ListboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';
import { reverseGeocode } from '../../utils/geocode';

const CATEGORIES = [
    'PLASTIC',
    'PAPER',
    'METAL',
    'ELECTRONICS',
    'GLASS',
    'ORGANIC',
    'MIXED'
];

export default function ReportDump() {
    const { addToast } = useToast();
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    const [imageFile, setImageFile] = useState(null);
    const [formData, setFormData] = useState({
        address: '',
        description: '',
        category: 'MIXED',
        latitude: '',
        longitude: '',
        pinCode: '',
        landmark: ''
    });

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(URL.createObjectURL(e.target.files[0]));
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile) {
            addToast('Image is required by the backend for dump reports', 'error');
            return;
        }

        setLoading(true);

        try {
            const payload = new FormData();
            payload.append('address', formData.address);
            payload.append('latitude', Number(formData.latitude));
            payload.append('longitude', Number(formData.longitude));
            payload.append('description', formData.description);
            payload.append('category', formData.category);
            payload.append('pinCode', Number(formData.pinCode));
            if (formData.landmark) {
                payload.append('landmark', formData.landmark);
            }
            payload.append('image', imageFile);

            await api.post('/illegals/', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            addToast('Report submitted successfully! Thank you for helping.', 'success');
            setImage(null);
            setImageFile(null);
            setFormData({
                address: '',
                description: '',
                category: 'MIXED',
                latitude: '',
                longitude: '',
                pinCode: '',
                landmark: ''
            });
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to submit report'), 'error');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Report Illegal Dumping</h1>
                <p className="text-gray-600 mt-2">Help us keep the city clean by reporting waste spots.</p>
            </div>

            <div className="card p-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <ListboxSelect
                            label="Category"
                            value={formData.category}
                            onChange={(val) => setFormData({ ...formData, category: val })}
                            options={CATEGORIES}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Enter address or landmark"
                                className="input-field pl-10"
                                required
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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

                    <div className="grid md:grid-cols-3 gap-4">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={formData.pinCode}
                                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                            />
                        </div>
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            rows="4"
                            className="input-field py-3"
                            placeholder="Describe the waste (e.g., construction debris, plastic bags...)"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Photo (Required)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-500 transition-colors cursor-pointer relative bg-gray-50">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                            {image ? (
                                <div className="relative h-48 w-full">
                                    <img src={image} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Camera className="h-10 w-10 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Upload photo of the spot</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn bg-red-600 text-white hover:bg-red-700 w-full py-3 flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Submitting...' : <><Send className="h-5 w-5" /> Submit Report</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
