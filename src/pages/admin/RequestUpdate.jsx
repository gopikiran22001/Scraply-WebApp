import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import ListboxSelect from '../../components/ListboxSelect';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'REQUESTED', label: 'REQUESTED' },
    { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
    { value: 'ASSIGNED', label: 'ASSIGNED' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
];

export default function AdminRequestUpdate() {
    const navigate = useNavigate();
    const { requestType, id } = useParams();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [request, setRequest] = useState(null);
    const [pickers, setPickers] = useState([]);
    const [nextStatus, setNextStatus] = useState('REQUESTED');
    const [pickerId, setPickerId] = useState('');

    const resolvedType = String(requestType || '').toUpperCase() === 'DUMP' ? 'DUMP' : 'PICKUP';

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        try {
            const [{ data: pickupsData }, { data: dumpsData }, { data: pickersData }] = await Promise.all([
                api.get('/pickups/'),
                api.get('/illegals/'),
                api.get('/auth/pickers'),
            ]);

            const pickups = Array.isArray(pickupsData) ? pickupsData : [];
            const dumps = Array.isArray(dumpsData) ? dumpsData : [];
            const source = resolvedType === 'DUMP' ? dumps : pickups;
            const matched = source.find((item) => String(item.id) === String(id));

            if (!matched) {
                addToast('Request not found', 'error');
                navigate('/admin/pickups');
                return;
            }

            setRequest(matched);
            setNextStatus(matched.status || 'REQUESTED');
            setPickerId(matched.pickerId || '');
            setPickers(Array.isArray(pickersData) ? pickersData : []);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to load request details'), 'error');
            navigate('/admin/pickups');
        } finally {
            setLoading(false);
        }
    }, [addToast, id, navigate, resolvedType]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const pickerOptions = useMemo(() => {
        return pickers.map((picker) => ({
            value: picker.id,
            label: picker.phone
                ? `${picker.name} (${picker.phone})`
                : picker.name,
        })).sort((a, b) => a.label.localeCompare(b.label));
    }, [pickers]);

    const handleSubmit = async () => {
        if (!request) {
            return;
        }

        if (nextStatus === 'ASSIGNED' && !pickerId) {
            addToast('Select a picker before assigning request', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                id: request.id,
                status: nextStatus,
            };

            if (nextStatus === 'ASSIGNED') {
                payload.assignedTo = pickerId;
            }

            if (resolvedType === 'DUMP') {
                await api.put('/illegals/', payload);
            } else {
                await api.put('/pickups/', payload);
            }

            addToast('Request updated successfully', 'success');
            navigate('/admin/pickups');
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update request'), 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-600">Loading request details...</div>;
    }

    if (!request) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="admin-shell p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Update Request</h1>
                        <p className="text-slate-600 mt-1">Update status and picker assignment for this request.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn btn-secondary inline-flex items-center gap-2"
                            onClick={fetchDetails}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary inline-flex items-center gap-2"
                            onClick={() => navigate('/admin/pickups')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    </div>
                </div>

                <div className="card p-5 mb-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500">Request ID</p>
                            <p className="font-semibold text-slate-900">{request.id}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Type</p>
                            <p className="font-semibold text-slate-900">{resolvedType}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Current Status</p>
                            <p className="font-semibold text-slate-900">{request.status || 'UNKNOWN'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Category</p>
                            <p className="font-semibold text-slate-900">{request.category || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-slate-500">Address</p>
                            <p className="font-semibold text-slate-900 break-words">{request.address || 'N/A'}</p>
                        </div>
                        {String(request.status || '').toUpperCase() === 'CANCELLED' ? (
                            <div className="md:col-span-2">
                                <p className="text-slate-500">Cancellation Reason</p>
                                <p className="font-semibold text-rose-700 break-words">{request.cancellationReason || 'N/A'}</p>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="card p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-600 block mb-1">New Status</label>
                            <ListboxSelect
                                value={nextStatus}
                                onChange={setNextStatus}
                                options={STATUS_OPTIONS}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-600 block mb-1">
                                Picker {nextStatus === 'ASSIGNED' ? <span className="text-red-500">*</span> : null}
                            </label>
                            <ListboxSelect
                                value={pickerId}
                                onChange={setPickerId}
                                options={pickerOptions}
                                placeholder="Select picker"
                                disabled={nextStatus !== 'ASSIGNED'}
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            type="button"
                            className="btn btn-primary inline-flex h-10 items-center justify-center px-4"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Updating...' : 'Update Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
