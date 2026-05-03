import React from 'react';

export default function CancellationReasonModal({
    isOpen,
    title = 'Cancel Request',
    subjectLabel = 'this request',
    reason,
    onReasonChange,
    isSubmitting = false,
    onCancel,
    onConfirm,
}) {
    const trimmedReason = String(reason || '').trim();
    const isValid = trimmedReason.length > 0;

    if (!isOpen) {
        return null;
    }

    const handleConfirm = () => {
        if (!isValid || isSubmitting) {
            return;
        }

        onConfirm(trimmedReason);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                    Provide a reason for cancelling {subjectLabel}. This is required.
                </p>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cancellation Reason</label>
                    <textarea
                        value={reason}
                        onChange={(event) => onReasonChange(event.target.value)}
                        rows={4}
                        className="input-field"
                        placeholder="Explain why this request is being cancelled"
                    />
                    {!isValid ? <p className="mt-2 text-xs text-red-600">Reason cannot be blank.</p> : null}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!isValid || isSubmitting}
                        className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
}