import React, { useMemo } from 'react';

const DEFAULT_BAR_COLOR = '#0ea5e9';

function normalizeRows(rows) {
    return (Array.isArray(rows) ? rows : [])
        .filter((row) => Number(row?.value || 0) > 0)
        .map((row) => ({
            label: row.label || 'Unknown',
            value: Number(row.value || 0),
            color: row.color || DEFAULT_BAR_COLOR,
        }));
}

export default function AdminBarListChart({
    title,
    subtitle,
    rows,
    maxRows = 6,
}) {
    const chartRows = useMemo(() => {
        return normalizeRows(rows)
            .sort((left, right) => right.value - left.value)
            .slice(0, maxRows);
    }, [maxRows, rows]);

    const maxValue = useMemo(() => {
        return chartRows.reduce((acc, row) => Math.max(acc, row.value), 0);
    }, [chartRows]);

    return (
        <div className="card p-5 border border-slate-200">
            <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
            </div>

            {chartRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No data available for current filters.
                </div>
            ) : (
                <div className="space-y-3">
                    {chartRows.map((row) => {
                        const width = maxValue ? Math.round((row.value / maxValue) * 100) : 0;

                        return (
                            <div key={row.label}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="text-slate-700 truncate pr-2">{row.label}</span>
                                    <span className="font-semibold text-slate-900">{row.value}</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${width}%`, backgroundColor: row.color }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
