import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react';

export default function Home() {
    return (
        <div className="space-y-16 pb-16">
            {/* Hero Section */}
            <section className="relative bg-primary-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                            Revolutionizing Waste Management for a <span className="text-primary-400">Cleaner Future</span>
                        </h1>
                        <p className="text-xl text-gray-200 mb-8">
                            Join Scraply in our mission to create sustainable communities through smart recycling and efficient waste collection.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/citizen/request-pickup" className="btn btn-primary flex items-center gap-2">
                                Schedule Pickup <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link to="/awareness" className="btn btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm">
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard
                        to="/citizen/request-pickup"
                        icon={<Truck className="h-8 w-8 text-primary-600" />}
                        title="Request Pickup"
                        description="Schedule hassle-free waste collection at your doorstep."
                    />
                    <FeatureCard
                        to="/citizen/centres"
                        icon={<MapPin className="h-8 w-8 text-blue-600" />}
                        title="Find Centres"
                        description="Locate nearby recycling hubs and drop-off points."
                    />
                    <FeatureCard
                        to="/citizen/report-dump"
                        icon={<AlertTriangle className="h-8 w-8 text-orange-600" />}
                        title="Report Dumping"
                        description="Help keep our city clean by reporting illegal dumps."
                    />
                    <FeatureCard
                        to="/awareness"
                        icon={<BookOpen className="h-8 w-8 text-purple-600" />}
                        title="Learn Segregation"
                        description="Master the art of waste segregation and recycling."
                    />
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description, to }) {
    return (
        <Link to={to} className="card p-6 flex flex-col items-start hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-gray-50 rounded-xl mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </Link>
    );
}
