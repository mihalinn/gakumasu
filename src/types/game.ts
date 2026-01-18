import type { Card, Buff } from './card';
import type { PItem, PDrink, PDrinkState } from './item';

export interface PresetFolder {
    id: string;
    name: string;
    isOpen: boolean;
}

export type LessonAttribute = 'vocal' | 'dance' | 'visual';

export interface SavedConfig {
    id: string;
    name: string;
    folderId?: string;
    data: {
        selectedCharName: string | null;
        selectedProfileId: string | null;
        hand: Card[];
        selectedPItems: PItem[];
        selectedPDrinks: PDrink[];
        producePlan?: '初' | '初LEGEND' | 'NIA';
        turnAttributes?: LessonAttribute[];
        status?: {
            vocal: number;
            dance: number;
            visual: number;
            hp: number;
            maxHp: number;
        };
    };
}

export type TurnPhase = 'start' | 'main' | 'end';

export interface GameState {
    // ターン管理
    turn: number;
    maxTurns: number;
    phase: TurnPhase;
    currentTurnAttribute?: LessonAttribute;

    // パラメータ
    vocal: number;
    dance: number;
    visual: number;
    hp: number;
    maxHp: number;
    shield: number;
    genki: number;
    goodImpression: number;
    motivation: number;
    concentration: number;

    // スコア
    score: number;

    // カード管理
    deck: Card[];
    hand: Card[];
    discard: Card[];
    onHold: Card[];
    excluded: Card[];
    cardsPlayed: number;

    // アイテム・ドリンク
    pItems: PItem[];
    pDrinks: PDrinkState[];
    buffs: Buff[];
    logs: string[];
}
