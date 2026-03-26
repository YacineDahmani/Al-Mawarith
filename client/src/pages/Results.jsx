import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { createCase, calculateInheritance } from '../api';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#0F4C5C', '#D4AF37', '#8A2A2A', '#2E8B57', '#4682B4', '#DAA520', '#708090', '#5F9EA0'];

export default function Results() {
    const navigate = useNavigate();
    const { t, isRTL } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const pendingCase = localStorage.getItem('pendingCase');
        if (!pendingCase) {
            navigate('/calculator');
            return;
        }

        const processCase = async () => {
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
                localStorage.removeItem('pendingCase');
            } catch (err) {
                console.error(err);
                if (err.response && err.response.data) {
                    const errorData = err.response.data;

                    const formatError = (data) => {
                        if (typeof data === 'string') return data;
                        if (Array.isArray(data)) return data.map(item => formatError(item)).join(' ');
                        if (typeof data === 'object' && data !== null) {
                            return Object.keys(data).map(key => {
                                const val = data[key];
                                const formattedVal = formatError(val);
                                return `${key}: ${formattedVal}`;
                            }).join('; ');
                        }
                        return 'Invalid value';
                    };

                    setError(formatError(errorData));
                } else {
                    const networkMessage =
                        err.code === 'ERR_NETWORK' || err.message === 'Network Error'
                            ? 'Cannot reach the backend server. Please start the Django server on port 8000 and try again.'
                            : 'Failed to calculate inheritance. Please try again.';
                    setError(networkMessage);
                }
            } finally {
                setLoading(false);
            }
        };

        processCase();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col w-full islamic-pattern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        border: '4px solid #D4AF37',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px',
                    }}></div>
                    <p className="text-deep-teal" style={{ fontSize: '1.25rem' }}>{t('calculating')}</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col w-full islamic-pattern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ textAlign: 'center', maxWidth: '480px', width: '100%', margin: '0 16px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                    <h3 className="font-serif text-deep-teal" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{t('calcError')}</h3>
                    <p style={{ color: '#4b5563', marginBottom: '24px' }}>{error}</p>
                    <Link to="/calculator" className="btn-primary">{t('backToCalculator')}</Link>
                </div>
            </div>
        );
    }

    const chartData = result?.distributions?.map(d => ({
        name: t(d.relationship) || d.relationship_display,
        value: d.percentage,
        totalValue: Number(d.total_value)
    })) || [];

    return (
        <div className="min-h-screen flex flex-col w-full islamic-pattern">

            <main style={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
                <div style={{ width: '100%', maxWidth: '1400px' }}>

                    {/* Title */}
                    <div className="animate-fadeIn" style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 className="font-serif text-deep-teal" style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 'bold' }}>{t('inheritanceDistribution')}</h2>
                        <div className="arabesque-divider"></div>
                        <p className="font-serif bg-white px-6 py-2 rounded-full shadow-sm inline-block mt-4 text-gray-700" style={{ fontSize: '1.15rem' }}>
                            {t('caseReference')}: <span className="text-gold" style={{ fontWeight: 700 }}>{result?.deceased_name}</span>
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" style={{ animationDelay: '0.1s' }}>
                        <div className="card w-full flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="bg-deep-teal/10 p-4 rounded-full mb-4">
                                <svg className="w-8 h-8 text-deep-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <p style={{ color: '#6b7280', marginBottom: '8px', fontWeight: 600, fontSize: '15px' }}>{t('totalEstate')}</p>
                            <p className="text-deep-teal" style={{ fontSize: '2rem', fontWeight: '800' }}>${Number(result?.total_estate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="card w-full flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="bg-red-50 p-4 rounded-full mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                            </div>
                            <p style={{ color: '#6b7280', marginBottom: '8px', fontWeight: 600, fontSize: '15px' }}>{t('deductions')}</p>
                            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444' }}>-${Number(result?.deductions).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="card w-full flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform duration-300" style={{ border: '2px solid rgba(212,175,55,0.2)' }}>
                            <div className="bg-gold/10 p-4 rounded-full mb-4">
                                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <p style={{ color: '#6b7280', marginBottom: '8px', fontWeight: 600, fontSize: '15px' }}>{t('netDistributable')}</p>
                            <p className="text-gold" style={{ fontSize: '2.25rem', fontWeight: '800' }}>${Number(result?.net_estate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Analysis & Charts */}
                    <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10" style={{ animationDelay: '0.2s' }}>
                        {/* Donut Chart */}
                        <div className="card w-full h-full" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <h3 className="font-serif text-deep-teal" style={{ fontSize: '1.25rem', marginBottom: '24px', textAlign: 'center', fontWeight: 'bold' }}>Percentage Distribution</h3>
                            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="55%"
                                            outerRadius="80%"
                                            paddingAngle={4}
                                            cornerRadius={6}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                                            contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none', padding: '12px' }}
                                            itemStyle={{ color: '#e5e7eb' }}
                                        />
                                        <Legend stroke="none" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="card w-full h-full" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <h3 className="font-serif text-deep-teal" style={{ fontSize: '1.25rem', marginBottom: '24px', textAlign: 'center', fontWeight: 'bold' }}>Value Distribution (USD)</h3>
                            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={40}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 13 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} tick={{ fill: '#6b7280', fontSize: 13 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(15,76,92,0.05)' }}
                                            formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                                            contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none', padding: '12px' }}
                                            itemStyle={{ color: '#e5e7eb' }}
                                        />
                                        <Bar dataKey="totalValue" radius={[6, 6, 0, 0]}>
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
                    <div className="animate-fadeIn card w-full" style={{ animationDelay: '0.3s', padding: '32px' }}>
                        <div className="flex items-center justify-between mb-6" style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '16px' }}>
                            <h3 className="font-serif text-deep-teal" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>{t('detailedBreakdown')}</h3>
                            <button onClick={() => window.print()} className="btn-outline" style={{ padding: '8px 24px', fontSize: '14px' }}>
                                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                {t('printReport')}
                            </button>
                        </div>
                        
                        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f9fafb' }}>
                                        <th style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: isRTL ? 'right' : 'left' }}>{t('heir')}</th>
                                        <th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>{t('count')}</th>
                                        <th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>{t('sharePercent')}</th>
                                        <th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: isRTL ? 'left' : 'right' }}>{t('perPerson')}</th>
                                        <th style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600, color: '#0F4C5C', textAlign: isRTL ? 'left' : 'right' }}>{t('totalShareValue')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result?.distributions?.map((d, i) => (
                                        <tr key={i} style={{ borderBottom: i === result.distributions.length - 1 ? 'none' : '1px solid #f3f4f6', transition: 'background-color 0.2s ease', backgroundColor: 'transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#f3f6f8'} onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                                            <td style={{ padding: '18px 20px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length], marginRight: isRTL ? 0 : '12px', marginLeft: isRTL ? '12px' : 0 }}></div>
                                                {t(d.relationship) || d.relationship_display}
                                            </td>
                                            <td style={{ padding: '18px 12px', color: '#4b5563', textAlign: 'center', fontWeight: '500' }}>{d.count}</td>
                                            <td style={{ padding: '18px 12px', textAlign: 'center' }}>
                                                <span style={{ backgroundColor: 'rgba(15,76,92,0.08)', color: '#0F4C5C', padding: '4px 10px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
                                                    {d.percentage.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 12px', color: '#4b5563', textAlign: isRTL ? 'left' : 'right', fontWeight: '500' }}>
                                                ${Number(d.per_person_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '18px 20px', color: '#D4AF37', fontWeight: 800, textAlign: isRTL ? 'left' : 'right', fontSize: '15px' }}>
                                                ${Number(d.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="animate-fadeIn" style={{ textAlign: 'center', marginTop: '48px', marginBottom: '24px', animationDelay: '0.4s' }}>
                        <Link to="/" className="btn-primary" style={{ padding: '16px 40px', borderRadius: '8px', fontSize: '16px', textDecoration: 'none' }}>{t('backToHome')}</Link>
                    </div>
                </div>
            </main>

            <footer style={{ backgroundColor: '#1A1A2E', color: 'white', padding: '32px 0', marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '1100px', padding: '0 32px', textAlign: 'center' }}>
                    <p style={{ color: '#d1d5db', fontWeight: '600' }}>{t('appTitle')} - {t('appSubtitle')}</p>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>{t('footerDesc')}</p>
                </div>
            </footer>
        </div>
    );
}
