import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Recycle, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const role = String(user?.role || '').toUpperCase();

    const isCitizen = role === 'USER';
    const isCollector = role === 'PICKER';
    const isAdmin = role === 'ADMIN';

    const handleLogout = async (e) => {
        e.preventDefault();
        await logout();
    };

    const navLinkClass = (to) => `text-sm font-medium transition-colors ${location.pathname === to
        ? 'text-primary-600 font-semibold'
        : 'text-gray-600 hover:text-primary-600'
        }`;

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-primary-600 p-2 rounded-lg">
                                <Recycle className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
                                Scraply
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/awareness" className={navLinkClass('/awareness')}>Awareness</Link>

                        {isCitizen && (
                            <>
                                <Link to="/citizen/dashboard" className={navLinkClass('/citizen/dashboard')}>Dashboard</Link>
                                <Link to="/citizen/request" className={navLinkClass('/citizen/request')}>Create Request</Link>
                            </>
                        )}

                        {isCollector && (
                            <>
                                <Link to="/collector/dashboard" className={navLinkClass('/collector/dashboard')}>Dashboard</Link>
                                <Link to="/collector/map" className={navLinkClass('/collector/map')}>Live Map</Link>
                            </>
                        )}

                        {isAdmin && (
                            <>
                                <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>Dashboard</Link>
                                <Link to="/admin/pickups" className={navLinkClass('/admin/pickups')}>Pickups</Link>
                                <Link to="/admin/centres" className={navLinkClass('/admin/centres')}>Centres</Link>
                                <Link to="/admin/reports" className={navLinkClass('/admin/reports')}>Reports</Link>
                            </>
                        )}

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        {!user ? (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className={navLinkClass('/login')}>Sign In</Link>
                                <Link to="/register" className="btn btn-primary py-1.5 px-4 text-sm">Get Started</Link>
                            </div>
                        ) : (
                            <div className="relative group">
                                <button
                                    type="button"
                                    className="flex items-center gap-2 p-2 rounded-full text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                                    title="Profile Menu"
                                >
                                    <User className="h-5 w-5" />
                                    <ChevronDown className="h-4 w-4" />
                                </button>

                                <div className="absolute right-0 top-full pt-2 z-50 w-52 opacity-0 invisible translate-y-1 pointer-events-none transition-all duration-200 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
                                    <div className="rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                                        {isCitizen ? <Link to="/citizen/pickups" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Requests</Link> : null}
                                        {isCitizen ? <Link to="/citizen/points" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Points</Link> : null}
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                            <LogOut className="h-4 w-4" />
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </nav>
    );
}
