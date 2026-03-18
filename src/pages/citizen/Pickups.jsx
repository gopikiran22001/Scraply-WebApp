import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Clock, CheckCircle, Calendar, XCircle, Package, User, AlertTriangle, MapPin } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';
import ListboxSelect from '../../components/ListboxSelect';

const REQUEST_TYPE_OPTIONS = [
    { value: 'ALL', label: 'All Requests' },
    { value: 'PICKUP', label: 'Pickups' },
    { value: 'DUMP', label: 'Dump Reports' },
];

const STATUS_FILTER_OPTIONS = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'REQUESTED', label: 'Requested' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Pickups() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestTypeFilter, setRequestTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const [{ data: pickupData }, { data: dumpData }] = await Promise.all([
                    api.get('/pickups/'),
                    api.get('/illegals/'),
                ]);

                const normalizedPickups = (Array.isArray(pickupData) ? pickupData : []).map((pickup) => ({
                    ...pickup,
                    requestType: 'PICKUP',
                    requestLabel: 'Pickup',
                    requestDate: pickup.requestedAt || null,
                    assignee: pickup.pickerName || 'Not assigned yet',
                }));

                const normalizedDumps = (Array.isArray(dumpData) ? dumpData : []).map((report) => ({
                    ...report,
                    requestType: 'DUMP',
                    requestLabel: 'Dump Report',
                    requestDate: report.reportedAt || report.requestedAt || null,
                    assignee: report.pickerName || 'Not assigned yet',
                }));

                const mergedRequests = [...normalizedPickups, ...normalizedDumps].sort((left, right) => {
                    const leftDate = left.requestDate ? new Date(left.requestDate).getTime() : 0;
                    const rightDate = right.requestDate ? new Date(right.requestDate).getTime() : 0;
                    return rightDate - leftDate;
                });

                setRequests(mergedRequests);
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Error fetching requests'), 'error');
                setRequests([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [addToast]);

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            const matchesType = requestTypeFilter === 'ALL' || request.requestType === requestTypeFilter;
            const matchesStatus = statusFilter === 'ALL' || String(request.status || '').toUpperCase() === statusFilter;
            return matchesType && matchesStatus;
        });
    }, [requests, requestTypeFilter, statusFilter]);

    const getStatusColor = (status) => {
        switch (String(status || '').toUpperCase()) {
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'ASSIGNED': return 'bg-blue-100 text-blue-700';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
            case 'REQUESTED': return 'bg-gray-100 text-gray-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (String(status || '').toUpperCase()) {
            case 'COMPLETED': return <CheckCircle className="h-6 w-6" />;
            case 'CANCELLED': return <XCircle className="h-6 w-6" />;
            default: return <Clock className="h-6 w-6" />;
        }
    };

    const getRequestTypeBadge = (requestType) => {
        if (requestType === 'DUMP') {
            return 'bg-orange-100 text-orange-700';
        }

        return 'bg-blue-100 text-blue-700';
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Requests</h1>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <ListboxSelect
                    label="Request Type"
                    value={requestTypeFilter}
                    onChange={setRequestTypeFilter}
                    options={REQUEST_TYPE_OPTIONS}
                />
                <ListboxSelect
                    label="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_FILTER_OPTIONS}
                />
            </div>

            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <p className="text-gray-500">No requests match the selected filters.</p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div key={`${request.requestType}-${request.id}`} className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className={`p-3 rounded-full ${getStatusColor(request.status)} bg-opacity-20`}>
                                    {getStatusIcon(request.status)}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-gray-900">{request.category}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestTypeBadge(request.requestType)}`}>
                                            {request.requestLabel}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        {request.requestType === 'DUMP' ? <AlertTriangle className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                        <span>{request.description}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{request.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{request.requestDate ? new Date(request.requestDate).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <User className="h-4 w-4" />
                                        <span>{request.assignee}</span>
                                    </div>
                                    {String(request.status || '').toUpperCase() === 'CANCELLED' && request.cancellationReason ? (
                                        <div className="mt-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                                            <span className="font-semibold">Cancellation Reason:</span> {request.cancellationReason}
                                        </div>
                                    ) : null}
                                    {request.requestType === 'DUMP' && request.landmark ? (
                                        <div className="mt-1 text-sm text-gray-500">
                                            Landmark: {request.landmark}
                                        </div>
                                    ) : null}
                                    {request.imageUrl && (
                                        <div className="mt-2">
                                            <img src={request.imageUrl} alt={request.requestLabel} className="h-16 w-16 object-cover rounded-md border border-gray-200" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                                {String(request.status || '').replace('_', ' ')}
                            </div>

                            <button
                                type="button"
                                className="px-5 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-800 hover:bg-gray-50 min-w-[130px]"
                                onClick={() => navigate(`/citizen/queries?requestType=${request.requestType}&requestId=${request.id}`)}
                            >
                                Raise Query
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
