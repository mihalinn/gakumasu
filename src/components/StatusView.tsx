import { useState } from 'react';
import type { LessonAttribute } from '../types/index';

// Define plan configuration for easy extensibility
const PRODUCE_PLAN_CONFIG = [
    { id: '初', label: '初', max: 1000 },
    { id: '初LEGEND', label: '初LEGEND', max: 1500 },
    { id: 'NIA', label: 'NIA', max: 2000 },
    // Add new plans here easily
] as const;

// Derive type from config
type ProducePlan = typeof PRODUCE_PLAN_CONFIG[number]['id'];

interface StatusViewProps {
    status: { vocal: number; dance: number; visual: number; hp: number; maxHp: number };
    setStatus: React.Dispatch<React.SetStateAction<{ vocal: number; dance: number; visual: number; hp: number; maxHp: number }>>;
    producePlan: ProducePlan;
    setProducePlan: React.Dispatch<React.SetStateAction<ProducePlan>>;
    turnAttributes: LessonAttribute[];
    setTurnAttributes: React.Dispatch<React.SetStateAction<LessonAttribute[]>>;
}

interface CommonCardProps {
    value: number;
    onChange: (val: string) => void;
}

interface HpCardProps extends CommonCardProps {
    max: number;
    onMaxChange: (val: string) => void;
}

interface StatusCardProps extends CommonCardProps {
    label: string;
    colorFrom: string;
    colorTo: string;
    max: number;
}

const StatusCard = ({ label, colorFrom, colorTo, value, max, onChange }: StatusCardProps) => (
    <div className={`relative overflow-hidden p-6 rounded-2xl border border-white/10 group transition-all hover:border-white/20`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-10 group-hover:opacity-20 transition-opacity`} />
        <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl ${colorFrom} opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none`} />

        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300 drop-shadow-sm mt-2">{label}</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onChange(Math.max(0, value - 1).toString())}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                    >
                        <span className="text-lg font-bold leading-none pb-0.5">-</span>
                    </button>
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-20 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-center text-xl font-mono font-bold text-white focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all"
                    />
                    <button
                        onClick={() => onChange(Math.min(max, value + 1).toString())}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                    >
                        <span className="text-lg font-bold leading-none pb-0.5">+</span>
                    </button>
                </div>
            </div>

            <div className="mt-auto">
                <input
                    type="range"
                    min="0"
                    max={max}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="custom-range"
                    style={{
                        backgroundImage: `linear-gradient(to right, currentColor ${Math.min(100, (value / max) * 100)}%, rgba(0,0,0,0.3) ${Math.min(100, (value / max) * 100)}%)`,
                        backgroundSize: '100% 8px',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                />
                <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono text-center w-full px-1">
                    <div className="flex justify-between w-full">
                        <span>0</span>
                        <span>{max}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const HpCard = ({ value, max, onChange, onMaxChange }: HpCardProps) => {
    return (
        <div className="relative overflow-hidden p-4 rounded-xl border border-white/10 group transition-all hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl from-emerald-500 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full gap-3">
                {/* Max HP Config */}
                <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400">MAX HP</span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onMaxChange(Math.max(1, max - 1).toString())}
                            className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-95"
                        >
                            <span className="text-[10px] font-bold">-</span>
                        </button>
                        <input
                            type="number"
                            value={max}
                            onChange={(e) => onMaxChange(e.target.value)}
                            className="w-10 bg-transparent border-b border-white/20 text-center text-sm font-mono font-bold text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                        <button
                            onClick={() => onMaxChange((max + 1).toString())}
                            className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-95"
                        >
                            <span className="text-[10px] font-bold">+</span>
                        </button>
                    </div>
                </div>

                {/* Current HP Config */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-emerald-400">現在 HP</span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onChange(Math.max(0, value - 1).toString())}
                                className="w-6 h-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                            >
                                <span className="text-sm font-bold leading-none pb-0.5">-</span>
                            </button>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-14 bg-black/20 border border-white/10 rounded-md px-1 py-0.5 text-center text-xl font-mono font-bold text-green-400 focus:outline-none focus:border-green-500/50 focus:bg-black/40 transition-all"
                            />
                            <button
                                onClick={() => onChange(Math.min(max, value + 1).toString())}
                                className="w-6 h-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                            >
                                <span className="text-sm font-bold leading-none pb-0.5">+</span>
                            </button>
                        </div>
                    </div>

                    <div className="pt-1">
                        <input
                            type="range"
                            min="0"
                            max={max}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="custom-range text-emerald-400 !h-4 compact-thumb"
                            style={{
                                backgroundImage: `linear-gradient(to right, currentColor ${Math.min(100, (value / max) * 100)}%, rgba(0,0,0,0.3) ${Math.min(100, (value / max) * 100)}%)`,
                                backgroundSize: '100% 4px',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export function StatusView({ status, setStatus, producePlan, setProducePlan, turnAttributes, setTurnAttributes }: StatusViewProps) {
    const [selectedAttribute, setSelectedAttribute] = useState<LessonAttribute>('vocal');

    const handleChange = (key: keyof typeof status, val: string) => {
        const num = parseInt(val) || 0;

        // If changing Max HP, ensure Current HP doesn't go below it (wait, current should not exceed max)
        if (key === 'maxHp') {
            setStatus(prev => ({
                ...prev,
                maxHp: num,
                hp: Math.min(prev.hp, num) // Constraint: HP <= MaxHP
            }));
        } else if (key === 'hp') {
            // Constraint: HP <= MaxHP
            setStatus(prev => ({
                ...prev,
                hp: Math.min(num, prev.maxHp)
            }));
        } else {
            setStatus(prev => ({ ...prev, [key]: num }));
        }
    };

    const handleTurnAttributeChange = (turnIndex: number) => {
        setTurnAttributes(prev => {
            const next = [...prev];
            next[turnIndex] = selectedAttribute;
            return next;
        });
    };

    // Calculate max values based on selected plan
    const activePlanConfig = PRODUCE_PLAN_CONFIG.find(p => p.id === producePlan) || PRODUCE_PLAN_CONFIG[0];
    const activeMax = activePlanConfig.max;

    return (
        <div className="animate-in slide-in-from-right-4 duration-500 h-full flex flex-col gap-8 text-slate-200">
            <style>{`
                .custom-range {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 24px;
                    border-radius: 9999px;
                    background: transparent;
                    outline: none;
                    cursor: pointer;
                }
                .custom-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                    transition: transform 0.1s;
                    margin-top: -8px; /* Correct thumb alignment */
                }
                .custom-range.compact-thumb::-webkit-slider-thumb {
                     width: 16px;
                     height: 16px;
                     margin-top: -6px;
                }
                .custom-range::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                }
                .custom-range::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 8px;
                    cursor: pointer;
                    border-radius: 9999px;
                    background: transparent;
                }
                
                /* Hide number input spinners */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>

            <header className="border-b border-white/5 pb-4 flex justify-between items-end flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">ステータス設定</h2>
                    <p className="text-slate-400 text-sm mt-1">試験開始時の初期パラメータを調整します</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Produce Plan</span>
                    <div className="relative">
                        <select
                            value={producePlan}
                            onChange={(e) => setProducePlan(e.target.value as ProducePlan)}
                            className="bg-black/40 border border-white/20 rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:bg-black/60 transition-all appearance-none cursor-pointer hover:border-white/40"
                        >
                            {PRODUCE_PLAN_CONFIG.map((plan) => (
                                <option key={plan.id} value={plan.id} className="bg-slate-900 text-white">
                                    {plan.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* LEFT COLUMN: Status Parameters */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar max-w-2xl">
                    <div className="text-pink-400">
                        <StatusCard
                            label="Vocal"
                            colorFrom="from-pink-500"
                            colorTo="to-rose-600"
                            value={status.vocal}
                            max={activeMax}
                            onChange={(val) => handleChange('vocal', val)}
                        />
                    </div>
                    <div className="text-blue-400">
                        <StatusCard
                            label="Dance"
                            colorFrom="from-blue-500"
                            colorTo="to-cyan-600"
                            value={status.dance}
                            max={activeMax}
                            onChange={(val) => handleChange('dance', val)}
                        />
                    </div>
                    <div className="text-yellow-400">
                        <StatusCard
                            label="Visual"
                            colorFrom="from-yellow-500"
                            colorTo="to-orange-600"
                            value={status.visual}
                            max={activeMax}
                            onChange={(val) => handleChange('visual', val)}
                        />
                    </div>
                    <div className="text-emerald-400">
                        <HpCard
                            value={status.hp}
                            max={status.maxHp}
                            onChange={(val) => handleChange('hp', val)}
                            onMaxChange={(val) => handleChange('maxHp', val)}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: Turn Attributes Config */}
                <div className="w-96 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-white/5 bg-slate-900/50 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-400 tracking-wider">ターン属性設定</h3>
                            <p className="text-[10px] text-slate-500">属性を選択してターンをクリック</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                        {/* Palette (Horizontal fit in column) */}
                        <div className="flex gap-2">
                            {(['vocal', 'dance', 'visual'] as LessonAttribute[]).map((attr) => (
                                <button
                                    key={attr}
                                    onClick={() => setSelectedAttribute(attr)}
                                    className={`
                                    flex-1 py-2 rounded-lg border-2 font-bold uppercase text-[10px] transition-all flex flex-col items-center justify-center gap-1
                                    ${attr === 'vocal'
                                            ? (selectedAttribute === 'vocal' ? 'bg-pink-500 text-white border-pink-400 shadow-sm scale-105' : 'bg-pink-500/10 text-pink-500 border-pink-500/30 hover:bg-pink-500/20')
                                            : ''}
                                    ${attr === 'dance'
                                            ? (selectedAttribute === 'dance' ? 'bg-blue-500 text-white border-blue-400 shadow-sm scale-105' : 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20')
                                            : ''}
                                    ${attr === 'visual'
                                            ? (selectedAttribute === 'visual' ? 'bg-yellow-500 text-white border-yellow-400 shadow-sm scale-105' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20')
                                            : ''}
                                `}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                    ${selectedAttribute === attr ? 'border-white bg-white/20' : 'border-current'}
                                `}>
                                        <span className="text-[8px]">{attr.toUpperCase().substring(0, 1)}</span>
                                    </div>
                                    {attr}
                                </button>
                            ))}
                        </div>

                        {/* Turn List (Vertical Scroll) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
                            {turnAttributes.map((attr, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleTurnAttributeChange(index)}
                                    onMouseEnter={(e) => {
                                        if (e.buttons === 1) handleTurnAttributeChange(index);
                                    }}
                                    onMouseDown={() => handleTurnAttributeChange(index)}
                                    className={`
                                    w-full flex items-center gap-3 p-2 rounded-lg border transition-all active:scale-95 group min-h-[48px]
                                    ${attr === 'vocal' ? 'bg-pink-500/10 border-pink-500/30' : ''}
                                    ${attr === 'dance' ? 'bg-blue-500/10 border-blue-500/30' : ''}
                                    ${attr === 'visual' ? 'bg-yellow-500/10 border-yellow-500/30' : ''}
                                    hover:bg-white/5
                                `}
                                >
                                    <div className="w-6 h-6 rounded bg-black/40 flex items-center justify-center font-mono font-bold text-slate-400 text-xs border border-white/10 group-hover:border-white/30">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 flex items-center gap-2">
                                        <div className={`
                                        w-1.5 h-6 rounded-full
                                        ${attr === 'vocal' ? 'bg-pink-500' : ''}
                                        ${attr === 'dance' ? 'bg-blue-500' : ''}
                                        ${attr === 'visual' ? 'bg-yellow-500' : ''}
                                    `} />
                                        <span className={`font-bold uppercase tracking-wider text-xs
                                        ${attr === 'vocal' ? 'text-pink-400' : ''}
                                        ${attr === 'dance' ? 'text-blue-400' : ''}
                                        ${attr === 'visual' ? 'text-yellow-400' : ''}
                                    `}>
                                            {attr}
                                        </span>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase
                                        ${selectedAttribute === 'vocal' ? 'text-pink-400 border-pink-500/30 bg-pink-500/10' : ''}
                                        ${selectedAttribute === 'dance' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : ''}
                                        ${selectedAttribute === 'visual' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' : ''}
                                    `}>
                                            Apply
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
