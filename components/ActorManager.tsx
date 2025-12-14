import React, { useState } from 'react';
import { Actor } from '../types';
import ActorCard from './ActorCard';
import CopyButton from './CopyButton';

const ActorManager: React.FC<{
  actors: Actor[];
  onUpdateActors: (actors: Actor[]) => void;
}> = ({ actors, onUpdateActors }) => {
  const [isOpen, setIsOpen] = useState(false);

  const addActor = () => {
    const newActor: Actor = {
      id: `act-${Date.now()}`,
      name: '',
      description: ''
    };
    onUpdateActors([...actors, newActor]);
  };

  const updateActor = (updated: Actor) => {
    onUpdateActors(actors.map(a => a.id === updated.id ? updated : a));
  };

  const deleteActor = (id: string) => {
    onUpdateActors(actors.filter(a => a.id !== id));
  };

  const getActorsJson = () => {
    return JSON.stringify(actors.map(a => ({
      name: a.name,
      description: `A full head and shoulder portrait well lit shot against a white background of ${a.description} wearing a simple white t-shirt`
    })), null, 2);
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-sm">
      <div 
        className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center cursor-pointer select-none rounded-t-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          Actor Board
          <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">{actors.length}</span>
        </h3>
        <div className="flex items-center gap-2">
          <CopyButton 
            onCopy={getActorsJson} 
            label="JSON" 
            title="Copy Actors List" 
            className="text-zinc-500 hover:text-indigo-400 text-[10px] font-medium bg-zinc-800/50 hover:bg-zinc-800 px-1.5 py-0.5 rounded" 
          />
          <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-black/10 rounded-b-2xl">
          <p className="text-[10px] text-zinc-500 mb-3">Physical appearance definitions.</p>
          <div className="flex flex-col gap-3">
            {actors.map(actor => (
              <ActorCard
                key={actor.id}
                actor={actor}
                onUpdate={updateActor}
                onDelete={deleteActor}
              />
            ))}
            
            <button 
              onClick={addActor}
              className="border border-dashed border-zinc-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all min-h-[60px]"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <span className="text-[10px] font-semibold uppercase">Add Actor</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActorManager;