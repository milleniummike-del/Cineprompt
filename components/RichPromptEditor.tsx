
import React, { useRef, useEffect } from 'react';
import { StoryboardProject } from '../types';

const RichPromptEditor: React.FC<{
  html: string;
  onChange: (html: string) => void;
  placeholder: string;
  project: StoryboardProject;
  heightClass?: string;
}> = ({ html, onChange, placeholder, project, heightClass = "h-24" }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync initial HTML only once or if significantly different (to avoid cursor jumps)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      // Only update if empty to prevent overwriting user typing
      if (editorRef.current.innerText.trim() === "" && html) {
          editorRef.current.innerHTML = html;
      } else if (!editorRef.current.innerHTML && !html) {
          // Both empty, do nothing
      } else if (html !== editorRef.current.innerHTML) {
          // Force update if external change (like auto-tagging) occurred and doesn't match
          // Note: This might cause cursor issues if typing, but safe for generation updates
          editorRef.current.innerHTML = html;
      }
    }
  }, [html]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    // Handle tag deletion
    const target = e.target as HTMLElement;
    if (target.classList.contains('tag-remove')) {
        const tag = target.closest('[data-char-id], [data-prop-id], [data-scene-id]');
        if (tag) {
            tag.remove();
            if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
            }
        }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const charId = e.dataTransfer.getData('application/cineprompt-char');
    const propId = e.dataTransfer.getData('application/cineprompt-prop');
    const sceneId = e.dataTransfer.getData('application/cineprompt-scene');
    
    // Helper to insert HTML at cursor/drop point
    const insertHtmlAtCursor = (html: string) => {
        if (document.caretRangeFromPoint) {
            const range = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (range) {
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }
        document.execCommand('insertHTML', false, html);
    };

    if (charId && editorRef.current) {
      const character = project.characters.find(c => c.id === charId);
      if (character) {
        const tagHtml = `<span data-char-id="${charId}" class="inline-flex items-center bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 rounded pl-1.5 pr-1 py-0.5 text-xs font-medium mx-1 select-none" contenteditable="false">${character.name}<span class="tag-remove ml-1 cursor-pointer text-indigo-400 hover:text-white hover:bg-indigo-500/40 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none text-[10px]">×</span></span>&nbsp;`;
        insertHtmlAtCursor(tagHtml);
        onChange(editorRef.current.innerHTML);
      }
    } else if (propId && editorRef.current) {
      const prop = project.props.find(p => p.id === propId);
      if (prop) {
        const tagHtml = `<span data-prop-id="${propId}" class="inline-flex items-center bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded pl-1.5 pr-1 py-0.5 text-xs font-medium mx-1 select-none" contenteditable="false">${prop.name}<span class="tag-remove ml-1 cursor-pointer text-emerald-400 hover:text-white hover:bg-emerald-500/40 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none text-[10px]">×</span></span>&nbsp;`;
        insertHtmlAtCursor(tagHtml);
        onChange(editorRef.current.innerHTML);
      }
    } else if (sceneId && editorRef.current) {
      const scene = project.scenes.find(s => s.id === sceneId);
      if (scene) {
        const tagHtml = `<span data-scene-id="${sceneId}" class="inline-flex items-center bg-orange-500/20 text-orange-200 border border-orange-500/30 rounded pl-1.5 pr-1 py-0.5 text-xs font-medium mx-1 select-none" contenteditable="false">${scene.name}<span class="tag-remove ml-1 cursor-pointer text-orange-400 hover:text-white hover:bg-orange-500/40 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none text-[10px]">×</span></span>&nbsp;`;
        insertHtmlAtCursor(tagHtml);
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      ref={editorRef}
      className={`w-full bg-zinc-900/50 border border-zinc-800 rounded p-3 text-sm text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all overflow-y-auto ${heightClass} empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600`}
      contentEditable
      onInput={handleInput}
      onClick={handleEditorClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      data-placeholder={placeholder}
      spellCheck={false}
    />
  );
};

export default RichPromptEditor;