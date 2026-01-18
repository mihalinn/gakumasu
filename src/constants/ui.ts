export const TABS = {
    PRODUCE: 'produce',
    CHARACTER: 'character',
    HAND: 'hand',
    P_ITEM: 'p_item',
    P_DRINK: 'p_drink',
    STATUS: 'status',
    PRESETS: 'presets',
    CARD_LIST: 'card_list',
} as const;

export type Tab = typeof TABS[keyof typeof TABS];
