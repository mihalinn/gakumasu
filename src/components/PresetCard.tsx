import { useState } from 'react';
import type { SavedConfig, PresetFolder } from '../types';

interface PresetCardProps {
  cfg: SavedConfig;
  folders?: PresetFolder[];
  onLoad: (cfg: SavedConfig) => void;
  onSaveOver: (cfg: SavedConfig) => void;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onMove?: (presetId: string, folderId: string | undefined) => void;
}

export function PresetCard({ cfg, folders, onLoad, onSaveOver, onDelete, onUpdateName, onMove }: PresetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(cfg.name);
  const [showMenu, setShowMenu] = useState(false);

  const handleSave = () => {
    onUpdateName(cfg.id, editName);
    setIsEditing(false);
  };
  
  // Drag logic only if movable
  const handleDragStart = (e: React.DragEvent) => {
    if(onMove) e.dataTransfer.setData("presetId", cfg.id);
  };

  return (
    <div 
       draggable={!!onMove}
       onDragStart={handleDragStart}
       className="group relative p-2 rounded hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-sm text-slate-300"
    >
        <div className="flex items-center justify-between">
           {isEditing ? (
               <input 
                 value={editName}
                 onChange={(e) => setEditName(e.target.value)}
                 onBlur={handleSave}
                 onKeyDown={(e) => e.key === "Enter" && handleSave()}
                 className="bg-black/50 border border-blue-500 rounded px-1 py-0.5 w-full text-xs"
                 autoFocus
               />
           ) : (
               <div className="flex-1 cursor-pointer truncate" onClick={() => onLoad(cfg)}>
                 {cfg.name}
               </div>
           )}
           
           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:text-white text-slate-500">
                  
               </button>
           </div>
        </div>
        
        {showMenu && (
           <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded shadow-xl z-50 w-32 flex flex-col py-1 text-xs">
              <button className="text-left px-3 py-1.5 hover:bg-slate-800" onClick={() => { onLoad(cfg); setShowMenu(false); }}>Load</button>
              <button className="text-left px-3 py-1.5 hover:bg-slate-800" onClick={() => { onSaveOver(cfg); setShowMenu(false); }}>Overwrite</button>
              <button className="text-left px-3 py-1.5 hover:bg-slate-800" onClick={() => { setIsEditing(true); setShowMenu(false); }}>Rename</button>
              
              {folders && onMove && (
                <>
                  <div className="h-px bg-slate-800 my-1" />
                  <div className="px-3 py-1 text-[9px] text-slate-500 uppercase font-bold">Move to...</div>
                  <button className="text-left px-3 py-1.5 hover:bg-slate-800 truncate" onClick={() => { onMove(cfg.id, undefined); setShowMenu(false); }}>Unclassified</button>
                  {folders.map(f => (
                      <button key={f.id} className="text-left px-3 py-1.5 hover:bg-slate-800 truncate" onClick={() => { onMove(cfg.id, f.id); setShowMenu(false); }}>
                         {f.name}
                      </button>
                  ))}
                </>
              )}
              
              <div className="h-px bg-slate-800 my-1" />
              <button className="text-left px-3 py-1.5 hover:bg-red-900/50 text-red-400" onClick={() => { onDelete(cfg.id); setShowMenu(false); }}>Delete</button>
           </div>
        )}
        {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </div>
  );
}
