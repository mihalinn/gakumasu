export interface CharacterStats {
    vocal: number;
    dance: number;
    visual: number;
    hp: number;
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

export interface Card {
    id: string;
    name: string;
    type: CardType;
    plan: CardPlan;
    rarity?: string;
    cost: number;
    effect: string;
    image?: string;
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
    };
}
