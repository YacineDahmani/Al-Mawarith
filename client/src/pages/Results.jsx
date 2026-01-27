import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { createCase, calculateInheritance } from '../api';

const COLORS = ['#0F4C5C', '#D4AF37', '#8A2A2A', '#2E8B57', '#4682B4', '#DAA520', '#708090', '#5F9EA0'];

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
            <nav className="bg-dark text-white py-4 px-8 shadow-md w-full flex justify-center">
                <div className="w-full max-w-6xl flex justify-between items-center">
                    <h1 className="text-2xl font-bold font-serif tracking-wide text-gold">Al-Mawarith</h1>
                    <Link to="/calculator" className="btn-primary text-sm px-4 rounded-md h-10 flex items-center">New Calculation</Link>
                </div>
            </nav>

            <main className="flex-grow w-full flex flex-col items-center px-6 py-12">
                <div className="w-full max-w-6xl">
                    <div className="text-center mb-12 animate-fadeIn">
                        <h2 className="text-4xl font-serif text-deep-teal mb-2">Inheritance Distribution</h2>
                        <p className="text-xl text-gray-600 font-serif">Case Reference: <span className="font-semibold text-deep-teal">{result?.deceased_name}</span></p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12 animate-fadeIn items-stretch" style={{ animationDelay: '0.1s' }}>
                        <div className="card text-center flex flex-col justify-center h-full py-8">
                            <p className="text-gray-500 mb-2 font-medium">Total Estate</p>
                            <p className="text-3xl font-bold text-deep-teal">${Number(result?.total_estate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="card text-center flex flex-col justify-center h-full py-8">
                            <p className="text-gray-500 mb-2 font-medium">Deductions</p>
                            <p className="text-3xl font-bold text-red-500">-${Number(result?.deductions).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="card text-center flex flex-col justify-center h-full py-8">
                            <p className="text-gray-500 mb-2 font-medium">Net Distributable</p>
                            <p className="text-3xl font-bold text-gold">${Number(result?.net_estate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                                            label={({ name, value }) => `${name} (${value.toFixed(2)}%)`}
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
                                            <th className="text-left py-4 px-4 rounded-l-lg text-deep-teal text-sm font-bold">Heir</th>
                                            <th className="text-right py-4 px-4 text-deep-teal text-sm font-bold">Count</th>
                                            <th className="text-right py-4 px-4 text-deep-teal text-sm font-bold">Share %</th>
                                            <th className="text-right py-4 px-4 text-deep-teal text-sm font-bold">Per Person</th>
                                            <th className="text-right py-4 px-4 rounded-r-lg text-deep-teal text-sm font-bold">Total Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {result?.distributions?.map((d, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 font-medium text-gray-800">
                                                    {d.relationship_display}
                                                </td>
                                                <td className="text-right py-4 px-4 text-gray-600">{d.count}</td>
                                                <td className="text-right py-4 px-4">
                                                    <span className="bg-deep-teal/10 text-deep-teal px-2 py-1 rounded text-xs font-bold">
                                                        {d.percentage.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="text-right py-4 px-4 text-gray-600">
                                                    ${Number(d.per_person_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-right py-4 px-4 text-gold font-bold">
                                                    ${Number(d.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="text-center print:hidden animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <Link to="/" className="btn-outline border-deep-teal text-deep-teal hover:bg-deep-teal hover:text-white mr-4 px-8 py-3 rounded-md">Back to Home</Link>
                        <button onClick={() => window.print()} className="btn-primary px-8 py-3 shadow-lg rounded-md">Print Report</button>
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
