import { useState } from 'react'
import type { Card, PItem, PDrink, SavedConfig, LessonAttribute } from '../types'
import { CharacterView } from './CharacterView'
import { HandView } from './HandView'
import { PItemView } from './PItemView'
import { PDrinkView } from './PDrinkView'
import { StatusView } from './StatusView'
import { PresetListView } from './PresetListView'
import { NavButton } from './UI'
import { ProduceView } from './ProduceView'
import { CardCatalog } from './CardCatalog'
import { useSimulation } from '../hooks/useSimulation'
import { RightSidebar } from './RightSidebar'
import { TABS } from '../constants/ui'
import type { Tab } from '../constants/ui'
import { useCharacterData } from '../hooks/useCharacterData'
import { INITIAL_PRESET } from '../data/initialData'
import { Layout } from './Layout'

export function GameManager() {
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

    // Simulation State (LIFTED)
    const { state: simState, endTurn, resetSimulation, playCard, usePDrink } = useSimulation(status, turnAttributes, hand, selectedPDrinks);

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
    const resetHand = (e?: React.MouseEvent) => { e?.stopPropagation(); setHand([]); };
    const resetPItems = (e?: React.MouseEvent) => { e?.stopPropagation(); setSelectedPItems([]); };
    const resetPDrinks = (e?: React.MouseEvent) => { e?.stopPropagation(); setSelectedPDrinks([]); };
    const resetCharacter = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedCharName(characterGroups[0]?.name || null);
        setSelectedProfileId(null);
    };
    const resetStatus = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setStatus({ vocal: 0, dance: 0, visual: 0, hp: 30, maxHp: 60 });
    };

    const [activeSidebarTab, setActiveSidebarTab] = useState<'settings' | 'produce'>('settings');

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
        return [INITIAL_PRESET];
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

    const sidebar = (
        <RightSidebar
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
            setActiveTab={setActiveTab}
            status={status}
            resetStatus={resetStatus}
            selectedProfile={selectedProfile || null}
            selectedGroup={selectedGroup}
            resetCharacter={resetCharacter}
            hand={hand}
            resetHand={resetHand}
            selectedPItems={selectedPItems}
            resetPItems={resetPItems}
            selectedPDrinks={selectedPDrinks}
            resetPDrinks={resetPDrinks}
            simState={simState}
        />
    );

    return (
        <Layout sidebar={sidebar}>


            <div className="flex h-full relative">
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
                        <NavButton label="カード一覧" active={activeTab === TABS.CARD_LIST} onClick={() => setActiveTab(TABS.CARD_LIST)} />
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

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden relative flex flex-col transition-all duration-500">
                    <div className={`flex-1 p-8 ${activeTab === TABS.PRODUCE ? 'overflow-hidden' : 'overflow-auto'}`}>
                        <div className="max-w-6xl mx-auto h-full">
                            {activeTab === TABS.PRODUCE && (
                                <ProduceView
                                    state={simState}
                                    endTurn={endTurn}
                                    resetSimulation={resetSimulation}
                                    playCard={playCard}
                                    usePDrink={usePDrink}
                                    turnAttributes={turnAttributes}
                                    plan={selectedProfile?.plan}
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
                            {activeTab === TABS.CARD_LIST && (
                                <CardCatalog renderMode="embedded" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
