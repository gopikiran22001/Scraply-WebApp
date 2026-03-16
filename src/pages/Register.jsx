import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Mail, Lock, User, ArrowRight, Phone, Truck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ListboxSelect from '../components/ListboxSelect';

export default function Register() {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'USER',
        address: '',
        vehicleType: '',
        vehicleNumber: '',
        pinCode: '',
        pickUpRoute: ''
    });

    const { register } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            ...formData,
            pinCode: formData.pinCode ? Number(formData.pinCode) : undefined
        };

        if (payload.role !== 'PICKER') {
            delete payload.address;
            delete payload.vehicleType;
            delete payload.vehicleNumber;
            delete payload.pinCode;
            delete payload.pickUpRoute;
        }

        const result = await register(payload);
        if (result.success) {
            addToast('Account created successfully. Please sign in.', 'success');
        } else {
            addToast(result.message, 'error');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                        <Recycle className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
                    <p className="mt-2 text-gray-600">Join the green revolution today</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="input-field pl-10"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="input-field pl-10"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="input-field pl-10"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    required
                                    className="input-field pl-10"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <ListboxSelect
                                label="I am a..."
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={(val) => setFormData({ ...formData, role: val })}
                                options={[
                                    { value: 'USER', label: 'Citizen (I want to recycle)' },
                                    { value: 'PICKER', label: 'Collector (I pick up waste)' },
                                    { value: 'ADMIN', label: 'Administrator' }
                                ]}
                            />
                        </div>

                        {formData.role === 'PICKER' && (
                            <>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
                                        Vehicle Type
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Truck className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="vehicleType"
                                            name="vehicleType"
                                            type="text"
                                            required
                                            className="input-field pl-10"
                                            value={formData.vehicleType}
                                            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        Vehicle Number
                                    </label>
                                    <input
                                        id="vehicleNumber"
                                        name="vehicleNumber"
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.vehicleNumber}
                                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-1">
                                        Pin Code
                                    </label>
                                    <input
                                        id="pinCode"
                                        name="pinCode"
                                        type="number"
                                        required
                                        className="input-field"
                                        value={formData.pinCode}
                                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="pickUpRoute" className="block text-sm font-medium text-gray-700 mb-1">
                                        Pickup Route
                                    </label>
                                    <input
                                        id="pickUpRoute"
                                        name="pickUpRoute"
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.pickUpRoute}
                                        onChange={(e) => setFormData({ ...formData, pickUpRoute: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 group"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="text-center text-sm">
                        <span className="text-gray-500">Already have an account? </span>
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
