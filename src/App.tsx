import { useState, useEffect } from 'react'
import type { CharacterGroup, Card, PItem, PDrink, SavedConfig } from './types/index'
import { CharacterView } from './components/CharacterView'
import { HandView } from './components/HandView'
import { PItemView } from './components/PItemView'
import { PDrinkView } from './components/PDrinkView'
import { NavButton, SummaryCard } from './components/UI'

const TABS = {
    PRODUCE: 'produce',
    CHARACTER: 'character',
    HAND: 'hand',
    P_ITEM: 'p_item',
    P_DRINK: 'p_drink',
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
    // Hand State
    const [hand, setHand] = useState<Card[]>([]);
    // View Mode State (Global)
    const [viewMode, setViewMode] = useState<'detail' | 'compact'>('detail');

    // Reset Logic
    const handleResetAll = () => {
        console.log("Immediate Reset All clicked");
        const firstChar = characterGroups.length > 0 ? characterGroups[0].name : null;
        setSelectedCharName(firstChar);
        setSelectedProfileId(null);
        setHand([]);
        setSelectedPItems([]);
        setSelectedPDrinks([]);
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
                selectedPDrinks
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
                selectedPDrinks
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
                    <NavButton label="キャラ" active={activeTab === TABS.CHARACTER} onClick={() => setActiveTab(TABS.CHARACTER)} />
                    <NavButton label="手札" active={activeTab === TABS.HAND} onClick={() => setActiveTab(TABS.HAND)} />
                    <NavButton label="Pアイテム" active={activeTab === TABS.P_ITEM} onClick={() => setActiveTab(TABS.P_ITEM)} />
                    <NavButton label="Pドリンク" active={activeTab === TABS.P_DRINK} onClick={() => setActiveTab(TABS.P_DRINK)} />
                </div>
                <div className="flex-1 flex flex-col space-y-4 pt-4 border-t border-white/5 overflow-hidden">
                    <div className="px-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">保存済み構成</p>
                        <button
                            onClick={handleAddNewPreset}
                            className="w-full py-2.5 px-3 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            <span className="text-[11px] font-bold">現在の構成を保存</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 px-3 custom-scrollbar pb-4">
                        <div className="space-y-1">
                            {savedConfigs.map((cfg) => (
                                <PresetCard
                                    key={cfg.id}
                                    cfg={cfg}
                                    characterGroups={characterGroups}
                                    onLoad={handleLoadPreset}
                                    onSaveOver={handleSaveToExisting}
                                    onDelete={handleDeletePreset}
                                    onUpdateName={handleUpdatePresetName}
                                />
                            ))}
                        </div>
                        {savedConfigs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 opacity-20">
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                <p className="text-[10px]">保存された構成はありません</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative bg-slate-950 flex flex-col">
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-6xl mx-auto h-full">
                        {activeTab === TABS.PRODUCE && <ProduceView />}
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
                    </div>
                </div>
            </div>
            {/* Right Sidebar */}
            <div className="w-80 bg-slate-900/30 border-l border-white/5 p-6 flex-shrink-0 flex flex-col overflow-y-auto animate-in slide-in-from-right-10 duration-300">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">現在の設定 (構成)</h3>
                <div className="space-y-6">
                    <SummaryCard
                        title="アイドル" onClick={() => setActiveTab(TABS.CHARACTER)}
                        value={selectedProfile ? selectedProfile.name : "（未設定）"}
                        sub={selectedGroup ? selectedGroup.name : "--"}
                        badge={selectedProfile?.plan}
                        highlight={!!selectedProfile}
                        imageUrl={selectedProfile?.image && selectedGroup ? `/images/characters/${selectedGroup.id}/${selectedProfile.image}` : undefined}
                    />
                    <div className="flex justify-end -mt-5 pr-2 relative z-20">
                        <button onClick={resetCharacter} className="text-[9px] text-zinc-600 hover:text-red-400 transition-colors px-1 uppercase tracking-tighter cursor-pointer">Clear Selection</button>
                    </div>
                    <div
                        className="cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group"
                        onClick={() => setActiveTab(TABS.HAND)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">手札</span>
                            <div className="flex items-center gap-2 underline-offset-4">
                                <button onClick={resetHand} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1 cursor-default">Clear</button>
                                <span className="text-xs text-slate-400">{hand.length}枚</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-1 mb-2">
                            {hand.map((card, i) => (
                                <div key={`${card.id}-${i}`} className="aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative group">
                                    {card.image && card.image !== 'default.png' && (
                                        <>
                                            <img src={`/images/cards/${card.image}`} className="w-full h-full object-contain opacity-100 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500 font-bold">
                                                {card.name[0]}
                                            </div>
                                        </>
                                    )}
                                    {(!card.image || card.image === 'default.png') && (
                                        <div className="absolute bottom-0 w-full text-[6px] text-center bg-black/50 text-white truncate px-0.5">
                                            {card.name}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {[...Array(Math.max(0, 25 - hand.length))].map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square bg-slate-800/50 rounded border border-white/5 border-dashed"></div>
                            ))}
                        </div>
                    </div>
                    <div
                        className="cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group"
                        onClick={() => setActiveTab(TABS.P_ITEM)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">Pアイテム</span>
                            <div className="flex items-center gap-2 underline-offset-4">
                                <button onClick={resetPItems} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1 cursor-default">Clear</button>
                                <span className="text-xs text-slate-400">{selectedPItems.length}個</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-1 mb-2">
                            {selectedPItems.map((item, i) => (
                                <div key={`${item.id}-${i}`} className="aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative group" title={item.name}>
                                    {item.image && item.image !== 'default.png' ? (
                                        <div className="relative w-full h-full">
                                            <img src={`/images/items/${item.image}`} className="w-full h-full object-cover" />
                                            <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-sm ${item.plan === 'logic' ? 'bg-blue-500' :
                                                item.plan === 'sense' ? 'bg-orange-500' :
                                                    item.plan === 'anomaly' ? 'bg-purple-500' :
                                                        'bg-slate-500'
                                                }`} />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500 font-bold">
                                            {item.name[0]}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {[...Array(Math.max(0, 5 - selectedPItems.length))].map((_, i) => (
                                <div key={`empty-pitem-${i}`} className="aspect-square bg-slate-800/50 rounded border border-white/5 border-dashed"></div>
                            ))}
                        </div>
                    </div>
                    <div
                        className="cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group"
                        onClick={() => setActiveTab(TABS.P_DRINK)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300 transition-colors">Pドリンク</span>
                            <div className="flex items-center gap-2 underline-offset-4">
                                <button onClick={resetPDrinks} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1 cursor-default">Clear</button>
                                <span className="text-xs text-slate-400">{selectedPDrinks.length}/3</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-2">
                            {[...Array(3)].map((_, i) => {
                                const drink = selectedPDrinks[i];
                                return (
                                    <div key={`pdrink-slot-${i}`} className="w-12 h-12 bg-slate-800 rounded border border-white/10 overflow-hidden relative group" title={drink?.name}>
                                        {drink ? (
                                            drink.image && drink.image !== 'default.png' ? (
                                                <div className="relative w-full h-full">
                                                    <img src={`/images/drinks/${drink.image}`} className="w-full h-full object-cover" />
                                                    <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-sm ${drink.plan === 'logic' ? 'bg-blue-500' :
                                                        drink.plan === 'sense' ? 'bg-orange-500' :
                                                            drink.plan === 'anomaly' ? 'bg-purple-500' :
                                                                'bg-slate-500'
                                                        }`} />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500 font-bold">
                                                    {drink.name[0]}
                                                </div>
                                            )
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                <span className="text-xs">+</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {/* Danger Zone */}
                <div className="pt-12 mt-auto">
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
    );
}

// --- Views ---
function ProduceView() {
    return (
        <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-4">プロデュース開始</h2>
        </div>
    );
}

// PresetCard Component
interface PresetCardProps {
    cfg: SavedConfig;
    characterGroups?: CharacterGroup[];
    onLoad: (id: string) => void;
    onSaveOver: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdateName: (id: string, name: string) => void;
}
function PresetCard({ cfg, characterGroups = [], onLoad, onSaveOver, onDelete, onUpdateName }: PresetCardProps) {
    const [confirmMode, setConfirmMode] = useState<'overwrite' | 'delete' | null>(null);
    const charGroup = characterGroups.find(g => g.name === cfg.data?.selectedCharName);
    const charIcon = charGroup?.profiles.find(p => p.id === cfg.data?.selectedProfileId)?.image || charGroup?.profiles[0]?.image;
    return (
        <div className="bg-slate-800/40 rounded-xl border border-white/5 p-2 hover:border-white/10 transition-all group">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 overflow-hidden flex-shrink-0">
                    {charIcon ? (
                        <img src={`/images/characters/${charGroup?.id}/${charIcon}`} className="w-full h-full object-cover object-[50%_15%]" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 font-bold">?</div>
                    )}
                </div>
                <input
                    type="text"
                    value={cfg.name}
                    onChange={(e) => onUpdateName(cfg.id, e.target.value)}
                    className="flex-1 bg-transparent text-[11px] font-bold text-slate-200 outline-none focus:text-blue-400 transition-colors min-w-0"
                    placeholder="名称未設定"
                    disabled={confirmMode !== null}
                />
            </div>

            {confirmMode === null ? (
                // Normal Mode
                <div className="grid grid-cols-3 gap-1">
                    <button
                        onClick={() => onLoad(cfg.id)}
                        className="py-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 text-[10px] font-bold transition-colors border border-green-500/10"
                    >
                        読込
                    </button>
                    <button
                        onClick={() => setConfirmMode('overwrite')}
                        className="py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-bold transition-colors border border-blue-500/10"
                    >
                        上書き...
                    </button>
                    <button
                        onClick={() => setConfirmMode('delete')}
                        className="py-1.5 rounded bg-red-500/5 text-red-400/60 hover:bg-red-500/20 text-[9px] font-bold transition-colors border border-red-500/5"
                    >
                        削除...
                    </button>
                </div>
            ) : (
                // Confirmation Mode
                <div className="grid grid-cols-2 gap-1 animate-in fade-in duration-200">
                    <button
                        onClick={() => setConfirmMode(null)}
                        className="py-1.5 rounded bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 text-[9px] font-bold transition-colors border border-white/5"
                    >
                        キャンセル
                    </button>
                    {confirmMode === 'overwrite' ? (
                        <button
                            onClick={() => { onSaveOver(cfg.id); setConfirmMode(null); }}
                            className="py-1.5 rounded bg-blue-500 text-white hover:bg-blue-400 text-[9px] font-bold transition-colors shadow-lg shadow-blue-500/20"
                        >
                            上書き実行
                        </button>
                    ) : (
                        <button
                            onClick={() => { onDelete(cfg.id); setConfirmMode(null); }}
                            className="py-1.5 rounded bg-red-500 text-white hover:bg-red-400 text-[9px] font-bold transition-colors shadow-lg shadow-red-500/20"
                        >
                            削除実行
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default App
