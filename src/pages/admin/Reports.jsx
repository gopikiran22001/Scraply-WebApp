import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import { Download, FileText } from 'lucide-react';
import ListboxSelect from '../../components/ListboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = [
    { value: 'REQUESTED', label: 'REQUESTED' },
    { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
    { value: 'ASSIGNED', label: 'ASSIGNED' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
];

export default function AdminReports() {
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        wasteByType: {},
        pickupsByStatus: {},
    });
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [{ data: pickupsData }, { data: reportsData }] = await Promise.all([
                api.get('/pickups/'),
                api.get('/illegals/'),
            ]);

            const pickups = Array.isArray(pickupsData) ? pickupsData : [];
            const illegalReports = Array.isArray(reportsData) ? reportsData : [];

            const wasteByType = pickups.reduce((acc, p) => {
                const key = p.category || 'UNKNOWN';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            const pickupsByStatus = pickups.reduce((acc, p) => {
                const key = p.status || 'UNKNOWN';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            setStats({ wasteByType, pickupsByStatus });
            setReports(illegalReports);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Error fetching report data'), 'error');
            setStats({ wasteByType: {}, pickupsByStatus: {} });
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateReportStatus = async (reportId, nextStatus) => {
        try {
            await api.put('/illegals/', {
                id: reportId,
                status: nextStatus,
            });

            setReports((prev) => prev.map((report) => (
                report.id === reportId ? { ...report, status: nextStatus } : report
            )));
            addToast('Report status updated', 'success');
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update report status'), 'error');
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
                <button className="btn btn-primary flex items-center gap-2" type="button">
                    <Download className="h-4 w-4" /> Export
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="card p-6">
                    <h3 className="font-bold text-gray-900 mb-6">Waste Category Distribution</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {Object.keys(stats.wasteByType).length > 0 ? (
                            <ul className="space-y-2">
                                {Object.entries(stats.wasteByType).map(([type, count]) => (
                                    <li key={type} className="flex justify-between items-center">
                                        <span className="text-gray-700">{type}</span>
                                        <span className="font-bold text-gray-900">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-400">No data available</p>
                        )}
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="font-bold text-gray-900 mb-6">Pickup Status Overview</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {Object.keys(stats.pickupsByStatus).length > 0 ? (
                            <ul className="space-y-2">
                                {Object.entries(stats.pickupsByStatus).map(([status, count]) => (
                                    <li key={status} className="flex justify-between items-center">
                                        <span className="text-gray-700">{status}</span>
                                        <span className="font-bold text-gray-900">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-400">No data available</p>
                        )}
                    </div>
                </div>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-4">Illegal Dump Reports</h2>
            <div className="card overflow-hidden mb-8">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        {report.imageUrl ? (
                                            <img src={report.imageUrl} alt="Report" className="h-10 w-10 object-cover rounded border border-gray-200" />
                                        ) : (
                                            <span className="text-gray-400 text-xs">No img</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate" title={report.address}>{report.address}</td>
                                    <td className="px-6 py-4 max-w-xs truncate" title={report.description}>{report.description}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{report.status}</span>
                                    </td>
                                    <td className="px-6 py-4">{report.reportedAt ? new Date(report.reportedAt).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 w-52">
                                        <ListboxSelect
                                            value={report.status}
                                            onChange={(newStatus) => updateReportStatus(report.id, newStatus)}
                                            options={STATUS_OPTIONS}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-4">Available Exports</h2>
            <div className="grid md:grid-cols-3 gap-4">
                {['Pickup Status Summary', 'Dump Report Summary', 'Category Distribution'].map((reportName) => (
                    <div key={reportName} className="card p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                                <FileText className="h-5 w-5 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-700">{reportName}</span>
                        </div>
                        <Download className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                    </div>
                ))}
            </div>
        </div>
    );
}
