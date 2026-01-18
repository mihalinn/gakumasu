import type { CardPlan } from './card';

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

export interface PDrinkState {
    drink: PDrink;
    used: boolean;
}
