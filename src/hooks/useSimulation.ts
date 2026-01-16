import { useState, useCallback } from 'react';
import type { GameState, Card, PItem, PDrink } from '../types';

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
    pItems: [],
    pDrinks: [],
};

export function useSimulation() {
    const [state, setState] = useState<GameState>(INITIAL_STATE);

    const startTurn = useCallback(() => {
        setState(prev => ({
            ...prev,
            phase: 'main',
            // ここにターン開始時の処理（ドローなど）を追加予定
        }));
    }, []);

    const endTurn = useCallback(() => {
        setState(prev => ({
            ...prev,
            turn: prev.turn + 1,
            phase: 'start',
            // ここにターン終了時の処理（手札破棄、元気減少など）を追加予定
        }));
    }, []);

    return {
        state,
        startTurn,
        endTurn,
    };
}
