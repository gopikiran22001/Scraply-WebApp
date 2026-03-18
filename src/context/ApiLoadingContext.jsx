/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { subscribeToApiActivity } from '../api/axios';

const ApiLoadingContext = createContext({ isLoading: false, activeRequestCount: 0 });

function GlobalApiLoadingOverlay({ isVisible }) {
    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/22 backdrop-blur-[2px]">
            <div className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-white/30 bg-white/92 px-5 py-4 shadow-2xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-slate-900">Loading</p>
                    <p className="text-xs text-slate-600">Fetching the latest data...</p>
                </div>
            </div>
        </div>
    );
}

export function ApiLoadingProvider({ children }) {
    const [activeRequestCount, setActiveRequestCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        return subscribeToApiActivity(setActiveRequestCount);
    }, []);

    useEffect(() => {
        let showTimer;

        if (activeRequestCount > 0) {
            showTimer = window.setTimeout(() => {
                setIsVisible(true);
            }, 150);
        } else {
            setIsVisible(false);
        }

        return () => {
            if (showTimer) {
                window.clearTimeout(showTimer);
            }
        };
    }, [activeRequestCount]);

    const value = useMemo(() => ({
        isLoading: isVisible,
        activeRequestCount,
    }), [activeRequestCount, isVisible]);

    return (
        <ApiLoadingContext.Provider value={value}>
            {children}
            <GlobalApiLoadingOverlay isVisible={isVisible} />
        </ApiLoadingContext.Provider>
    );
}

export function useApiLoading() {
    return useContext(ApiLoadingContext);
}