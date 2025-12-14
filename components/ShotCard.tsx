
import React from 'react';
import { Shot, StoryboardProject, Timing, CameraInstruction } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { explodeText } from '../utils/textUtils';
import CopyButton from './CopyButton';
import RichPromptEditor from './RichPromptEditor';
import CameraControlPalette from './CameraControlPalette';
import ShotDialogueEditor from './ShotDialogueEditor';

const ShotCard: React.FC<{
  shot: Shot;
  index: number;
  project: StoryboardProject;
  onUpdate: (shot: Shot) => void;
  onDelete: (id: string) => void;
}> = ({ shot, index, project, onUpdate, onDelete }) => {
  
  const isExpanded = shot.isExpanded ?? true;

  const toggleExpand = (e: React.MouseEvent) => {
    // Avoid toggling when interacting with controls inside the header
    if ((e.target as HTMLElement).closest('input, button, a')) return;
    onUpdate({ ...shot, isExpanded: !isExpanded });
  };

  const handleAddInstruction = (category: 'Shot' | 'Angle' | 'Movement', value: string, timing: Timing) => {
    const newInstruction: CameraInstruction = {
      id: `inst-${Date.now()}`,
      category,
      value,
      timing
    };
    onUpdate({
      ...shot,
      cameraInstructions: [...shot.cameraInstructions, newInstruction]
    });
  };

  const removeInstruction = (id: string) => {
    onUpdate({
      ...shot,
      cameraInstructions: shot.cameraInstructions.filter(i => i.id !== id)
    });
  };

  const updateInstructionTiming = (id: string, newTiming: string) => {
     onUpdate({
        ...shot,
        cameraInstructions: shot.cameraInstructions.map(i =>
          i.id === id ? { ...i, timing: newTiming } : i
        )
     });
  };

  const getCameraPromptsText = () => {
    if (shot.cameraInstructions.length === 0) return '';
    return shot.cameraInstructions
      .map(i => `${i.category}: ${i.value} (${i.timing})`)
      .join('\n');
  };

  // Helper to reconstruct dialogue text from structured lines
  const getDialogueText = () => {
    if (!shot.dialogueLines || shot.dialogueLines.length === 0) return '';
    return shot.dialogueLines.map(line => {
      const char = project.characters.find(c => c.id === line.characterId);
      const name = char ? char.name : 'Unknown';
      return `${name}: "${line.text}"`;
    }).join('\n');
  };

  // Helper to resolve characters, props, scenes and clean text for both Prompt and JSON outputs
  const getResolvedData = () => {
    const charIds = new Set<string>();
    const propIds = new Set<string>();
    const sceneIds = new Set<string>();
    
    // Helper to scan for tags in a given HTML string
    const scanForTags = (html: string) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      div.querySelectorAll('[data-char-id]').forEach((el) => {
        const id = el.getAttribute('data-char-id');
        if (id) charIds.add(id);
      });
      div.querySelectorAll('[data-prop-id]').forEach((el) => {
        const id = el.getAttribute('data-prop-id');
        if (id) propIds.add(id);
      });
      div.querySelectorAll('[data-scene-id]').forEach((el) => {
        const id = el.getAttribute('data-scene-id');
        if (id) sceneIds.add(id);
      });
      return div;
    };

    const sceneDiv = scanForTags(shot.initialScenePrompt);
    const actionDiv = scanForTags(shot.actionPrompt);
    
    // Add characters from Dialogue lines
    if (shot.dialogueLines) {
        shot.dialogueLines.forEach(line => {
            if (line.characterId) charIds.add(line.characterId);
        });
    }

    // Implicit matches
    const dialogText = getDialogueText();
    const combinedText = (actionDiv.innerText + " " + sceneDiv.innerText + " " + dialogText).toLowerCase();

    // Resolve Characters
    const uniqueCharIds = Array.from(charIds);
    const resolvedCharacters = uniqueCharIds.map(id => {
        const char = project.characters.find(c => c.id === id);
        if (!char) return null;
        const actor = project.actors.find(a => a.id === char.actorId);
        const costume = project.costumes.find(c => c.id === char.costumeId);
        return { character: char, actor, costume };
    }).filter(Boolean) as { character: any, actor: any, costume: any }[];

    // Resolve Props (Explicit + Implicit)
    const explicitProps = Array.from(propIds).map(id => project.props.find(p => p.id === id)).filter(Boolean);
    const implicitProps = (project.props || []).filter(p => {
        if (propIds.has(p.id)) return false;
        return combinedText.includes(p.name.toLowerCase());
    });
    const resolvedProps = Array.from(new Map([...explicitProps, ...implicitProps].map(item => [item?.id, item])).values()).filter(Boolean);

    // Resolve Scenes (Explicit + Implicit)
    const explicitScenes = Array.from(sceneIds).map(id => project.scenes.find(s => s.id === id)).filter(Boolean);
    const implicitScenes = (project.scenes || []).filter(s => {
        if (sceneIds.has(s.id)) return false;
        return combinedText.includes(s.name.toLowerCase());
    });
    const resolvedScenes = Array.from(new Map([...explicitScenes, ...implicitScenes].map(item => [item?.id, item])).values()).filter(Boolean);

    // EXPANDED TAG REPLACEMENT: Replaces tags with FULL visual descriptions
    const replaceTags = (div: HTMLElement) => {
        div.querySelectorAll('.tag-remove').forEach(el => el.remove());
        
        div.querySelectorAll('[data-char-id]').forEach(tag => {
           const id = tag.getAttribute('data-char-id');
           const char = project.characters.find(c => c.id === id);
           if (char) {
               const actor = project.actors.find(a => a.id === char.actorId);
               const costume = project.costumes.find(c => c.id === char.costumeId);
               const desc = `${char.name} (${actor?.name || 'Unknown'} - ${actor?.description || ''}, wearing ${costume?.name || 'Outfit'} - ${costume?.description || ''})`;
               tag.replaceWith(desc);
           }
        });
        
        div.querySelectorAll('[data-prop-id]').forEach(tag => {
            const id = tag.getAttribute('data-prop-id');
            const prop = project.props.find(p => p.id === id);
            if (prop) {
                tag.replaceWith(`${prop.name} (${prop.description})`);
            }
         });
         
        div.querySelectorAll('[data-scene-id]').forEach(tag => {
            const id = tag.getAttribute('data-scene-id');
            const scene = project.scenes.find(s => s.id === id);
            if (scene) {
                tag.replaceWith(`${scene.name} (${scene.description})`);
            }
         });
         
         return div.innerText.trim();
    };

    return {
        characters: resolvedCharacters,
        props: resolvedProps,
        scenes: resolvedScenes,
        sceneText: replaceTags(sceneDiv),
        actionText: replaceTags(actionDiv),
        dialogText: dialogText
    };
  };

  const getFullShotPrompt = () => {
    const data = getResolvedData();
    let prompt = "";

    // Context Headers
    if (data.characters.length > 0) {
      data.characters.forEach(({ character, actor, costume }) => {
        prompt += `Character Context: ${character.name} is played by ${actor?.name} (${actor?.description}), wearing ${costume?.name} (${costume?.description}).\n`;
      });
      prompt += '\n';
    }

    if (data.scenes.length > 0) {
        data.scenes.forEach((s: any) => {
          prompt += `Location Context: ${s.name} is ${s.description}\n`;
        });
        prompt += `\n`;
    }

    // Main Prompt
    prompt += `Scene: ${data.sceneText}\n\n`;
    prompt += `Action: ${data.actionText}\n\n`;

    if (data.dialogText) {
        prompt += `Dialogue:\n${data.dialogText}\n\n`;
    }

    // Camera Section
    const cameraText = getCameraPromptsText();
    if (cameraText) {
      prompt += `Camera:\n${cameraText}`;
    }

    return prompt.trim();
  };

  const getShotJson = () => {
      const data = getResolvedData();
      
      const jsonOutput = {
          title: shot.title,
          scene: data.sceneText,
          action: data.actionText,
          dialog: shot.dialogueLines ? shot.dialogueLines.map(line => {
             const char = project.characters.find(c => c.id === line.characterId);
             return {
                 character: char ? char.name : 'Unknown',
                 text: line.text
             }
          }) : [],
          dialogueText: data.dialogText, 
          characters: data.characters.map(c => ({
              role: c.character.name,
              actor: c.actor?.name,
              actorDescription: c.actor?.description,
              costume: c.costume?.name,
              costumeDescription: c.costume?.description
          })),
          locations: data.scenes.map((s: any) => ({
             name: s.name,
             description: s.description
          })),
          props: data.props.map((p: any) => ({
              name: p.name,
              description: p.description
          })),
          camera: shot.cameraInstructions.map(i => ({
              category: i.category,
              value: i.value,
              timing: i.timing
          }))
      };

      return JSON.stringify(jsonOutput, null, 2);
  };

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-6 shadow-2xl relative group transition-all duration-300 ${!isExpanded ? 'h-auto' : ''}`}>
      {/* Header */}
      <div 
        onClick={toggleExpand}
        className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center cursor-pointer hover:from-zinc-800/80 hover:to-zinc-900 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className={`transition-transform duration-200 text-zinc-500 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 font-bold font-mono text-sm border border-zinc-700">
            {index + 1}
          </div>
          <input 
            value={shot.title || `Scene ${index + 1}`}
            onChange={(e) => onUpdate({...shot, title: e.target.value})}
            onClick={(e) => e.stopPropagation()} 
            className="bg-transparent text-white font-semibold focus:outline-none border-b border-transparent focus:border-zinc-600 px-1 py-0.5"
            placeholder="Shot Title"
          />
        </div>
        <div className="flex items-center gap-2">
           <CopyButton 
              onCopy={getShotJson} 
              label="JSON" 
              title="Copy Shot JSON" 
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
           />
           <CopyButton 
              onCopy={getFullShotPrompt} 
              label="Prompt" 
              title="Copy Full Prompt" 
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
           />
           <div className="w-px h-5 bg-zinc-800 mx-1"></div>
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(shot.id); }} 
             className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-zinc-900"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>
      </div>

      {/* Editor Controls - Conditional Render */}
      {isExpanded && (
        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
          
          {/* 1. Initial Scene */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs uppercase font-bold text-zinc-500 block">1. Initial Scene</label>
              <CopyButton onCopy={() => explodeText(shot.initialScenePrompt, project)} />
            </div>
            <RichPromptEditor 
              html={shot.initialScenePrompt}
              onChange={(val) => onUpdate({...shot, initialScenePrompt: val})}
              placeholder="Describe location, lighting, and atmosphere (no people)..."
              project={project}
            />
          </div>

          {/* 2. Action Prompt */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs uppercase font-bold text-zinc-500 block">2. Action (Motion)</label>
              <CopyButton onCopy={() => explodeText(shot.actionPrompt, project)} />
            </div>
            <RichPromptEditor 
              html={shot.actionPrompt}
              onChange={(val) => onUpdate({...shot, actionPrompt: val})}
              placeholder="Describe movement, events, and performance..."
              project={project}
              heightClass="h-20"
            />
          </div>

          {/* 3. Dialogue */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs uppercase font-bold text-zinc-500 block">3. Dialogue</label>
              <CopyButton onCopy={() => getDialogueText()} />
            </div>
            
            <ShotDialogueEditor
              lines={shot.dialogueLines || []}
              characters={project.characters}
              onUpdateLines={(lines) => onUpdate({...shot, dialogueLines: lines})}
            />
          </div>

          {/* 4. Camera Instructions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-2">
                4. Camera & Direction
                <span className="text-[10px] font-normal bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Timeline</span>
              </label>
              
              <div className="flex items-center gap-3 bg-zinc-900/50 rounded-lg px-2 py-1 border border-zinc-800/50">
                <CopyButton text={getCameraPromptsText()} label="Camera" title="Copy Camera Instructions Only" />
              </div>
            </div>
            
            {/* Instruction List */}
            <div className="flex flex-col gap-2 mb-3 min-h-[40px] p-2 bg-zinc-900/30 rounded border border-dashed border-zinc-800">
              {shot.cameraInstructions.length === 0 && (
                 <span className="text-zinc-600 text-xs italic p-1">No camera instructions added yet.</span>
              )}
              {shot.cameraInstructions.map((inst) => (
                <div key={inst.id} className={`group flex items-center justify-between p-2 rounded border text-xs transition-colors ${CATEGORY_COLORS[inst.category] || 'bg-zinc-800 border-zinc-700'}`}>
                  <div className="flex items-center gap-2 flex-grow">
                     <span className="font-bold opacity-70 w-4">{inst.category.charAt(0)}</span>
                     <span className="font-medium">{inst.value}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <div className="flex items-center">
                        <input
                           value={inst.timing}
                           onChange={(e) => updateInstructionTiming(inst.id, e.target.value)}
                           className="bg-black/20 hover:bg-black/40 text-current px-2 py-1 rounded text-[10px] uppercase font-mono w-16 text-center border border-transparent hover:border-white/10 focus:border-white/30 focus:outline-none transition-colors"
                           placeholder="0:00"
                        />
                     </div>
                     <button onClick={() => removeInstruction(inst.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                     </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Instruction Tool */}
            <details className="group">
              <summary className="list-none cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 select-none">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                Add Camera Move / Angle
              </summary>
              <div className="pl-2">
                <CameraControlPalette onAdd={handleAddInstruction} />
              </div>
            </details>
          </div>

        </div>
      )}
    </div>
  );
};

export default ShotCard;
