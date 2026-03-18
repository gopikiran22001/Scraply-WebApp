import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getDashboardRoute(role) {
    const normalizedRole = String(role || '').toUpperCase();
    if (normalizedRole === 'ADMIN') {
        return '/admin/dashboard';
    }
    if (normalizedRole === 'PICKER') {
        return '/collector/dashboard';
    }
    return '/citizen/dashboard';
}

export default function PublicOnlyRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to={getDashboardRoute(user.role)} replace />;
    }

    return children;
}
