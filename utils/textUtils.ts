
import { StoryboardProject, Character, Prop, Scene, DialogueLine } from '../types';

export const explodeText = (html: string, project: StoryboardProject): string => {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Remove tag-remove buttons before processing
  tempDiv.querySelectorAll('.tag-remove').forEach(el => el.remove());

  // Find all character tags
  const tags = tempDiv.querySelectorAll('[data-char-id]');
  tags.forEach(tag => {
    const charId = tag.getAttribute('data-char-id');
    const character = project.characters.find(c => c.id === charId);
    if (character) {
      const actor = project.actors.find(a => a.id === character.actorId);
      const costume = project.costumes.find(c => c.id === character.costumeId);
      
      let description = character.name;
      if (actor && costume) {
        description = `${actor.name} (${actor.description}) wearing ${costume.name} (${costume.description})`;
      } else if (actor) {
        description = `${actor.name} (${actor.description})`;
      }
      
      // Replace the tag with the exploded text
      tag.replaceWith(description);
    }
  });

  // Find all prop tags
  const propTags = tempDiv.querySelectorAll('[data-prop-id]');
  propTags.forEach(tag => {
    const propId = tag.getAttribute('data-prop-id');
    const prop = project.props.find(p => p.id === propId);
    if (prop) {
      // Replace with Prop Name + Description
      tag.replaceWith(`${prop.name} (${prop.description})`);
    }
  });

  // Find all scene tags
  const sceneTags = tempDiv.querySelectorAll('[data-scene-id]');
  sceneTags.forEach(tag => {
    const sceneId = tag.getAttribute('data-scene-id');
    const scene = project.scenes.find(s => s.id === sceneId);
    if (scene) {
      // Replace with Scene Name + Description
      tag.replaceWith(`${scene.name} (${scene.description})`);
    }
  });

  return tempDiv.innerText;
};

export const autoTagText = (text: string, characters: Character[], props: Prop[], scenes: Scene[] = []): string => {
  let taggedText = text;
  
  // 1. Tag Characters
  // Sort characters by name length (descending) to match longest names first 
  const sortedChars = [...characters].sort((a, b) => b.name.length - a.name.length);
  
  sortedChars.forEach(char => {
    const regex = new RegExp(`\\b${char.name}\\b`, 'g'); 
    if (regex.test(taggedText)) {
      const tagHtml = `<span data-char-id="${char.id}" class="inline-flex items-center bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 rounded pl-1.5 pr-1 py-0.5 text-xs font-medium mx-1 select-none" contenteditable="false">${char.name}<span class="tag-remove ml-1 cursor-pointer text-indigo-400 hover:text-white hover:bg-indigo-500/40 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none text-[10px]">×</span></span>&nbsp;`;
      taggedText = taggedText.replace(regex, tagHtml);
    }
  });

  // 2. Tag Scenes (Locations)
  const sortedScenes = [...scenes].sort((a, b) => b.name.length - a.name.length);
  sortedScenes.forEach(scene => {
    const regex = new RegExp(`\\b${scene.name}\\b`, 'g');
    taggedText = taggedText.replace(regex, (match, offset, string) => {
        // Simple check to avoid replacing inside existing tags
        const prefix = string.substring(Math.max(0, offset - 20), offset);
        if (prefix.includes('<span') && !prefix.includes('>')) return match; 
        
        return `<span data-scene-id="${scene.id}" class="inline-flex items-center bg-orange-500/20 text-orange-200 border border-orange-500/30 rounded pl-1.5 pr-1 py-0.5 text-xs font-medium mx-1 select-none" contenteditable="false">${scene.name}<span class="tag-remove ml-1 cursor-pointer text-orange-400 hover:text-white hover:bg-orange-500/40 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none text-[10px]">×</span></span>&nbsp;`;
    });
  });

  // 3. Tag Props
  const sortedProps = [...props].sort((a, b) => b.name.length - a.name.length);

  sortedProps.forEach(prop => {
    const regex = new RegExp(`\\b${prop.name}\\b`, 'g');
    
    taggedText = taggedText.replace(regex, (match, offset, string) => {
        // Very basic check: look for opening < immediately before without >
        const prefix = string.substring(Math.max(0, offset - 20), offset);
        if (prefix.includes('<span') && !prefix.includes('>')) return match; // Likely inside a tag definition
        
        return `<span data-prop-id="${prop.id}" class="inline-flex items-center bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded pl-1.5 pr-1 py-0.5 text-xs font-medium mx-1 select-none" contenteditable="false">${prop.name}<span class="tag-remove ml-1 cursor-pointer text-emerald-400 hover:text-white hover:bg-emerald-500/40 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none text-[10px]">×</span></span>&nbsp;`;
    });
  });

  return taggedText;
};

// New Helper: Parse raw text/HTML string into DialogueLine[]
export const parseDialogueStringToLines = (text: string, characters: Character[]): DialogueLine[] => {
  if (!text) return [];

  // Remove HTML tags to process raw text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  const rawText = tempDiv.innerText;

  const lines: DialogueLine[] = [];
  
  // Split by newlines
  const rawLines = rawText.split(/\n+/);

  rawLines.forEach((lineStr, index) => {
    const trimmed = lineStr.trim();
    if (!trimmed) return;

    // Pattern: "CHARACTER NAME: Dialogue content"
    const match = trimmed.match(/^([^:]+):\s*(.*)$/);
    
    if (match) {
      const charName = match[1].trim();
      const content = match[2].trim().replace(/^"|"$/g, ''); // Remove surrounding quotes

      // Find character ID
      const character = characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
      
      lines.push({
        id: `dlg-${Date.now()}-${index}`,
        characterId: character ? character.id : '',
        text: content
      });
    } else {
      // No clear character prefix, add as generic line
      lines.push({
        id: `dlg-${Date.now()}-${index}`,
        characterId: '', // Unknown/Generic
        text: trimmed
      });
    }
  });

  return lines;
};
