import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssetTypeChoices } from '../api';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const DRAFT_STORAGE_KEY = 'al_mawarith_case_draft';

export default function Calculator() {
    const navigate = useNavigate();
    const { t, isRTL } = useLanguage();
    const [step, setStep] = useState(1);
    const [assetTypes, setAssetTypes] = useState([]);
    const [formError, setFormError] = useState('');

    const [caseData, setCaseData] = useState(() => {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.caseData) return parsed.caseData;
            } catch (e) {
                console.error(e);
            }
        }
        return {
            name: '',
            gender: 'M',
            date_of_death: '',
            funeral_expenses: 0,
            debts: 0,
        };
    });

    const [assets, setAssets] = useState(() => {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed.assets)) return parsed.assets;
            } catch (e) {
                console.error(e);
            }
        }
        return [];
    });

    const [heirs, setHeirs] = useState(() => {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed.heirs)) return parsed.heirs;
            } catch (e) {
                console.error(e);
            }
        }
        return [];
    });

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

    // Load asset choices from API or fallback
    useEffect(() => {
        getAssetTypeChoices()
            .then(res => setAssetTypes(res.data))
            .catch(() => {
                setAssetTypes([
                    { value: 'LIQUID', label: 'Liquid Cash' },
                    { value: 'REAL_ESTATE', label: 'Real Estate' },
                    { value: 'COMMODITY', label: 'Commodity' },
                    { value: 'VEHICLE', label: 'Vehicle' },
                    { value: 'BUSINESS', label: 'Business/Shares' },
                ]);
            });
    }, []);

    // Persist draft automatically (UX Invariant 1: Zero Data Loss)
    useEffect(() => {
        const draft = { caseData, assets, heirs };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }, [caseData, assets, heirs]);

    const totalAssetValue = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);

    const handleGenderChange = (newGender) => {
        setCaseData({ ...caseData, gender: newGender });
        // Synchronize spouse options to prevent illegal states
        if (newGender === 'M') {
            setHeirs(prev => prev.filter(h => h.relationship !== 'HUSBAND'));
        } else {
            setHeirs(prev => prev.filter(h => h.relationship !== 'WIFE'));
        }
    };

    const addAsset = () => {
        setAssets([...assets, { name: '', asset_type: 'LIQUID', value: '', is_divisible: true }]);
        setFormError('');
    };

    const updateAsset = (index, field, value) => {
        const updated = [...assets];
        updated[index][field] = value;
        setAssets(updated);
        setFormError('');
    };

    const removeAsset = (index) => {
        setAssets(assets.filter((_, i) => i !== index));
    };

    const toggleHeir = (relationship) => {
        const existing = heirs.find(h => h.relationship === relationship);
        if (existing) {
            setHeirs(heirs.filter(h => h.relationship !== relationship));
        } else {
            if (relationship === 'HUSBAND' && (heirs.find(h => h.relationship === 'WIFE') || caseData.gender === 'M')) return;
            if (relationship === 'WIFE' && (heirs.find(h => h.relationship === 'HUSBAND') || caseData.gender === 'F')) return;
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

    const handleReset = () => {
        if (window.confirm(t('clearDraftConfirm'))) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            setCaseData({
                name: '',
                gender: 'M',
                date_of_death: '',
                funeral_expenses: 0,
                debts: 0,
            });
            setAssets([]);
            setHeirs([]);
            setStep(1);
            setFormError('');
        }
    };

    const handleNextToAssets = () => {
        if (!caseData.name.trim() || !caseData.date_of_death) {
            setFormError(t('deceasedInfo') + ': required fields missing.');
            return;
        }
        setFormError('');
        setStep(2);
    };

    const handleNextToHeirs = () => {
        if (assets.length === 0) {
            setFormError(t('noAssets'));
            return;
        }

        const invalid = assets.some(a => !a.name || !a.name.trim() || Number(a.value) <= 0);
        if (invalid) {
            setFormError(t('assetsInvalidError'));
            return;
        }

        const deductions = Number(caseData.funeral_expenses || 0) + Number(caseData.debts || 0);
        if (deductions > totalAssetValue) {
            setFormError(t('debtsExceedEstateError'));
            return;
        }

        setFormError('');
        setStep(3);
    };

    const handleSubmit = () => {
        if (heirs.length === 0) {
            setFormError(t('pleaseSelectHeir'));
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

            <main className="flex-grow w-full flex flex-col items-center px-4 sm:px-6 py-10">
                <div className="w-full max-w-4xl">

                    {/* Header bar with Reset Action */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-sm font-semibold tracking-wide text-deep-teal">
                            {t('appSubtitle')}
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-xs text-stone-500 hover:text-rose-600 transition-colors font-medium border border-stone-300 hover:border-rose-300 rounded px-3 py-1 bg-white/80 shadow-xs"
                        >
                            {t('resetForm')}
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex justify-center items-center mb-8">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base transition-all duration-200 border-2 ${
                                        step >= s
                                            ? 'border-gold bg-gold text-dark shadow-sm'
                                            : 'border-stone-200 bg-white text-stone-400'
                                    } ${step === s ? 'ring-4 ring-gold/20 scale-105' : ''}`}
                                >
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div
                                        className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-colors duration-200 ${
                                            step > s ? 'bg-gold' : 'bg-stone-200'
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Error Summary Banner */}
                    {formError && (
                        <div
                            role="alert"
                            className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs animate-fadeIn"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base">⚠️</span>
                                <span>{formError}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormError('')}
                                className="text-rose-600 hover:text-rose-900 font-bold ml-4"
                                aria-label="Dismiss error"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Step 1: Deceased Information */}
                    {step === 1 && (
                        <div className="card animate-fadeIn max-w-2xl mx-auto">
                            <h2 className="text-2xl sm:text-3xl font-serif text-deep-teal text-center mb-8">
                                {t('deceasedInfo')}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="sm:col-span-2">
                                    <label htmlFor="fullName" className="block text-sm font-semibold text-stone-700 mb-2">
                                        {t('fullName')} <span className="text-rose-600" aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        className="input-field"
                                        value={caseData.name}
                                        onChange={e => {
                                            setCaseData({ ...caseData, name: e.target.value });
                                            setFormError('');
                                        }}
                                        placeholder={t('fullName')}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="gender" className="block text-sm font-semibold text-stone-700 mb-2">
                                        {t('gender')} <span className="text-rose-600" aria-hidden="true">*</span>
                                    </label>
                                    <select
                                        id="gender"
                                        className="input-field cursor-pointer"
                                        value={caseData.gender}
                                        onChange={e => handleGenderChange(e.target.value)}
                                    >
                                        <option value="M">{t('male')}</option>
                                        <option value="F">{t('female')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="dateOfDeath" className="block text-sm font-semibold text-stone-700 mb-2">
                                        {t('dateOfDeath')} <span className="text-rose-600" aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="dateOfDeath"
                                        type="date"
                                        className="input-field"
                                        value={caseData.date_of_death}
                                        onChange={e => {
                                            setCaseData({ ...caseData, date_of_death: e.target.value });
                                            setFormError('');
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="funeralExpenses" className="block text-sm font-semibold text-stone-700 mb-2">
                                        {t('funeralExpenses')}
                                    </label>
                                    <div className="relative">
                                        <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-500 font-medium`}>$</span>
                                        <input
                                            id="funeralExpenses"
                                            type="number"
                                            className={`input-field tabular-nums ${isRTL ? '!pr-8' : '!pl-8'}`}
                                            value={caseData.funeral_expenses || ''}
                                            onChange={e => setCaseData({ ...caseData, funeral_expenses: Math.max(0, Number(e.target.value)) })}
                                            min="0"
                                            step="any"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="debts" className="block text-sm font-semibold text-stone-700 mb-2">
                                        {t('outstandingDebts')}
                                    </label>
                                    <div className="relative">
                                        <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-500 font-medium`}>$</span>
                                        <input
                                            id="debts"
                                            type="number"
                                            className={`input-field tabular-nums ${isRTL ? '!pr-8' : '!pl-8'}`}
                                            value={caseData.debts || ''}
                                            onChange={e => setCaseData({ ...caseData, debts: Math.max(0, Number(e.target.value)) })}
                                            min="0"
                                            step="any"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleNextToAssets}
                                    className="btn-primary px-8 py-3 text-base"
                                    disabled={!caseData.name.trim() || !caseData.date_of_death}
                                >
                                    {t('nextAssets')} {isRTL ? '←' : '→'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Estate Assets */}
                    {step === 2 && (
                        <div className="card animate-fadeIn max-w-3xl mx-auto">
                            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                                <h2 className="text-2xl sm:text-3xl font-serif text-deep-teal">
                                    {t('estateAssets')}
                                </h2>
                                <div className="text-base sm:text-lg font-bold text-dark bg-amber-50 border border-amber-200/60 px-4 py-1.5 rounded-full tabular-nums">
                                    {t('totalValue')}: <span className="text-amber-800">${totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {assets.length === 0 ? (
                                <div className="text-center py-12 px-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl mb-6">
                                    <p className="text-stone-700 font-medium mb-1">{t('noAssets')}</p>
                                    <p className="text-sm text-stone-500 mb-6">{t('startAdding')}</p>
                                    <button type="button" onClick={addAsset} className="btn-secondary">
                                        {t('addFirstAsset')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 mb-6">
                                    {assets.map((asset, index) => {
                                        const isInvalidName = !asset.name || !asset.name.trim();
                                        const isInvalidValue = asset.value === '' || Number(asset.value) <= 0;
                                        return (
                                            <div
                                                key={index}
                                                className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-stone-50/80 border border-stone-200/80 rounded-xl items-end"
                                            >
                                                <div className="sm:col-span-5">
                                                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                                                        {t('assetName')} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`input-field bg-white ${isInvalidName ? 'border-rose-400' : ''}`}
                                                        placeholder={t('assetNamePlaceholder')}
                                                        value={asset.name}
                                                        onChange={e => updateAsset(index, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                                                        {t('assetType')}
                                                    </label>
                                                    <select
                                                        className="input-field bg-white cursor-pointer"
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
                                                <div className="sm:col-span-3">
                                                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                                                        {t('assetValue')} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className={`input-field bg-white tabular-nums ${isInvalidValue ? 'border-rose-400' : ''}`}
                                                        placeholder="0.00"
                                                        value={asset.value}
                                                        onChange={e => updateAsset(index, 'value', Math.max(0, Number(e.target.value)) || '')}
                                                        min="0"
                                                        step="any"
                                                    />
                                                </div>
                                                <div className="sm:col-span-1 flex justify-center pb-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAsset(index)}
                                                        className="text-stone-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                                                        title={t('removeAsset')}
                                                        aria-label={t('removeAsset')}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="flex justify-center pt-2">
                                        <button
                                            type="button"
                                            onClick={addAsset}
                                            className="btn-outline text-sm py-2 px-5"
                                        >
                                            {t('addAnotherAsset')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-stone-100 flex justify-between items-center">
                                <button type="button" onClick={() => setStep(1)} className="btn-ghost">
                                    {isRTL ? '→' : '←'} {t('back')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextToHeirs}
                                    className="btn-primary px-8 py-3 text-base"
                                    disabled={assets.length === 0}
                                >
                                    {t('nextHeirs')} {isRTL ? '←' : '→'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Select Heirs */}
                    {step === 3 && (
                        <div className="card animate-fadeIn max-w-4xl mx-auto">
                            <h2 className="text-2xl sm:text-3xl font-serif text-deep-teal text-center mb-8">
                                {t('selectHeirs')}
                            </h2>

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
                                <div key={gIdx} className="mb-8">
                                    <h3 className="text-lg font-semibold text-deep-teal mb-4 pb-2 border-b border-stone-100">
                                        {group.title}
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {group.options.map(opt => {
                                            const selected = heirs.find(h => h.relationship === opt.value);
                                            const disabled = (opt.value === 'HUSBAND' && caseData.gender === 'M') ||
                                                (opt.value === 'WIFE' && caseData.gender === 'F');

                                            return (
                                                <div
                                                    key={opt.value}
                                                    className={`p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between text-center ${
                                                        selected
                                                            ? 'border-deep-teal bg-deep-teal/5 shadow-xs'
                                                            : disabled
                                                            ? 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
                                                            : 'border-stone-200 bg-white hover:border-gold/50'
                                                    }`}
                                                >
                                                    <span className={`text-xs sm:text-sm font-semibold mb-3 ${selected ? 'text-deep-teal' : 'text-stone-700'}`}>
                                                        {opt.label}
                                                    </span>

                                                    {selected ? (
                                                        <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-1 border border-stone-200 shadow-xs">
                                                            {(!opt.max || opt.max > 1) ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (selected.count > 1) updateHeirCount(opt.value, selected.count - 1);
                                                                            else toggleHeir(opt.value);
                                                                        }}
                                                                        className="w-7 h-7 flex items-center justify-center text-deep-teal font-bold hover:bg-stone-100 rounded"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="w-8 text-center font-bold text-deep-teal tabular-nums text-sm">
                                                                        {selected.count}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateHeirCount(opt.value, selected.count + 1)}
                                                                        disabled={opt.max && selected.count >= opt.max}
                                                                        className="w-7 h-7 flex items-center justify-center text-deep-teal font-bold hover:bg-stone-100 rounded disabled:opacity-30"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleHeir(opt.value)}
                                                                    className="text-deep-teal font-semibold text-xs py-1 px-2 flex items-center gap-1.5 hover:text-rose-600 transition-colors"
                                                                >
                                                                    <span>✓</span> {t('selected')} ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => !disabled && toggleHeir(opt.value)}
                                                            disabled={disabled}
                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                                disabled
                                                                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                                                    : 'bg-stone-50 hover:bg-gold hover:text-dark text-stone-600'
                                                            }`}
                                                        >
                                                            {t('select')}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="mt-8 pt-6 border-t border-stone-100 flex justify-between items-center">
                                <button type="button" onClick={() => setStep(2)} className="btn-ghost">
                                    {isRTL ? '→' : '←'} {t('back')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="btn-primary px-8 py-3 text-base shadow-md"
                                    disabled={heirs.length === 0}
                                >
                                    {t('calculateDistribution')} {isRTL ? '←' : '→'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
