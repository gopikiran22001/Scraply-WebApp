import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ListboxSelect from '../../components/ListboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';

const STATUS_OPTIONS = [
    { value: 'REQUESTED', label: 'REQUESTED' },
    { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
    { value: 'ASSIGNED', label: 'ASSIGNED' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
];

export default function AdminPickups() {
    const { addToast } = useToast();
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPickups = useCallback(async () => {
        try {
            const { data } = await api.get('/pickups/');
            setPickups(Array.isArray(data) ? data : []);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to load pickups'), 'error');
            setPickups([]);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchPickups();
    }, [fetchPickups]);

    const updatePickup = async (pickupId, status) => {
        try {
            await api.put('/pickups/', {
                id: pickupId,
                status,
            });
            addToast('Pickup status updated', 'success');
            fetchPickups();
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update pickup'), 'error');
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Pickups</h1>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Address</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pickups.map((pickup) => (
                                <tr key={pickup.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">#{pickup.id.slice(-6)}</td>
                                    <td className="px-6 py-4">
                                        {pickup.imageUrl ? (
                                            <img src={pickup.imageUrl} alt="Pickup" className="h-10 w-10 object-cover rounded border border-gray-200" />
                                        ) : (
                                            <span className="text-gray-400 text-xs">No img</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{pickup.category}</td>
                                    <td className="px-6 py-4 max-w-xs truncate" title={pickup.address}>{pickup.address}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{pickup.status}</span>
                                    </td>
                                    <td className="px-6 py-4 w-52">
                                        <ListboxSelect
                                            value={pickup.status}
                                            onChange={(nextStatus) => updatePickup(pickup.id, nextStatus)}
                                            options={STATUS_OPTIONS}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
