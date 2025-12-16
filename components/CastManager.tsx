
import React, { useState } from 'react';
import { Actor, Costume, Character } from '../types';
import CharacterCard from './CharacterCard';
import CopyButton from './CopyButton';

const CastManager: React.FC<{
  actors: Actor[];
  costumes: Costume[];
  characters: Character[];
  onUpdateCharacters: (chars: Character[]) => void;
}> = ({ actors, costumes, characters, onUpdateCharacters }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // New Character Form State
  const [newCharName, setNewCharName] = useState("");
  const [newActorId, setNewActorId] = useState("");
  const [newCostumeId, setNewCostumeId] = useState("");

  const handleCreate = () => {
    if (!newActorId || !newCostumeId || !newCharName) return;
    
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: newCharName,
      actorId: newActorId,
      costumeId: newCostumeId
    };
    
    onUpdateCharacters([...characters, newChar]);
    setNewCharName("");
    setNewActorId("");
    setNewCostumeId("");
  };

  const handleUpdateChar = (updated: Character) => {
    onUpdateCharacters(characters.map(c => c.id === updated.id ? updated : c));
  };

  const handleDelete = (id: string) => {
    onUpdateCharacters(characters.filter(c => c.id !== id));
  };

  const getCastJson = () => {
    const cleanCast = characters.map(c => {
        const actor = actors.find(a => a.id === c.actorId);
        const costume = costumes.find(cos => cos.id === c.costumeId);
        
        const actorDesc = actor ? actor.description : 'an actor';
        const costumeDesc = costume ? costume.description : 'casual clothes';
        
        // Construct the base visual description
        const baseDescription = `${actorDesc} wearing ${costumeDesc}`.trim();

        return {
            role: c.name,
            actorName: actor?.name,
            costumeName: costume?.name,
            description: baseDescription,
            prompts: {
                frontal: `Full body frontal shot of ${baseDescription}, neutral lighting, solid background`,
                side: `Side profile full body shot of ${baseDescription}, neutral lighting, solid background`,
                rear: `Rear view full body shot of ${baseDescription}, neutral lighting, solid background`
            }
        };
    });
    return JSON.stringify(cleanCast, null, 2);
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-sm">
      <div 
        className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center cursor-pointer select-none rounded-t-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          Cast & Characters
          <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">{characters.length}</span>
        </h3>
        <div className="flex items-center gap-2">
          <CopyButton 
            onCopy={getCastJson} 
            label="JSON" 
            title="Copy Cast List with View Prompts" 
            className="text-zinc-500 hover:text-indigo-400 text-[10px] font-medium bg-zinc-800/50 hover:bg-zinc-800 px-1.5 py-0.5 rounded" 
          />
          <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-black/10 rounded-b-2xl">
          <p className="text-[10px] text-zinc-500 mb-3">Combine Actor & Costume. Drag to storyboard.</p>
          
          {/* Creator */}
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800 mb-3 flex flex-col gap-2">
             <div>
               <label className="text-[9px] uppercase font-bold text-zinc-600 mb-0.5 block">Role Name</label>
               <input 
                 value={newCharName}
                 onChange={(e) => setNewCharName(e.target.value)}
                 className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-zinc-600 text-zinc-300"
                 placeholder="e.g. Hero"
               />
             </div>
             <div className="flex gap-2">
               <div className="flex-1">
                 <label className="text-[9px] uppercase font-bold text-zinc-600 mb-0.5 block">Actor</label>
                 <select 
                    value={newActorId}
                    onChange={(e) => setNewActorId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-1 py-1 text-xs focus:outline-none focus:border-zinc-600 text-zinc-300"
                 >
                   <option value="">Actor...</option>
                   {actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                 </select>
               </div>
               <div className="flex-1">
                 <label className="text-[9px] uppercase font-bold text-zinc-600 mb-0.5 block">Costume</label>
                 <select 
                    value={newCostumeId}
                    onChange={(e) => setNewCostumeId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-1 py-1 text-xs focus:outline-none focus:border-zinc-600 text-zinc-300"
                 >
                   <option value="">Costume...</option>
                   {costumes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               </div>
             </div>
             <button 
               onClick={handleCreate}
               disabled={!newCharName || !newActorId || !newCostumeId}
               className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors w-full mt-1"
             >
               Add Character
             </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
             {characters.map(char => (
               <CharacterCard 
                 key={char.id} 
                 character={char} 
                 actors={actors}
                 costumes={costumes}
                 actor={actors.find(a => a.id === char.actorId)}
                 costume={costumes.find(c => c.id === char.costumeId)}
                 onDelete={handleDelete}
                 onUpdate={handleUpdateChar}
               />
             ))}
             {characters.length === 0 && (
               <div className="text-center py-2 text-zinc-600 text-[10px] italic">
                 No characters created yet.
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CastManager;
