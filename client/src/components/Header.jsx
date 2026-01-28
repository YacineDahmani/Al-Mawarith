import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ rightContent }) {
    const { t, language, toggleLanguage } = useLanguage();

    return (
        <nav className="bg-dark text-white py-4 px-8 shadow-md w-full flex justify-center">
            <div className="w-full max-w-6xl flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold font-serif tracking-wide text-gold hover:text-gold/80 transition-colors">
                    {t('appTitle')}
                </Link>

                <div className="flex items-center gap-4">
                    {rightContent}
                    <button
                        onClick={toggleLanguage}
                        className="px-3 py-1 rounded-md border border-gray-600 hover:border-gold hover:text-gold transition-colors text-sm font-medium"
                    >
                        {language === 'en' ? 'العربية' : 'English'}
                    </button>
                </div>
            </div>
        </nav>
    );
}
