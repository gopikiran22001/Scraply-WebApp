import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { User, Mail, Phone, MapPin, Save, Camera, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

export default function Profile() {
    const { addToast } = useToast();
    const { refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        pickUpRoute: '',
        vehicleType: '',
        password: ''
    });
    const [loading, setLoading] = useState(true);
    const [profileRole, setProfileRole] = useState('');
    const [profileStatus, setProfileStatus] = useState('');

    const [avatar, setAvatar] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get('/auth/profile');
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    pickUpRoute: data.pickUpRoute || '',
                    vehicleType: data.vehicleType || '',
                    password: ''
                });
                setProfileRole(data.role || '');
                setProfileStatus(data.status || '');
                setAvatar(data.profileImage || null);
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Failed to load profile'), 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [addToast]);

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAvatar(URL.createObjectURL(e.target.files[0]));
            setAvatarFile(e.target.files[0]);
            setIsEditing(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = new FormData();

            payload.append('name', formData.name);
            payload.append('phone', formData.phone);
            payload.append('address', formData.address);
            payload.append('email', formData.email);

            if (formData.pickUpRoute) payload.append('pickUpRoute', formData.pickUpRoute);
            if (formData.vehicleType) payload.append('vehicleType', formData.vehicleType);
            if (formData.password) payload.append('password', formData.password);

            if (avatarFile) {
                payload.append('image', avatarFile);
            }

            await api.put('/auth/profile', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await refreshProfile();
            setFormData((prev) => ({ ...prev, password: '' }));
            setAvatarFile(null);
            setIsEditing(false);
            addToast('Profile updated successfully!', 'success');
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update profile'), 'error');
        }
    };

    if (loading) return <div className="text-center py-12">Loading...</div>;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8 text-center sm:text-left">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar / Photo */}
                <div className="md:col-span-1">
                    <div className="card p-6 text-center">
                        <div className="relative inline-block mb-4 group">
                            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-primary-100 flex items-center justify-center mx-auto overflow-hidden border-4 border-white shadow-lg">
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 sm:h-16 sm:w-16 text-primary-400" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 shadow-md transition-colors cursor-pointer">
                                <Camera className="h-4 w-4" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
                        <p className="text-gray-500 text-sm">{profileRole || 'USER'}</p>
                        <p className="text-xs text-gray-400 mt-1">Account Status: {profileStatus || 'UNKNOWN'}</p>

                        <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-3">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm truncate">{formData.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{formData.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{formData.address}</span>
                            </div>
                            {formData.pickUpRoute && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Shield className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">Route: {formData.pickUpRoute}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2">
                    <div className="card p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'} text-sm`}
                            >
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Route</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.pickUpRoute}
                                        onChange={(e) => setFormData({ ...formData, pickUpRoute: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="Leave empty to keep current password"
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end pt-4">
                                    <button type="submit" className="btn btn-primary flex items-center gap-2">
                                        <Save className="h-4 w-4" /> Save Changes
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
