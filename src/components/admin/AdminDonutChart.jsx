import React, { useMemo, useState } from 'react';
import { PieChart } from 'lucide-react';

const DEFAULT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

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
    const [hoveredItem, setHoveredItem] = useState(null);

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
        <div className="card p-6 border border-slate-200 bg-gradient-to-br from-slate-50/50 to-white shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    {title}
                </h3>
                {subtitle ? <p className="text-sm text-slate-600 mt-2">{subtitle}</p> : null}
            </div>

            {chartData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 flex-1 flex items-center justify-center">
                    No data available for current filters.
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-[200px,1fr] sm:items-center flex-1">
                    <div className="relative mx-auto h-48 w-48 rounded-full shadow-lg hover:shadow-xl transition-shadow" style={{ background: gradient }}>
                        <div className="absolute inset-6 rounded-full bg-white border-4 border-slate-100 flex flex-col items-center justify-center text-center shadow-inner">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-600">{totalLabel}</span>
                            <span className="text-3xl font-bold text-slate-900 mt-1">{total}</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2.5">
                        {chartData.map((item, idx) => {
                            const percent = total ? Math.round((item.value / total) * 100) : 0;
                            const isHovered = hoveredItem === idx;

                            return (
                                <div
                                    key={item.label}
                                    className="group cursor-pointer"
                                    onMouseEnter={() => setHoveredItem(idx)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-all ${isHovered ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                        <span className="inline-flex items-center gap-3 flex-1 min-w-0">
                                            <span
                                                className={`h-3.5 w-3.5 rounded-full flex-shrink-0 shadow-md transition-all ${isHovered ? 'scale-125 shadow-lg' : ''}`}
                                                style={{
                                                    backgroundColor: item.color,
                                                    boxShadow: isHovered ? `0 0 16px ${item.color}60` : `0 2px 8px ${item.color}30`,
                                                }}
                                            ></span>
                                            <span className={`text-sm font-semibold truncate transition-colors ${isHovered ? 'text-slate-900' : 'text-slate-700'}`}>
                                                {item.label}
                                            </span>
                                        </span>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className={`text-sm font-bold transition-colors ${isHovered ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {item.value}
                                            </span>
                                            <span className={`text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full transition-all ${isHovered ? 'bg-slate-200 text-slate-900' : 'text-slate-700'}`}>
                                                {percent}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
