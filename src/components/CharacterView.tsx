import type { CharacterProfile, CharacterGroup } from '../types/index'

interface CharacterViewProps {
    characterGroups: CharacterGroup[];
    selectedCharName: string | null;
    setSelectedCharName: (name: string | null) => void;
    selectedProfileId: string | null;
    setSelectedProfileId: (id: string | null) => void;
}

export function CharacterView({
    characterGroups,
    selectedCharName,
    setSelectedCharName,
    selectedProfileId,
    setSelectedProfileId
}: CharacterViewProps) {
    const selectedGroup = characterGroups.find(g => g.name === selectedCharName);
    const selectedProfile = selectedGroup?.profiles.find(p => p.id === selectedProfileId);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-500">
            {/* LEFT: Character List */}
            <div className="w-full lg:w-64 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col overflow-hidden shadow-xl">
                <div className="p-3 bg-slate-900/80 border-b border-white/5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">アイドル選択</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {characterGroups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => {
                                setSelectedCharName(group.name);
                                setSelectedProfileId(null);
                            }}
                            className={`w-full px-4 py-3 rounded-lg text-left transition-all relative flex items-center justify-between group ${selectedCharName === group.name
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                }`}
                        >
                            <span className="text-sm font-bold tracking-tight">{group.name}</span>
                            {selectedCharName === group.name && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* CENTER: Profile List */}
            <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 flex flex-col overflow-hidden shadow-xl">
                <div className="p-3 bg-slate-900/80 border-b border-white/5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">プロファイル (衣装/ランク)</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {selectedGroup ? (
                        <div className="space-y-3">
                            {selectedGroup.profiles.map((profile: CharacterProfile) => (
                                <button
                                    key={profile.id}
                                    onClick={() => setSelectedProfileId(profile.id)}
                                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all border group relative ${selectedProfileId === profile.id
                                        ? "bg-slate-800/80 border-blue-500/50 shadow-lg ring-1 ring-blue-500/20"
                                        : "bg-slate-900/40 border-white/5 hover:bg-slate-800/40 hover:border-white/10"
                                        }`}
                                >
                                    <div className="w-14 h-14 rounded-lg bg-slate-950 border border-white/10 flex-shrink-0 overflow-hidden shadow-inner">
                                        {profile.image ? (
                                            <img
                                                src={`${import.meta.env.BASE_URL}images/characters/${encodeURIComponent(selectedGroup.id)}/${encodeURIComponent(profile.image)}`}
                                                className="w-full h-full object-cover object-[50%_15%] transition-transform group-hover:scale-110 duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-800 text-[10px] font-bold">No Image</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center justify-between">
                                        <p className={`font-bold text-sm transition-colors ${selectedProfileId === profile.id ? "text-white" : "text-slate-300 group-hover:text-white"
                                            } truncate tracking-tight`}>{profile.name}</p>

                                        <span className={`text-[9px] px-2.5 py-1 rounded font-bold uppercase tracking-wider border transition-all ${profile.plan === "logic"
                                            ? "bg-blue-500/20 text-blue-400 border-blue-500/20"
                                            : profile.plan === "sense"
                                                ? "bg-orange-500/20 text-orange-400 border-orange-500/20"
                                                : "bg-purple-500/20 text-purple-400 border-purple-500/20"
                                            }`}>
                                            {profile.plan}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40 italic space-y-4">
                            <svg className="w-16 h-16 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            <p className="text-sm font-medium tracking-widest uppercase">アイドルを選択してください</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Preview (Full Image) */}
            <div className="hidden xl:flex w-96 overflow-hidden relative group">

                {selectedProfile ? (
                    <div key={selectedProfile.id} className="w-full h-full relative">
                        {selectedProfile.image ? (
                            <img
                                src={`${import.meta.env.BASE_URL}images/characters/${encodeURIComponent(selectedGroup?.id || '')}/${encodeURIComponent(selectedProfile.image)}`}
                                className="w-full h-full object-contain object-bottom filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-appear-mosaic opacity-0"
                                style={{
                                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                                }}
                                alt={selectedProfile.name}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700/50 uppercase tracking-[0.2em] font-black text-xs">
                                No Preview Image
                            </div>
                        )}

                        <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
                            {/* Shortened duration and delay for snappier feel */}
                            <div className="inline-flex flex-col gap-1 px-4 py-2 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-both">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Preview</p>
                                <p className="text-lg font-black text-white tracking-tight">{selectedProfile.name}</p>
                                <p className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition-colors">{selectedProfile.characterName}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 opacity-20 italic space-y-2">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase">プレビュー表示領域</p>
                    </div>
                )}
            </div>
        </div>
    )
}
