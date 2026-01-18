import type { Card } from '../types';

export const shuffle = (cards: Card[]) => {
    const newCards = [...cards];
    for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    return newCards;
};

export const drawCards = (currentDeck: Card[], currentDiscard: Card[], count: number, currentHand: Card[] = []) => {
    let deck = shuffle([...currentDeck]);
    let discard = [...currentDiscard];
    const hand: Card[] = [];
    const drawnIds = new Set(currentHand.map(c => c.id));

    let attempts = 0;
    const MAX_ATTEMPTS = count * 2 + 10; // Prevent infinite loop if deck is small/full of uniques

    while (hand.length < count && (deck.length > 0 || discard.length > 0)) {
        if (attempts++ > MAX_ATTEMPTS) break;

        if (deck.length === 0) {
            if (discard.length === 0) break;
            deck = shuffle(discard);
            discard = [];
        }

        const card = deck.pop();
        if (card) {
            // Unique check
            if (card.unique && (drawnIds.has(card.id) || hand.some(c => c.id === card.id))) {
                // Cannot draw this card (already in hand). 
                // Skip it (effectively discard/return to diff pile? For now, discard)
                // In a perfect sim, it might stay in deck, but deck is a stack.
                // If we pop it, we must put it somewhere. discard is safest to avoid blocking.
                discard.push(card);
                continue;
            }
            hand.push(card);
            drawnIds.add(card.id);
        }
    }

    return { deck, discard, hand };
};
