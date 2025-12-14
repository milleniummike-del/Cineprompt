import React, { useState } from 'react';
import { Prop } from '../types';
import PropCard from './PropCard';
import CopyButton from './CopyButton';

const PropManager: React.FC<{
  props: Prop[];
  onUpdateProps: (props: Prop[]) => void;
}> = ({ props, onUpdateProps }) => {
  const [isOpen, setIsOpen] = useState(false);

  const addProp = () => {
    const newProp: Prop = {
      id: `prop-${Date.now()}`,
      name: '',
      description: ''
    };
    onUpdateProps([...props, newProp]);
  };

  const updateProp = (updated: Prop) => {
    onUpdateProps(props.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProp = (id: string) => {
    onUpdateProps(props.filter(p => p.id !== id));
  };

  const getPropsJson = () => {
    return JSON.stringify(props.map(p => ({
      name: p.name,
      description: `A close up well lit studio photograph against a white background of ${p.description}`
    })), null, 2);
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-sm">
      <div 
        className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center cursor-pointer select-none rounded-t-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          Prop Board
          <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">{props.length}</span>
        </h3>
        <div className="flex items-center gap-2">
          <CopyButton 
            onCopy={getPropsJson} 
            label="JSON" 
            title="Copy Props List" 
            className="text-zinc-500 hover:text-indigo-400 text-[10px] font-medium bg-zinc-800/50 hover:bg-zinc-800 px-1.5 py-0.5 rounded" 
          />
          <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-black/10 rounded-b-2xl">
          <p className="text-[10px] text-zinc-500 mb-3">Objects & Vehicles.</p>
          <div className="flex flex-col gap-3">
            {props.map(p => (
              <PropCard
                key={p.id}
                prop={p}
                onUpdate={updateProp}
                onDelete={deleteProp}
              />
            ))}
            
            <button 
              onClick={addProp}
              className="border border-dashed border-zinc-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all min-h-[60px]"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <span className="text-[10px] font-semibold uppercase">Add Prop</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropManager;