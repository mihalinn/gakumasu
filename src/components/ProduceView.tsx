import type { Card, PItem, PDrink, LessonAttribute } from '../types/index'
import { useSimulation } from '../hooks/useSimulation'

interface ProduceViewProps {
  initialHand: Card[];
  initialPItems: PItem[];
  initialPDrinks: PDrink[];
  status: { vocal: number; dance: number; visual: number; hp: number; maxHp: number };
  turnAttributes: LessonAttribute[];
}

export function ProduceView({ initialHand, initialPItems: _initialPItems, initialPDrinks: _initialPDrinks, status, turnAttributes }: ProduceViewProps) {
  const { state, endTurn, resetSimulation, playCard } = useSimulation(status, turnAttributes, initialHand);

  return (
    <div className="h-full grid grid-cols-[240px_1fr_240px] gap-2 animate-in fade-in duration-500 p-2">
      {/* Left Column: Logs */}
      <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">LOGS</h3>
        <div className="flex-1 overflow-auto text-xs text-slate-500 font-mono space-y-1">
          <p>Turn 1 Start</p>
          <p>Skill activated: ...</p>
          <p className="opacity-50">...</p>
        </div>
      </div>

      {/* Center Column: Main Game Area */}
      <div className="flex flex-col gap-4 h-full">
        {/* Header: Turn & Score */}
        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">TURN</span>
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
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">SCORE</span>
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
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <div className="p-3 bg-black/60 backdrop-blur rounded-lg border border-white/10 min-w-[120px]">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-slate-400">HP</span>
                <span className="text-xl font-bold text-white font-mono">{state.hp}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${(state.hp / state.maxHp) * 100}%` }}></div>
              </div>
            </div>
            <div className="p-3 bg-black/60 backdrop-blur rounded-lg border border-white/10 min-w-[120px]">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400">元気</span>
                <span className="text-xl font-bold text-blue-400 font-mono">{state.genki}</span>
              </div>
            </div>
          </div>

          <div className="text-center opacity-30">
            <p className="font-bold text-2xl text-slate-500">STAGE VIEW</p>
            <p className="text-sm text-slate-600 mt-2">（スキルエフェクト・アイドル表示予定地）</p>
          </div>
        </div>

        {/* Hand Area */}
        <div className="h-48 bg-slate-900/50 rounded-xl border border-white/5 p-4 flex items-center justify-center gap-3 overflow-x-auto custom-scrollbar">
          {state.hand.length === 0 ? (
            <p className="text-slate-600 text-sm font-medium">No Cards in Hand</p>
          ) : (
            state.hand.map((card, idx) => {
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
                        src={`${import.meta.env.BASE_URL}images/cards/${card.image.split('/').map(part => encodeURIComponent(part)).join('/')}`}
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

      {/* Right Column: Other Info */}
      <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">TURN ATTRIBUTES</h3>
          <div className="grid grid-cols-6 gap-1">
            {turnAttributes.map((attr, index) => {
              const turnNumber = index + 1;
              const isCurrent = turnNumber === state.turn;
              const isPast = turnNumber < state.turn;

              return (
                <div
                  key={`turn-attr-${index}`}
                  title={`Turn ${turnNumber}: ${attr.toUpperCase()}`}
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
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">DECK INFO</h3>
          <div className="bg-slate-800/50 p-2 rounded text-xs text-slate-400">
            <div className="flex justify-between mb-1"><span>Remaining</span><span className="text-white font-mono">{state.deck.length}</span></div>
            <div className="flex justify-between"><span>Discard</span><span className="text-white font-mono">{state.discard.length}</span></div>
          </div>
        </div>

        <div className="mt-auto pt-4">
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
