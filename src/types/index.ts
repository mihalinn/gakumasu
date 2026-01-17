export interface CharacterStats {
    vocal: number;
    dance: number;
    visual: number;
    hp: number;
    maxHp: number;
}

export interface CharacterProfile {
    id: string;
    characterName: string;
    name: string;
    plan: 'logic' | 'sense' | 'anomaly';
    image: string;
    uniquePItem?: string | null;
    uniqueCard?: Card | null;
}

export interface CharacterGroup {
    id: string;
    name: string;
    profiles: CharacterProfile[];
}

export type CardType = 'active' | 'mental' | 'trouble';
export type CardPlan =
    | 'logic' | 'sense' | 'anomaly' | 'free' | 'trouble'
    | 'unique_logic' | 'unique_sense' | 'unique_anomaly' | 'unique_free'
    | 'support_logic' | 'support_sense' | 'support_anomaly' | 'support_free'
    | 'basic_logic' | 'basic_sense' | 'basic_anomaly' | 'basic_free';

import type { Effect, Condition } from '../logic/types';

export interface Card {
    id: string;
    name: string;
    type: CardType;
    plan: CardPlan;
    rarity?: string;
    cost: number;
    effect: string; // Legacy description
    image?: string;
    effects?: Effect[]; // New logic engine
    conditions?: Condition[];
    startInHand?: boolean; // レッスン開始時に手札に入る
    usageLimit?: 'once_per_lesson'; // レッスン中1回
    unique?: boolean; // 重複不可
    costType?: 'normal' | 'hp'; // コストタイプ: hpなら元気消費不可で直接HP消費
}

export interface PItem {
    id: string;
    name: string;
    plan: CardPlan;
    effect: string;
    image?: string;
}

export interface PDrink {
    id: string;
    name: string;
    plan: CardPlan;
    effect: string;
    image?: string;
}

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

export interface PDrinkState {
    drink: PDrink;
    used: boolean;
}

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
    shield: number; // 元気によるブロック値とは別（もしあれば）。無ければ削除でも可ですが一旦保持
    genki: number;  // 元気
    goodImpression: number; // 好印象
    motivation: number; // やる気
    concentration: number; // 集中

    // スコア
    score: number;

    // カード管理
    deck: Card[];
    hand: Card[];
    discard: Card[];
    onHold: Card[]; // 保留カード (次のターンに持ち越し)
    excluded: Card[]; // 除外されたカード (レッスン中1回など)
    cardsPlayed: number; // そのターンに使用したカード枚数

    // アイテム・ドリンク
    pItems: PItem[];
    pDrinks: PDrinkState[];
    buffs: import('../logic/types').Buff[]; // 追加: 持続効果
    logs: string[];
}
