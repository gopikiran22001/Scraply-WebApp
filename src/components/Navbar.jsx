import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Recycle, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const closeTimerRef = useRef(null);
    const role = String(user?.role || '').toUpperCase();

    const isCitizen = role === 'USER';
    const isCollector = role === 'PICKER';
    const isAdmin = role === 'ADMIN';

    const handleLogout = async (e) => {
        e.preventDefault();
        setIsMenuOpen(false);
        await logout();
    };

    const handleMenuMouseEnter = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsMenuOpen(true);
    };

    const handleMenuMouseLeave = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = setTimeout(() => {
            setIsMenuOpen(false);
        }, 180);
    };

    useEffect(() => {
        setIsMenuOpen(false);
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    const navLinkClass = (to) => `text-sm font-medium transition-colors ${location.pathname === to
        ? 'text-primary-600 font-semibold'
        : 'text-gray-600 hover:text-primary-600'
        }`;

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-md">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-primary-600 p-2 rounded-lg">
                                <Recycle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent hidden sm:inline">
                                Scraply
                            </span>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
                            title="Toggle Menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/awareness" className={navLinkClass('/awareness')}>Awareness</Link>

                        {isCitizen && (
                            <>
                                <Link to="/citizen/dashboard" className={navLinkClass('/citizen/dashboard')}>Dashboard</Link>
                                <Link to="/citizen/request" className={navLinkClass('/citizen/request')}>Create Request</Link>
                                <Link to="/citizen/queries" className={navLinkClass('/citizen/queries')}>Queries</Link>
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
                                <Link to="/admin/pickups" className={navLinkClass('/admin/pickups')}>Requests</Link>
                                <Link to="/admin/queries" className={navLinkClass('/admin/queries')}>Queries</Link>
                            </>
                        )}

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        {!user ? (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className={navLinkClass('/login')}>Sign In</Link>
                                <Link to="/register" className="btn btn-primary py-1.5 px-4 text-sm">Get Started</Link>
                            </div>
                        ) : (
                            <div
                                className="relative"
                                ref={menuRef}
                                onMouseEnter={handleMenuMouseEnter}
                                onMouseLeave={handleMenuMouseLeave}
                            >
                                <button
                                    type="button"
                                    className="flex items-center gap-2 p-2 rounded-full text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                                    title="Profile Menu"
                                    onClick={() => setIsMenuOpen((prev) => !prev)}
                                    aria-expanded={isMenuOpen}
                                    aria-haspopup="menu"
                                >
                                    <User className="h-5 w-5" />
                                    <ChevronDown className="h-4 w-4" />
                                </button>

                                <div className={`absolute right-0 top-full pt-2 z-50 w-52 transition-all duration-200 ease-out ${isMenuOpen ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-1 pointer-events-none'}`}>
                                    <div className="rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                                        <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                                        {isCitizen ? <Link to="/citizen/pickups" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Requests</Link> : null}
                                        {isCitizen ? <Link to="/citizen/queries" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Queries</Link> : null}
                                        {isCitizen ? <Link to="/citizen/points" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Points</Link> : null}
                                        {isAdmin && <Link to="/admin/pickers" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Pickers</Link>}
                                        {isAdmin && <Link to="/admin/centres" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Centres</Link>}
                                        {isAdmin && <Link to="/admin/reports" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Reports</Link>}
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                            <LogOut className="h-4 w-4" />
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Profile Icon */}
                    <div className="md:hidden">
                        {!user ? (
                            <Link to="/login" className="btn btn-primary py-1.5 px-3 text-sm">Sign In</Link>
                        ) : (
                            <button
                                type="button"
                                className="p-2 rounded-full text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                title="Profile"
                            >
                                <User className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
                        <Link to="/awareness" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/awareness' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Awareness</Link>

                        {isCitizen && (
                            <>
                                <Link to="/citizen/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/citizen/dashboard' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Dashboard</Link>
                                <Link to="/citizen/request" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/citizen/request' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Create Request</Link>
                                <Link to="/citizen/queries" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/citizen/queries' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Queries</Link>
                            </>
                        )}

                        {isCollector && (
                            <>
                                <Link to="/collector/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/collector/dashboard' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Dashboard</Link>
                                <Link to="/collector/map" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/collector/map' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Live Map</Link>
                            </>
                        )}

                        {isAdmin && (
                            <>
                                <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/admin/dashboard' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Dashboard</Link>
                                <Link to="/admin/pickups" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/admin/pickups' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Requests</Link>
                                <Link to="/admin/queries" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${location.pathname === '/admin/queries' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>Queries</Link>
                            </>
                        )}
                    </div>
                )}

                {/* Mobile Profile Dropdown */}
                {isMobileMenuOpen && user && (
                    <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Profile</Link>
                        {isCitizen && (
                            <>
                                <Link to="/citizen/pickups" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">My Requests</Link>
                                <Link to="/citizen/queries" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">My Queries</Link>
                                <Link to="/citizen/points" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Points</Link>
                            </>
                        )}
                        {isAdmin && (
                            <>
                                <Link to="/admin/pickers" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Pickers</Link>
                                <Link to="/admin/centres" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Centres</Link>
                                <Link to="/admin/reports" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Reports</Link>
                            </>
                        )}
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <LogOut className="h-4 w-4" />
                            Log Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
