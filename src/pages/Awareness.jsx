import React from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle,
    XCircle,
    Recycle,
    AlertTriangle,
    Battery,
    Droplets,
    BookOpenCheck,
    ArrowRight,
} from 'lucide-react';

export default function Awareness() {
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Waste Segregation and Responsible Disposal Guide</h1>
                <p className="text-xl text-gray-600">
                    Correct segregation at home is the fastest way to improve recycling quality, reduce contamination, and keep neighborhoods cleaner.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={<Recycle className="h-5 w-5 text-emerald-600" />}
                    title="Dry Waste"
                    description="Paper, clean plastic, metal, glass, cardboard"
                />
                <InfoCard
                    icon={<Droplets className="h-5 w-5 text-sky-600" />}
                    title="Wet Waste"
                    description="Food scraps, peels, tea leaves, garden trimmings"
                />
                <InfoCard
                    icon={<Battery className="h-5 w-5 text-violet-600" />}
                    title="Hazardous / E-waste"
                    description="Batteries, chargers, bulbs, old electronics"
                />
                <InfoCard
                    icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
                    title="Reject Waste"
                    description="Sanitary and contaminated mixed material"
                />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">What goes where</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <CategoryBox
                        title="Dry Bin"
                        accent="emerald"
                        items={[
                            'Newspapers, notebooks, cartons',
                            'Rinsed milk packets and bottles',
                            'Plastic containers and caps',
                            'Metal cans and foil (clean)',
                        ]}
                    />
                    <CategoryBox
                        title="Wet Bin"
                        accent="sky"
                        items={[
                            'Vegetable and fruit peels',
                            'Leftover cooked food (small quantities)',
                            'Coffee grounds and tea leaves',
                            'Garden leaves and flowers',
                        ]}
                    />
                    <CategoryBox
                        title="Hazardous / E-waste"
                        accent="violet"
                        items={[
                            'Batteries and power banks',
                            'CFL/LED bulbs and tube lights',
                            'Mobile phones, cables, chargers',
                            'Paint/chemical containers',
                        ]}
                    />
                    <CategoryBox
                        title="Sanitary / Reject"
                        accent="rose"
                        items={[
                            'Diapers and sanitary waste (wrapped)',
                            'Medical cotton/masks (sealed)',
                            'Contaminated wrappers and tissues',
                            'Broken ceramics and mirror shards',
                        ]}
                    />
                </div>
            </section>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="card p-6 sm:p-8 border-t-4 border-t-green-500">
                    <h2 className="text-2xl font-bold text-green-700 mb-6 flex items-center gap-2">
                        <CheckCircle className="h-6 w-6" /> Do's
                    </h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Separate dry and wet waste at the source.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Rinse plastic containers before disposal.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Flatten cardboard boxes to save space.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Wrap broken glass in newspaper before binning.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Keep batteries and e-waste in a separate box for safe drop-off.</span>
                        </li>
                    </ul>
                </div>

                <div className="card p-6 sm:p-8 border-t-4 border-t-red-500">
                    <h2 className="text-2xl font-bold text-red-700 mb-6 flex items-center gap-2">
                        <XCircle className="h-6 w-6" /> Don'ts
                    </h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't mix e-waste with regular garbage.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't throw batteries in the general bin.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't use single-use plastics if avoidable.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't pour oil or grease down the drain.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't send wet food waste in plastic carry bags for collection.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpenCheck className="h-6 w-6 text-primary-600" /> Reporting illegal dumping effectively
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <ChecklistCard title="Capture clearly" description="Take a photo that shows the dumping spot and surrounding landmark." />
                    <ChecklistCard title="Pin location" description="Use nearest road, building, or pincode so pickup teams can route quickly." />
                    <ChecklistCard title="Add context" description="Mention if it is recurring, blocked drainage, or near school/market areas." />
                </div>
            </section>

            <div className="grid md:grid-cols-3 gap-6">
                <img
                    src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop"
                    alt="Recycling"
                    className="rounded-xl h-64 w-full object-cover shadow-md"
                />
                <img
                    src="https://images.unsplash.com/photo-1605600659908-0ef719419d41?q=80&w=2073&auto=format&fit=crop"
                    alt="Segregation"
                    className="rounded-xl h-64 w-full object-cover shadow-md"
                />
                <img
                    src="https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?q=80&w=2071&auto=format&fit=crop"
                    alt="Green City"
                    className="rounded-xl h-64 w-full object-cover shadow-md"
                />
            </div>

            <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white p-8 sm:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Take the next clean-city action</h2>
                <p className="text-slate-200 max-w-2xl mb-6">
                    Use this guide while creating requests so your waste reaches the right collection stream and gets processed correctly.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Link to="/citizen/request" className="btn btn-primary inline-flex items-center gap-2">
                        Create Request <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/citizen/centres" className="btn btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
                        View Centres
                    </Link>
                </div>
            </section>
        </div>
    );
}

function InfoCard({ icon, title, description }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 mb-2">{icon}</div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-600 mt-1">{description}</p>
        </div>
    );
}

function CategoryBox({ title, accent, items }) {
    const accents = {
        emerald: 'border-emerald-200 bg-emerald-50/40 text-emerald-800',
        sky: 'border-sky-200 bg-sky-50/40 text-sky-800',
        violet: 'border-violet-200 bg-violet-50/40 text-violet-800',
        rose: 'border-rose-200 bg-rose-50/40 text-rose-800',
    };

    const accentClass = accents[accent] || accents.emerald;

    return (
        <div className={`rounded-xl border p-4 ${accentClass}`}>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <ul className="space-y-1.5 text-sm text-slate-700">
                {items.map((item) => (
                    <li key={item}>- {item}</li>
                ))}
            </ul>
        </div>
    );
}

function ChecklistCard({ title, description }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900 mb-1">{title}</p>
            <p className="text-sm text-slate-600">{description}</p>
        </div>
    );
}
