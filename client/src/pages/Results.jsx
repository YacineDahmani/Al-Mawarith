import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { createCase, calculateInheritance } from '../api';

const COLORS = ['#0F4C5C', '#D4AF37', '#1a6b7d', '#c9a230', '#2d8a9e', '#b8942a', '#3fa3b8', '#a68524'];

export default function Results() {
    const navigate = useNavigate();
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
                setError('Failed to calculate inheritance. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        processCase();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col w-full islamic-pattern items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-deep-teal">Calculating distribution...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col w-full islamic-pattern items-center justify-center">
                <div className="card text-center max-w-md w-full mx-4">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="text-2xl font-serif text-deep-teal mb-2">Calculation Error</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link to="/calculator" className="btn-primary">Back to Calculator</Link>
                </div>
            </div>
        );
    }

    const chartData = result?.distributions?.map(d => ({
        name: d.relationship_display,
        value: d.percentage,
    })) || [];

    return (
        <div className="min-h-screen flex flex-col w-full islamic-pattern">
            <nav className="bg-deep-teal text-white py-4 px-8 shadow-md w-full flex justify-center">
                <div className="w-full max-w-6xl flex justify-between items-center">
                    <h1 className="text-2xl font-bold font-serif tracking-wide">Al-Mawarith</h1>
                    <Link to="/calculator" className="btn-primary text-sm px-4 py-2">New Calculation</Link>
                </div>
            </nav>

            <main className="flex-grow w-full flex flex-col items-center px-6 py-12">
                <div className="w-full max-w-6xl">
                    <div className="text-center mb-12 animate-fadeIn">
                        <h2 className="text-4xl font-serif text-deep-teal mb-3">Inheritance Distribution</h2>
                        <p className="text-gray-600 text-lg">Case Reference: <span className="font-semibold text-deep-teal">{result?.deceased_name}</span></p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                        <div className="card text-center">
                            <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Total Estate</p>
                            <p className="text-3xl font-bold text-deep-teal">${Number(result?.total_estate).toLocaleString()}</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Deductions</p>
                            <p className="text-3xl font-bold text-red-500">-${Number(result?.deductions).toLocaleString()}</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Net Distributable</p>
                            <p className="text-3xl font-bold text-gold">${Number(result?.net_estate).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                        <div className="card h-full flex flex-col">
                            <h3 className="text-xl font-serif text-deep-teal mb-6 text-center border-b pb-4">Distribution Chart</h3>
                            <div className="flex-grow flex items-center justify-center" style={{ minHeight: '350px' }}>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, value }) => `${name} (${value.toFixed(1)}%)`}
                                        >
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => `${value.toFixed(2)}%`}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card h-full flex flex-col">
                            <h3 className="text-xl font-serif text-deep-teal mb-6 border-b pb-4">Detailed Breakdown</h3>
                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-deep-teal/5">
                                            <th className="text-left py-3 px-3 rounded-l-lg text-deep-teal text-sm font-bold uppercase">Heir</th>
                                            <th className="text-right py-3 px-2 text-deep-teal text-sm font-bold uppercase">Count</th>
                                            <th className="text-right py-3 px-2 text-deep-teal text-sm font-bold uppercase">Share</th>
                                            <th className="text-right py-3 px-3 rounded-r-lg text-deep-teal text-sm font-bold uppercase">Total Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {result?.distributions?.map((d, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-3 font-medium text-gray-800">
                                                    {d.relationship_display}
                                                    <div className="text-xs text-gray-400 font-normal mt-0.5">${Number(d.per_person_value).toLocaleString()} / person</div>
                                                </td>
                                                <td className="text-right py-4 px-2 text-gray-600">{d.count}</td>
                                                <td className="text-right py-4 px-2">
                                                    <span className="bg-deep-teal/10 text-deep-teal px-2 py-1 rounded text-xs font-bold">
                                                        {d.percentage.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="text-right py-4 px-3 text-gold font-bold">
                                                    ${Number(d.total_value).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="text-center print:hidden animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <Link to="/" className="btn-secondary mr-4 px-8 py-3 bg-gray-600 hover:bg-gray-700">Back to Home</Link>
                        <button onClick={() => window.print()} className="btn-primary px-8 py-3 shadow-lg">Print Report</button>
                    </div>
                </div>
            </main>

            <footer className="bg-dark text-white py-8 mt-auto w-full flex justify-center print:hidden">
                <div className="w-full max-w-6xl px-8 text-center">
                    <p className="text-gray-400">Al-Mawarith - Islamic Inheritance Calculator</p>
                    <p className="text-sm text-gray-500 mt-2">Based on Sunni Sharia principles</p>
                </div>
            </footer>
        </div>
    );
}
