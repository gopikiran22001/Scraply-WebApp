import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Recycle, User, LogOut } from 'lucide-react';
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
                                <Link to="/citizen/request-pickup" className={navLinkClass('/citizen/request-pickup')}>Request Pickup</Link>
                                <Link to="/citizen/pickups" className={navLinkClass('/citizen/pickups')}>My Pickups</Link>
                                <Link to="/citizen/report-dump" className={navLinkClass('/citizen/report-dump')}>Report Dump</Link>
                                <Link to="/citizen/centres" className={navLinkClass('/citizen/centres')}>Centres</Link>
                                <Link to="/citizen/points" className={navLinkClass('/citizen/points')}>Points</Link>
                            </>
                        )}

                        {isCollector && (
                            <>
                                <Link to="/collector/dashboard" className={navLinkClass('/collector/dashboard')}>Dashboard</Link>
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
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/profile"
                                    className={`p-2 rounded-full transition-colors ${location.pathname === '/profile'
                                        ? 'text-primary-600 bg-primary-50'
                                        : 'text-gray-500 hover:text-primary-600 hover:bg-gray-100'
                                        }`}
                                    title="Profile"
                                >
                                    <User className="h-5 w-5" />
                                </Link>
                                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Log Out">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </nav>
    );
}
