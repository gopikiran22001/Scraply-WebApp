import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

function clampHeight(value, maxValue) {
    if (maxValue <= 0) {
        return 6;
    }

    return Math.max(6, Math.round((value / maxValue) * 120));
}

export default function AdminTrendChart({
    title,
    subtitle,
    data,
    firstKey = 'pickups',
    secondKey = 'reports',
    firstLabel = 'Pickups',
    secondLabel = 'Reports',
}) {
    const [hoveredBucket, setHoveredBucket] = useState(null);
    const [visibleSeries, setVisibleSeries] = useState({
        first: true,
        second: true,
    });

    const maxValue = useMemo(() => {
        return data.reduce((max, item) => {
            const firstValue = visibleSeries.first ? Number(item[firstKey] || 0) : 0;
            const secondValue = visibleSeries.second ? Number(item[secondKey] || 0) : 0;
            return Math.max(max, firstValue, secondValue);
        }, 0);
    }, [data, firstKey, secondKey, visibleSeries]);

    const totals = useMemo(() => {
        return data.reduce((acc, item) => ({
            first: acc.first + Number(item[firstKey] || 0),
            second: acc.second + Number(item[secondKey] || 0),
        }), { first: 0, second: 0 });
    }, [data, firstKey, secondKey]);

    const tooltipData = hoveredBucket || null;

    const toggleSeries = (key) => {
        setVisibleSeries((previous) => ({
            ...previous,
            [key]: !previous[key],
        }));
    };

    return (
        <div className="card p-5 border border-slate-200">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-secondary-600" /> {title}
                    </h3>
                    {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                    <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${visibleSeries.first ? 'border-secondary-200 bg-secondary-50 text-secondary-800' : 'border-slate-200 bg-white text-slate-500'}`}
                        onClick={() => toggleSeries('first')}
                    >
                        <span className={`h-2 w-2 rounded-full ${visibleSeries.first ? 'bg-secondary-500' : 'bg-slate-300'}`}></span>
                        {firstLabel} ({totals.first})
                    </button>
                    <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${visibleSeries.second ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-500'}`}
                        onClick={() => toggleSeries('second')}
                    >
                        <span className={`h-2 w-2 rounded-full ${visibleSeries.second ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                        {secondLabel} ({totals.second})
                    </button>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    No trend data available for the selected range.
                </div>
            ) : (
                <div className="overflow-x-auto no-scrollbar relative">
                    <div className="min-w-[680px]">
                        {tooltipData ? (
                            <div className="mb-2 inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                                <span className="font-semibold text-slate-700">{tooltipData.label}</span>
                                <span className="inline-flex items-center gap-1 text-secondary-700">
                                    <span className="h-2 w-2 rounded-full bg-secondary-500"></span>
                                    {firstLabel}: <strong>{Number(tooltipData[firstKey] || 0)}</strong>
                                </span>
                                <span className="inline-flex items-center gap-1 text-amber-700">
                                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                    {secondLabel}: <strong>{Number(tooltipData[secondKey] || 0)}</strong>
                                </span>
                            </div>
                        ) : null}

                        <div className="flex items-end gap-2 h-36">
                            {data.map((item) => {
                                const firstValue = Number(item[firstKey] || 0);
                                const secondValue = Number(item[secondKey] || 0);
                                const isHovered = hoveredBucket?.bucket === item.bucket;

                                return (
                                    <div
                                        key={item.bucket}
                                        className={`flex-1 min-w-[64px] rounded-md transition-colors ${isHovered ? 'bg-slate-50' : ''}`}
                                        onMouseEnter={() => setHoveredBucket(item)}
                                        onMouseLeave={() => setHoveredBucket(null)}
                                        onFocus={() => setHoveredBucket(item)}
                                        onBlur={() => setHoveredBucket(null)}
                                        tabIndex={0}
                                    >
                                        <div className="h-32 flex items-end justify-center gap-1">
                                            <div
                                                className={`w-3 rounded-t transition-all duration-150 ${visibleSeries.first ? 'bg-secondary-500' : 'bg-secondary-200/40'} ${isHovered ? 'ring-1 ring-secondary-300' : ''}`}
                                                style={{ height: `${clampHeight(visibleSeries.first ? firstValue : 0, maxValue)}px` }}
                                                aria-label={`${firstLabel}: ${firstValue}`}
                                            ></div>
                                            <div
                                                className={`w-3 rounded-t transition-all duration-150 ${visibleSeries.second ? 'bg-amber-500' : 'bg-amber-200/40'} ${isHovered ? 'ring-1 ring-amber-300' : ''}`}
                                                style={{ height: `${clampHeight(visibleSeries.second ? secondValue : 0, maxValue)}px` }}
                                                aria-label={`${secondLabel}: ${secondValue}`}
                                            ></div>
                                        </div>
                                        <div className={`mt-2 text-center text-[11px] font-medium ${isHovered ? 'text-slate-700' : 'text-slate-500'}`}>
                                            {item.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
