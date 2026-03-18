import React from 'react';
import { Link } from 'react-router-dom';
import {
    Truck,
    MapPin,
    List,
    BookOpen,
    ArrowRight,
    Clock3,
    ShieldCheck,
    Leaf,
    ClipboardCheck,
    AlertTriangle,
    Recycle,
} from 'lucide-react';

export default function Home() {
    return (
        <div className="space-y-16 pb-20">
            {/* Hero Section */}
            <section className="relative bg-primary-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                            Cleaner streets start with <span className="text-primary-400">smart local action</span>
                        </h1>
                        <p className="text-xl text-gray-200 mb-8">
                            Scraply helps citizens request doorstep pickups, report illegal dumping, and learn correct segregation so recyclable waste stays out of landfills.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/citizen/request" className="btn btn-primary flex items-center gap-2">
                                Create Request <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link to="/awareness" className="btn btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm">
                                Explore Awareness
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Strip */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard icon={<Clock3 className="h-5 w-5 text-primary-600" />} title="Fast action" value="Same-day triage" />
                    <MetricCard icon={<Recycle className="h-5 w-5 text-emerald-600" />} title="Sorted recovery" value="Dry and wet tracking" />
                    <MetricCard icon={<ShieldCheck className="h-5 w-5 text-blue-600" />} title="Traceable updates" value="Status on every request" />
                    <MetricCard icon={<Leaf className="h-5 w-5 text-lime-600" />} title="Cleaner zones" value="Community-first model" />
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 max-w-2xl">
                    <h2 className="text-3xl font-bold text-gray-900">Everything you need in one civic workflow</h2>
                    <p className="text-gray-600 mt-2">From reporting to pickup completion, every action is structured so citizens and collection teams stay aligned.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard
                        to="/citizen/request"
                        icon={<Truck className="h-8 w-8 text-primary-600" />}
                        title="Create Request"
                        description="Use one form to submit pickup requests or dump reports."
                    />
                    <FeatureCard
                        to="/citizen/centres"
                        icon={<MapPin className="h-8 w-8 text-blue-600" />}
                        title="Find Centres"
                        description="Locate nearby recycling hubs and drop-off points."
                    />
                    <FeatureCard
                        to="/citizen/pickups"
                        icon={<List className="h-8 w-8 text-orange-600" />}
                        title="My Requests"
                        description="Track request history and completion status."
                    />
                    <FeatureCard
                        to="/awareness"
                        icon={<BookOpen className="h-8 w-8 text-violet-600" />}
                        title="Learn Segregation"
                        description="Master the art of waste segregation and recycling."
                    />
                </div>
            </section>

            {/* How it Works */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">How Scraply works</h2>
                    <div className="grid gap-5 md:grid-cols-3">
                        <StepCard
                            step="01"
                            icon={<ClipboardCheck className="h-5 w-5 text-primary-600" />}
                            title="Raise a request"
                            description="Choose Pickup or Dump Report, add location and basic details, then submit in under a minute."
                        />
                        <StepCard
                            step="02"
                            icon={<Truck className="h-5 w-5 text-orange-600" />}
                            title="Team assignment"
                            description="Admin panel assigns the nearest available picker based on pincode and route context."
                        />
                        <StepCard
                            step="03"
                            icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
                            title="Track to closure"
                            description="Watch status updates from REQUESTED to COMPLETED and keep a complete service history."
                        />
                    </div>
                </div>
            </section>

            {/* Use Case Cards */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                        <h3 className="text-xl font-bold text-emerald-800 flex items-center gap-2 mb-3">
                            <Recycle className="h-5 w-5" /> When to create a Pickup request
                        </h3>
                        <ul className="space-y-2 text-slate-700 text-sm">
                            <li>- Dry recyclables like paper, plastics, and metal are sorted and ready.</li>
                            <li>- You have moderate volume from home, shop, or office.</li>
                            <li>- You want traceable collection instead of mixed-bin disposal.</li>
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
                        <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-5 w-5" /> When to report Illegal dumping
                        </h3>
                        <ul className="space-y-2 text-slate-700 text-sm">
                            <li>- Waste is dumped in open plots, roadsides, or near drains.</li>
                            <li>- You can share a clear image and approximate location.</li>
                            <li>- Public health risk is visible (odor, blockage, spread).</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white p-8 sm:p-10">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">Start contributing to a cleaner neighborhood today</h2>
                    <p className="text-slate-200 max-w-2xl mb-6">
                        Every correctly segregated request reduces landfill load and helps build a reliable local recycling chain.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/citizen/request" className="btn btn-primary inline-flex items-center gap-2">
                            Raise a Request <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link to="/citizen/centres" className="btn btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
                            Find Drop-Off Centres
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function MetricCard({ icon, title, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 mb-3">{icon}</div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">{value}</p>
        </div>
    );
}

function StepCard({ step, icon, title, description }) {
    return (
        <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/40">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">Step {step}</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-slate-200">{icon}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-600">{description}</p>
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
