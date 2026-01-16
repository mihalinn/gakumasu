import { useState, useEffect } from 'react'
import type { CharacterGroup, Card, PItem, PDrink, SavedConfig, LessonAttribute } from './types/index'
import { CharacterView } from './components/CharacterView'
import { HandView } from './components/HandView'
import { PItemView } from './components/PItemView'
import { PDrinkView } from './components/PDrinkView'
import { StatusView } from './components/StatusView'
import { PresetListView } from './components/PresetListView'
import { NavButton, SummaryCard } from './components/UI'
import { ProduceView } from './components/ProduceView'

const TABS = {
    PRODUCE: 'produce',
    CHARACTER: 'character',
    HAND: 'hand',
    P_ITEM: 'p_item',
    P_DRINK: 'p_drink',
    STATUS: 'status',
    PRESETS: 'presets',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

const CHARACTER_ORDER = [
    "花海 咲季",
    "月村 手毬",
    "藤田 ことね",
    "姫崎 莉波",
    "紫雲 清夏",
    "篠澤 広",
    "葛城 リーリヤ",
    "倉本 千奈",
    "有村 麻央",
    "花海 佑芽",
    "秦谷 美鈴",
    "十王 星南",
    "雨夜 燕"
];

function useCharacterData() {
    const [characters, setCharacters] = useState<CharacterGroup[]>([]);
    useEffect(() => {
        const loadCharacters = () => {
            const modules = import.meta.glob('./data/characters/*.json', { eager: true });
            const groups: CharacterGroup[] = [];
            for (const path in modules) {
                try {
                    const mod = modules[path] as Record<string, unknown>;
                    const rawData = mod.default || mod;
                    const profiles = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
                    if (profiles && profiles.length > 0) {
                        const id = path.split('/').pop()?.replace('.json', '') || '';
                        groups.push({ id, name: profiles[0].characterName, profiles: profiles });
                    }
                } catch (e) {
                    console.error(`Failed to load ${path}`, e);
                }
            }
            groups.sort((a, b) => {
                const indexA = CHARACTER_ORDER.indexOf(a.name);
                const indexB = CHARACTER_ORDER.indexOf(b.name);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
            setCharacters(groups);
        };
        loadCharacters();
    }, []);
    return characters;
}

function App() {
    const [activeTab, setActiveTab] = useState<Tab>(TABS.CHARACTER);
    const characterGroups = useCharacterData();
    // Selection State
    const [selectedCharName, setSelectedCharName] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    // P-Item & P-Drink State
    const [selectedPItems, setSelectedPItems] = useState<PItem[]>([]);
    const [selectedPDrinks, setSelectedPDrinks] = useState<PDrink[]>([]);
    // Status State
    const [status, setStatus] = useState({ vocal: 0, dance: 0, visual: 0, hp: 30, maxHp: 60 });
    const [producePlan, setProducePlan] = useState<'初' | '初LEGEND' | 'NIA'>('初');
    const [turnAttributes, setTurnAttributes] = useState<LessonAttribute[]>(Array(12).fill('vocal'));
    // Hand State
    const [hand, setHand] = useState<Card[]>([]);
    // View Mode State (Global)
    const [viewMode, setViewMode] = useState<'detail' | 'compact'>('detail');
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

    // Reset Logic
    const handleResetAll = () => {
        console.log("Immediate Reset All clicked");
        const firstChar = characterGroups.length > 0 ? characterGroups[0].name : null;
        setSelectedCharName(firstChar);
        setSelectedProfileId(null);
        setHand([]);
        setSelectedPItems([]);
        setSelectedPDrinks([]);
        setStatus({ vocal: 0, dance: 0, visual: 0, hp: 30, maxHp: 60 });
        setProducePlan('初');
        setTurnAttributes(Array(12).fill('vocal'));
        setActiveTab(TABS.CHARACTER);
        setViewMode('detail');
    };
    const resetHand = (e: React.MouseEvent) => { e.stopPropagation(); setHand([]); };
    const resetPItems = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedPItems([]); };
    const resetPDrinks = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedPDrinks([]); };
    const resetCharacter = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCharName(characterGroups[0]?.name || null);
        setSelectedProfileId(null);
    };

    const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>(() => {
        const saved = localStorage.getItem("gakumas_sim_presets_v2");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error("Failed to load presets", e);
                return [];
            }
        }
        return [];
    });

    const persistPresets = (presets: SavedConfig[]) => {
        localStorage.setItem("gakumas_sim_presets_v2", JSON.stringify(presets));
    };

    const handleAddNewPreset = () => {
        const newPreset: SavedConfig = {
            id: crypto.randomUUID(),
            name: `新規構成 ${savedConfigs.length + 1}`,
            data: {
                selectedCharName,
                selectedProfileId,
                hand,
                selectedPItems,
                selectedPDrinks,
                status,
                producePlan,
                turnAttributes
            }
        };
        const newConfigs = [newPreset, ...savedConfigs];
        setSavedConfigs(newConfigs);
        persistPresets(newConfigs);
    };
    const handleSaveToExisting = (id: string) => {
        const newConfigs = savedConfigs.map(cfg => cfg.id === id ? {
            ...cfg,
            data: {
                selectedCharName,
                selectedProfileId,
                hand,
                selectedPItems,
                selectedPDrinks,
                status,
                producePlan,
                turnAttributes
            }
        } : cfg);
        setSavedConfigs(newConfigs);
        persistPresets(newConfigs);
    };
    const handleLoadPreset = (id: string) => {
        const preset = savedConfigs.find(cfg => cfg.id === id);
        if (!preset) return;
        const { data } = preset;
        setSelectedCharName(data.selectedCharName);
        setSelectedProfileId(data.selectedProfileId);
        setHand(data.hand || []);
        setSelectedPItems(data.selectedPItems || []);
        setSelectedPDrinks(data.selectedPDrinks || []);
        setStatus(data.status || { vocal: 0, dance: 0, visual: 0, hp: 30, maxHp: 60 });
        setProducePlan(data.producePlan || '初');
        setTurnAttributes(data.turnAttributes || Array(12).fill('vocal'));
        setActiveTab(TABS.CHARACTER);
    };
    const handleDeletePreset = (id: string) => {
        const newConfigs = savedConfigs.filter(cfg => cfg.id !== id);
        setSavedConfigs(newConfigs);
        persistPresets(newConfigs);
    };
    const handleUpdatePresetName = (id: string, name: string) => {
        const newConfigs = savedConfigs.map(cfg => cfg.id === id ? { ...cfg, name } : cfg);
        setSavedConfigs(newConfigs);
        persistPresets(newConfigs);
    };

    // Auto-select first character when data loads
    if (!selectedCharName && characterGroups.length > 0) {
        setSelectedCharName(characterGroups[0].name);
    }
    // Derived state
    const selectedGroup = characterGroups.find(g => g.name === selectedCharName);
    const selectedProfile = selectedGroup?.profiles.find(p => p.id === selectedProfileId);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Left Sidebar */}
            <div className="w-48 bg-slate-900/50 backdrop-blur-xl flex flex-col py-6 border-r border-white/5 px-3 space-y-8 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-center tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        GAKUMAS
                        <span className="block text-[10px] font-medium text-slate-500 tracking-widest mt-1">SIMULATOR</span>
                    </h1>
                </div>
                <div>
                    <NavButton
                        label="プロデュース"
                        icon=""
                        active={activeTab === TABS.PRODUCE}
                        onClick={() => setActiveTab(TABS.PRODUCE)}
                        primary
                    />
                </div>
                <div className="flex flex-col space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3 mt-2">設定</p>
                    <NavButton label="ステータス" active={activeTab === TABS.STATUS} onClick={() => setActiveTab(TABS.STATUS)} />
                    <NavButton label="キャラ" active={activeTab === TABS.CHARACTER} onClick={() => setActiveTab(TABS.CHARACTER)} />
                    <NavButton label="手札" active={activeTab === TABS.HAND} onClick={() => setActiveTab(TABS.HAND)} />
                    <NavButton label="Pアイテム" active={activeTab === TABS.P_ITEM} onClick={() => setActiveTab(TABS.P_ITEM)} />
                    <NavButton label="Pドリンク" active={activeTab === TABS.P_DRINK} onClick={() => setActiveTab(TABS.P_DRINK)} />
                </div>
                <div className="flex flex-col space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3 mt-2">保存データ</p>
                    <NavButton label="保存データ一覧" active={activeTab === TABS.PRESETS} onClick={() => setActiveTab(TABS.PRESETS)} />
                    <button
                        onClick={handleAddNewPreset}
                        className="mx-3 mt-1 py-2 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition-all flex items-center justify-center gap-2 group"
                    >
                        <svg className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        <span className="text-[10px] font-bold">現在の構成を保存</span>
                    </button>
                </div>
                <div className="flex-1 flex flex-col space-y-4 pt-4 border-t border-white/5 overflow-hidden">
                    <div className="mt-auto pt-4">
                        <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 opacity-40 hover:opacity-100 transition-opacity">
                            <p className="text-[9px] font-bold text-red-500/50 uppercase tracking-widest mb-3 text-center">Danger Zone</p>
                            <button
                                onClick={handleResetAll}
                                className="w-full py-2 rounded-lg border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 hover:border-red-500/40 transition-all active:scale-[0.98] cursor-pointer relative z-50"
                            >
                                全ての選択をリセット
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative bg-slate-950 flex flex-col transition-all duration-500">
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-6xl mx-auto h-full">
                        {activeTab === TABS.PRODUCE && (
                            <ProduceView
                                initialHand={hand}
                                initialPItems={selectedPItems}
                                initialPDrinks={selectedPDrinks}
                                status={status}
                                turnAttributes={turnAttributes}
                            />
                        )}
                        {activeTab === TABS.CHARACTER && (
                            <CharacterView
                                characterGroups={characterGroups}
                                selectedCharName={selectedCharName}
                                setSelectedCharName={setSelectedCharName}
                                selectedProfileId={selectedProfileId}
                                setSelectedProfileId={setSelectedProfileId}
                            />
                        )}
                        {activeTab === TABS.HAND && (
                            <HandView
                                hand={hand}
                                setHand={setHand}
                                selectedProfile={selectedProfile}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                            />
                        )}
                        {activeTab === TABS.P_ITEM && (
                            <PItemView
                                selectedPItems={selectedPItems}
                                setSelectedPItems={setSelectedPItems}
                                selectedProfile={selectedProfile}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                            />
                        )}
                        {activeTab === TABS.P_DRINK && (
                            <PDrinkView
                                selectedPDrinks={selectedPDrinks}
                                setSelectedPDrinks={setSelectedPDrinks}
                                selectedProfile={selectedProfile}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                            />
                        )}
                        {activeTab === TABS.STATUS && (
                            <StatusView
                                status={status}
                                setStatus={setStatus}
                                producePlan={producePlan}
                                setProducePlan={setProducePlan}
                                turnAttributes={turnAttributes}
                                setTurnAttributes={setTurnAttributes}
                            />
                        )}
                        {activeTab === TABS.PRESETS && (
                            <PresetListView
                                savedConfigs={savedConfigs}
                                characterGroups={characterGroups}
                                onLoad={handleLoadPreset}
                                onSaveOver={handleSaveToExisting}
                                onDelete={handleDeletePreset}
                                onUpdateName={handleUpdatePresetName}
                                onCreateNew={handleAddNewPreset}
                            />
                        )}
                    </div>
                </div>
                {/* Show Right Sidebar Button */}
                {!isRightSidebarOpen && (
                    <div className="absolute right-0 top-6 z-50 animate-in fade-in slide-in-from-right-2 duration-300">
                        <button
                            onClick={() => setIsRightSidebarOpen(true)}
                            className="bg-slate-800 border-l border-t border-b border-white/10 rounded-l-lg p-3 text-slate-400 hover:text-white shadow-xl hover:bg-slate-700 transition-all"
                            title="設定を表示"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            <div className={`${isRightSidebarOpen ? 'w-80' : 'w-0'} bg-slate-900/30 border-l border-white/5 flex-shrink-0 flex flex-col overflow-hidden transition-all duration-500 ease-in-out relative`}>
                <div className="w-80 h-full flex flex-col p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900/95 py-2 -my-2 z-10 backdrop-blur w-full">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">現在の設定</h3>
                        <button onClick={() => setIsRightSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div className="space-y-6">
                        {/* Status Summary */}
                        <div className="flex flex-col gap-1.5">
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

                        <SummaryCard
                            title="アイドル" onClick={() => setActiveTab(TABS.CHARACTER)}
                            value={selectedProfile ? selectedProfile.name : "（未設定）"}
                            sub={selectedGroup ? selectedGroup.name : "--"}
                            badge={selectedProfile?.plan}
                            highlight={!!selectedProfile}
                            imageUrl={selectedProfile?.image && selectedGroup ? `${import.meta.env.BASE_URL}images/characters/${selectedGroup.id}/${selectedProfile.image}` : undefined}
                        />
                        <div className="flex justify-end -mt-5 pr-2 relative z-20">
                            <button onClick={resetCharacter} className="text-[9px] text-zinc-600 hover:text-red-400 transition-colors px-1 uppercase tracking-tighter cursor-pointer">Clear Selection</button>
                        </div>

                        <div className="cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group" onClick={() => setActiveTab(TABS.HAND)}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">手札</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={resetHand} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">Clear</button>
                                    <span className="text-xs text-slate-400">{hand.length}/25</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1 mb-2">
                                {hand.map((card, i) => (
                                    <div key={`${card.id}-${i}`} className="aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative group">
                                        {card.image && card.image !== 'default.png' && (
                                            <img src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map(s => encodeURIComponent(s)).join('/')}`} className="w-full h-full object-contain" />
                                        )}
                                        {(!card.image || card.image === 'default.png') && (
                                            <div className="absolute inset-0 flex items-center justify-center text-[6px] text-center bg-black/50 text-white truncate px-0.5">
                                                {card.name[0]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {[...Array(Math.max(0, 25 - hand.length))].map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square bg-slate-800/50 rounded border border-white/5 border-dashed"></div>
                                ))}
                            </div>
                        </div>

                        <div className="cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group" onClick={() => setActiveTab(TABS.P_ITEM)}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">Pアイテム</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={resetPItems} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">Clear</button>
                                    <span className="text-xs text-slate-400">{selectedPItems.length}個</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1 mb-2">
                                {selectedPItems.map((item, i) => (
                                    <div key={`${item.id}-${i}`} className="aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative group">
                                        {item.image && item.image !== 'default.png' ? (
                                            <img src={`${import.meta.env.BASE_URL}images/items/${item.image}`} className="w-full h-full object-cover" />
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
                                    <button onClick={resetPDrinks} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">Clear</button>
                                    <span className="text-xs text-slate-400">{selectedPDrinks.length}/3</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mb-2">
                                {[...Array(3)].map((_, i) => {
                                    const drink = selectedPDrinks[i];
                                    return (
                                        <div key={`pdrink-slot-${i}`} className="w-12 h-12 bg-slate-800 rounded border border-white/10 overflow-hidden relative" title={drink?.name}>
                                            {drink ? (
                                                <img src={`${import.meta.env.BASE_URL}images/drinks/${drink.image}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs">+</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App
