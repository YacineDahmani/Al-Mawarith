import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col w-full islamic-pattern">
            <nav className="bg-deep-teal text-white py-4 px-8 shadow-md w-full flex justify-center">
                <div className="w-full max-w-6xl flex justify-center items-center">
                    <h1 className="text-2xl font-bold font-serif tracking-wide">Al-Mawarith</h1>

                </div>
            </nav>

            <main className="flex-grow w-full flex flex-col items-center justify-center px-4 py-8">
                <div className="w-full max-w-6xl">
                    <section className="text-center mb-24">
                        <h2 className="text-5xl md:text-6xl font-serif text-deep-teal mb-6 leading-tight">
                            Islamic Inheritance Calculator
                        </h2>
                        <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Calculate inheritance distributions according to Sharia law with precision and ease.
                            Handle complex asset types and dynamic heir relationships.
                        </p>
                        <Link to="/calculator" className="btn-primary text-lg inline-block transform hover:scale-105 transition-transform duration-300">
                            Start Calculation
                        </Link>
                    </section>

                    <section className="grid md:grid-cols-3 gap-8 mb-24 items-stretch">
                        <div className="card text-center hover:shadow-xl transition-shadow duration-300 h-full flex flex-col items-center">
                            <div className="w-16 h-16 bg-deep-teal/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <svg className="w-8 h-8 text-deep-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-deep-teal mb-3">Precise Calculations</h3>
                            <p className="text-gray-600 flex-grow">Accurate Sharia-compliant calculations using fixed shares (Ashab al-Furud) and residuary rules (Asabah).</p>
                        </div>

                        <div className="card text-center hover:shadow-xl transition-shadow duration-300 h-full flex flex-col items-center">
                            <div className="w-16 h-16 bg-deep-teal/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <svg className="w-8 h-8 text-deep-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-deep-teal mb-3">All Heir Types</h3>
                            <p className="text-gray-600 flex-grow">Comprehensive support for spouses, children, parents, grandparents, siblings, and extended family.</p>
                        </div>

                        <div className="card text-center hover:shadow-xl transition-shadow duration-300 h-full flex flex-col items-center">
                            <div className="w-16 h-16 bg-deep-teal/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <svg className="w-8 h-8 text-deep-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-deep-teal mb-3">Visual Results</h3>
                            <p className="text-gray-600 flex-grow">Easy-to-understand visualizations with pie charts and detailed breakdown tables for shares.</p>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="bg-dark text-white py-12 mt-auto w-full flex justify-center">
                <div className="w-full max-w-6xl px-8 text-center">
                    <p className="text-2xl font-serif mb-4 text-gold">Al-Mawarith</p>
                    <p className="text-gray-400 mb-2">Islamic Inheritance Calculator</p>
                    <p className="text-sm text-gray-500">Based on Sunni Sharia principles</p>
                </div>
            </footer>
        </div>
    );
}
