import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

const DEFAULT_BAR_COLOR = '#3b82f6';

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
    const [hoveredRow, setHoveredRow] = useState(null);

    const chartRows = useMemo(() => {
        return normalizeRows(rows)
            .sort((left, right) => right.value - left.value)
            .slice(0, maxRows);
    }, [maxRows, rows]);

    const maxValue = useMemo(() => {
        return chartRows.reduce((acc, row) => Math.max(acc, row.value), 0);
    }, [chartRows]);

    const scaleMax = useMemo(() => Math.max(10, maxValue), [maxValue]);

    return (
        <div className="card p-6 border border-slate-200 bg-gradient-to-br from-slate-50/50 to-white shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    {title}
                </h3>
                {subtitle ? <p className="text-sm text-slate-600 mt-2">{subtitle}</p> : null}
            </div>

            {chartRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 flex-1 flex items-center justify-center">
                    No data available for current filters.
                </div>
            ) : (
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                        <span>0</span>
                        <span>0 to {scaleMax}</span>
                        <span>{scaleMax}</span>
                    </div>
                    <div className="space-y-3">
                        {chartRows.map((row, idx) => {
                            const width = scaleMax ? Math.round((row.value / scaleMax) * 100) : 0;
                            const isHovered = hoveredRow === idx;

                            return (
                                <div
                                    key={row.label}
                                    className="group"
                                    onMouseEnter={() => setHoveredRow(idx)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span className={`text-sm font-semibold truncate transition-colors ${isHovered ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {row.label}
                                        </span>
                                        <span className={`text-sm font-bold flex-shrink-0 transition-colors ${isHovered ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {row.value}
                                        </span>
                                    </div>
                                    <div className="h-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 overflow-hidden border border-slate-200/50 shadow-xs">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${isHovered ? 'shadow-lg scale-y-110' : ''}`}
                                            style={{
                                                width: `${width}%`,
                                                backgroundColor: row.color,
                                                opacity: isHovered ? 1 : 0.9,
                                                boxShadow: isHovered ? `0 0 12px ${row.color}40` : 'none',
                                            }}
                                        ></div>
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
