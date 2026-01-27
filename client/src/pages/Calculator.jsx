import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssetTypeChoices } from '../api';

export default function Calculator() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [assetTypes, setAssetTypes] = useState([]);

    const [caseData, setCaseData] = useState({
        name: '',
        gender: 'M',
        date_of_death: '',
        funeral_expenses: 0,
        debts: 0,
    });

    const [assets, setAssets] = useState([]);
    const [heirs, setHeirs] = useState([]);

    const relationshipOptions = [
        { value: 'HUSBAND', label: 'Husband', gender: 'M', max: 1 },
        { value: 'WIFE', label: 'Wife', gender: 'F', max: 4 },
        { value: 'SON', label: 'Son', gender: 'M', max: null },
        { value: 'DAUGHTER', label: 'Daughter', gender: 'F', max: null },
        { value: 'FATHER', label: 'Father', gender: 'M', max: 1 },
        { value: 'MOTHER', label: 'Mother', gender: 'F', max: 1 },
        { value: 'GRANDSON', label: 'Grandson', gender: 'M', max: null },
        { value: 'GRANDDAUGHTER', label: 'Granddaughter', gender: 'F', max: null },
        { value: 'FULL_BROTHER', label: 'Full Brother', gender: 'M', max: null },
        { value: 'FULL_SISTER', label: 'Full Sister', gender: 'F', max: null },
        { value: 'PATERNAL_BROTHER', label: 'Paternal Half-Brother', gender: 'M', max: null },
        { value: 'PATERNAL_SISTER', label: 'Paternal Half-Sister', gender: 'F', max: null },
        { value: 'MATERNAL_BROTHER', label: 'Maternal Half-Brother', gender: 'M', max: null },
        { value: 'MATERNAL_SISTER', label: 'Maternal Half-Sister', gender: 'F', max: null },
        { value: 'PATERNAL_GRANDFATHER', label: 'Paternal Grandfather', gender: 'M', max: 1 }, // Usually considered unique in direct line, but simplifying
        { value: 'PATERNAL_GRANDMOTHER', label: 'Paternal Grandmother', gender: 'F', max: null },
        { value: 'MATERNAL_GRANDMOTHER', label: 'Maternal Grandmother', gender: 'F', max: 1 },
        { value: 'PATERNAL_UNCLE', label: 'Paternal Uncle', gender: 'M', max: null },
        { value: 'COUSIN', label: 'Cousin', gender: 'M', max: null },
    ];

    useEffect(() => {
        getAssetTypeChoices().then(res => setAssetTypes(res.data)).catch(() => {
            setAssetTypes([
                { value: 'LIQUID', label: 'Liquid Cash' },
                { value: 'REAL_ESTATE', label: 'Real Estate' },
                { value: 'COMMODITY', label: 'Commodity' },
                { value: 'VEHICLE', label: 'Vehicle' },
                { value: 'BUSINESS', label: 'Business/Shares' },
            ]);
        });
    }, []);

    const totalAssetValue = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);

    const addAsset = () => {
        setAssets([...assets, { name: '', asset_type: 'LIQUID', value: '', is_divisible: true }]);
    };

    const updateAsset = (index, field, value) => {
        const updated = [...assets];
        updated[index][field] = value;
        setAssets(updated);
    };

    const removeAsset = (index) => {
        setAssets(assets.filter((_, i) => i !== index));
    };

    const toggleHeir = (relationship) => {
        const existing = heirs.find(h => h.relationship === relationship);
        if (existing) {
            setHeirs(heirs.filter(h => h.relationship !== relationship));
        } else {
            if (relationship === 'HUSBAND' && heirs.find(h => h.relationship === 'WIFE')) return;
            if (relationship === 'WIFE' && heirs.find(h => h.relationship === 'HUSBAND')) return;
            setHeirs([...heirs, { relationship, count: 1 }]);
        }
    };

    const updateHeirCount = (relationship, count) => {
        const option = relationshipOptions.find(r => r.value === relationship);
        const max = option?.max || 99;
        const validCount = Math.min(Math.max(1, count), max);

        setHeirs(heirs.map(h =>
            h.relationship === relationship ? { ...h, count: validCount } : h
        ));
    };

    const handleSubmit = () => {
        // Validate assets
        const invalidAssets = assets.some(a => !a.name || Number(a.value) <= 0);
        if (invalidAssets) {
            alert("Please ensure all assets have a name and a value greater than 0.");
            return;
        }

        const fullData = {
            ...caseData,
            total_estate_value: totalAssetValue,
            heirs: heirs,
            assets: assets.map(a => ({ ...a, value: Number(a.value) })),
        };

        localStorage.setItem('pendingCase', JSON.stringify(fullData));
        navigate('/results');
    };

    return (
        <div className="min-h-screen flex flex-col w-full islamic-pattern">
            <nav className="bg-dark text-white py-4 px-8 shadow-md w-full flex justify-center">
                <div className="w-full max-w-6xl flex justify-center items-center">
                    <h1 className="text-2xl font-bold font-serif tracking-wide text-gold">Al-Mawarith</h1>
                </div>
            </nav>

            <main className="flex-grow w-full flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-5xl">
                    <div className="flex justify-center mb-12 mt-4">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-300 border-2 ${step >= s ? 'bg-gold border-gold text-dark' : 'bg-white border-gray-200 text-gray-300'
                                    }`}>
                                    {s}
                                </div>
                                {s < 3 && <div className={`w-20 h-1 mx-2 transition-colors duration-300 rounded ${step > s ? 'bg-gold' : 'bg-gray-100'}`} />}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="card max-w-4xl mx-auto w-full animate-fadeIn">
                            <h2 className="text-3xl font-serif text-deep-teal mb-8 text-center">Deceased Information</h2>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={caseData.name}
                                        onChange={e => setCaseData({ ...caseData, name: e.target.value })}
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
                                    <select
                                        className="input-field"
                                        value={caseData.gender}
                                        onChange={e => setCaseData({ ...caseData, gender: e.target.value })}
                                    >
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Death <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={caseData.date_of_death}
                                        onChange={e => setCaseData({ ...caseData, date_of_death: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Funeral Expenses (Optional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <input
                                            type="number"
                                            className="input-field !pl-10"
                                            value={caseData.funeral_expenses}
                                            onChange={e => setCaseData({ ...caseData, funeral_expenses: Number(e.target.value) })}
                                            min="0"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Outstanding Debts (Optional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <input
                                            type="number"
                                            className="input-field !pl-10"
                                            value={caseData.debts}
                                            onChange={e => setCaseData({ ...caseData, debts: Number(e.target.value) })}
                                            min="0"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    className={`btn-primary px-8 ${(!caseData.name || !caseData.date_of_death) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!caseData.name || !caseData.date_of_death}
                                >
                                    Next: Assets
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="card w-full animate-fadeIn">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                                <h2 className="text-3xl font-serif text-deep-teal">Estate Assets</h2>
                                <div className="text-xl font-bold text-gold mt-4 md:mt-0 bg-deep-teal/5 px-6 py-2 rounded-full">
                                    Total Value: ${totalAssetValue.toLocaleString()}
                                </div>
                            </div>

                            {assets.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg mb-8">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-700 font-medium mb-1">No assets added yet.</p>
                                    <p className="text-sm text-gray-500 mb-6">Start by adding the deceased's assets.</p>
                                    <button onClick={addAsset} className="btn-secondary">
                                        + Add First Asset
                                    </button>
                                </div>
                            )}

                            {assets.map((asset, index) => (
                                <div key={index} className="grid md:grid-cols-12 gap-4 mb-4 p-5 bg-gray-100 rounded-lg shadow-sm items-end">
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Asset Name</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g., Family Home"
                                            value={asset.name}
                                            onChange={e => updateAsset(index, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                                        <select
                                            className="input-field"
                                            value={asset.asset_type}
                                            onChange={e => updateAsset(index, 'asset_type', e.target.value)}
                                        >
                                            {assetTypes.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Value ($)</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="0.00"
                                            value={asset.value}
                                            onChange={e => updateAsset(index, 'value', e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end pb-1">
                                        <button
                                            onClick={() => removeAsset(index)}
                                            className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                                            title="Remove Asset"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {assets.length > 0 && (
                                <div className="flex justify-center mb-10">
                                    <button onClick={addAsset} className="btn-outline">
                                        + Add Another Asset
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between pt-10">
                                <button onClick={() => setStep(1)} className="btn-ghost">
                                    <span className="mr-2">←</span> Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className={`btn-primary px-8 ${assets.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={assets.length === 0}
                                >
                                    Next: Heirs
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="card w-full animate-fadeIn max-w-5xl mx-auto">
                            <h2 className="text-3xl font-serif text-deep-teal mb-8 text-center">Select Surviving Heirs</h2>

                            {[
                                {
                                    title: "Primary Heirs",
                                    options: relationshipOptions.filter(r => ['HUSBAND', 'WIFE', 'FATHER', 'MOTHER'].includes(r.value))
                                },
                                {
                                    title: "Descendants (Children & Grandchildren)",
                                    options: relationshipOptions.filter(r => ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER'].includes(r.value))
                                },
                                {
                                    title: "Siblings",
                                    options: relationshipOptions.filter(r => ['FULL_BROTHER', 'FULL_SISTER', 'PATERNAL_BROTHER', 'PATERNAL_SISTER', 'MATERNAL_BROTHER', 'MATERNAL_SISTER'].includes(r.value))
                                },
                                {
                                    title: "Ascendants & Extended Family",
                                    options: relationshipOptions.filter(r => ['PATERNAL_GRANDFATHER', 'PATERNAL_GRANDMOTHER', 'MATERNAL_GRANDMOTHER', 'PATERNAL_UNCLE', 'COUSIN'].includes(r.value))
                                }
                            ].map((group, gIdx) => (
                                <div key={gIdx} className="mb-8 last:mb-0">
                                    <h3 className="text-xl font-semibold text-deep-teal mb-4 border-b border-gray-100 pb-2">{group.title}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {group.options.map(opt => {
                                            const selected = heirs.find(h => h.relationship === opt.value);
                                            const disabled = (opt.value === 'HUSBAND' && (heirs.find(h => h.relationship === 'WIFE') || caseData.gender === 'M')) ||
                                                (opt.value === 'WIFE' && (heirs.find(h => h.relationship === 'HUSBAND') || caseData.gender === 'F'));

                                            return (
                                                <div
                                                    key={opt.value}
                                                    className={`p-4 rounded-xl transition-all duration-200 border ${selected
                                                        ? 'bg-deep-teal/5 border-deep-teal shadow-md'
                                                        : disabled
                                                            ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                                                            : 'bg-white border-gray-200 hover:border-gold hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex flex-col h-full justify-between items-center text-center">
                                                        <span className={`font-semibold text-sm mb-3 ${selected ? 'text-deep-teal' : 'text-gray-700'}`}>
                                                            {opt.label}
                                                        </span>

                                                        {selected ? (
                                                            <div className="flex items-center justify-center gap-3 bg-white rounded-lg shadow-sm px-2 py-1 border border-gray-200">
                                                                {(!opt.max || opt.max > 1) ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (selected.count > 1) updateHeirCount(opt.value, selected.count - 1);
                                                                                else toggleHeir(opt.value);
                                                                            }}
                                                                            className="w-6 h-6 flex items-center justify-center text-deep-teal hover:bg-gray-100 rounded text-lg font-bold"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="w-8 text-center font-bold text-deep-teal">{selected.count}</span>
                                                                        <button
                                                                            onClick={() => updateHeirCount(opt.value, selected.count + 1)}
                                                                            className="w-6 h-6 flex items-center justify-center text-deep-teal hover:bg-gray-100 rounded text-lg font-bold"
                                                                            disabled={opt.max && selected.count >= opt.max}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-deep-teal font-semibold px-2 text-sm flex items-center gap-1">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                        Selected
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => !disabled && toggleHeir(opt.value)}
                                                                disabled={disabled}
                                                                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${disabled ? 'cursor-not-allowed' : 'bg-gray-50 hover:bg-gold hover:text-white text-gray-500'}`}
                                                            >
                                                                Select
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between items-center pt-10 mt-8 border-t border-gray-100">
                                <button onClick={() => setStep(2)} className="btn-ghost">
                                    <span className="mr-2">←</span> Back
                                </button>
                                <div className="flex flex-col items-end">
                                    {heirs.length === 0 && <span className="text-xs text-red-500 mb-2">Please select at least one heir</span>}
                                    <button
                                        onClick={handleSubmit}
                                        className={`btn-primary px-10 text-lg shadow-lg flex items-center ${heirs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={heirs.length === 0}
                                    >
                                        Calculate Distribution <span className="ml-2">→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
