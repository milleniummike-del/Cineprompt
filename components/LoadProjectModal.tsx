import React from 'react';
import { StoryboardProject } from '../types';

const LoadProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  projects: StoryboardProject[];
  onLoad: (project: StoryboardProject) => void;
  onDelete: (id: string) => void;
}> = ({ isOpen, onClose, projects, onLoad, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Saved Projects</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No saved projects found.
            </div>
          ) : (
            projects.sort((a,b) => b.lastModified - a.lastModified).map(p => (
              <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex justify-between items-center group hover:border-zinc-700 transition-all">
                <div>
                  <h4 className="font-semibold text-zinc-200">{p.title || 'Untitled'}</h4>
                  <div className="text-xs text-zinc-500 mt-1">
                    {p.shots.length} Shots • {new Date(p.lastModified).toLocaleDateString()} {new Date(p.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onLoad(p)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors"
                  >
                    Load
                  </button>
                  <button 
                    onClick={() => onDelete(p.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors rounded hover:bg-zinc-900"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadProjectModal;
