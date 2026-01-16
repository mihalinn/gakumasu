import type { SavedConfig, CharacterGroup } from '../types/index';
import { useState } from 'react';

interface PresetListViewProps {
    savedConfigs: SavedConfig[];
    characterGroups: CharacterGroup[];
    onLoad: (id: string) => void;
    onSaveOver: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdateName: (id: string, name: string) => void;
    onCreateNew: () => void;
}

export function PresetListView({
    savedConfigs,
    characterGroups,
    onLoad,
    onSaveOver,
    onDelete,
    onUpdateName,
    onCreateNew
}: PresetListViewProps) {
    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">保存済み構成</h2>
                    <p className="text-slate-400 text-sm mt-1">保存されたデッキやステータス設定を管理・読み込みします</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/50 hover:scale-105 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <span>現在の状態を新規保存</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {savedConfigs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {savedConfigs.map((cfg) => (
                            <PresetGridItem
                                key={cfg.id}
                                cfg={cfg}
                                characterGroups={characterGroups}
                                onLoad={onLoad}
                                onSaveOver={onSaveOver}
                                onDelete={onDelete}
                                onUpdateName={onUpdateName}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                        <svg className="w-24 h-24 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        <p className="text-xl font-medium">作成されたデータはありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface PresetGridItemProps {
    cfg: SavedConfig;
    characterGroups: CharacterGroup[];
    onLoad: (id: string) => void;
    onSaveOver: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdateName: (id: string, name: string) => void;
}

function PresetGridItem({ cfg, characterGroups, onLoad, onSaveOver, onDelete, onUpdateName }: PresetGridItemProps) {
    const [confirmMode, setConfirmMode] = useState<'overwrite' | 'delete' | null>(null);

    // Derived Data
    const charGroup = characterGroups.find(g => g.name === cfg.data?.selectedCharName);
    const profile = charGroup?.profiles.find(p => p.id === cfg.data?.selectedProfileId);
    const charIcon = profile?.image || charGroup?.profiles[0]?.image;
    const handCount = cfg.data.hand?.length || 0;
    const itemCount = cfg.data.selectedPItems?.length || 0;
    const status = cfg.data.status || { vocal: 0, dance: 0, visual: 0, hp: 0 };

    return (
        <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-4 flex flex-col gap-4 group hover:border-blue-500/30 hover:bg-slate-800/60 transition-all shadow-xl">
            {/* Header: Icon & Name */}
            <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/10 overflow-hidden flex-shrink-0 shadow-inner">
                    {charIcon ? (
                        <img src={`${import.meta.env.BASE_URL}images/characters/${charGroup?.id}/${charIcon}`} className="w-full h-full object-cover object-[50%_15%]" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 font-bold">?</div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        value={cfg.name}
                        onChange={(e) => onUpdateName(cfg.id, e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-slate-200 outline-none focus:text-blue-400 focus:border-b focus:border-blue-500 transition-all placeholder:text-slate-600"
                        placeholder="名称未設定"
                        disabled={confirmMode !== null}
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        <Badge label={profile?.plan || 'N/A'} color={profile?.plan === 'logic' ? 'blue' : profile?.plan === 'sense' ? 'orange' : 'purple'} />
                        <Badge label={`手札 ${handCount}`} color="slate" />
                        <Badge label={`Item ${itemCount}`} color="slate" />
                    </div>
                </div>
            </div>

            {/* Status Preview */}
            <div className="grid grid-cols-4 gap-1 p-2 bg-black/20 rounded-lg">
                <StatusValue label="Vo" value={status.vocal} color="text-pink-400" />
                <StatusValue label="Da" value={status.dance} color="text-blue-400" />
                <StatusValue label="Vi" value={status.visual} color="text-yellow-400" />
                <StatusValue label="HP" value={status.hp} color="text-green-400" />
            </div>

            {/* Actions */}
            <div className="mt-auto pt-2 border-t border-white/5">
                {confirmMode === null ? (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onLoad(cfg.id)}
                            className="col-span-2 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-bold transition-all border border-green-500/10 hover:border-green-500/30"
                        >
                            この構成で始める
                        </button>
                        <button
                            onClick={() => setConfirmMode('overwrite')}
                            className="py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all border border-blue-500/10"
                        >
                            上書き保存
                        </button>
                        <button
                            onClick={() => setConfirmMode('delete')}
                            className="py-1.5 rounded-lg bg-red-500/5 text-red-500/60 hover:bg-red-500/20 hover:text-red-400 text-xs font-bold transition-all border border-red-500/5"
                        >
                            削除
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setConfirmMode(null)}
                            className="py-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 text-xs font-bold"
                        >
                            キャンセル
                        </button>
                        {confirmMode === 'overwrite' ? (
                            <button
                                onClick={() => { onSaveOver(cfg.id); setConfirmMode(null); }}
                                className="py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-400 text-xs font-bold shadow-lg shadow-blue-500/20"
                            >
                                上書き実行
                            </button>
                        ) : (
                            <button
                                onClick={() => { onDelete(cfg.id); setConfirmMode(null); }}
                                className="py-2 rounded-lg bg-red-500 text-white hover:bg-red-400 text-xs font-bold shadow-lg shadow-red-500/20"
                            >
                                削除実行
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const Badge = ({ label, color }: { label: string, color: 'blue' | 'orange' | 'purple' | 'slate' }) => {
    const styles = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        slate: "bg-slate-700/30 text-slate-400 border-white/5",
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${styles[color]}`}>
            {label}
        </span>
    );
}

const StatusValue = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex flex-col items-center">
        <span className={`text-[8px] font-bold ${color}`}>{label}</span>
        <span className="text-xs font-mono font-bold text-white">{value}</span>
    </div>
);
