import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function buildPageNumbers(currentPage, totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    return Array.from(pages)
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((left, right) => left - right);
}

export default function AdminPagination({
    totalItems,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 20, 50],
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const pageNumbers = useMemo(
        () => buildPageNumbers(currentPage, totalPages),
        [currentPage, totalPages]
    );

    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(totalItems, currentPage * pageSize);

    return (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{start}-{end}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalItems}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <select
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
                    value={String(pageSize)}
                    onChange={(event) => onPageSizeChange(Number(event.target.value))}
                    aria-label="Rows per page"
                >
                    {pageSizeOptions.map((value) => (
                        <option key={value} value={value}>
                            {value} / page
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4" /> Prev
                </button>

                <div className="flex items-center gap-1">
                    {pageNumbers.map((pageNumber, index) => {
                        const previous = pageNumbers[index - 1];
                        const hasGap = previous && pageNumber - previous > 1;

                        return (
                            <React.Fragment key={pageNumber}>
                                {hasGap ? <span className="px-1 text-slate-400">...</span> : null}
                                <button
                                    type="button"
                                    className={`h-8 min-w-8 rounded-lg border px-2 text-sm ${pageNumber === currentPage
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-slate-200 bg-white text-slate-700'
                                        }`}
                                    onClick={() => onPageChange(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
