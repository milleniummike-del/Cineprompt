import React from 'react';
import { Costume } from '../types';
import CopyButton from './CopyButton';

const CostumeCard: React.FC<{
  costume: Costume;
  onUpdate: (c: Costume) => void;
  onDelete: (id: string) => void;
}> = ({ costume, onUpdate, onDelete }) => {

  const getCostumeJson = () => {
    return JSON.stringify({
      name: costume.name,
      description: `A full length view of a costume with no people consisting of ${costume.description}`
    }, null, 2);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 group hover:border-zinc-700 transition-all">
      <div className="flex-grow space-y-2">
        <div className="flex justify-between items-start">
           <div className="flex-1 mr-2">
             <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Costume Name</label>
             <input 
               value={costume.name}
               onChange={(e) => onUpdate({...costume, name: e.target.value})}
               placeholder="e.g. Combat Suit"
               className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-zinc-800 focus:border-zinc-500 placeholder-zinc-700 w-full py-1"
             />
           </div>
           <div className="flex items-center gap-1 mt-1">
             <CopyButton 
                onCopy={getCostumeJson} 
                title="Copy Costume JSON" 
                className="text-zinc-600 hover:text-indigo-400 p-1 rounded hover:bg-zinc-800 transition-colors"
             />
             <button onClick={() => onDelete(costume.id)} className="text-zinc-600 hover:text-red-400 p-0.5">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
           </div>
        </div>
        <div className="relative">
           <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Description</label>
           <textarea 
              value={costume.description}
              onChange={(e) => {
                onUpdate({...costume, description: e.target.value});
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onFocus={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="e.g. Silver spacesuit with glowing accents..."
              className="w-full bg-zinc-950/50 text-xs text-zinc-400 rounded p-2 border border-zinc-800 focus:border-pink-500/50 focus:outline-none resize-none min-h-[96px] overflow-hidden"
              style={{ height: 'auto' }}
           />
        </div>
      </div>
    </div>
  );
};

export default CostumeCard;