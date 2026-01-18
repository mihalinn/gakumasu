import { useState, useEffect } from 'react';
import type { CharacterGroup } from '../types';

const CHARACTER_ORDER = [
  "花海 咲季",
  "月村 手毬",
  "藤田 ことね",
  "姫崎 莉波",
  "紫雲 清夏",
  "篠澤 広",
  "葛城 リーリヤ",
  "倉本 千奈",
  "有村 麻央",
  "花海 佑芽",
  "秦谷 美鈴",
  "十王 星南",
  "雨夜 燕"
];

export function useCharacterData() {
  const [characters, setCharacters] = useState<CharacterGroup[]>([]);
  useEffect(() => {
    const loadCharacters = () => {
      const modules = import.meta.glob('../data/characters/*.json', { eager: true });
      const groups: CharacterGroup[] = [];
      for (const path in modules) {
        try {
          const mod = modules[path] as Record<string, unknown>;
          const rawData = mod.default || mod;
          const profiles = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
          if (profiles && profiles.length > 0) {
            const id = path.split('/').pop()?.replace('.json', '') || '';
            groups.push({ id, name: profiles[0].characterName, profiles: profiles });
          }
        } catch (e) {
          console.error(`Failed to load ${path}`, e);
        }
      }
      groups.sort((a, b) => {
        const indexA = CHARACTER_ORDER.indexOf(a.name);
        const indexB = CHARACTER_ORDER.indexOf(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      setCharacters(groups);
    };
    loadCharacters();
  }, []);
  return characters;
}
