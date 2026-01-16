import type { PItem, CharacterProfile } from '../types/index';
import pItemsLogic from '../data/p_items_logic.json';
import pItemsSense from '../data/p_items_sense.json';
import pItemsAnomaly from '../data/p_items_anomaly.json';
import pItemsFree from '../data/p_items_free.json';
import { useState } from 'react';

type ViewMode = 'detail' | 'compact';

interface PItemViewProps {
    selectedPItems: PItem[];
    setSelectedPItems: (items: PItem[]) => void;
    selectedProfile?: CharacterProfile;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const pItemsList = [
    ...(pItemsLogic as PItem[]),
    ...(pItemsSense as PItem[]),
    ...(pItemsAnomaly as PItem[]),
    ...(pItemsFree as PItem[]),
];

export function PItemView({ selectedPItems, setSelectedPItems, selectedProfile, viewMode, setViewMode }: PItemViewProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const toggleItem = (item: PItem) => {
        if (selectedPItems.find(i => i.id === item.id)) {
            setSelectedPItems(selectedPItems.filter(i => i.id !== item.id));
        } else {
            if (selectedPItems.length >= 5) {
                alert("Pアイテムは最大5個までです");
                return;
            }
            setSelectedPItems([...selectedPItems, item]);
        }
    };

    const filteredItems = pItemsList.filter(i => {
        // Plan filter
        const planMatch = i.plan === "free" || (selectedProfile && i.plan === selectedProfile.plan);
        // Search filter
        const searchMatch = !searchTerm.trim() ||
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.effect.toLowerCase().includes(searchTerm.toLowerCase());

        return planMatch && searchMatch;
    });

    return (
        <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col gap-6 text-slate-200">
            <header className="border-b border-white/5 pb-4 flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Pアイテム設定</h2>
                    <p className="text-slate-400 text-sm mt-1">プロデュース中に効果を発揮するアイテムを選択してください (最大5個)</p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="relative w-full md:w-96">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="アイテム名・効果で検索..."
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
                {/* LEFT: Item Pool */}
                <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-3 bg-slate-900/80 border-b border-white/5">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">アイテムプール</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div>
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                利用可能アイテム
                            </h4>
                            {filteredItems.length === 0 ? (
                                <div className="py-12 text-center text-slate-500 italic text-sm">
                                    条件に一致するアイテムが見つかりません
                                </div>
                            ) : (
                                <div className={viewMode === 'compact' ? "grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}>
                                    {filteredItems.map(item => {
                                        const isSelected = !!selectedPItems.find(i => i.id === item.id);

                                        if (viewMode === 'compact') {
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleItem(item)}
                                                    className={`relative group aspect-square rounded-lg overflow-hidden border transition-all hover:scale-105 active:scale-95 ${isSelected
                                                        ? "bg-blue-600/20 border-blue-500/50 ring-2 ring-blue-500/50"
                                                        : "bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-700/50"
                                                        }`}
                                                >
                                                    {item.image && item.image !== "default.png" ? (
                                                        <img src={`${import.meta.env.BASE_URL}images/items/${item.image}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500 font-bold text-lg">
                                                            {item.name[0]}
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[1px] p-1 text-center">
                                                        <p className="text-[9px] font-bold text-white truncate leading-tight">{item.name}</p>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        }

                                        // Detail View
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => toggleItem(item)}
                                                className={`text-left rounded-lg p-3 transition-all group relative overflow-hidden flex flex-col gap-2 border ${isSelected
                                                    ? "bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/30"
                                                    : "bg-slate-800/50 hover:bg-slate-700/50 border-white/5"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-slate-950 flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden">
                                                        {item.image && item.image !== "default.png" ? (
                                                            <img src={`${import.meta.env.BASE_URL}images/items/${item.image}`} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] text-slate-500 font-bold">{item.name[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-sm text-slate-200 group-hover:text-white truncate">{item.name}</p>
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono uppercase ${item.plan === "logic" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                            item.plan === "sense" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                                item.plan === "anomaly" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                                                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                                            }`}>
                                                            {item.plan}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2">
                                                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{item.effect}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* RIGHT: Current Selection */}
                <div className="w-80 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-3 bg-slate-900/80 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">選択中</h3>
                        <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-white">{selectedPItems.length}/5</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {selectedPItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 text-center">
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                <p className="text-xs">アイテム未選択</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedPItems.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="flex items-center gap-3 p-2 bg-slate-800/70 rounded-lg border border-white/10 group transition-all animate-in slide-in-from-right-2 duration-200">
                                        <div className="w-8 h-8 rounded bg-slate-900 flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden">
                                            {item.image && item.image !== "default.png" ? (
                                                <img src={`${import.meta.env.BASE_URL}images/items/${item.image}`} className="w-full h-full object-cover" />
                                            ) : <span className="text-[8px] font-bold text-slate-600">{item.name[0]}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                                            <p className="text-[9px] text-slate-500 uppercase">{item.plan}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleItem(item)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 transition-all text-slate-500 hover:text-red-400"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
