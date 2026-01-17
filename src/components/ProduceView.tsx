import { useEffect, useRef } from 'react';
import type { Card, LessonAttribute } from '../types/index'

interface ProduceViewProps {
  state: any; // Ideally this would be GameState from types
  endTurn: () => void;
  resetSimulation: () => void;
  playCard: (cardId: string) => void;
  usePDrink: (index: number) => void;
  turnAttributes: LessonAttribute[];
  plan?: 'logic' | 'sense' | 'anomaly';
}

export function ProduceView({ state, endTurn, resetSimulation, playCard, usePDrink, turnAttributes, plan }: ProduceViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Logicプランでない場合のみ集中を表示 -> センスとアノマリーのみ表示に変更 (未選択時は非表示)
  const showConcentration = plan === 'sense' || plan === 'anomaly';


  useEffect(() => {
    // ... (unchanged)
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [state.logs]);

  return (
    <div className="h-full grid grid-cols-[240px_1fr_240px] gap-2 animate-in fade-in duration-500 p-2">
      {/* ... (Left Column unchanged) */}
      <div className="flex flex-col gap-2 h-full overflow-hidden">
        {/* Logs */}
        <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">ログ</h3>
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto text-xs space-y-1 custom-scrollbar p-1 scroll-smooth">
            {state.logs && state.logs.length > 0 ? (
              state.logs.map((log: string, idx: number) => {
                let styleClass = "text-slate-400 border-b border-white/5";
                if (log.includes('開始')) styleClass = "text-white bg-white/5 border-l-2 border-white/50 font-bold";
                else if (log.includes('カード使用')) styleClass = "text-cyan-200 bg-cyan-500/10 border-l-2 border-cyan-500/50";
                else if (log.includes('Pドリンク使用')) styleClass = "text-orange-200 bg-orange-500/10 border-l-2 border-orange-500/50";

                return (
                  <p key={`${state.turn}-${idx}`} className={`py-1.5 px-2 rounded-r text-[11px] leading-relaxed break-words whitespace-pre-wrap transition-all animate-in fade-in slide-in-from-left-1 ${styleClass}`}>
                    {log}
                  </p>
                );
              })
            ) : (
              <p className="opacity-50 text-slate-500 text-center py-4">ログなし</p>
            )}
          </div>
        </div>

        {/* P-DRINKS */}
        <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 shrink-0">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pドリンク</h3>
          {state.pDrinks && state.pDrinks.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {state.pDrinks.map(({ drink, used }: any, idx: number) => {
                const canAct = state.cardsPlayed < 1;
                return (
                  <button
                    key={`${drink.id}-${idx}`}
                    onClick={() => canAct && !used && usePDrink(idx)}
                    disabled={used || !canAct}
                    className={`
                    aspect-square bg-slate-800 rounded border border-white/10 overflow-hidden relative transition-all
                    ${(used || !canAct)
                        ? 'opacity-40 grayscale cursor-not-allowed'
                        : 'hover:border-white/30 hover:scale-105 cursor-pointer'
                      }
                  `}
                    title={drink.name}
                  >

                    {drink.image ? (
                      <img
                        src={`${import.meta.env.BASE_URL}images/drinks/${drink.image.split('/').map((part: string) => encodeURIComponent(part)).join('/')}`}
                        alt={drink.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500">
                        {drink.name[0]}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-[10px] text-slate-600 py-2">ドリンクなし</div>
          )}
        </div>
      </div>

      {/* Center Column: Main Game Area */}
      <div className="flex flex-col gap-4 h-full">
        {/* Header: Turn & Score */}
        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ターン</span>
              <div className="text-3xl font-bold font-mono text-white">
                {state.turn} <span className="text-sm text-slate-600">/ {state.maxTurns}</span>
              </div>
            </div>
            {/* Current Turn Attribute Display */}
            {state.currentTurnAttribute && (
              <div className={`
                        flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 animate-heartbeat transition-all duration-300
                        ${state.currentTurnAttribute === 'vocal' ? 'border-pink-500 bg-pink-500/10 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.5)]' : ''}
                        ${state.currentTurnAttribute === 'dance' ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}
                        ${state.currentTurnAttribute === 'visual' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : ''}
                    `}>
                <span className="text-[10px] font-bold uppercase">{state.currentTurnAttribute.slice(0, 2)}</span>
              </div>
            )}
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">スコア</span>
              <div className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">
                {state.score.toLocaleString()}
              </div>
            </div>
          </div>
          <button
            onClick={endTurn}
            disabled={state.turn >= state.maxTurns}
            className={`px-6 py-2 font-bold rounded-lg border transition-colors ${state.turn >= state.maxTurns
              ? 'bg-slate-800 text-slate-600 border-white/5 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 text-white border-white/10'
              }`}
          >
            スキップ
          </button>
        </div>

        {/* Main Stage Area */}
        <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
          {/* Character Status Overlay */}
          {/* Left Status Overlay: Motivation, Good Impression, Concentration, Buffs */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-lg border border-white/10 p-3 min-w-[150px] shadow-xl ring-1 ring-white/5 flex flex-col gap-2">
              {/* Status Effects Row */}
              <div className="grid grid-cols-3 gap-2 pb-1">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-bold text-slate-500 uppercase">やる気</span>
                  <span className="text-xs font-bold text-orange-400 font-mono">{state.motivation}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-bold text-slate-500 uppercase">好印象</span>
                  <span className="text-xs font-bold text-pink-400 font-mono">{state.goodImpression}</span>
                </div>
                {showConcentration ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">集中</span>
                    <span className="text-xs font-bold text-purple-400 font-mono">{state.concentration}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-30">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">---</span>
                    <span className="text-xs font-bold text-slate-600 font-mono">-</span>
                  </div>
                )}
              </div>

              {/* Active Buffs Section */}
              {state.buffs && state.buffs.length > 0 && (
                <div className="flex flex-col gap-1 pt-1 border-t border-white/5 w-full">
                  {(() => {
                    const groupedBuffs = state.buffs.reduce((acc: any[], buff: any) => {
                      const existing = acc.find(b => b.type === buff.type);
                      if (existing) {
                        // Sum values
                        if (buff.value) existing.value = (existing.value || 0) + buff.value;
                        // Sum counts (stacks)
                        if (buff.count) existing.count = (existing.count || 0) + buff.count;
                        // Max duration (or extend? Assuming max for display simplification)
                        existing.duration = Math.max(existing.duration, buff.duration);
                      } else {
                        acc.push({ ...buff });
                      }
                      return acc;
                    }, []);

                    return groupedBuffs.map((buff: any, i: number) => (
                      <div
                        key={`${buff.id}-${i}`}
                        className="bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded flex justify-between items-center gap-2 group relative cursor-help w-full"
                        title={`${buff.name} (残り${buff.duration}ターン)`}
                      >
                        <span className="text-[9px] font-bold text-blue-300 uppercase truncate flex-1">
                          {buff.name}
                          {buff.value ? ` (${buff.value > 0 ? '+' : ''}${buff.value})` : ''}
                        </span>
                        <div className="flex items-center gap-1">
                          {buff.count !== undefined && (
                            <span className="text-[8px] font-mono text-white bg-blue-500/30 px-1 rounded flex items-center justify-center min-w-[12px]">
                              {buff.count}
                            </span>
                          )}
                          <span className="text-[8px] font-mono text-blue-500 bg-blue-500/10 px-0.5 rounded">
                            {buff.duration === -1 ? '∞' : buff.duration}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Right Status Overlay: HP, Genki */}
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-lg border border-white/10 p-3 min-w-[150px] shadow-xl ring-1 ring-white/5 flex flex-col gap-2">
              {/* HP Section */}
              <div className="pb-2 border-b border-white/5">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">HP</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black font-mono tracking-tight ${state.hp < state.maxHp * 0.3 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                      {state.hp}
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono font-bold">/ {state.maxHp}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden ring-1 ring-white/5">
                  <div
                    className={`h-full transition-all duration-500 ease-out relative ${state.hp < state.maxHp * 0.3 ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
                    style={{ width: `${Math.min(100, (state.hp / state.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Genki Section */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GENKI</span>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  <span className="text-sm font-bold font-mono leading-none">{state.genki}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center opacity-30">
            <p className="font-bold text-2xl text-slate-500">ステージビュー</p>
            <p className="text-sm text-slate-600 mt-2">（スキルエフェクト・アイドル表示予定地）</p>
          </div>
        </div>

        {/* Hand Area */}
        <div className="h-48 bg-slate-900/50 rounded-xl border border-white/5 p-4 flex items-center justify-center gap-3 overflow-x-auto custom-scrollbar">
          {state.hand.length === 0 ? (
            <p className="text-slate-600 text-sm font-medium">手札なし</p>
          ) : (
            state.hand.map((card: Card, idx: number) => {
              const canPlay = state.cardsPlayed < 1;
              return (
                <button
                  key={`${card.id}-${idx}`}
                  onClick={() => canPlay && playCard(card.id)}
                  disabled={!canPlay}
                  className={`
                        w-24 h-32 rounded-lg border p-1 flex flex-col items-center justify-between shrink-0 transition-all duration-300 shadow-lg
                        ${canPlay
                      ? 'bg-slate-800 border-white/10 hover:scale-105 hover:border-white/30 hover:shadow-blue-500/10 cursor-pointer'
                      : 'bg-slate-900/50 border-white/5 opacity-50 cursor-not-allowed grayscale shadow-none'
                    }
                    `}
                >
                  <div className="w-full aspect-square bg-black/40 rounded overflow-hidden relative flex items-center justify-center">
                    {card.image ? (
                      <img
                        src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map((part: string) => encodeURIComponent(part)).join('/')}`}
                        alt={card.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold bg-slate-800/50">
                        カード画像なし
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full px-0.5">
                    <div className="text-[9px] font-black tracking-tight text-center line-clamp-1 leading-tight text-slate-200 truncate">
                      {card.name}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Turn Info Summary */}
      <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col gap-4 overflow-hidden">
        {/* Turn Attributes Summary */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ターン属性</h3>
          <div className="grid grid-cols-6 gap-1">
            {turnAttributes.map((attr, index) => {
              const turnNumber = index + 1;
              const isCurrent = turnNumber === (state.turn ?? 1);
              const isPast = turnNumber < (state.turn ?? 1);

              return (
                <div
                  key={`turn-attr-${index}`}
                  title={`ターン ${turnNumber}: ${attr.toUpperCase()}`}
                  className={`
                                h-1.5 rounded-full transition-all duration-300
                                ${attr === 'vocal' ? 'bg-pink-500' : ''}
                                ${attr === 'dance' ? 'bg-blue-500' : ''}
                                ${attr === 'visual' ? 'bg-yellow-500' : ''}
                                ${isCurrent
                      ? `ring-1 ring-white scale-125 opacity-100 animate-heartbeat
                                       ${attr === 'vocal' ? 'shadow-[0_0_10px_rgba(236,72,153,0.8)]' : ''}
                                       ${attr === 'dance' ? 'shadow-[0_0_10px_rgba(59,130,246,0.8)]' : ''}
                                       ${attr === 'visual' ? 'shadow-[0_0_10px_rgba(234,179,8,0.8)]' : ''}
                                      `
                      : ''
                    }
                                ${!isCurrent && !isPast ? 'opacity-40' : ''}
                                ${isPast ? 'opacity-20' : ''}
                            `}
                />
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">山札・管理</h3>
          <div className="bg-slate-800/50 p-2 rounded text-xs text-slate-400 space-y-2">
            <div className="flex justify-between items-center border-b border-white/5 pb-1">
              <span>山札</span>
              <span className="text-white font-mono">{state.deck.length}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-1">
              <span>捨札</span>
              <span className="text-white font-mono">{state.discard.length}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-1">
              <span className="text-slate-500">除外</span>
              <span className="text-slate-300 font-mono">{state.excluded ? state.excluded.length : 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">保留</span>
              <span className="text-slate-300 font-mono">{state.onHold ? state.onHold.length : 0}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={resetSimulation}
            className="w-full py-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-500 text-xs font-bold rounded border border-white/5 hover:border-red-500/30 transition-all duration-200"
          >
            リセット (Turn 1)
          </button>
        </div>
      </div>
    </div>
  );
}
