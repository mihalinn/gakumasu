import { useState, useEffect } from 'react';
import type { CharacterGroup } from '../types';

export function useCharacterData() {
  const [characterGroups, setCharacterGroups] = useState<CharacterGroup[]>([]);

  useEffect(() => {
    async function load() {
       const modules = import.meta.glob('../data/characters/*.json');
       const groups: CharacterGroup[] = [];
       for (const path in modules) {
           try {
             const mod = await modules[path]() as any;
             groups.push(mod.default || mod);
           } catch(e) { console.error("Failed to load char data", path, e); }
       }
       // Sort logic ideally based on ID or Name
       groups.sort((a, b) => a.id.localeCompare(b.id)); 
       setCharacterGroups(groups);
    }
    load();
  }, []);

  return { characterGroups };
}
