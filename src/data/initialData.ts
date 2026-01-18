import type { SavedConfig, Card } from '../types';
import logicCardsData from './cards/logic.json';
import freeCardsData from './cards/free.json';

// Helper to find cards
const findCard = (id: string, list: Card[]) => list.find(c => c.id === id) || list[0];

const INITIAL_DECK_IDS = [
    { id: 'free_アピールの基本', src: freeCardsData },
    { id: 'free_ポーズの基本', src: freeCardsData },
    { id: 'free_表現の基本', src: freeCardsData },
    { id: 'logic_可愛い仕草', src: logicCardsData },
    { id: 'logic_気分転換', src: logicCardsData },
    { id: 'logic_目線の基本', src: logicCardsData },
    { id: 'logic_ファンサの基本', src: logicCardsData },
];

export const INITIAL_PRESET: SavedConfig = {
    id: 'default-preset-logic',
    name: '初期デッキ (ロジック)',
    data: {
        selectedCharName: '藤田 ことね',
        selectedProfileId: 'kotone_sekaiichi_kawaii_watashi',
        hand: INITIAL_DECK_IDS.map(item => {
            const c = findCard(item.id, item.src as Card[]);
            return c ? { ...c } : null;
        }).filter(Boolean) as Card[],
        selectedPItems: [],
        selectedPDrinks: [],
        status: { vocal: 500, dance: 500, visual: 500, hp: 40, maxHp: 80 },
        producePlan: '初',
        turnAttributes: Array(12).fill('vocal'),
    }
};
