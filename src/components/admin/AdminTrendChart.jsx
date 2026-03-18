import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

function toHeightPercent(value, maxValue) {
    if (maxValue <= 0 || value <= 0) {
        return 0;
    }

    return Math.max(4, Math.round((value / maxValue) * 100));
}

export default function AdminTrendChart({
    title,
    subtitle,
    data,
    firstKey = 'pickups',
    secondKey = 'reports',
    firstLabel = 'Pickups',
    secondLabel = 'Reports',
    className = '',
}) {
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

    const scaleMax = useMemo(() => Math.max(10, maxValue), [maxValue]);

    const totals = useMemo(() => {
        return data.reduce((acc, item) => ({
            first: acc.first + Number(item[firstKey] || 0),
            second: acc.second + Number(item[secondKey] || 0),
        }), { first: 0, second: 0 });
    }, [data, firstKey, secondKey]);

    const toggleSeries = (key) => {
        setVisibleSeries((previous) => ({
            ...previous,
            [key]: !previous[key],
        }));
    };

    return (
        <div className={`card p-5 border border-slate-200 h-full flex flex-col ${className}`}>
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
                <div className="relative flex-1 min-h-[260px] flex flex-col">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Scale</span>
                        <span>0 to {scaleMax}</span>
                    </div>

                    <div className="relative flex-1 border-t border-slate-100 pt-3 pl-8">
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 text-[10px] text-slate-400">
                            <div className="absolute top-0 -translate-y-1/2">{scaleMax}</div>
                            <div className="absolute top-1/2 -translate-y-1/2">{Math.round(scaleMax / 2)}</div>
                            <div className="absolute bottom-0 translate-y-1/2">0</div>
                        </div>

                        <div className="pointer-events-none absolute inset-y-0 left-8 right-0">
                            <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200"></div>
                            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200"></div>
                            <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-slate-200"></div>
                        </div>

                        <div className="h-full overflow-x-auto overflow-y-hidden no-scrollbar">
                            <div className="min-w-[680px] h-full flex items-end gap-2 pr-2">
                                {data.map((item) => {
                                    const firstValue = Number(item[firstKey] || 0);
                                    const secondValue = Number(item[secondKey] || 0);
                                    const firstHeight = toHeightPercent(visibleSeries.first ? firstValue : 0, scaleMax);
                                    const secondHeight = toHeightPercent(visibleSeries.second ? secondValue : 0, scaleMax);

                                    return (
                                        <div
                                            key={item.bucket}
                                            className="flex-1 min-w-[64px] h-full rounded-md"
                                        >
                                            <div className="h-full grid grid-rows-[1fr_auto]">
                                                <div className="flex items-end justify-center gap-1 min-h-[140px]">
                                                    <div
                                                        className={`w-3 rounded-t ${visibleSeries.first ? 'bg-secondary-500' : 'bg-secondary-200/40'}`}
                                                        style={{ height: `${firstHeight}%` }}
                                                        aria-label={`${firstLabel}: ${firstValue}`}
                                                    ></div>
                                                    <div
                                                        className={`w-3 rounded-t ${visibleSeries.second ? 'bg-amber-500' : 'bg-amber-200/40'}`}
                                                        style={{ height: `${secondHeight}%` }}
                                                        aria-label={`${secondLabel}: ${secondValue}`}
                                                    ></div>
                                                </div>
                                                <div className="mt-2 text-center text-[11px] font-medium text-slate-500">
                                                    {item.label}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
