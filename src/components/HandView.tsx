import { useState, useMemo } from 'react';
import type { Card, CharacterProfile } from '../types/index';
import cardsLogic from '../data/cards_logic.json';
import cardsSense from '../data/cards_sense.json';
import cardsAnomaly from '../data/cards_anomaly.json';
import cardsFree from '../data/cards_free.json';
import cardsTrouble from '../data/cards_trouble.json';

interface HandViewProps {
    hand: Card[];
    setHand: (hand: Card[]) => void;
    selectedProfile?: CharacterProfile;
    viewMode: 'detail' | 'compact';
    setViewMode: (mode: 'detail' | 'compact') => void;
}

type TabType = 'all' | 'active' | 'mental' | 'other';
type ViewMode = 'detail' | 'compact';

export function HandView({ hand, setHand, selectedProfile, viewMode, setViewMode }: HandViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const addToHand = (card: Card) => {
        if (hand.length >= 25) {
            alert("手札は最大25枚までです");
            return;
        }
        setHand([...hand, card]);
    };

    const removeFromHand = (index: number) => {
        const newHand = [...hand];
        newHand.splice(index, 1);
        setHand(newHand);
    };

    const availableCards = useMemo(() => {
        let pool: Card[] = [
            ...(cardsFree as Card[]),
            ...(cardsTrouble as Card[]),
        ];

        if (!selectedProfile) {
            return [
                ...pool,
                ...(cardsLogic as Card[]),
                ...(cardsSense as Card[]),
                ...(cardsAnomaly as Card[]),
            ];
        }

        switch (selectedProfile.plan) {
            case 'logic':
                pool = [...pool, ...(cardsLogic as Card[])];
                break;
            case 'sense':
                pool = [...pool, ...(cardsSense as Card[])];
                break;
            case 'anomaly':
                pool = [...pool, ...(cardsAnomaly as Card[])];
                break;
            default:
                pool = [
                    ...pool,
                    ...(cardsLogic as Card[]),
                    ...(cardsSense as Card[]),
                    ...(cardsAnomaly as Card[]),
                ];
                break;
        }

        return pool;
    }, [selectedProfile]);

    const filteredCards = useMemo(() => {
        let result = availableCards;

        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowerTerm) ||
                c.effect.toLowerCase().includes(lowerTerm)
            );
        }

        if (activeTab === 'active') {
            result = result.filter(c => c.type === 'active');
        } else if (activeTab === 'mental') {
            result = result.filter(c => c.type === 'mental');
        } else if (activeTab === 'other') {
            result = result.filter(c => c.type !== 'active' && c.type !== 'mental');
        }

        return result;
    }, [availableCards, searchTerm, activeTab]);

    return (
        <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col gap-6 text-slate-200">
            <header className="border-b border-white/5 pb-4 flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">手札編集</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-400 text-sm">試験に持ち込むカードを選択してください</p>
                        {selectedProfile && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono ${selectedProfile.plan === 'logic' ? 'text-blue-300 border-blue-500/30 bg-blue-500/10' :
                                selectedProfile.plan === 'sense' ? 'text-red-300 border-red-500/30 bg-red-500/10' :
                                    'text-purple-300 border-purple-500/30 bg-purple-500/10'
                                }`}>
                                {selectedProfile.plan.toUpperCase()} PLAN ONLY
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="カード名・効果で検索..."
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

                    <div className="flex gap-1 border-b border-white/5">
                        {[
                            { id: 'all', label: 'すべて', color: 'bg-white' },
                            { id: 'active', label: 'アクティブ', color: 'bg-red-500' },
                            { id: 'mental', label: 'メンタル', color: 'bg-blue-500' },
                            { id: 'other', label: 'その他', color: 'bg-slate-500' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all hover:bg-white/5 relative top-[1px] ${activeTab === tab.id
                                    ? `text-white border-${tab.color.replace('bg-', '')}`
                                    : 'text-slate-500 border-transparent hover:text-slate-300'
                                    }`}
                                style={{
                                    borderColor: activeTab === tab.id ? (tab.id === 'all' ? 'white' : undefined) : undefined
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                        {selectedProfile?.uniqueCard && (searchTerm === "" || selectedProfile.uniqueCard.name.includes(searchTerm) || selectedProfile.uniqueCard.effect.includes(searchTerm)) && (
                            <div className="mb-6">
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-80">
                                    <span className="w-1 h-4 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.5)]"></span>
                                    固有カード
                                </h4>
                                <div className={viewMode === 'compact' ? "grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}>
                                    <CardButton
                                        card={selectedProfile.uniqueCard}
                                        onClick={() => addToHand(selectedProfile.uniqueCard!)}
                                        mode={viewMode}
                                        isUnique
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-80">
                                <span className={`w-1 h-4 rounded-full ${activeTab === 'active' ? 'bg-red-500' :
                                    activeTab === 'mental' ? 'bg-blue-500' :
                                        activeTab === 'other' ? 'bg-slate-500' : 'bg-white'
                                    }`}></span>
                                {activeTab === 'all' ? '検索結果' :
                                    activeTab === 'active' ? 'アクティブ' :
                                        activeTab === 'mental' ? 'メンタル' : 'その他'}
                            </h4>

                            {filteredCards.length === 0 ? (
                                <div className="py-12 text-center text-slate-500 italic text-sm">
                                    条件に一致するカードが見つかりません
                                </div>
                            ) : (
                                <div className={viewMode === 'compact' ? "grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}>
                                    {filteredCards.map((card, idx) => (
                                        <CardButton
                                            key={`${card.id}-${idx}`}
                                            card={card}
                                            onClick={() => addToHand(card)}
                                            mode={viewMode}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-80 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-3 bg-slate-900/80 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">現在のデッキ</h3>
                        <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-white">{hand.length}枚</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {hand.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <p className="text-xs">カードが選択されていません</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {hand.map((card, idx) => (
                                    <div key={`${card.id}-${idx}`} className="flex items-center gap-3 p-2 rounded bg-slate-800/70 border border-white/10 group transition-all animate-in slide-in-from-right-2 duration-200">
                                        <div className="w-8 h-8 rounded bg-slate-950 flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden relative">
                                            <div className={`absolute inset-0 border-2 rounded opacity-30 ${card.rarity === 'SSR' ? 'border-yellow-400' :
                                                card.rarity === 'SR' ? 'border-blue-400' : 'border-slate-600'
                                                } pointer-events-none`}></div>

                                            {card.image && card.image !== "default.png" ? (
                                                <img src={`${import.meta.env.BASE_URL}images/cards/${card.image}`} className="w-full h-full object-cover" />
                                            ) : <span className="text-[10px] font-bold">{card.name[0]}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-200 truncate">{card.name}</p>
                                            <p className="text-[9px] text-slate-500 uppercase">{card.type}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromHand(idx)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 transition-all text-slate-500 hover:text-red-400"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

function CardButton({ card, onClick, mode, isUnique }: { card: Card, onClick: () => void, mode: ViewMode, isUnique?: boolean }) {
    if (mode === 'compact') {
        return (
            <button
                onClick={onClick}
                className={`relative group aspect-square rounded-lg overflow-hidden border transition-all hover:scale-105 active:scale-95 ${isUnique
                    ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-400"
                    : "bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-700/50"
                    }`}
            >
                {card.image && card.image !== "default.png" ? (
                    <img src={`${import.meta.env.BASE_URL}images/cards/${card.image}`} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500 font-bold text-lg">
                        {card.name[0]}
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[1px] p-1 text-center">
                    <p className="text-[9px] font-bold text-white truncate leading-tight">{card.name}</p>
                </div>

                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-black/50 ${card.type === 'active' ? 'bg-red-500' :
                    card.type === 'mental' ? 'bg-blue-500' : 'bg-slate-500'
                    }`}></div>
            </button>
        )
    }

    return (
        <button
            onClick={onClick}
            className={`text-left rounded-lg p-3 transition-colors group relative overflow-hidden flex flex-col gap-2 ${isUnique
                ? "bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30"
                : "bg-slate-800/50 hover:bg-slate-700/50 border border-white/5"
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded bg-slate-950 flex-shrink-0 flex items-center justify-center border overflow-hidden ${isUnique ? 'border-yellow-500/30' : 'border-white/10'}`}>
                    {card.image && card.image !== "default.png" ? (
                        <img src={`${import.meta.env.BASE_URL}images/cards/${card.image}`} className="w-full h-full object-cover object-top" />
                    ) : (
                        <span className="text-xs text-slate-600 font-bold">{card.name[0]}</span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`font-bold text-sm truncate ${isUnique ? 'text-yellow-200 group-hover:text-white' : 'text-slate-200 group-hover:text-white'}`}>{card.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                        {isUnique && <span className="text-[8px] px-1.5 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 font-mono uppercase">UNIQUE</span>}
                        {card.rarity && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono uppercase ${card.rarity === "R" ? "bg-slate-400/20 text-slate-400 border-slate-400/20" :
                                card.rarity === "SR" ? "bg-blue-500/20 text-blue-400 border-blue-500/20" :
                                    "bg-yellow-500/20 text-yellow-400 border-yellow-500/20"
                                }`}>{card.rarity}</span>
                        )}
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono uppercase ${card.type === "active" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            card.type === "mental" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            }`}>{card.type}</span>
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{card.effect}</p>
        </button>
    )
}
