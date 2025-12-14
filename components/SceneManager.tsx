import React, { useState } from 'react';
import { Scene } from '../types';
import SceneCard from './SceneCard';
import CopyButton from './CopyButton';

const SceneManager: React.FC<{
  scenes: Scene[];
  onUpdateScenes: (scenes: Scene[]) => void;
}> = ({ scenes, onUpdateScenes }) => {
  const [isOpen, setIsOpen] = useState(false);

  const addScene = () => {
    const newScene: Scene = {
      id: `scn-${Date.now()}`,
      name: '',
      description: ''
    };
    onUpdateScenes([...scenes, newScene]);
  };

  const updateScene = (updated: Scene) => {
    onUpdateScenes(scenes.map(s => s.id === updated.id ? updated : s));
  };

  const deleteScene = (id: string) => {
    onUpdateScenes(scenes.filter(s => s.id !== id));
  };

  const getScenesJson = () => {
    return JSON.stringify(scenes.map(s => ({
      name: s.name,
      description: `A detailed cinematic view of a location with no people: ${s.description}`
    })), null, 2);
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-sm">
      <div 
        className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center cursor-pointer select-none rounded-t-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          Scene Board
          <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">{scenes.length}</span>
        </h3>
        <div className="flex items-center gap-2">
          <CopyButton 
            onCopy={getScenesJson} 
            label="JSON" 
            title="Copy Scenes List" 
            className="text-zinc-500 hover:text-indigo-400 text-[10px] font-medium bg-zinc-800/50 hover:bg-zinc-800 px-1.5 py-0.5 rounded" 
          />
          <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-black/10 rounded-b-2xl">
          <p className="text-[10px] text-zinc-500 mb-3">Locations & Sets.</p>
          <div className="flex flex-col gap-3">
            {scenes.map(s => (
              <SceneCard
                key={s.id}
                scene={s}
                onUpdate={updateScene}
                onDelete={deleteScene}
              />
            ))}
            
            <button 
              onClick={addScene}
              className="border border-dashed border-zinc-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all min-h-[60px]"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <span className="text-[10px] font-semibold uppercase">Add Scene</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneManager;