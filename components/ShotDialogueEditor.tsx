
import React from 'react';
import { DialogueLine, Character } from '../types';

const ShotDialogueEditor: React.FC<{
  lines: DialogueLine[];
  characters: Character[];
  onUpdateLines: (lines: DialogueLine[]) => void;
}> = ({ lines, characters, onUpdateLines }) => {

  const handleAddLine = () => {
    onUpdateLines([
      ...lines,
      {
        id: `dlg-${Date.now()}`,
        characterId: '',
        text: ''
      }
    ]);
  };

  const handleUpdateLine = (id: string, updates: Partial<DialogueLine>) => {
    onUpdateLines(lines.map(line => 
      line.id === id ? { ...line, ...updates } : line
    ));
  };

  const handleDeleteLine = (id: string) => {
    onUpdateLines(lines.filter(line => line.id !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {lines.length === 0 && (
        <div className="text-zinc-600 text-xs italic p-2 text-center border border-dashed border-zinc-800 rounded">
          No dialogue. Click "Add Line" to start.
        </div>
      )}
      
      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={line.id} className="flex gap-2 items-start bg-zinc-900/50 p-2 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors group">
            <div className="w-1/3 min-w-[120px] max-w-[200px]">
               <select
                 value={line.characterId}
                 onChange={(e) => handleUpdateLine(line.id, { characterId: e.target.value })}
                 className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
               >
                 <option value="">Select Character...</option>
                 {characters.map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
            </div>
            
            <div className="flex-grow">
               <textarea
                 value={line.text}
                 onChange={(e) => handleUpdateLine(line.id, { text: e.target.value })}
                 placeholder="Dialogue line..."
                 className="w-full bg-transparent text-sm text-zinc-300 focus:outline-none placeholder-zinc-600 resize-none h-[32px] min-h-[32px] py-1 border-b border-transparent focus:border-zinc-700 transition-colors"
                 rows={1}
                 // Auto-expand height simplistic approach
                 onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                 }}
               />
            </div>

            <button 
              onClick={() => handleDeleteLine(line.id)}
              className="text-zinc-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
              title="Delete line"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={handleAddLine}
        className="self-start mt-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
      >
         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
         Add Line
      </button>
    </div>
  );
};

export default ShotDialogueEditor;
