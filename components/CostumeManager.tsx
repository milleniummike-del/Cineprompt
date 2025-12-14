import React, { useState } from 'react';
import { Costume } from '../types';
import CostumeCard from './CostumeCard';
import CopyButton from './CopyButton';

const CostumeManager: React.FC<{
  costumes: Costume[];
  onUpdateCostumes: (costumes: Costume[]) => void;
}> = ({ costumes, onUpdateCostumes }) => {
  const [isOpen, setIsOpen] = useState(false);

  const addCostume = () => {
    const newCostume: Costume = {
      id: `cos-${Date.now()}`,
      name: '',
      description: ''
    };
    onUpdateCostumes([...costumes, newCostume]);
  };

  const updateCostume = (updated: Costume) => {
    onUpdateCostumes(costumes.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCostume = (id: string) => {
    onUpdateCostumes(costumes.filter(c => c.id !== id));
  };

  const getCostumesJson = () => {
    return JSON.stringify(costumes.map(c => ({
      name: c.name,
      description: `A full length view of a costume with no people consisting of ${c.description}`
    })), null, 2);
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-sm">
      <div 
        className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center cursor-pointer select-none rounded-t-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
          Costume Board
          <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">{costumes.length}</span>
        </h3>
        <div className="flex items-center gap-2">
          <CopyButton 
            onCopy={getCostumesJson} 
            label="JSON" 
            title="Copy Costumes List" 
            className="text-zinc-500 hover:text-indigo-400 text-[10px] font-medium bg-zinc-800/50 hover:bg-zinc-800 px-1.5 py-0.5 rounded" 
          />
          <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-black/10 rounded-b-2xl">
          <p className="text-[10px] text-zinc-500 mb-3">Outfits & Wardrobe.</p>
          <div className="flex flex-col gap-3">
            {costumes.map(cos => (
              <CostumeCard
                key={cos.id}
                costume={cos}
                onUpdate={updateCostume}
                onDelete={deleteCostume}
              />
            ))}
            
            <button 
              onClick={addCostume}
              className="border border-dashed border-zinc-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all min-h-[60px]"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <span className="text-[10px] font-semibold uppercase">Add Costume</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostumeManager;