import { useState, useMemo } from 'react';
import type { Card } from '../types/index';

interface CardCatalogProps {
    isOpen?: boolean;
    onClose?: () => void;
    renderMode?: 'modal' | 'embedded';
}

const CARD_DATA = import.meta.glob('../data/cards/*.json', { eager: true });

function getCardDescription(card: Card): string {
    if (card.effect) return card.effect;
    if (!card.effects || card.effects.length === 0) return "効果なし";

    //簡易的な説明生成
    return card.effects.map(e => {
        switch (e.type) {
            case 'score_fixed': return `パラメータ+${e.value}`;
            case 'score_scale_impression': return `好印象の${(e.ratio ?? 1) * 100}%分パラメータ上昇`;
            case 'score_scale_genki': return `元気の${(e.ratio ?? 1) * 100}%分パラメータ上昇`;
            case 'buff_genki': return `元気+${e.value}`;
            case 'buff_impression': return `好印象+${e.value}`;
            case 'buff_motivation': return `やる気+${e.value}`;
            case 'buff_concentration': return `集中+${e.value}`;
            case 'buff_cost_reduction': return `消費体力減少(${e.duration}ターン)`;
            case 'draw_card': return `カードを${e.value}枚引く`;
            case 'add_card_play_count': return `行動回数+${e.value}`;
            case 'consume_hp': return `体力-${e.value}`;
            case 'condition_gate': return `条件付き効果...`;
            default: return e.type;
        }
    }).join(' / ');
}

export function CardCatalog({ isOpen = true, onClose, renderMode = 'modal' }: CardCatalogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'mental' | 'other'>('all');
    const [filterPlan, setFilterPlan] = useState<'all' | 'logic' | 'sense' | 'free'>('all');
    const [filterRarity, setFilterRarity] = useState<'all' | 'Legend' | 'SSR' | 'SR' | 'R' | 'N'>('all');
    const [filterUpgrade, setFilterUpgrade] = useState<'all' | 'enhanced' | 'basic'>('all');

    // Load cards exactly like HandView
    const allCards = useMemo(() => {
        let cards: Card[] = [];
        for (const path in CARD_DATA) {
            const mod = CARD_DATA[path] as any;
            const data = mod.default || mod;
            if (Array.isArray(data)) {
                cards = [...cards, ...data];
            }
        }
        return cards;
    }, []);

    const filteredCards = useMemo(() => {
        return allCards.filter(card => {
            const matchesSearch = searchTerm === "" ||
                card.name.includes(searchTerm) ||
                (card.effect && card.effect.includes(searchTerm));

            const matchesPlan = filterPlan === 'all' ||
                (filterPlan === 'free' ? card.plan === 'free' :
                    card.plan === filterPlan || card.plan.includes(filterPlan));

            const matchesActiveTab = activeTab === 'all' ||
                (activeTab === 'active' ? card.type === 'active' :
                    activeTab === 'mental' ? card.type === 'mental' :
                        card.type !== 'active' && card.type !== 'mental');

            const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;

            const matchesUpgrade = filterUpgrade === 'all' ||
                (filterUpgrade === 'enhanced' ? card.name.endsWith('+') : !card.name.endsWith('+'));

            return matchesSearch && matchesPlan && matchesActiveTab && matchesRarity && matchesUpgrade;
        });
    }, [allCards, searchTerm, activeTab, filterPlan, filterRarity, filterUpgrade]);

    if (!isOpen) return null;

    const containerClass = renderMode === 'modal'
        ? "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        : "h-full w-full flex flex-col overflow-hidden animate-in fade-in duration-200";

    const innerClass = renderMode === 'modal'
        ? "bg-slate-900 w-full max-w-6xl h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
        : "flex-1 flex flex-col min-h-0 bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden";

    return (
        <div className={containerClass}>
            <div className={innerClass}>
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex flex-col gap-4 bg-slate-900">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                カード一覧
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">登録されている全カードデータ ({allCards.length}枚)</p>
                        </div>
                        {renderMode === 'modal' && onClose && (
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>

                    {/* Filters Container */}
                    <div className="flex flex-col gap-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="カード名・効果で検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                            />
                            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-950/40 rounded-lg border border-white/5 self-start">
                            {[
                                { id: 'all', label: 'すべて', activeColor: 'bg-slate-700' },
                                { id: 'active', label: 'アクティブ', activeColor: 'bg-red-500/80' },
                                { id: 'mental', label: 'メンタル', activeColor: 'bg-blue-500/80' },
                                { id: 'other', label: 'トラブル', activeColor: 'bg-slate-600/80' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab.id
                                        ? `${tab.activeColor} text-white shadow-sm ring-1 ring-white/10`
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Advanced Filters */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 items-center bg-slate-900/30 py-2 px-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 font-bold">プラン</span>
                                <div className="flex gap-0.5 bg-black/20 rounded p-0.5">
                                    <FilterButton label="すべて" active={filterPlan === 'all'} onClick={() => setFilterPlan('all')} />
                                    <FilterButton label="ロジック" active={filterPlan === 'logic'} onClick={() => setFilterPlan('logic')} color="text-blue-300 bg-blue-500/10 hover:bg-blue-500/20" />
                                    <FilterButton label="センス" active={filterPlan === 'sense'} onClick={() => setFilterPlan('sense')} color="text-red-300 bg-red-500/10 hover:bg-red-500/20" />
                                    <FilterButton label="共通" active={filterPlan === 'free'} onClick={() => setFilterPlan('free')} />
                                </div>
                            </div>

                            <div className="w-px h-3 bg-white/10 hidden sm:block"></div>

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 font-bold">レアリティ</span>
                                <div className="flex gap-0.5 bg-black/20 rounded p-0.5">
                                    <FilterButton label="すべて" active={filterRarity === 'all'} onClick={() => setFilterRarity('all')} />
                                    <FilterButton label="Legend" active={filterRarity === 'Legend'} color="text-fuchsia-400" onClick={() => setFilterRarity('Legend')} />
                                    <FilterButton label="SSR" active={filterRarity === 'SSR'} color="text-yellow-400" onClick={() => setFilterRarity('SSR')} />
                                    <FilterButton label="SR" active={filterRarity === 'SR'} color="text-blue-400" onClick={() => setFilterRarity('SR')} />
                                    <FilterButton label="R" active={filterRarity === 'R'} color="text-slate-300" onClick={() => setFilterRarity('R')} />
                                    <FilterButton label="N" active={filterRarity === 'N'} color="text-slate-500" onClick={() => setFilterRarity('N')} />
                                </div>
                            </div>

                            <div className="w-px h-3 bg-white/10 hidden sm:block"></div>

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 font-bold">強化</span>
                                <div className="flex gap-0.5 bg-black/20 rounded p-0.5">
                                    <FilterButton label="すべて" active={filterUpgrade === 'all'} onClick={() => setFilterUpgrade('all')} />
                                    <FilterButton label="強化済み" active={filterUpgrade === 'enhanced'} onClick={() => setFilterUpgrade('enhanced')} color="text-yellow-200 bg-yellow-400/10 hover:bg-yellow-400/20" />
                                    <FilterButton label="強化前" active={filterUpgrade === 'basic'} onClick={() => setFilterUpgrade('basic')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredCards.map((card, idx) => (
                            <div
                                key={`${card.id}-${idx}`}
                                className="bg-slate-800/40 border border-white/5 rounded-xl p-3 flex gap-3 hover:bg-slate-800/60 hover:border-white/10 transition-all group"
                            >
                                {/* Image */}
                                <div className="w-16 h-16 shrink-0 bg-slate-950 rounded-lg border border-white/10 overflow-hidden relative">
                                    {card.image ? (
                                        <img
                                            src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map(part => encodeURIComponent(part)).join('/')}`}
                                            className="w-full h-full object-cover"
                                            alt={card.name}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-xl">
                                            {card.name[0]}
                                        </div>
                                    )}
                                    <div className={`absolute bottom-0 inset-x-0 h-1 ${card.type === 'active' ? 'bg-red-500' :
                                        card.type === 'mental' ? 'bg-blue-500' : 'bg-slate-500'
                                        }`}></div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-sm text-slate-200 truncate" title={card.name}>{card.name}</h3>
                                            <span className={`text-[10px] font-mono px-1 rounded border shrink-0 ${card.rarity === 'Legend' ? 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10' :
                                                card.rarity === 'SSR' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                                                    card.rarity === 'SR' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' :
                                                        'text-slate-400 border-slate-500/30'
                                                }`}>
                                                {card.rarity || 'N'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2 mt-0.5 text-[10px] text-slate-500 uppercase font-bold">
                                            <span className={card.plan === 'free' ? 'text-green-400' : card.plan.includes('logic') ? 'text-blue-400' : 'text-red-400'}>
                                                {card.plan}
                                            </span>
                                            <span>•</span>
                                            <span>{card.type}</span>
                                            <span>•</span>
                                            <span>Cost {card.cost}</span>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-2" title={getCardDescription(card)}>
                                        {getCardDescription(card)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredCards.length === 0 && (
                        <div className="h-full flex items-center justify-center text-slate-500 italic">
                            一致するカードがありません
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FilterButton({ label, active, onClick, color }: { label: string, active: boolean, onClick: () => void, color?: string }) {
    return (
        <button
            onClick={onClick}
            className={`text-[10px] px-2.5 py-1 rounded transition-all ${active
                ? `bg-slate-700 text-white font-bold shadow-sm ring-1 ring-white/10 ${color || ''}`
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
        >
            {label}
        </button>
    )
}
