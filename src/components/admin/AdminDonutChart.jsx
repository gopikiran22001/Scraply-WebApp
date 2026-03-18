import React, { useMemo } from 'react';

const DEFAULT_COLORS = ['#16a34a', '#f59e0b', '#0ea5e9', '#6366f1', '#ef4444', '#14b8a6', '#8b5cf6'];

function normalizeData(data) {
    return (Array.isArray(data) ? data : [])
        .filter((item) => Number(item?.value || 0) > 0)
        .map((item, index) => ({
            label: item.label || `Item ${index + 1}`,
            value: Number(item.value || 0),
            color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        }));
}

export default function AdminDonutChart({
    title,
    subtitle,
    data,
    totalLabel = 'Total',
}) {
    const chartData = useMemo(() => normalizeData(data), [data]);

    const total = useMemo(() => {
        return chartData.reduce((acc, item) => acc + item.value, 0);
    }, [chartData]);

    const gradient = useMemo(() => {
        if (total === 0) {
            return 'conic-gradient(#e2e8f0 0deg 360deg)';
        }

        let currentAngle = 0;
        const parts = chartData.map((item) => {
            const angle = (item.value / total) * 360;
            const start = currentAngle;
            const end = currentAngle + angle;
            currentAngle = end;
            return `${item.color} ${start}deg ${end}deg`;
        });

        return `conic-gradient(${parts.join(', ')})`;
    }, [chartData, total]);

    return (
        <div className="card p-5 border border-slate-200">
            <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
            </div>

            {chartData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No data available for current filters.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-[160px,1fr] sm:items-center">
                    <div className="relative mx-auto h-36 w-36 rounded-full" style={{ background: gradient }}>
                        <div className="absolute inset-4 rounded-full bg-white border border-slate-100 flex flex-col items-center justify-center text-center">
                            <span className="text-[11px] uppercase tracking-wide text-slate-500">{totalLabel}</span>
                            <span className="text-xl font-bold text-slate-900">{total}</span>
                        </div>
                    </div>

                    <ul className="space-y-2">
                        {chartData.map((item) => {
                            const percent = total ? Math.round((item.value / total) * 100) : 0;

                            return (
                                <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="inline-flex items-center gap-2 text-slate-700">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                        {item.label}
                                    </span>
                                    <span className="font-semibold text-slate-900">{item.value} ({percent}%)</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
