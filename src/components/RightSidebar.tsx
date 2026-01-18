import { SummaryCard } from './UI';
import { TABS } from '../constants/ui';
import type { Tab } from '../constants/ui';
import type { Card, PItem, PDrink, CharacterProfile, CharacterGroup, GameState } from '../types';

interface RightSidebarProps {
    activeSidebarTab: 'produce' | 'settings';
    setActiveSidebarTab: (tab: 'produce' | 'settings') => void;
    setActiveTab: (tab: Tab) => void;

    status: { vocal: number; dance: number; visual: number; hp: number; maxHp: number };
    resetStatus: () => void;
    selectedProfile: CharacterProfile | null;
    selectedGroup: CharacterGroup | undefined;
    resetCharacter: () => void;
    hand: Card[];
    resetHand: () => void;
    selectedPItems: PItem[];
    resetPItems: () => void;
    selectedPDrinks: PDrink[];
    resetPDrinks: () => void;
    simState: GameState;
}

export function RightSidebar({
    activeSidebarTab,
    setActiveSidebarTab,
    setActiveTab,
    status,
    resetStatus,
    selectedProfile,
    selectedGroup,
    resetCharacter,
    hand,
    resetHand,
    selectedPItems,
    resetPItems,
    selectedPDrinks,
    resetPDrinks,
    simState
}: RightSidebarProps) {
    return (
        <div className="w-80 bg-slate-900/30 border-l border-white/5 flex-shrink-0 flex flex-col overflow-hidden transition-all duration-500 ease-in-out relative">
            <div className="w-80 h-full flex flex-col p-6 overflow-y-auto">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 mb-6 sticky top-0 bg-slate-900/95 py-2 -my-2 z-10 backdrop-blur w-full border-b border-white/5">
                    <button
                        onClick={() => setActiveSidebarTab('settings')}
                        className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-colors ${activeSidebarTab === 'settings' ? 'text-white bg-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        現在の設定
                    </button>
                    <button
                        onClick={() => setActiveSidebarTab('produce')}
                        className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-colors ${activeSidebarTab === 'produce' ? 'text-white bg-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        プロデュース
                    </button>
                </div>

                {activeSidebarTab === 'settings' ? (
                    <div className="space-y-6 text-slate-100">
                        {/* Status Summary */}
                        <div
                            className="flex flex-col gap-1.5 cursor-pointer hover:bg-white/5 p-2 -m-2 mb-2 rounded-lg transition-colors group"
                            onClick={() => setActiveTab(TABS.STATUS)}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">ステータス</span>
                                <button onClick={(e) => { e.stopPropagation(); resetStatus(); }} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">Clear</button>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                                <div className="flex flex-col items-center justify-center gap-0.5 bg-slate-800/50 rounded px-1 py-1.5 border border-white/5">
                                    <span className="text-[9px] font-bold text-pink-400">Vo</span>
                                    <span className="text-sm font-mono font-bold text-white">{status.vocal}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center gap-0.5 bg-slate-800/50 rounded px-1 py-1.5 border border-white/5">
                                    <span className="text-[9px] font-bold text-blue-400">Da</span>
                                    <span className="text-sm font-mono font-bold text-white">{status.dance}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center gap-0.5 bg-slate-800/50 rounded px-1 py-1.5 border border-white/5">
                                    <span className="text-[9px] font-bold text-yellow-400">Vi</span>
                                    <span className="text-sm font-mono font-bold text-white">{status.visual}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/50 rounded px-3 py-1.5 border border-white/5">
                                <span className="text-[10px] font-bold text-green-400">HP</span>
                                <span className="text-sm font-mono font-bold text-white ml-auto">{status.hp}</span>
                                <span className="text-[9px] text-slate-500 font-mono">/ {status.maxHp}</span>
                            </div>
                        </div>

                        {/* Idol Profile */}
                        <div
                            className="cursor-pointer hover:bg-white/5 p-2 -m-2 mb-2 rounded-lg transition-colors group"
                            onClick={() => setActiveTab(TABS.CHARACTER)}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">アイドル</span>
                                <button onClick={(e) => { e.stopPropagation(); resetCharacter(); }} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">Clear</button>
                            </div>
                            <SummaryCard
                                value={selectedProfile ? selectedProfile.name : "（未設定）"}
                                sub={selectedGroup ? selectedGroup.name : "--"}
                                badge={selectedProfile?.plan}
                                highlight={!!selectedProfile}
                                imageUrl={selectedProfile?.image && selectedGroup ? `${import.meta.env.BASE_URL}images/characters/${selectedGroup.id}/${selectedProfile.image}` : undefined}
                                imagePosition="object-[50%_15%]"
                                imageLayout="right"
                            />
                        </div>

                        <div className="cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group" onClick={() => setActiveTab(TABS.HAND)}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">手札</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); resetHand(); }} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">Clear</button>
                                    <span className="text-xs text-slate-400">{hand.length}/25</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1 mb-2">
                                {hand.map((card, i) => (
                                    <div key={`${card.id}-${i}`} className="aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative group">
                                        {card.image && card.image !== 'default.png' && (
                                            <img src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map(s => encodeURIComponent(s)).join('/')}`} className="w-full h-full object-contain" alt="" />
                                        )}
                                        {(!card.image || card.image === 'default.png') && (
                                            <div className="absolute inset-0 flex items-center justify-center text-[6px] text-center bg-black/50 text-white truncate px-0.5">
                                                {card.name[0]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {[...Array(Math.max(0, 25 - hand.length))].map((_, i) => (
                                    <div key={`empty-hand-${i}`} className="aspect-square bg-slate-800/50 rounded border border-white/5 border-dashed"></div>
                                ))}
                            </div>
                        </div>

                        <div className="cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group" onClick={() => setActiveTab(TABS.P_ITEM)}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">Pアイテム</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); resetPItems(); }} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">Clear</button>
                                    <span className="text-xs text-slate-400">{selectedPItems.length}個</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1 mb-2">
                                {selectedPItems.map((item, i) => (
                                    <div key={`${item.id}-${i}`} className="aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative group">
                                        {item.image && item.image !== 'default.png' ? (
                                            <img src={`${import.meta.env.BASE_URL}images/items/${item.image}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500 font-bold">{item.name[0]}</div>
                                        )}
                                    </div>
                                ))}
                                {[...Array(Math.max(0, 5 - selectedPItems.length))].map((_, i) => (
                                    <div key={`empty-pitem-${i}`} className="aspect-square bg-slate-800/50 rounded border border-white/5 border-dashed"></div>
                                ))}
                            </div>
                        </div>

                        <div className="cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group" onClick={() => setActiveTab(TABS.P_DRINK)}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">Pドリンク</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); resetPDrinks(); }} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">Clear</button>
                                    <span className="text-xs text-slate-400">{selectedPDrinks.length}/3</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mb-2">
                                {[...Array(3)].map((_, i) => {
                                    const drink = selectedPDrinks[i];
                                    return (
                                        <div key={`pdrink-slot-${i}`} className="w-12 h-12 bg-slate-800 rounded border border-white/10 overflow-hidden relative" title={drink?.name}>
                                            {drink ? (
                                                <img src={`${import.meta.env.BASE_URL}images/drinks/${drink.image}`} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs">+</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 min-w-0 -mx-2">
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6">
                            {/* Sidebar Hand */}
                            <section>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HAND</span>
                                    <span className="text-[10px] font-mono text-slate-500">{simState.hand.length}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {simState.hand.map((card: Card, i: number) => (
                                        <div key={`side-hand-${i}`} className="aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative group" title={card.name}>
                                            {card.image && card.image !== 'default.png' ? (
                                                <img src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map((s: string) => encodeURIComponent(s)).join('/')}`} className="w-full h-full object-contain" alt="" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-center bg-black/50 text-white truncate px-0.5">{card.name[0]}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Sidebar Hold */}
                            <section>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HOLD</span>
                                    <span className="text-[10px] font-mono text-slate-500">{simState.onHold ? simState.onHold.length : 0}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {simState.onHold && simState.onHold.map((card: Card, i: number) => (
                                        <div key={`side-hold-${i}`} className="aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative group" title={card.name}>
                                            {card.image && card.image !== 'default.png' ? (
                                                <img src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map((s: string) => encodeURIComponent(s)).join('/')}`} className="w-full h-full object-contain" alt="" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-center bg-black/50 text-white truncate px-0.5">{card.name[0]}</div>
                                            )}
                                        </div>
                                    ))}
                                    {(!simState.onHold || simState.onHold.length === 0) && <p className="col-span-4 text-[10px] text-slate-600 text-center py-2 italic">Empty</p>}
                                </div>
                            </section>

                            {/* Sidebar Deck */}
                            <section>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DECK (REMAINING)</span>
                                    <span className="text-[10px] font-mono text-slate-500">{simState.deck.length}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {simState.deck.map((card: Card, i: number) => (
                                        <div key={`side-deck-${i}`} className="aspect-square bg-slate-900 rounded border border-white/5 overflow-hidden relative" title={card.name}>
                                            {card.image && card.image !== 'default.png' ? (
                                                <img src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map((s: string) => encodeURIComponent(s)).join('/')}`} className="w-full h-full object-contain" alt="" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-center text-slate-600 truncate px-0.5">{card.name[0]}</div>
                                            )}
                                        </div>
                                    ))}
                                    {simState.deck.length === 0 && <p className="col-span-4 text-[10px] text-slate-600 text-center py-4 italic">No cards remaining</p>}
                                </div>
                            </section>

                            {/* Sidebar Discard */}
                            <section>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DISCARD PILE</span>
                                    <span className="text-[10px] font-mono text-slate-500">{simState.discard.length}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {simState.discard.map((card: Card, i: number) => (
                                        <div key={`side-discard-${i}`} className="aspect-square bg-slate-900 rounded border border-white/5 overflow-hidden relative" title={card.name}>
                                            {card.image && card.image !== 'default.png' ? (
                                                <img src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map((s: string) => encodeURIComponent(s)).join('/')}`} className="w-full h-full object-contain" alt="" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-center text-slate-700 truncate px-0.5">{card.name[0]}</div>
                                            )}
                                        </div>
                                    ))}
                                    {simState.discard.length === 0 && <p className="col-span-4 text-[10px] text-slate-600 text-center py-4 italic">Empty</p>}
                                </div>
                            </section>

                            {/* Sidebar Excluded */}
                            <section>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">EXCLUDED</span>
                                    <span className="text-[10px] font-mono text-slate-500">{simState.excluded ? simState.excluded.length : 0}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {simState.excluded && simState.excluded.map((card: Card, i: number) => (
                                        <div key={`side-excluded-${i}`} className="aspect-square bg-slate-900/50 rounded border border-white/5 overflow-hidden relative group" title={card.name}>
                                            {card.image && card.image !== 'default.png' ? (
                                                <img src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map((s: string) => encodeURIComponent(s)).join('/')}`} className="w-full h-full object-contain" alt="" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-center text-slate-700 truncate px-0.5">{card.name[0]}</div>
                                            )}
                                        </div>
                                    ))}
                                    {(!simState.excluded || simState.excluded.length === 0) && <p className="col-span-4 text-[10px] text-slate-600 text-center py-2 italic">Empty</p>}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
