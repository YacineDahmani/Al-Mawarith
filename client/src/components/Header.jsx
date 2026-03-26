import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ rightContent }) {
    const { t, language, setLanguage } = useLanguage();

    return (
        <nav className="bg-dark text-white py-4 px-8 shadow-md w-full flex justify-center">
            <div className="w-full max-w-6xl flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold font-serif tracking-wide text-gold hover:text-gold/80 transition-colors">
                    {t('appTitle')}
                </Link>

                <div className="flex items-center gap-4">
                    {rightContent}
                    <div
                        className={`lang-switch ${language === 'en' ? 'is-en' : 'is-ar'}`}
                        role="group"
                        aria-label="Language selector"
                        dir="ltr"
                    >
                        <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            className={`lang-switch__option ${language === 'en' ? 'is-active' : ''}`}
                            aria-pressed={language === 'en'}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage('ar')}
                            className={`lang-switch__option ${language === 'ar' ? 'is-active' : ''}`}
                            aria-pressed={language === 'ar'}
                        >
                            AR
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
