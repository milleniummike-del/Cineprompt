import React from 'react';
import { Prop } from '../types';
import CopyButton from './CopyButton';
import ImageUploader from './ImageUploader';

const PropCard: React.FC<{
  prop: Prop;
  onUpdate: (p: Prop) => void;
  onDelete: (id: string) => void;
}> = ({ prop, onUpdate, onDelete }) => {
  
  const handleDragStart = (e: React.DragEvent) => {
    // Prevent drag if interacting with inputs directly to allow text selection
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
       return;
    }
    
    e.dataTransfer.setData('application/cineprompt-prop', prop.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getPropJson = () => {
    return JSON.stringify({
      name: prop.name,
      description: `A close up well lit studio photograph against a white background of ${prop.description}`
    }, null, 2);
  };

  return (
    <div 
      draggable="true"
      onDragStart={handleDragStart}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 group hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing relative"
    >
      {/* Visual Drag Handle Hint */}
      <div className="absolute top-2 right-2 text-zinc-700 group-hover:text-zinc-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </div>

      <div className="flex gap-3">
        <ImageUploader id={prop.id} />

        <div className="flex-grow space-y-2 min-w-0">
          <div className="flex justify-between items-start pr-6">
             <div className="flex-1 mr-2 min-w-0">
               <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Prop Name</label>
               <input 
                 value={prop.name}
                 onChange={(e) => onUpdate({...prop, name: e.target.value})}
                 placeholder="e.g. Glowing Orb"
                 className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-zinc-800 focus:border-emerald-500 placeholder-zinc-700 w-full py-1"
               />
             </div>
          </div>
          <div className="relative">
             <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Visual Details</label>
             <textarea 
                value={prop.description}
                onChange={(e) => {
                  onUpdate({...prop, description: e.target.value});
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="e.g. Ancient metallic sphere with pulsing blue light..."
                className="w-full bg-zinc-950/50 text-xs text-zinc-400 rounded p-2 border border-zinc-800 focus:border-emerald-500/50 focus:outline-none resize-none min-h-[80px] overflow-hidden"
                style={{ height: 'auto' }}
             />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-zinc-800 pt-2">
         <CopyButton 
            onCopy={getPropJson} 
            title="Copy Prop JSON" 
            className="text-zinc-600 hover:text-indigo-400 p-1 rounded hover:bg-zinc-800 transition-colors"
         />
         <button 
           onClick={() => onDelete(prop.id)} 
           className="text-xs text-zinc-600 hover:text-red-400 flex items-center gap-1 py-1 px-2 rounded hover:bg-zinc-800 transition-colors"
         >
           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
           Delete Prop
         </button>
      </div>
    </div>
  );
};

export default PropCard;