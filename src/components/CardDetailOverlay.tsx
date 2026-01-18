import type { Card } from '../types';

interface CardDetailOverlayProps {
    card: Card;
}

export function CardDetailOverlay({ card }: CardDetailOverlayProps) {
    // 効果テキストを行ごとに分割 (改行 または " / " で分割)
    const effectLines = card.effect ? card.effect.split(/\n|\s\/\s/).filter(line => line.trim() !== '') : [];

    // コストバッジのスタイル決定
    const isHpCost = card.costType === 'hp';

    // HP消費の場合、コスト値ではなく効果から消費量を取得して表示する
    let displayCost = card.cost;
    if (isHpCost && card.effects) {
        const consumeHpEffect = card.effects.find(e => e.type === 'consume_hp');
        if (consumeHpEffect && consumeHpEffect.value) {
            displayCost = consumeHpEffect.value;
        }
    }

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 w-[280px] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none drop-shadow-2xl">
            {/* Main Card Body - Dark theme to match surrounding UI */}
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-4 shadow-xl relative overflow-hidden ring-1 ring-white/10">

                {/* Cost Badge (Top Right) */}
                <div className="absolute top-2 right-2 z-10">
                    <div className="relative flex items-center justify-center w-12 h-10 pt-1">
                        {/* Background Shape */}
                        {isHpCost ? (
                            // HP Cost: Heart Shape
                            <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full drop-shadow-md text-rose-500" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        ) : (
                            // Normal Cost: Diamond/Crystal Shape
                            <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full drop-shadow-md text-blue-500" fill="currentColor">
                                <path d="M12 2L2 12l10 10 10-10L12 2z" />
                            </svg>
                        )}

                        {/* Cost Value - HP消費はマイナス表示にするのが一般的だが、参照画像では-4となっていたためマイナスをつける  */}
                        {/* ただし、元データが正の値(consume 1)なので、表示時にマイナスをつける */}
                        <span className="relative z-20 text-white font-black text-xl leading-none shadow-black drop-shadow-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {isHpCost ? `-${displayCost}` : displayCost}
                        </span>
                    </div>
                </div>

                {/* Header: Name and Type */}
                <div className="flex flex-col items-center mb-4 mt-1 relative z-0">
                    <h3 className="text-base font-bold text-white tracking-tight text-center leading-tight mb-1 px-8">
                        {card.name}
                        {card.name.endsWith('+') && <span className="text-yellow-400 ml-0.5"></span>}
                    </h3>

                    {/* Subtitle with lines */}
                    <div className="flex items-center gap-2 w-full justify-center">
                        <div className="h-px bg-white/20 w-16"></div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.type}</span>
                        <div className="h-px bg-white/20 w-16"></div>
                    </div>
                </div>

                {/* Effect Lines */}
                <div className="space-y-1.5 mb-3 px-1">
                    {effectLines.map((line, idx) => {
                        // Determine line color/style based on content
                        let textColor = "text-slate-200";
                        let markerColor = "bg-slate-400";
                        let bgColor = "bg-slate-800/50";

                        if (line.includes('体力') || line.includes('減少') || line.includes('無効')) { textColor = "text-red-200"; markerColor = "bg-red-400"; bgColor = "bg-red-500/10"; }
                        else if (line.includes('元気')) { textColor = "text-green-200"; markerColor = "bg-green-400"; bgColor = "bg-green-500/10"; }
                        else if (line.includes('好印象')) { textColor = "text-pink-200"; markerColor = "bg-pink-400"; bgColor = "bg-pink-500/10"; }
                        else if (line.includes('やる気')) { textColor = "text-orange-200"; markerColor = "bg-orange-400"; bgColor = "bg-orange-500/10"; }
                        else if (line.includes('集中')) { textColor = "text-purple-200"; markerColor = "bg-purple-400"; bgColor = "bg-purple-500/10"; }

                        return (
                            <div key={idx} className={`flex items-center gap-2 px-2 py-1 rounded ${bgColor}`}>
                                {/* Bullet Point (Diamond) */}
                                <span className={`w-1.5 h-1.5 rotate-45 shrink-0 shadow-[0_0_4px_rgba(0,0,0,0.5)] ${markerColor}`}></span>

                                <span className={`text-xs font-bold leading-snug flex-1 ${textColor}`}>
                                    {line}
                                </span>
                            </div>
                        );
                    })}
                    {effectLines.length === 0 && (
                        <p className="text-xs text-slate-500 text-center italic">効果なし</p>
                    )}
                </div>

                {/* Footer: Usage Limits / Unique */}
                <div className="flex flex-col gap-1 mt-3 pt-2 border-t border-white/10">
                    {card.usageLimit === 'once_per_lesson' && (
                        <p className="text-[10px] font-bold text-purple-300 text-center">
                            試験・ステージ中1回
                        </p>
                    )}
                    {card.unique && (
                        <p className="text-[10px] font-bold text-yellow-300 text-center">
                            重複不可 (Unique)
                        </p>
                    )}
                </div>
            </div>

            {/* Tooltip Triangle */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/95 border-b border-r border-white/10 rotate-45 shadow-sm transform"></div>
        </div>
    );
}
