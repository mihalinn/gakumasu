import { useState, useMemo } from 'react';
import type { PDrink, CharacterProfile } from '../types/index';

type ViewMode = 'detail' | 'compact';

interface PDrinkViewProps {
    selectedPDrinks: PDrink[];
    setSelectedPDrinks: (drinks: PDrink[]) => void;
    selectedProfile?: CharacterProfile;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const DRINK_DATA = import.meta.glob('../data/drinks/*.json', { eager: true });

export function PDrinkView({ selectedPDrinks, setSelectedPDrinks, selectedProfile, viewMode, setViewMode }: PDrinkViewProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Use Memo to aggregate all drinks from dynamic JSONs
    const allDrinks = useMemo(() => {
        let drinks: PDrink[] = [];
        for (const path in DRINK_DATA) {
            const mod = DRINK_DATA[path] as any;
            const data = mod.default || mod;
            if (Array.isArray(data)) {
                drinks = [...drinks, ...data];
            }
        }
        return drinks;
    }, []);

    const addDrink = (drink: PDrink) => {
        if (selectedPDrinks.length >= 3) {
            alert("Pドリンクは最大3つまでです");
            return;
        }
        setSelectedPDrinks([...selectedPDrinks, drink]);
    };

    const removeDrink = (index: number) => {
        const newDrinks = [...selectedPDrinks];
        newDrinks.splice(index, 1);
        setSelectedPDrinks(newDrinks);
    };

    const filteredDrinks = useMemo(() => {
        const plan = selectedProfile?.plan || 'free';
        return allDrinks.filter(d => {
            // Plan filter: show free drinks and drinks for the current plan
            const planMatch = d.plan === 'free' || d.plan === plan;
            // Search filter
            const searchMatch = !searchTerm.trim() ||
                d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.effect.toLowerCase().includes(searchTerm.toLowerCase());
            return planMatch && searchMatch;
        });
    }, [allDrinks, selectedProfile, searchTerm]);

    return (
        <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col gap-6 text-slate-200">
            <header className="border-b border-white/5 pb-4 flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Pドリンク設定</h2>
                    <p className="text-slate-400 text-sm mt-1">試験中に使用できるドリンクを選択してください (最大3つ重複可)</p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="relative w-full md:w-96">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="ドリンク名・効果で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="flex bg-slate-950/50 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setViewMode('detail')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'detail' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            詳細
                        </button>
                        <button
                            onClick={() => setViewMode('compact')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'compact' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            コンパクト
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                {/* LEFT: Drink Pool */}
                <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-3 bg-slate-900/80 border-b border-white/5">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">ドリンクプール</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div>
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                利用可能ドリンク
                            </h4>
                            {filteredDrinks.length === 0 ? (
                                <div className="py-12 text-center text-slate-500 italic text-sm">
                                    条件に一致するドリンクが見つかりません
                                </div>
                            ) : (
                                <div className={viewMode === 'compact' ? "grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}>
                                    {filteredDrinks.map((drink, idx) => (
                                        viewMode === 'compact' ? (
                                            <button
                                                key={`${drink.id}-${idx}`}
                                                onClick={() => addDrink(drink)}
                                                className="relative group aspect-square rounded-lg overflow-hidden border transition-all hover:scale-105 active:scale-95 bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-700/50"
                                            >
                                                {drink.image && drink.image !== "default.png" ? (
                                                    <img src={`${import.meta.env.BASE_URL}images/drinks/${drink.image.split('/').map(part => encodeURIComponent(part)).join('/')}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500 font-bold text-lg">
                                                        D
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[1px] p-1 text-center">
                                                    <p className="text-[9px] font-bold text-white truncate leading-tight">{drink.name}</p>
                                                </div>
                                            </button>
                                        ) : (
                                            <button
                                                key={`${drink.id}-${idx}`}
                                                onClick={() => addDrink(drink)}
                                                className="text-left rounded-lg p-3 transition-all group relative overflow-hidden flex flex-col gap-2 border bg-slate-800/50 hover:bg-slate-700/50 border-white/5 hover:border-white/10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-slate-950 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {drink.image && drink.image !== "default.png" ? (
                                                            <img src={`${import.meta.env.BASE_URL}images/drinks/${drink.image.split('/').map(part => encodeURIComponent(part)).join('/')}`} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-600">D</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-sm text-slate-200 group-hover:text-white truncate">{drink.name}</p>
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono uppercase ${drink.plan === "logic" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                            drink.plan === "sense" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                                drink.plan === "anomaly" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                                                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                                            }`}>
                                                            {drink.plan}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{drink.effect}</p>
                                            </button>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Current Selection */}
                <div className="w-80 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-3 bg-slate-900/80 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">選択中</h3>
                        <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-white">{selectedPDrinks.length}/3</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                        {[...Array(3)].map((_, i) => {
                            const drink = selectedPDrinks[i];
                            return (
                                <div key={i} className={`w-full border rounded-xl p-3 flex items-center gap-3 group transition-all min-h-[64px] ${drink ? "bg-slate-800/70 border-white/10 hover:bg-slate-800/90" : "bg-slate-950/30 border-dashed border-white/5"
                                    }`}>
                                    {drink ? (
                                        <>
                                            <div className="w-8 h-8 rounded bg-slate-900 flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden">
                                                {drink.image && drink.image !== "default.png" ? (
                                                    <img src={`${import.meta.env.BASE_URL}images/drinks/${drink.image.split('/').map(part => encodeURIComponent(part)).join('/')}`} className="w-full h-full object-cover" />
                                                ) : <span className="text-[10px] font-bold text-slate-600">D</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-200 truncate">{drink.name}</p>
                                                <p className="text-[9px] text-slate-500 uppercase">{drink.plan}</p>
                                            </div>
                                            <button
                                                onClick={() => removeDrink(i)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 transition-all text-slate-500 hover:text-red-400"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full text-center py-2">
                                            <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">空スロット</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div >
    );
}
