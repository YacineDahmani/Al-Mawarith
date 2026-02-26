import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
                    setError('Failed to calculate inheritance. Please try again.');
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
    })) || [];

    return (
        <div className="min-h-screen flex flex-col w-full islamic-pattern">

            <main style={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
                <div style={{ width: '100%', maxWidth: '1400px' }}>

                    {/* Title */}
                    <div className="animate-fadeIn" style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 className="font-serif text-deep-teal" style={{ fontSize: '2rem', marginBottom: '8px' }}>{t('inheritanceDistribution')}</h2>
                        <p className="font-serif" style={{ fontSize: '1.1rem', color: '#4b5563' }}>{t('caseReference')}: <span className="text-deep-teal" style={{ fontWeight: 600 }}>{result?.deceased_name}</span></p>
                    </div>

                    {/* Summary Cards */}
                    <div className="animate-fadeIn" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px', animationDelay: '0.1s' }}>
                        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                            <p style={{ color: '#6b7280', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>{t('totalEstate')}</p>
                            <p className="text-deep-teal" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>${Number(result?.total_estate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                            <p style={{ color: '#6b7280', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>{t('deductions')}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444' }}>-${Number(result?.deductions).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                            <p style={{ color: '#6b7280', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>{t('netDistributable')}</p>
                            <p className="text-gold" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>${Number(result?.net_estate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Chart + Table */}
                    <div className="animate-fadeIn" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', animationDelay: '0.2s' }}>

                        {/* Pie Chart */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <h3 className="font-serif text-deep-teal" style={{ fontSize: '1.15rem', marginBottom: '16px', textAlign: 'center', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>{t('distributionChart')}</h3>
                            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={50}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: isRTL ? 'right' : 'left' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            layout="horizontal"
                                            align="center"
                                            iconSize={10}
                                            wrapperStyle={{ fontSize: '13px' }}
                                            formatter={(value, entry) => `${value} ${entry.payload.value.toFixed(1)}%`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Detailed Breakdown Table */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 className="font-serif text-deep-teal" style={{ fontSize: '1.15rem', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>{t('detailedBreakdown')}</h3>
                            <div style={{ flexGrow: 1, overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'rgba(15,76,92,0.05)' }}>
                                            <th style={{ padding: '12px 12px', fontSize: '13px', fontWeight: 700, color: '#0F4C5C', textAlign: isRTL ? 'right' : 'left', borderRadius: isRTL ? '0 8px 8px 0' : '8px 0 0 8px' }}>{t('heir')}</th>
                                            <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 700, color: '#0F4C5C', textAlign: 'center' }}>{t('count')}</th>
                                            <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 700, color: '#0F4C5C', textAlign: 'center' }}>{t('sharePercent')}</th>
                                            <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 700, color: '#0F4C5C', textAlign: isRTL ? 'left' : 'right' }}>{t('perPerson')}</th>
                                            <th style={{ padding: '12px 12px', fontSize: '13px', fontWeight: 700, color: '#0F4C5C', textAlign: isRTL ? 'left' : 'right', borderRadius: isRTL ? '8px 0 0 8px' : '0 8px 8px 0' }}>{t('totalShareValue')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result?.distributions?.map((d, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                                <td style={{ padding: '14px 12px', fontWeight: 500, color: '#1f2937' }}>
                                                    {t(d.relationship) || d.relationship_display}
                                                </td>
                                                <td style={{ padding: '14px 8px', color: '#4b5563', textAlign: 'center' }}>{d.count}</td>
                                                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                                                    <span style={{ backgroundColor: 'rgba(15,76,92,0.1)', color: '#0F4C5C', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                                                        {d.percentage.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 8px', color: '#4b5563', textAlign: isRTL ? 'left' : 'right' }}>
                                                    ${Number(d.per_person_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '14px 12px', color: '#D4AF37', fontWeight: 700, textAlign: isRTL ? 'left' : 'right' }}>
                                                    ${Number(d.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="animate-fadeIn" style={{ textAlign: 'center', marginTop: '16px', animationDelay: '0.3s' }}>
                        <Link to="/" className="btn-outline" style={{ padding: '12px 32px', borderRadius: '6px', marginRight: isRTL ? 0 : '16px', marginLeft: isRTL ? '16px' : 0 }}>{t('backToHome')}</Link>
                        <button onClick={() => window.print()} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '6px', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}>{t('printReport')}</button>
                    </div>
                </div>
            </main>

            <footer style={{ backgroundColor: '#1A1A2E', color: 'white', padding: '24px 0', marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '1100px', padding: '0 32px', textAlign: 'center' }}>
                    <p style={{ color: '#9ca3af' }}>{t('appTitle')} - {t('appSubtitle')}</p>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>{t('footerDesc')}</p>
                </div>
            </footer>
        </div>
    );
}
