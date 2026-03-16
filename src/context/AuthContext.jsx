/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const normalizeRole = (role) => String(role || '').toUpperCase();

    const getHomeRouteByRole = (role) => {
        const normalizedRole = normalizeRole(role);
        if (normalizedRole === 'ADMIN') return '/admin/dashboard';
        if (normalizedRole === 'PICKER') return '/collector/dashboard';
        return '/citizen/dashboard';
    };

    const refreshProfile = useCallback(async () => {
        const { data } = await api.get('/auth/profile');
        setUser({
            ...(data || {}),
            role: normalizeRole(data?.role),
        });
    }, []);

    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                await refreshProfile();
            } catch {
                setUser(null);
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, [refreshProfile]);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password }, {
                headers: {
                    'X-Platform': 'WEB'
                }
            });

            const loggedInUser = {
                ...data,
                role: normalizeRole(data.role)
            };

            setUser(loggedInUser);
            navigate(getHomeRouteByRole(loggedInUser.role));

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: getApiErrorMessage(error, 'Login failed')
            };
        }
    };

    const register = async (userData) => {
        try {
            const payload = {
                ...userData,
                role: normalizeRole(userData.role)
            };

            await api.post('/auth/register', payload);
            navigate('/login');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: getApiErrorMessage(error, 'Registration failed')
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to notify server during logout'), 'error');
        } finally {
            setUser(null);
            navigate('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
