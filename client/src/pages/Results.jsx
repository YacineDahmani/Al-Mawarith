import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { createCase, calculateInheritance } from '../api';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#0F4C5C', '#C29015', '#8A2A2A', '#2E8B57', '#3B82F6', '#D97706', '#64748B', '#0D9488'];

export default function Results() {
    const navigate = useNavigate();
    const { t, isRTL } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const processCase = async () => {
        const pendingCase = localStorage.getItem('pendingCase');
        if (!pendingCase) {
            navigate('/calculator');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const caseData = JSON.parse(pendingCase);
            const response = await createCase(caseData);
            const caseId = response.data.id;
            const calcResponse = await calculateInheritance(caseId);

            if (calcResponse.data.error) {
                setError(calcResponse.data.error);
            } else {
                setResult(calcResponse.data);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const errorData = err.response.data;
                const formatError = (data) => {
                    if (typeof data === 'string') return data;
                    if (Array.isArray(data)) return data.map(item => formatError(item)).join(' ');
                    if (typeof data === 'object' && data !== null) {
                        return Object.keys(data).map(key => `${key}: ${formatError(data[key])}`).join('; ');
                    }
                    return 'Calculation could not be processed.';
                };
                setError(formatError(errorData));
            } else {
                setError('Failed to reach calculation service. Please verify server connectivity and retry.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        processCase();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col w-full islamic-pattern items-center justify-center">
                <div className="text-center p-8 bg-white/90 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="w-12 h-12 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-deep-teal font-serif text-lg font-bold">{t('calculating')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col w-full islamic-pattern items-center justify-center p-4">
                <div className="card text-center max-w-md w-full p-8">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="font-serif text-deep-teal text-2xl font-bold mb-2">{t('calcError')}</h3>
                    <p className="text-stone-600 text-sm mb-6 leading-relaxed">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button type="button" onClick={processCase} className="btn-secondary text-sm">
                            Retry Calculation
                        </button>
                        <Link to="/calculator" className="btn-primary text-sm">
                            {t('backToCalculator')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const chartData = result?.distributions?.map(d => ({
        name: t(d.relationship) || d.relationship_display,
        value: d.percentage,
        totalValue: Number(d.total_value),
    })) || [];

    return (
        <div className="min-h-screen flex flex-col w-full islamic-pattern">
            <Header />

            <main className="flex-grow w-full flex flex-col items-center px-4 sm:px-6 py-10">
                <div className="w-full max-w-6xl">

                    {/* Title & Case Reference */}
                    <div className="text-center mb-8 animate-fadeIn">
                        <h2 className="font-serif text-deep-teal text-3xl sm:text-4xl font-bold mb-2">
                            {t('inheritanceDistribution')}
                        </h2>
                        <div className="arabesque-divider" />
                        <div className="inline-flex items-center gap-2 bg-white px-5 py-1.5 rounded-full border border-stone-200 shadow-xs text-sm sm:text-base mt-2">
                            <span className="text-stone-600 font-medium">{t('caseReference')}:</span>
                            <span className="text-deep-teal font-bold">{result?.deceased_name}</span>
                        </div>
                    </div>

                    {/* Sharia Rules & Asl al-Mas'ala Badges */}
                    <div className="flex flex-wrap justify-center items-center gap-3 mb-8 animate-fadeIn">
                        <div className="inline-flex items-center gap-1.5 bg-deep-teal/10 border border-deep-teal/20 text-deep-teal px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                            <span>📐</span>
                            <span>{t('aslAlMasala')}:</span>
                            <span className="tabular-nums font-bold text-base">{result?.asl_al_masala}</span>
                        </div>

                        {result?.umariyyatan_applied && (
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                                <span>⚖️</span>
                                <span>{t('umariyyatanApplied')}</span>
                            </div>
                        )}

                        {result?.awl_applied && (
                            <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-300 text-rose-900 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                                <span>📉</span>
                                <span>{t('awlApplied')}</span>
                            </div>
                        )}

                        {result?.radd_applied && (
                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                                <span>📈</span>
                                <span>{t('raddApplied')}</span>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 animate-fadeIn">
                        <div className="card text-center p-6 flex flex-col justify-between">
                            <p className="text-stone-500 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
                                {t('totalEstate')}
                            </p>
                            <p className="text-deep-teal text-2xl sm:text-3xl font-extrabold tabular-nums">
                                ${Number(result?.total_estate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <span className="text-xs text-stone-400 mt-2">Gross assets</span>
                        </div>

                        <div className="card text-center p-6 flex flex-col justify-between">
                            <p className="text-stone-500 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
                                {t('deductions')}
                            </p>
                            <p className="text-rose-600 text-2xl sm:text-3xl font-extrabold tabular-nums">
                                -${Number(result?.deductions).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <span className="text-xs text-stone-400 mt-2">Debts & funeral expenses</span>
                        </div>

                        <div className="card text-center p-6 flex flex-col justify-between border-2 border-amber-300/60 bg-amber-50/20">
                            <p className="text-stone-700 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
                                {t('netDistributable')}
                            </p>
                            <p className="text-amber-800 text-2xl sm:text-3xl font-extrabold tabular-nums">
                                ${Number(result?.net_estate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <span className="text-xs text-amber-700 font-medium mt-2">100% distributed</span>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fadeIn no-print">
                        {/* Donut Chart */}
                        <div className="card p-6 flex flex-col">
                            <h3 className="font-serif text-deep-teal text-lg font-bold text-center mb-4">
                                {t('distributionChart')} (%)
                            </h3>
                            <div className="h-72 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="55%"
                                            outerRadius="80%"
                                            paddingAngle={3}
                                            cornerRadius={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                                            contentStyle={{ backgroundColor: '#1A1A2E', color: '#fff', borderRadius: '8px', border: 'none' }}
                                        />
                                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="card p-6 flex flex-col">
                            <h3 className="font-serif text-deep-teal text-lg font-bold text-center mb-4">
                                {t('totalShareValue')} ($)
                            </h3>
                            <div className="h-72 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }} barSize={36}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis
                                            tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(15,76,92,0.04)' }}
                                            formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                                            contentStyle={{ backgroundColor: '#1A1A2E', color: '#fff', borderRadius: '8px', border: 'none' }}
                                        />
                                        <Bar dataKey="totalValue" radius={[4, 4, 0, 0]}>
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Breakdown Table */}
                    <div className="card p-6 sm:p-8 mb-8 animate-fadeIn">
                        <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-stone-100 gap-3">
                            <h3 className="font-serif text-deep-teal text-xl sm:text-2xl font-bold">
                                {t('detailedBreakdown')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="btn-outline text-xs sm:text-sm py-2 px-4 no-print"
                            >
                                🖨️ {t('printReport')}
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-stone-200">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-700">
                                        <th className={`p-3.5 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('heir')}</th>
                                        <th className="p-3.5 font-bold text-center">{t('count')}</th>
                                        <th className="p-3.5 font-bold text-center">{t('sharePercent')}</th>
                                        <th className="p-3.5 font-bold text-center">{t('shareType')}</th>
                                        <th className={`p-3.5 font-bold ${isRTL ? 'text-left' : 'text-right'}`}>{t('perPerson')}</th>
                                        <th className={`p-3.5 font-bold ${isRTL ? 'text-left' : 'text-right'}`}>{t('totalShareValue')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {result?.distributions?.map((d, i) => (
                                        <tr key={i} className="hover:bg-stone-50/75 transition-colors">
                                            <td className="p-3.5 font-semibold text-stone-800">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                                    />
                                                    <div>
                                                        <span>{t(d.relationship) || d.relationship_display}</span>
                                                        {d.dalil && (
                                                            <div className="text-[11px] font-normal text-stone-500 mt-0.5">
                                                                {d.dalil}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3.5 text-center text-stone-600 font-medium tabular-nums">{d.count}</td>
                                            <td className="p-3.5 text-center">
                                                <span className="bg-deep-teal/10 text-deep-teal px-2.5 py-1 rounded-full text-xs font-bold tabular-nums">
                                                    {d.percentage.toFixed(2)}% ({d.share_fraction})
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className="text-xs px-2 py-0.5 rounded bg-stone-100 font-medium text-stone-600">
                                                    {t(d.share_type) || d.share_type}
                                                </span>
                                            </td>
                                            <td className={`p-3.5 text-stone-600 font-medium tabular-nums ${isRTL ? 'text-left' : 'text-right'}`}>
                                                ${Number(d.per_person_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className={`p-3.5 font-bold text-amber-800 tabular-nums ${isRTL ? 'text-left' : 'text-right'}`}>
                                                ${Number(d.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Excluded Relatives (Mahjubun) Card */}
                    {result?.blocked_heirs && result.blocked_heirs.length > 0 && (
                        <div className="card p-6 sm:p-8 mb-8 bg-stone-50/50 border border-stone-200 animate-fadeIn">
                            <h3 className="font-serif text-deep-teal text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                                <span>🚫</span>
                                <span>{t('blockedHeirsTitle')}</span>
                            </h3>
                            <div className="space-y-2">
                                {result.blocked_heirs.map((b, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-white border border-stone-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm gap-2"
                                    >
                                        <span className="font-semibold text-stone-700 line-through decoration-rose-500">
                                            {t(b.relationship) || b.relationship_display}
                                        </span>
                                        <span className="text-stone-500 text-xs bg-stone-100 px-2.5 py-1 rounded font-medium">
                                            {b.reason}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8 mb-4 no-print animate-fadeIn">
                        <Link to="/calculator" className="btn-secondary text-sm">
                            {t('backToCalculator')}
                        </Link>
                        <Link to="/" className="btn-primary text-sm">
                            {t('backToHome')}
                        </Link>
                    </div>

                </div>
            </main>

            <footer className="bg-dark text-white py-8 mt-auto w-full text-center text-xs text-stone-400 no-print">
                <p className="font-semibold text-stone-300 text-sm mb-1">{t('appTitle')} - {t('appSubtitle')}</p>
                <p>{t('footerDesc')}</p>
            </footer>
        </div>
    );
}
