import type { Card } from '../types';

export const shuffle = (cards: Card[]) => {
    const newCards = [...cards];
    for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    return newCards;
};

export const drawCards = (currentDeck: Card[], currentDiscard: Card[], count: number) => {
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
