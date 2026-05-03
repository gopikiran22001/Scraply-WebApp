import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import ListboxSelect from '../../components/ListboxSelect';
import { useToast } from '../../context/ToastContext';

const ACCOUNT_STATUS_OPTIONS = [
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminPickers() {
    const { addToast } = useToast();
    const [pickers, setPickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPicker, setSelectedPicker] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);

    const fetchPickers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/auth/pickers/all'); // Use new endpoint for all pickers
            setPickers(Array.isArray(data) ? data : []);
        } catch (error) {
            setPickers([]);
            addToast('Failed to fetch pickers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPickers();
    }, []);

    const handlePickerStatusChange = async (pickerId, status) => {
        try {
            await api.put('/auth/status/update', { userId: pickerId, status });
            addToast(`Picker status updated to ${status}`, 'success');
            fetchPickers();
        } catch (error) {
            addToast('Failed to update picker status', 'error');
        }
    };

    const openPanel = (picker) => {
        setSelectedPicker(picker);
        setPanelOpen(true);
    };
    const closePanel = () => {
        setPanelOpen(false);
        setSelectedPicker(null);
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Pickers Management</h1>
            <div className="card overflow-hidden mb-8">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-900 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pickers.map((picker) => (
                                <tr key={picker.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openPanel(picker)}>
                                    <td className="px-6 py-4">{picker.name}</td>
                                    <td className="px-6 py-4">{picker.phone || 'N/A'}</td>
                                    <td className="px-6 py-4">{picker.status || 'N/A'}</td>
                                </tr>
                            ))}
                            {pickers.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-center text-slate-500" colSpan={3}>
                                        No pickers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {panelOpen && selectedPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4" onClick={closePanel}>
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col relative border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 text-2xl transition-colors" onClick={closePanel} aria-label="Close">✕</button>
                        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-primary-700">Picker Details</h2>
                        <div className="mb-8">
                            <div className="mb-4">
                                <span className="block text-xs font-semibold text-slate-500 mb-1">Basic Info</span>
                                <div className="flex flex-col gap-2 bg-slate-50 rounded-lg p-4">
                                    <div><span className="font-medium">Name:</span> {selectedPicker.name}</div>
                                    <div><span className="font-medium">Phone:</span> {selectedPicker.phone || 'N/A'}</div>
                                    <div><span className="font-medium">Email:</span> {selectedPicker.email || 'N/A'}</div>
                                    <div><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedPicker.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{selectedPicker.status || 'N/A'}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-8">
                            <span className="block text-xs font-semibold text-slate-500 mb-1">Admin Actions</span>
                            <div className="flex items-center gap-4">
                                <label className="font-medium">Modify Status:</label>
                                <ListboxSelect
                                    value={selectedPicker.status || 'ACCEPTED'}
                                    onChange={(newStatus) => {
                                        handlePickerStatusChange(selectedPicker.id, newStatus);
                                        setSelectedPicker({ ...selectedPicker, status: newStatus });
                                    }}
                                    options={ACCOUNT_STATUS_OPTIONS}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
