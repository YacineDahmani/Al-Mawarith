import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen flex flex-col w-full islamic-pattern">
            <Header />

            <main className="flex-grow w-full flex flex-col items-center justify-center px-4 sm:px-6 py-12">
                <div className="w-full max-w-5xl">
                    <section className="text-center mb-14 animate-fadeIn">
                        <h1 className="font-serif text-deep-teal text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
                            {t('heroTitle')}
                        </h1>
                        <div className="arabesque-divider" />
                        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed mb-8">
                            {t('heroDesc')}
                        </p>
                        <Link to="/calculator" className="btn-primary text-base py-3.5 px-8 shadow-md">
                            {t('startBtn')}
                        </Link>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-12">
                        <div className="card text-center p-8 hover:shadow-lg transition-shadow flex flex-col items-center">
                            <div className="w-14 h-14 bg-deep-teal/10 rounded-full flex items-center justify-center mb-5 text-deep-teal text-2xl">
                                ⚖️
                            </div>
                            <h2 className="text-xl font-serif font-bold text-deep-teal mb-3">{t('feature1Title')}</h2>
                            <p className="text-sm text-stone-600 leading-relaxed flex-grow">{t('feature1Desc')}</p>
                        </div>

                        <div className="card text-center p-8 hover:shadow-lg transition-shadow flex flex-col items-center">
                            <div className="w-14 h-14 bg-deep-teal/10 rounded-full flex items-center justify-center mb-5 text-deep-teal text-2xl">
                                👥
                            </div>
                            <h2 className="text-xl font-serif font-bold text-deep-teal mb-3">{t('feature2Title')}</h2>
                            <p className="text-sm text-stone-600 leading-relaxed flex-grow">{t('feature2Desc')}</p>
                        </div>

                        <div className="card text-center p-8 hover:shadow-lg transition-shadow flex flex-col items-center">
                            <div className="w-14 h-14 bg-deep-teal/10 rounded-full flex items-center justify-center mb-5 text-deep-teal text-2xl">
                                📊
                            </div>
                            <h2 className="text-xl font-serif font-bold text-deep-teal mb-3">{t('feature3Title')}</h2>
                            <p className="text-sm text-stone-600 leading-relaxed flex-grow">{t('feature3Desc')}</p>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="bg-dark text-white py-8 mt-auto w-full text-center text-xs text-stone-400">
                <p className="text-xl font-serif mb-2 text-gold font-bold">{t('appTitle')}</p>
                <p className="text-stone-300 mb-1">{t('appSubtitle')}</p>
                <p>{t('footerDesc')}</p>
                <p className="text-xs text-stone-500 mt-4">
                    Credit:{' '}
                    <a
                        href="https://github.com/YacineDahmani"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                    >
                        YacineDahmani
                    </a>
                </p>
            </footer>
        </div>
    );
}
