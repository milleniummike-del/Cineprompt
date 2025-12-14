import React, { useState } from 'react';
import { Timing } from '../types';
import { SHOT_TYPES, CAMERA_ANGLES, CAMERA_MOVEMENTS, TIMING_OPTIONS } from '../constants';

const CameraControlPalette: React.FC<{ 
  onAdd: (category: 'Shot' | 'Angle' | 'Movement', value: string, timing: Timing) => void 
}> = ({ onAdd }) => {
  const [activeTab, setActiveTab] = useState<'Shot' | 'Angle' | 'Movement'>('Shot');
  const [selectedTiming, setSelectedTiming] = useState<Timing>('0:00');

  const getOptions = () => {
    switch (activeTab) {
      case 'Shot': return SHOT_TYPES;
      case 'Angle': return CAMERA_ANGLES;
      case 'Movement': return CAMERA_MOVEMENTS;
      default: return [];
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden mt-2">
      <div className="flex border-b border-zinc-800">
        {['Shot', 'Angle', 'Movement'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
              activeTab === tab 
                ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="p-3 bg-zinc-900">
        <div className="mb-3 flex items-center space-x-2 text-xs">
          <span className="text-zinc-500 uppercase font-bold">Timing:</span>
          <div className="flex flex-wrap gap-1">
            {TIMING_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTiming(t)}
                className={`px-2 py-0.5 rounded-full border transition-all ${
                  selectedTiming === t 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
          {getOptions().map((opt) => (
            <button
              key={opt}
              onClick={() => onAdd(activeTab, opt, selectedTiming)}
              className="text-left px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 border border-transparent hover:border-zinc-600 text-zinc-300 text-xs transition-all truncate"
              title={opt}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CameraControlPalette;
