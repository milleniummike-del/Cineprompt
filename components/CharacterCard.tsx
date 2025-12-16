
import React, { useState } from 'react';
import { Character, Actor, Costume } from '../types';
import CopyButton from './CopyButton';
import ImageUploader from './ImageUploader';

const CharacterCard: React.FC<{
  character: Character;
  actors: Actor[];
  costumes: Costume[];
  actor?: Actor;
  costume?: Costume;
  onDelete: (id: string) => void;
  onUpdate: (c: Character) => void;
}> = ({ character, actors, costumes, actor, costume, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [editName, setEditName] = useState(character.name);
  const [editActorId, setEditActorId] = useState(character.actorId);
  const [editCostumeId, setEditCostumeId] = useState(character.costumeId);

  const handleDragStart = (e: React.DragEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/cineprompt-char', character.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSave = () => {
    if (!editName || !editActorId || !editCostumeId) return;
    onUpdate({
      ...character,
      name: editName,
      actorId: editActorId,
      costumeId: editCostumeId
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(character.name);
    setEditActorId(character.actorId);
    setEditCostumeId(character.costumeId);
    setIsEditing(false);
  };

  const actorDesc = actor ? actor.description : 'an actor';
  const costumeDesc = costume ? costume.description : 'casual clothes';
  const baseDescription = `${actorDesc} wearing ${costumeDesc}`.trim();

  const prompts = {
      Front: `Full body frontal shot of ${baseDescription}, neutral lighting, solid background`,
      Side: `Side profile full body shot of ${baseDescription}, neutral lighting, solid background`,
      Rear: `Rear view full body shot of ${baseDescription}, neutral lighting, solid background`
  };

  const getCharacterJson = () => {
    return JSON.stringify({
      role: character.name,
      actorName: actor?.name,
      costumeName: costume?.name,
      description: baseDescription,
      prompts: {
          frontal: prompts.Front,
          side: prompts.Side,
          rear: prompts.Rear
      }
    }, null, 2);
  };

  if (isEditing) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 flex flex-col gap-2 shadow-lg">
        <div>
          <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Role Name</label>
          <input 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 text-zinc-200"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Actor</label>
          <select 
            value={editActorId}
            onChange={(e) => setEditActorId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 text-zinc-300"
          >
            {actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
           <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Costume</label>
           <select 
             value={editCostumeId}
             onChange={(e) => setEditCostumeId(e.target.value)}
             className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 text-zinc-300"
           >
             {costumes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>
        <div className="flex gap-2 mt-1">
          <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 rounded font-medium">Save</button>
          <button onClick={handleCancel} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs py-1 rounded font-medium">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      draggable="true"
      onDragStart={handleDragStart}
      className={`bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-lg p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing transition-all shadow-sm group ${showPrompts ? 'ring-1 ring-indigo-500/30' : ''}`}
    >
      <div className="flex items-start gap-3">
        <ImageUploader id={character.id} className="w-40 aspect-video" />

        <div className="flex-grow min-w-0">
            <div className="flex flex-col gap-1">
                <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => setShowPrompts(!showPrompts)}
                >
                    <div className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                        {character.name}
                        <svg className={`w-3 h-3 text-zinc-600 transition-transform ${showPrompts ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex flex-col gap-0.5 mt-1">
                        <span className="truncate">Played by: {actor?.name || 'Unknown'}</span>
                        <span className="truncate">Costume: {costume?.name || 'No Costume'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-1 shrink-0">
                    <CopyButton 
                        onCopy={getCharacterJson} 
                        title="Copy Character JSON with View Prompts" 
                        className="text-zinc-600 hover:text-indigo-400 p-1 rounded hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
                    />
                    <button onClick={() => setIsEditing(true)} className="text-zinc-600 hover:text-indigo-400 p-1 rounded hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => onDelete(character.id)} className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {showPrompts && (
          <div className="space-y-1.5 pt-1 animate-in slide-in-from-top-1 duration-200">
              <div className="h-px bg-zinc-800 w-full mb-2"></div>
              {Object.entries(prompts).map(([view, prompt]) => (
                  <div key={view} className="flex items-center gap-2 bg-zinc-950/50 p-1.5 rounded border border-zinc-800/30">
                      <span className="text-[9px] font-bold uppercase text-zinc-500 w-8 tracking-wider">{view}</span>
                      <div className="flex-1 truncate text-[10px] text-zinc-600 italic select-all cursor-text" title={prompt}>
                          {prompt}
                      </div>
                      <CopyButton 
                          text={prompt}
                          className="text-zinc-600 hover:text-indigo-400 p-0.5"
                      />
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default CharacterCard;
