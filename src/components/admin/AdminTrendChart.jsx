import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

function calculateDynamicScale(maxValue) {
    if (maxValue === 0) return 10;
    
    const magnitude = Math.floor(Math.log10(maxValue));
    const normalized = maxValue / Math.pow(10, magnitude);
    
    let increment;
    if (normalized <= 1) increment = 1;
    else if (normalized <= 2) increment = 2;
    else if (normalized <= 5) increment = 5;
    else increment = 10;
    
    const baseScale = increment * Math.pow(10, magnitude);
    return Math.ceil(baseScale * 1.15);
}

// SVG Path generator for smooth curves (Catmull-Rom spline)
function generateSmoothPath(points, height) {
    if (points.length < 2) return '';
    
    const path = [];
    for (let i = 0; i < points.length; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[Math.min(points.length - 1, i + 1)];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        
        if (i === 0) {
            path.push(`M ${p1.x} ${height - p1.y}`);
        }
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = height - (p1.y + (p2.y - p0.y) / 6);
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = height - (p2.y - (p3.y - p1.y) / 6);
        const x = p2.x;
        const y = height - p2.y;
        
        path.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`);
    }
    
    return path.join(' ');
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
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipData, setTooltipData] = useState(null);

    const maxValue = useMemo(() => {
        return data.reduce((max, item) => {
            const firstValue = visibleSeries.first ? Number(item[firstKey] || 0) : 0;
            const secondValue = visibleSeries.second ? Number(item[secondKey] || 0) : 0;
            return Math.max(max, firstValue, secondValue);
        }, 0);
    }, [data, firstKey, secondKey, visibleSeries]);

    const scaleMax = useMemo(() => calculateDynamicScale(maxValue), [maxValue]);

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

    const chartWidth = 640;
    const chartHeight = 300;
    const padding = 40;
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 2;

    const pointSpacing = plotWidth / Math.max(data.length - 1, 1);

    const firstPoints = useMemo(() => {
        return data.map((item, idx) => ({
            x: padding + idx * pointSpacing,
            y: (Number(item[firstKey] || 0) / scaleMax) * plotHeight,
            value: Number(item[firstKey] || 0),
        }));
    }, [data, firstKey, scaleMax, pointSpacing]);

    const secondPoints = useMemo(() => {
        return data.map((item, idx) => ({
            x: padding + idx * pointSpacing,
            y: (Number(item[secondKey] || 0) / scaleMax) * plotHeight,
            value: Number(item[secondKey] || 0),
        }));
    }, [data, secondKey, scaleMax, pointSpacing]);

    const firstPath = useMemo(() => generateSmoothPath(firstPoints, chartHeight - padding), [firstPoints]);
    const secondPath = useMemo(() => generateSmoothPath(secondPoints, chartHeight - padding), [secondPoints]);

    return (
        <div className={`card p-6 border border-slate-200 h-full flex flex-col bg-gradient-to-br from-blue-50/50 via-white to-white shadow-sm hover:shadow-md transition-shadow ${className}`}>
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" /> {title}
                    </h3>
                    {subtitle ? <p className="text-sm text-slate-600 mt-2">{subtitle}</p> : null}
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <button
                        type="button"
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium transition-all ${visibleSeries.first ? 'bg-blue-500 text-white shadow-lg hover:shadow-xl' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => toggleSeries('first')}
                    >
                        <span className={`h-2.5 w-2.5 rounded-full ${visibleSeries.first ? 'bg-white' : 'bg-blue-500'}`}></span>
                        {firstLabel}
                    </button>
                    <button
                        type="button"
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium transition-all ${visibleSeries.second ? 'bg-amber-500 text-white shadow-lg hover:shadow-xl' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => toggleSeries('second')}
                    >
                        <span className={`h-2.5 w-2.5 rounded-full ${visibleSeries.second ? 'bg-white' : 'bg-amber-500'}`}></span>
                        {secondLabel}
                    </button>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-center text-slate-500 flex-1 flex items-center justify-center">
                    <div>
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-slate-400 opacity-50" />
                        <p className="text-sm font-medium">No trend data available</p>
                        <p className="text-xs mt-1">for the selected range</p>
                    </div>
                </div>
            ) : (
                <div className="relative flex-1 min-h-[320px] flex flex-col">
                    <div className="relative flex-1 bg-white rounded-lg border border-slate-100 overflow-hidden">
                        <svg
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            preserveAspectRatio="none"
                            className="absolute inset-0"
                        >
                            <defs>
                                <linearGradient id="firstGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="secondGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Grid lines */}
                            <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="1" />
                            <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="1" />
                            
                            {/* Horizontal grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                                <line
                                    key={`hgrid-${fraction}`}
                                    x1={padding}
                                    y1={padding + fraction * plotHeight}
                                    x2={chartWidth - padding}
                                    y2={padding + fraction * plotHeight}
                                    stroke="#f1f5f9"
                                    strokeWidth="1"
                                />
                            ))}

                            {/* Y-axis labels */}
                            <text x={padding - 10} y={padding - 5} textAnchor="end" fontSize="11" fill="#64748b" fontWeight="500">
                                {scaleMax}
                            </text>
                            <text x={padding - 10} y={padding + plotHeight / 2 + 4} textAnchor="end" fontSize="11" fill="#64748b" fontWeight="500">
                                {Math.round(scaleMax / 2)}
                            </text>
                            <text x={padding - 10} y={chartHeight - padding + 4} textAnchor="end" fontSize="11" fill="#64748b" fontWeight="500">
                                0
                            </text>

                            {/* Area fills */}
                            {visibleSeries.first && (
                                <path
                                    d={`${firstPath} L ${firstPoints[firstPoints.length - 1]?.x || padding} ${chartHeight - padding} Z`}
                                    fill="url(#firstGradient)"
                                    opacity="0.5"
                                />
                            )}
                            {visibleSeries.second && (
                                <path
                                    d={`${secondPath} L ${secondPoints[secondPoints.length - 1]?.x || padding} ${chartHeight - padding} Z`}
                                    fill="url(#secondGradient)"
                                    opacity="0.5"
                                />
                            )}

                            {/* Lines */}
                            {visibleSeries.first && (
                                <path d={firstPath} stroke="#3b82f6" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
                            )}
                            {visibleSeries.second && (
                                <path d={secondPath} stroke="#f59e0b" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
                            )}

                            {/* Hover vertical line */}
                            {hoveredIndex !== null && (
                                <line
                                    x1={padding + hoveredIndex * pointSpacing}
                                    y1={padding}
                                    x2={padding + hoveredIndex * pointSpacing}
                                    y2={chartHeight - padding}
                                    stroke="#cbd5e1"
                                    strokeWidth="2"
                                    strokeDasharray="4"
                                />
                            )}

                            {/* Data points */}
                            {visibleSeries.first && firstPoints.map((point, idx) => (
                                <circle
                                    key={`first-${idx}`}
                                    cx={point.x}
                                    cy={chartHeight - padding - point.y}
                                    r={hoveredIndex === idx ? 5 : 3.5}
                                    fill="#3b82f6"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="transition-all"
                                />
                            ))}
                            {visibleSeries.second && secondPoints.map((point, idx) => (
                                <circle
                                    key={`second-${idx}`}
                                    cx={point.x}
                                    cy={chartHeight - padding - point.y}
                                    r={hoveredIndex === idx ? 5 : 3.5}
                                    fill="#f59e0b"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="transition-all"
                                />
                            ))}
                        </svg>

                        {/* Interactive hover area */}
                        <svg
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            preserveAspectRatio="none"
                            className="absolute inset-0 cursor-crosshair"
                            onMouseMove={(e) => {
                                const svg = e.currentTarget;
                                const rect = svg.getBoundingClientRect();
                                const x = (e.clientX - rect.left) / rect.width * chartWidth;
                                const relativeX = x - padding;
                                const index = Math.round(relativeX / pointSpacing);
                                
                                if (index >= 0 && index < data.length) {
                                    setHoveredIndex(index);
                                    setTooltipData({
                                        x: padding + index * pointSpacing,
                                        bucket: data[index].bucket,
                                        firstValue: Number(data[index][firstKey] || 0),
                                        secondValue: Number(data[index][secondKey] || 0),
                                    });
                                }
                            }}
                            onMouseLeave={() => {
                                setHoveredIndex(null);
                                setTooltipData(null);
                            }}
                            style={{ pointerEvents: 'none' }}
                        />

                        {/* Tooltip */}
                        {tooltipData && (
                            <div
                                className="absolute bg-white border border-slate-200 rounded-lg shadow-xl p-3 text-sm z-10"
                                style={{
                                    left: `${(tooltipData.x / chartWidth) * 100}%`,
                                    top: `${(padding * 0.7 / chartHeight) * 100}%`,
                                    transform: 'translateX(-50%)',
                                    pointerEvents: 'none',
                                }}
                            >
                                <div className="font-semibold text-slate-900 mb-2">{title}</div>
                                <div className="text-xs text-slate-600 mb-1">{tooltipData.bucket}</div>
                                {visibleSeries.first && (
                                    <div className="flex items-center gap-2 text-xs text-slate-700 mb-1">
                                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                                        <span>{firstLabel}: <strong>{tooltipData.firstValue}</strong></span>
                                    </div>
                                )}
                                {visibleSeries.second && (
                                    <div className="flex items-center gap-2 text-xs text-slate-700">
                                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                                        <span>{secondLabel}: <strong>{tooltipData.secondValue}</strong></span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* X-axis labels */}
                    <div className="flex justify-between px-6 mt-4 text-xs font-medium text-slate-600">
                        {data.map((item, idx) => (
                            (idx === 0 || idx === data.length - 1 || idx % Math.ceil(data.length / 5) === 0) && (
                                <span key={`label-${idx}`}>{item.bucket}</span>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
