import { useState, useCallback, useEffect } from 'react';
import type { GameState } from '../types';
import { applyCardEffects } from '../logic/effectResolver';
import { LOGIC_CONSTANTS } from '../logic/constants';
import { shuffle, drawCards } from '../logic/utils';

const INITIAL_STATE: GameState = {
    turn: 1,
    maxTurns: 12,
    phase: 'start',
    hp: 30, // 仮の初期値
    maxHp: 30,
    vocal: 0, // Added default vocal stat
    dance: 0, // Added default dance stat
    visual: 0, // Added default visual stat
    shield: 0,
    genki: 0,
    goodImpression: 0,
    motivation: 0,
    concentration: 0,
    score: 0,
    deck: [],
    hand: [],
    discard: [],
    onHold: [],
    excluded: [],
    cardsPlayed: 0,
    pItems: [],
    pDrinks: [],
    buffs: [],
    logs: [],
};

export function useSimulation(
    initialStatus?: { vocal: number; dance: number; visual: number; hp: number; maxHp: number },
    turnAttributes?: import('../types').LessonAttribute[],
    targetDeck?: import('../types').Card[],
    initialPDrinks?: import('../types').PDrink[]
) {

    const [state, setState] = useState<GameState>(() => {
        // startInHandのカードを探す
        const startHandCards = (targetDeck || []).filter(c => c.startInHand);
        const remainingDeckCards = (targetDeck || []).filter(c => !c.startInHand);

        const shuffledDeck = shuffle(remainingDeckCards);
        // 初期手札3枚確保 (startInHand優先)
        // 上限5枚だが、初期は基本3枚
        const drawTarget = 3;
        const drawCount = Math.max(0, drawTarget - startHandCards.length);
        const { deck, hand: drawnHand, discard } = drawCards(shuffledDeck, [], drawCount);

        return {
            ...INITIAL_STATE,
            ...initialStatus,
            hp: initialStatus?.hp ?? INITIAL_STATE.hp,
            maxHp: initialStatus?.maxHp ?? INITIAL_STATE.maxHp,
            currentTurnAttribute: turnAttributes ? turnAttributes[0] : 'vocal',
            deck,
            hand: [...startHandCards, ...drawnHand],
            discard,
            onHold: [],
            excluded: [],
            cardsPlayed: 0,
            pDrinks: initialPDrinks ? initialPDrinks.map(d => ({ drink: d, used: false })) : [],
            logs: ['ターン1 開始'],
        };
    });

    const usePDrink = useCallback((index: number) => {
        setState(prev => {
            if (index < 0 || index >= prev.pDrinks.length || prev.pDrinks[index].used) return prev;

            const newDrinks = [...prev.pDrinks];
            newDrinks[index] = { ...newDrinks[index], used: true };

            // TODO: Apply drink effects here

            return {
                ...prev,
                pDrinks: newDrinks,
                logs: [...prev.logs, `Pドリンク使用: ${newDrinks[index].drink.name} `]
            };
        });
    }, []);



    const playCard = useCallback((cardId: string) => {
        setState(prev => {
            if (prev.cardsPlayed >= 1) return prev; // check card limit

            const cardIndex = prev.hand.findIndex(c => c.id === cardId);
            if (cardIndex === -1) return prev;

            const newHand = [...prev.hand];
            const [playedCard] = newHand.splice(cardIndex, 1);

            // コスト計算
            let reductionFlat = 0;
            prev.buffs.forEach(b => {
                if (b.type === 'reduce_hp_cost') reductionFlat += (b.value ?? 0);
            });
            let actualCost = Math.max(0, playedCard.cost - reductionFlat);

            const hasCostReductionBuff = prev.buffs.some(b => b.type === 'buff_cost_reduction');
            const hasDoubleCostBuff = prev.buffs.some(b => b.type === 'buff_double_cost');

            if (hasCostReductionBuff) actualCost = Math.floor(actualCost * 0.5);
            if (hasDoubleCostBuff) actualCost *= 2;
            actualCost = Math.max(0, actualCost);

            // リソースチェック: コストが払えるか？
            // 体力0でもコスト0なら使用可能
            if (prev.hp + prev.genki < actualCost) {
                return prev;
            }

            // リソース消費 (元気 -> 体力の順)
            let remainingCost = actualCost;
            let newGenki = prev.genki;
            let newHp = prev.hp;

            if (newGenki >= remainingCost) {
                newGenki -= remainingCost;
                remainingCost = 0;
            } else {
                remainingCost -= newGenki;
                newGenki = 0;
                newHp -= remainingCost;
            }

            // カード適用前の状態 (コスト支払い後)
            let midState: GameState = {
                ...prev,
                hand: newHand,
                genki: newGenki,
                hp: newHp,
                cardsPlayed: prev.cardsPlayed + 1,
            };

            // Effect execution
            let afterEffectState = midState;
            if (playedCard.effects) {
                afterEffectState = applyCardEffects(midState, playedCard.effects);
            } else {
                afterEffectState = {
                    ...midState,
                    logs: [...(midState.logs || []), `(No effects data for: ${playedCard.name})`]
                };
            }

            // Move card to discard or excluded
            let newDiscard = [...afterEffectState.discard];
            let newExcluded = [...(prev.excluded || [])];

            if (playedCard.usageLimit === 'once_per_lesson') {
                newExcluded.push(playedCard);
            } else {
                newDiscard.push(playedCard);
            }

            return {
                ...afterEffectState,
                discard: newDiscard,
                excluded: newExcluded,
                logs: [
                    ...(afterEffectState.logs || []),
                    `カード使用: ${playedCard.name}${actualCost > 0 ? ` (消費: ${actualCost})` : ''} `
                ],
            };
        });
    }, []);

    const endTurn = useCallback(() => {
        setState(prev => {
            if (prev.turn >= prev.maxTurns) return prev;

            const nextTurn = prev.turn + 1;

            // スキップ回復: カード不使用なら体力+2
            let nextHp = prev.hp;
            let skipLog = "";
            if (prev.cardsPlayed === 0) {
                nextHp = Math.min(prev.maxHp, prev.hp + 2);
                skipLog = " (スキップ回復 +2)";
            }

            // 手札・捨札管理
            // 保留カード以外を全て捨札へ
            // TODO: onHoldロジック実装時はここで separation
            const currentDiscard = [...prev.discard, ...prev.hand];
            const nextHand: import('../types').Card[] = []; // 保留があればここに入れる

            // 次のターンのドロー処理
            // 手札上限5枚だが、基本は「3枚になるまで」引く。
            // 既に保留で3枚超えている場合は引かない？
            // 通常: 3枚になるように引く
            const MAX_HAND = 5;
            const BASE_DRAW_TARGET = 3;

            const currentHandSize = nextHand.length;
            const drawCount = Math.max(0, BASE_DRAW_TARGET - currentHandSize);
            // ドロー後に5枚を超えないようにする（通常ドローでは超えないはずだが、効果ドローとの兼ね合いでガード）
            const safeDrawCount = Math.min(drawCount, MAX_HAND - currentHandSize);

            const { deck: newDeck, hand: drawnHand, discard: newDiscard } = drawCards(prev.deck, currentDiscard, safeDrawCount);

            // 持続効果によるスコア獲得 (好印象など)
            const goodImpressionScore = prev.goodImpression * LOGIC_CONSTANTS.IMPRESSION.TURN_END_SCORE_PER_STACK;

            // バフの更新 (持続ターンを減らす)
            const updatedBuffs = prev.buffs
                .map(b => ({ ...b, duration: b.duration === -1 ? -1 : b.duration - 1 }))
                .filter(b => b.duration !== 0);

            // 好印象の減衰 (-1)
            const nextImpression = Math.max(0, prev.goodImpression - 1);

            return {
                ...prev,
                score: prev.score + goodImpressionScore,
                hp: nextHp,
                turn: nextTurn,
                phase: 'start',
                currentTurnAttribute: turnAttributes ? (turnAttributes[nextTurn - 1] ?? 'vocal') : 'vocal',
                deck: newDeck,
                hand: [...nextHand, ...drawnHand],
                discard: newDiscard,
                buffs: updatedBuffs,
                goodImpression: nextImpression,
                cardsPlayed: 0,
                logs: [
                    ...prev.logs,
                    ...(goodImpressionScore > 0 ? [`好印象スコア: +${goodImpressionScore} `] : []),
                    `ターン${nextTurn} 開始(好印象 - 1)${skipLog} `
                ],
            };
        });
    }, [turnAttributes]);

    const resetSimulation = useCallback(() => {
        const startHandCards = (targetDeck || []).filter(c => c.startInHand);
        const remainingDeckCards = (targetDeck || []).filter(c => !c.startInHand);

        const shuffledDeck = shuffle(remainingDeckCards);
        const drawTarget = 3;
        const drawCount = Math.max(0, drawTarget - startHandCards.length);
        const { deck, hand: drawnHand, discard } = drawCards(shuffledDeck, [], drawCount);

        setState({
            ...INITIAL_STATE,
            ...initialStatus,
            hp: initialStatus?.hp ?? INITIAL_STATE.hp,
            maxHp: initialStatus?.maxHp ?? INITIAL_STATE.maxHp,
            currentTurnAttribute: turnAttributes ? turnAttributes[0] : 'vocal',
            deck,
            hand: [...startHandCards, ...drawnHand],
            discard,
            excluded: [],
            onHold: [],
            cardsPlayed: 0,
            pDrinks: initialPDrinks ? initialPDrinks.map(d => ({ drink: d, used: false })) : [],
            logs: ['ターン1 開始'],
        });
    }, [initialStatus, turnAttributes, targetDeck, initialPDrinks]);

    // 入力プロップス（デッキ、ステータス、属性）が変更されたら、シミュレーションを初期化/リセットする
    // これにより、キャラ選択や手札追加時に自動的に初期ドローが行われるようになる
    useEffect(() => {
        resetSimulation();
    }, [resetSimulation]);

    // そのターンのカード使用枚数が上限に達したら、1秒後に自動でターン終了する
    useEffect(() => {
        if (state.cardsPlayed >= 1 && state.turn < state.maxTurns) {
            const timer = setTimeout(() => {
                endTurn();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [state.cardsPlayed, state.turn, state.maxTurns, endTurn]);

    return {
        state,
        endTurn,
        resetSimulation,
        playCard,
        usePDrink,
    };
}
