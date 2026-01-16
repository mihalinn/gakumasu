import { useState, useCallback, useEffect } from 'react';
import type { GameState, Card } from '../types';

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
};

export function useSimulation(
    initialStatus?: { vocal: number; dance: number; visual: number; hp: number; maxHp: number },
    turnAttributes?: import('../types').LessonAttribute[],
    targetDeck?: import('../types').Card[]
) {
    // デッキをシャッフルするヘルパー関数
    const shuffle = (cards: GameState['deck']) => {
        const newCards = [...cards];
        for (let i = newCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }
        return newCards;
    };

    // カードを引くヘルパー関数
    const drawCards = (currentDeck: Card[], currentDiscard: Card[], count: number) => {
        let deck = [...currentDeck];
        let discard = [...currentDiscard];
        const hand: Card[] = [];

        for (let i = 0; i < count; i++) {
            if (deck.length === 0) {
                if (discard.length === 0) break;
                deck = shuffle(discard);
                discard = [];
            }
            const card = deck.pop();
            if (card) hand.push(card);
        }

        return { deck, discard, hand };
    };

    const [state, setState] = useState<GameState>(() => {
        const shuffledDeck = shuffle(targetDeck || []);
        const { deck, hand, discard } = drawCards(shuffledDeck, [], 3);

        return {
            ...INITIAL_STATE,
            ...initialStatus,
            hp: initialStatus?.hp ?? INITIAL_STATE.hp,
            maxHp: initialStatus?.maxHp ?? INITIAL_STATE.maxHp,
            currentTurnAttribute: turnAttributes ? turnAttributes[0] : 'vocal',
            deck,
            hand,
            discard,
            cardsPlayed: 0,
        };
    });

    const playCard = useCallback((cardId: string) => {
        setState(prev => {
            if (prev.cardsPlayed >= 1) return prev; // check card limit

            const cardIndex = prev.hand.findIndex(c => c.id === cardId);
            if (cardIndex === -1) return prev;

            const newHand = [...prev.hand];
            const [playedCard] = newHand.splice(cardIndex, 1);
            const newDiscard = [...prev.discard, playedCard];

            // TODO: Apply card effects and calculate score here

            return {
                ...prev,
                hand: newHand,
                discard: newDiscard,
                cardsPlayed: prev.cardsPlayed + 1,
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

            return {
                ...prev,
                turn: nextTurn,
                phase: 'start', // 'main'にしても良いが、一旦アニメーション等のためにstart経由か、あるいは即mainか要検討。一旦startで維持
                currentTurnAttribute: turnAttributes ? (turnAttributes[nextTurn - 1] ?? 'vocal') : 'vocal',
                deck: newDeck,
                hand: newHand,
                discard: newDiscard,
                cardsPlayed: 0, // Reset for next turn
            };
        });
    }, [turnAttributes]);

    const resetSimulation = useCallback(() => {
        const shuffledDeck = shuffle(targetDeck || []);
        const { deck, hand, discard } = drawCards(shuffledDeck, [], 3);

        setState({
            ...INITIAL_STATE,
            ...initialStatus,
            hp: initialStatus?.hp ?? INITIAL_STATE.hp,
            maxHp: initialStatus?.maxHp ?? INITIAL_STATE.maxHp,
            currentTurnAttribute: turnAttributes ? turnAttributes[0] : 'vocal',
            deck,
            hand,
            discard,
            cardsPlayed: 0,
        });
    }, [initialStatus, turnAttributes, targetDeck]);

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
    };
}
