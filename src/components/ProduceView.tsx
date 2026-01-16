import type { Card, PItem, PDrink, LessonAttribute } from '../types/index'
import { useSimulation } from '../hooks/useSimulation'

interface ProduceViewProps {
  initialHand: Card[];
  initialPItems: PItem[];
  initialPDrinks: PDrink[];
  status: { vocal: number; dance: number; visual: number; hp: number; maxHp: number };
  turnAttributes: LessonAttribute[];
}

export function ProduceView({ initialHand: _initialHand, initialPItems: _initialPItems, initialPDrinks: _initialPDrinks, status, turnAttributes }: ProduceViewProps) {
  const { state, endTurn } = useSimulation(status, turnAttributes);

  return (
    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
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
                    flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 
                    ${state.currentTurnAttribute === 'vocal' ? 'border-pink-500 bg-pink-500/10 text-pink-400' : ''}
                    ${state.currentTurnAttribute === 'dance' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : ''}
                    ${state.currentTurnAttribute === 'visual' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : ''}
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
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-white/10 transition-colors"
        >
          ターン終了
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

      {/* Hand Area (Placeholder for now) */}
      <div className="h-40 bg-slate-900/50 rounded-xl border border-white/5 p-4 flex items-center justify-center text-slate-600">
        <p>手札エリア (Coming Soon)</p>
      </div>
    </div>
  );
}
