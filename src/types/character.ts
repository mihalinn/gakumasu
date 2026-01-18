import type { Card } from './card';

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
