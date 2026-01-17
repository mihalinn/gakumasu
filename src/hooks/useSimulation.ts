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
    shield: 0,
    genki: 0,
    goodImpression: 0,
    motivation: 0,
    concentration: 0,
    score: 0,
    deck: [],
    hand: [],
    discard: [],
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
        const drawCount = Math.max(0, 3 - startHandCards.length);
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
                logs: [...prev.logs, `Pドリンク使用: ${newDrinks[index].drink.name}`]
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
            // 消費体力削減 (Flat) バフを適用
            let reductionFlat = 0;
            prev.buffs.forEach(b => {
                if (b.type === 'reduce_hp_cost') reductionFlat += (b.value ?? 0);
            });
            // 消費体力減少 (Buff) バフがある場合、コストを 0 にする（または半減などの仕様に合わせて調整。一旦0想定）
            let actualCost = Math.max(0, playedCard.cost - reductionFlat);

            const hasCostReductionBuff = prev.buffs.some(b => b.type === 'buff_cost_reduction');
            const hasDoubleCostBuff = prev.buffs.some(b => b.type === 'buff_double_cost');

            if (hasCostReductionBuff) actualCost = Math.ceil(actualCost * 0.5);
            if (hasDoubleCostBuff) actualCost = actualCost * 2;

            // リソースチェック
            if (prev.hp + prev.genki < actualCost) {
                // TODO: 体力不足の警告ログなどを出すべきか。一旦中断で。
                return prev;
            }

            const newDiscard = [...prev.discard, playedCard];

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

            // Apply card using Logic Engine
            let newState = { ...prev, hp: newHp, genki: newGenki };

            // Effect execution
            if (playedCard.effects) {
                const resultState = applyCardEffects(newState, playedCard.effects);
                newState = { ...resultState };
            } else {
                newState.logs = [...newState.logs, `(No effects data for: ${playedCard.name})`];
            }

            return {
                ...newState,
                hand: newHand,
                discard: newDiscard,
                cardsPlayed: prev.cardsPlayed + 1,
                logs: [
                    ...newState.logs,
                    `カード使用: ${playedCard.name}${actualCost > 0 ? ` (消費: ${actualCost})` : ''}`
                ],
            };
        });
    }, []);

    const endTurn = useCallback(() => {
        setState(prev => {
            if (prev.turn >= prev.maxTurns) return prev;

            const nextTurn = prev.turn + 1;
            // 手札を全て捨札へ
            const currentDiscard = [...prev.discard, ...prev.hand];

            // 次のターンのドロー処理
            const { deck: newDeck, hand: newHand, discard: newDiscard } = drawCards(prev.deck, currentDiscard, 3);

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
                turn: nextTurn,
                phase: 'start',
                currentTurnAttribute: turnAttributes ? (turnAttributes[nextTurn - 1] ?? 'vocal') : 'vocal',
                deck: newDeck,
                hand: newHand,
                discard: newDiscard,
                buffs: updatedBuffs,
                goodImpression: nextImpression,
                cardsPlayed: 0,
                logs: [
                    ...prev.logs,
                    ...(goodImpressionScore > 0 ? [`好印象スコア: +${goodImpressionScore}`] : []),
                    `ターン${nextTurn} 開始 (好印象 -1)`
                ],
            };
        });
    }, [turnAttributes]);

    const resetSimulation = useCallback(() => {
        const startHandCards = (targetDeck || []).filter(c => c.startInHand);
        const remainingDeckCards = (targetDeck || []).filter(c => !c.startInHand);

        const shuffledDeck = shuffle(remainingDeckCards);
        const drawCount = Math.max(0, 3 - startHandCards.length);
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
