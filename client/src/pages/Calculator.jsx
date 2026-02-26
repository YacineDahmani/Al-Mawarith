import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssetTypeChoices } from '../api';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

export default function Calculator() {
    const navigate = useNavigate();
    const { t, isRTL } = useLanguage();
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
        { value: 'HUSBAND', label: t('HUSBAND'), gender: 'M', max: 1 },
        { value: 'WIFE', label: t('WIFE'), gender: 'F', max: 4 },
        { value: 'SON', label: t('SON'), gender: 'M', max: null },
        { value: 'DAUGHTER', label: t('DAUGHTER'), gender: 'F', max: null },
        { value: 'FATHER', label: t('FATHER'), gender: 'M', max: 1 },
        { value: 'MOTHER', label: t('MOTHER'), gender: 'F', max: 1 },
        { value: 'GRANDSON', label: t('GRANDSON'), gender: 'M', max: null },
        { value: 'GRANDDAUGHTER', label: t('GRANDDAUGHTER'), gender: 'F', max: null },
        { value: 'FULL_BROTHER', label: t('FULL_BROTHER'), gender: 'M', max: null },
        { value: 'FULL_SISTER', label: t('FULL_SISTER'), gender: 'F', max: null },
        { value: 'PATERNAL_BROTHER', label: t('PATERNAL_BROTHER'), gender: 'M', max: null },
        { value: 'PATERNAL_SISTER', label: t('PATERNAL_SISTER'), gender: 'F', max: null },
        { value: 'MATERNAL_BROTHER', label: t('MATERNAL_BROTHER'), gender: 'M', max: null },
        { value: 'MATERNAL_SISTER', label: t('MATERNAL_SISTER'), gender: 'F', max: null },
        { value: 'PATERNAL_GRANDFATHER', label: t('PATERNAL_GRANDFATHER'), gender: 'M', max: 1 },
        { value: 'PATERNAL_GRANDMOTHER', label: t('PATERNAL_GRANDMOTHER'), gender: 'F', max: null },
        { value: 'MATERNAL_GRANDMOTHER', label: t('MATERNAL_GRANDMOTHER'), gender: 'F', max: 1 },
        { value: 'PATERNAL_UNCLE', label: t('PATERNAL_UNCLE'), gender: 'M', max: null },
        { value: 'COUSIN', label: t('COUSIN'), gender: 'M', max: null },
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
            <Header />

            <main className="flex-grow w-full flex flex-col items-center px-6" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
                <div style={{ width: '100%', maxWidth: '1024px' }}>

                    {/* Step Indicator */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '48px' }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '18px',
                                        border: '2px solid',
                                        borderColor: step >= s ? '#D4AF37' : '#e5e7eb',
                                        backgroundColor: step >= s ? '#D4AF37' : '#fff',
                                        color: step >= s ? '#1A1A2E' : '#d1d5db',
                                        transition: 'all 0.3s ease',
                                        boxShadow: step === s ? '0 0 0 4px rgba(212,175,55,0.2)' : 'none',
                                        transform: step === s ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                >
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div style={{
                                        width: '80px',
                                        height: '4px',
                                        margin: '0 12px',
                                        borderRadius: '4px',
                                        backgroundColor: step > s ? '#D4AF37' : '#f3f4f6',
                                        transition: 'background-color 0.3s ease',
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Deceased Information */}
                    {step === 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="card animate-fadeIn" style={{ width: '100%', maxWidth: '800px' }}>
                                <h2 className="text-3xl font-serif text-deep-teal" style={{ textAlign: 'center', marginBottom: '32px' }}>{t('deceasedInfo')}</h2>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="block text-sm font-semibold text-gray-700" style={{ marginBottom: '8px' }}>{t('fullName')} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={caseData.name}
                                            onChange={e => setCaseData({ ...caseData, name: e.target.value })}
                                            placeholder={t('fullName')}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700" style={{ marginBottom: '8px' }}>{t('gender')} <span className="text-red-500">*</span></label>
                                        <select
                                            className="input-field"
                                            value={caseData.gender}
                                            onChange={e => setCaseData({ ...caseData, gender: e.target.value })}
                                        >
                                            <option value="M">{t('male')}</option>
                                            <option value="F">{t('female')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700" style={{ marginBottom: '8px' }}>{t('dateOfDeath')} <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={caseData.date_of_death}
                                            onChange={e => setCaseData({ ...caseData, date_of_death: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700" style={{ marginBottom: '8px' }}>{t('funeralExpenses')}</label>
                                        <div className="relative">
                                            <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-500 font-medium`}>$</span>
                                            <input
                                                type="number"
                                                className={`input-field ${isRTL ? '!pr-10' : '!pl-10'}`}
                                                value={caseData.funeral_expenses}
                                                onChange={e => setCaseData({ ...caseData, funeral_expenses: Number(e.target.value) })}
                                                min="0"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700" style={{ marginBottom: '8px' }}>{t('outstandingDebts')}</label>
                                        <div className="relative">
                                            <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-500 font-medium`}>$</span>
                                            <input
                                                type="number"
                                                className={`input-field ${isRTL ? '!pr-10' : '!pl-10'}`}
                                                value={caseData.debts}
                                                onChange={e => setCaseData({ ...caseData, debts: Number(e.target.value) })}
                                                min="0"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setStep(2)}
                                        className={`btn-primary ${(!caseData.name || !caseData.date_of_death) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!caseData.name || !caseData.date_of_death}
                                        style={{ padding: '16px 48px', fontSize: '18px' }}
                                    >
                                        {t('nextAssets')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Estate Assets */}
                    {step === 2 && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="card animate-fadeIn" style={{ width: '100%', maxWidth: '960px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h2 className="text-3xl font-serif text-deep-teal">{t('estateAssets')}</h2>
                                    <div className="text-xl font-bold text-gold" style={{ marginTop: '8px', backgroundColor: 'rgba(15,76,92,0.05)', padding: '8px 24px', borderRadius: '999px' }}>
                                        {t('totalValue')}: ${totalAssetValue.toLocaleString()}
                                    </div>
                                </div>

                                {assets.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#fafafa', border: '2px dashed #d1d5db', borderRadius: '12px', marginBottom: '32px' }}>
                                        <div style={{ width: '64px', height: '64px', backgroundColor: '#e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-700 font-medium" style={{ marginBottom: '4px' }}>{t('noAssets')}</p>
                                        <p className="text-sm text-gray-500" style={{ marginBottom: '24px' }}>{t('startAdding')}</p>
                                        <button onClick={addAsset} className="btn-secondary">
                                            {t('addFirstAsset')}
                                        </button>
                                    </div>
                                )}

                                {assets.map((asset, index) => (
                                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr auto', gap: '16px', marginBottom: '16px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '12px', alignItems: 'end' }}>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500" style={{ marginBottom: '4px' }}>{t('assetName')}</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="e.g., Family Home"
                                                value={asset.name}
                                                onChange={e => updateAsset(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500" style={{ marginBottom: '4px' }}>{t('assetType')}</label>
                                            <select
                                                className="input-field"
                                                value={asset.asset_type}
                                                onChange={e => updateAsset(index, 'asset_type', e.target.value)}
                                            >
                                                {assetTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {t(type.value) || type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500" style={{ marginBottom: '4px' }}>{t('assetValue')}</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="0.00"
                                                value={asset.value}
                                                onChange={e => updateAsset(index, 'value', e.target.value)}
                                                min="0"
                                            />
                                        </div>
                                        <div style={{ paddingBottom: '4px' }}>
                                            <button
                                                onClick={() => removeAsset(index)}
                                                className="text-red-400 hover:text-red-600"
                                                style={{ padding: '8px', borderRadius: '8px' }}
                                                title={t('removeAsset')}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {assets.length > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                                        <button onClick={addAsset} className="btn-outline">
                                            {t('addAnotherAsset')}
                                        </button>
                                    </div>
                                )}

                                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button onClick={() => setStep(1)} className="btn-ghost">
                                        <span style={{ marginRight: isRTL ? 0 : '8px', marginLeft: isRTL ? '8px' : 0 }}>{isRTL ? '→' : '←'}</span> {t('back')}
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        className={`btn-primary ${assets.length === 0 || assets.some(a => !a.name || Number(a.value) <= 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={assets.length === 0 || assets.some(a => !a.name || Number(a.value) <= 0)}
                                        style={{ padding: '16px 48px', fontSize: '18px' }}
                                    >
                                        {t('nextHeirs')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Select Heirs */}
                    {step === 3 && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="card animate-fadeIn" style={{ width: '100%', maxWidth: '1024px' }}>
                                <h2 className="text-3xl font-serif text-deep-teal" style={{ textAlign: 'center', marginBottom: '32px' }}>{t('selectHeirs')}</h2>

                                {[
                                    {
                                        title: t('primaryHeirs'),
                                        options: relationshipOptions.filter(r => ['HUSBAND', 'WIFE', 'FATHER', 'MOTHER'].includes(r.value))
                                    },
                                    {
                                        title: t('descendants'),
                                        options: relationshipOptions.filter(r => ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER'].includes(r.value))
                                    },
                                    {
                                        title: t('siblings'),
                                        options: relationshipOptions.filter(r => ['FULL_BROTHER', 'FULL_SISTER', 'PATERNAL_BROTHER', 'PATERNAL_SISTER', 'MATERNAL_BROTHER', 'MATERNAL_SISTER'].includes(r.value))
                                    },
                                    {
                                        title: t('extendedFamily'),
                                        options: relationshipOptions.filter(r => ['PATERNAL_GRANDFATHER', 'PATERNAL_GRANDMOTHER', 'MATERNAL_GRANDMOTHER', 'PATERNAL_UNCLE', 'COUSIN'].includes(r.value))
                                    }
                                ].map((group, gIdx) => (
                                    <div key={gIdx} style={{ marginBottom: gIdx < 3 ? '32px' : '0' }}>
                                        <h3 className="text-xl font-semibold text-deep-teal" style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>{group.title}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                                            {group.options.map(opt => {
                                                const selected = heirs.find(h => h.relationship === opt.value);
                                                const disabled = (opt.value === 'HUSBAND' && (heirs.find(h => h.relationship === 'WIFE') || caseData.gender === 'M')) ||
                                                    (opt.value === 'WIFE' && (heirs.find(h => h.relationship === 'HUSBAND') || caseData.gender === 'F'));

                                                return (
                                                    <div
                                                        key={opt.value}
                                                        style={{
                                                            padding: '16px',
                                                            borderRadius: '12px',
                                                            border: `1px solid ${selected ? '#0F4C5C' : disabled ? '#f3f4f6' : '#e5e7eb'}`,
                                                            backgroundColor: selected ? 'rgba(15,76,92,0.03)' : disabled ? '#fafafa' : '#fff',
                                                            opacity: disabled ? 0.5 : 1,
                                                            cursor: disabled ? 'not-allowed' : 'default',
                                                            boxShadow: selected ? '0 4px 12px rgba(15,76,92,0.1)' : 'none',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                                                            <span style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px', color: selected ? '#0F4C5C' : '#374151' }}>
                                                                {opt.label}
                                                            </span>

                                                            {selected ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '4px 8px', border: '1px solid #e5e7eb' }}>
                                                                    {(!opt.max || opt.max > 1) ? (
                                                                        <>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (selected.count > 1) updateHeirCount(opt.value, selected.count - 1);
                                                                                    else toggleHeir(opt.value);
                                                                                }}
                                                                                style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F4C5C', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', border: 'none', background: 'none', borderRadius: '4px' }}
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <span style={{ width: '32px', textAlign: 'center', fontWeight: 'bold', color: '#0F4C5C' }}>{selected.count}</span>
                                                                            <button
                                                                                onClick={() => updateHeirCount(opt.value, selected.count + 1)}
                                                                                disabled={opt.max && selected.count >= opt.max}
                                                                                style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F4C5C', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', border: 'none', background: 'none', borderRadius: '4px' }}
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <span style={{ color: '#0F4C5C', fontWeight: 600, padding: '4px 8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                            {t('selected')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => !disabled && toggleHeir(opt.value)}
                                                                    disabled={disabled}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px',
                                                                        borderRadius: '8px',
                                                                        fontSize: '14px',
                                                                        fontWeight: 500,
                                                                        backgroundColor: '#fafafa',
                                                                        color: '#6b7280',
                                                                        border: 'none',
                                                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                                                        transition: 'all 0.2s ease',
                                                                    }}
                                                                    onMouseEnter={e => { if (!disabled) { e.target.style.backgroundColor = '#D4AF37'; e.target.style.color = '#fff'; }}}
                                                                    onMouseLeave={e => { e.target.style.backgroundColor = '#fafafa'; e.target.style.color = '#6b7280'; }}
                                                                >
                                                                    {t('select')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button onClick={() => setStep(2)} className="btn-ghost">
                                        <span style={{ marginRight: isRTL ? 0 : '8px', marginLeft: isRTL ? '8px' : 0 }}>{isRTL ? '→' : '←'}</span> {t('back')}
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        {heirs.length === 0 && <span style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>{t('pleaseSelectHeir')}</span>}
                                        <button
                                            onClick={handleSubmit}
                                            className={`btn-primary ${heirs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={heirs.length === 0}
                                            style={{ padding: '16px 48px', fontSize: '18px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}
                                        >
                                            {t('calculateDistribution')} <span style={{ marginLeft: isRTL ? 0 : '8px', marginRight: isRTL ? '8px' : 0 }}>{isRTL ? '←' : '→'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
