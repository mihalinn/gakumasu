import { useState, useCallback, useEffect } from 'react';
import type { GameState } from '../types';
import { initializeGame, playCardCore, endTurnCore } from '../logic/engine';

export function useSimulation(
    initialStatus?: { vocal: number; dance: number; visual: number; hp: number; maxHp: number },
    turnAttributes?: import('../types').LessonAttribute[],
    targetDeck?: import('../types').Card[],
    initialPDrinks?: import('../types').PDrink[]
) {

    const [state, setState] = useState<GameState>(() =>
        initializeGame(initialStatus, turnAttributes, targetDeck, initialPDrinks)
    );

    const usePDrink = useCallback((index: number) => {
        setState(prev => {
            if (index < 0 || index >= prev.pDrinks.length || prev.pDrinks[index].used) return prev;

            const newDrinks = [...prev.pDrinks];
            newDrinks[index] = { ...newDrinks[index], used: true };

            // TODO: Apply drink effects here
            // Note: Drink logic is not yet in engine.ts, deferring for now or keeping as is.
            // For now, keep state update here as it was. Can move to engine later.
            return {
                ...prev,
                pDrinks: newDrinks,
                logs: [...prev.logs, `Pドリンク使用: ${newDrinks[index].drink.name} `]
            };
        });
    }, []);

    const playCard = useCallback((cardId: string) => {
        setState(prev => playCardCore(prev, cardId));
    }, []);

    const endTurn = useCallback(() => {
        setState(prev => endTurnCore(prev, turnAttributes));
    }, [turnAttributes]);

    const resetSimulation = useCallback(() => {
        setState(initializeGame(initialStatus, turnAttributes, targetDeck, initialPDrinks));
    }, [initialStatus, turnAttributes, targetDeck, initialPDrinks]);

    // Input props handling
    useEffect(() => {
        resetSimulation();
    }, [resetSimulation]);

    // Timer for auto-end turn
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

