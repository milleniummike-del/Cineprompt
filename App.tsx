
import React, { useState, useRef, useEffect } from 'react';
import { generateStoryboard, generateProjectAssets, generateSingleShot } from './services/geminiService';
import { Shot, StoryboardProject, Actor, Costume, Character, Prop, Scene } from './types';
import { autoTagText, parseDialogueStringToLines } from './utils/textUtils';
import { generatePDF } from './services/pdfService';

// Components
import ActorManager from './components/ActorManager';
import CostumeManager from './components/CostumeManager';
import PropManager from './components/PropManager';
import SceneManager from './components/SceneManager';
import CastManager from './components/CastManager';
import ShotCard from './components/ShotCard';
import LoadProjectModal from './components/LoadProjectModal';

const TREATMENT_TEMPLATE = `🎯 Logline:
A one-sentence hook that captures your story's essence

📋 Synopsis:
A brief overview of your plot (usually 1-2 paragraphs)

👥 Character Descriptions:
Focused profiles of key players

🏆 Story Arc:
The beginning, middle, and end of your narrative

🎭 Tone and Style:
Visual and Emotional Blueprint`;

export default function App() {
  const [idea, setIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [project, setProject] = useState<StoryboardProject>({
    id: `proj-${Date.now()}`,
    title: 'Untitled Project',
    originalIdea: '',
    treatment: '',
    actors: [],
    costumes: [],
    props: [],
    scenes: [],
    characters: [],
    shots: [],
    lastModified: Date.now()
  });
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedProjects, setSavedProjects] = useState<StoryboardProject[]>([]);
  
  // Settings for Generation
  const [assetCounts, setAssetCounts] = useState({
    actors: 5,
    characters: 5,
    scenes: 5,
    props: 5,
    shots: 6
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showTreatment, setShowTreatment] = useState(false);
  
  // New Shot Generation State
  const [newShotPrompt, setNewShotPrompt] = useState('');
  const [isGeneratingShot, setIsGeneratingShot] = useState(false);
  const [debugLog, setDebugLog] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved projects from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cineprompt_saves');
      if (saved) {
        setSavedProjects(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  }, []);

  const handleSaveProject = () => {
    const updatedProject = {
      ...project,
      lastModified: Date.now(),
      title: project.title === 'Untitled Project' ? (project.shots[0]?.title || 'New Project') : project.title
    };

    setProject(updatedProject); // Update current state

    const newSavedList = [...savedProjects.filter(p => p.id !== project.id), updatedProject];
    setSavedProjects(newSavedList);
    localStorage.setItem('cineprompt_saves', JSON.stringify(newSavedList));
    
    // Quick feedback
    const btn = document.getElementById('save-btn');
    if (btn) {
      const originalText = btn.innerText;
      btn.innerText = 'Saved!';
      setTimeout(() => btn.innerText = originalText, 1500);
    }
  };

  const handleRenameSavedProject = (id: string, newTitle: string) => {
    const newSavedList = savedProjects.map(p => 
      p.id === id ? { ...p, title: newTitle, lastModified: Date.now() } : p
    );
    setSavedProjects(newSavedList);
    localStorage.setItem('cineprompt_saves', JSON.stringify(newSavedList));
    
    // If currently loaded project is the one being renamed, update it too to reflect change immediately
    if (project.id === id) {
        setProject(prev => ({ ...prev, title: newTitle }));
    }
  };

  const migrateProjectData = (p: any): StoryboardProject => {
    // Basic structural migration
    const actors = p.actors || (p as any).characters || [];
    const costumes = p.costumes || [];
    const props = p.props || [];
    const scenes = p.scenes || [];
    const characters = p.characters && p.actors ? p.characters : []; // If new structure exists

    let shots: Shot[] = [];
    if (p.shots && Array.isArray(p.shots)) {
      shots = p.shots.map((s: any) => {
        // Migrate old dialog string to lines if lines don't exist
        let dialogueLines = s.dialogueLines || [];
        if (dialogueLines.length === 0 && s.dialog) {
          dialogueLines = parseDialogueStringToLines(s.dialog, characters);
        }

        return {
          ...s,
          initialScenePrompt: s.initialScenePrompt || s.initialFramePrompt || '',
          dialog: s.dialog || '',
          dialogueLines: dialogueLines
        };
      });
    }

    return {
      ...p,
      treatment: p.treatment || '',
      actors,
      costumes,
      props,
      scenes,
      characters,
      shots
    };
  };

  const handleLoadProject = (p: StoryboardProject) => {
    const migratedProject = migrateProjectData(p);
    setProject(migratedProject);
    setIdea(p.originalIdea);
    setShowLoadModal(false);
    // Auto-open treatment if it exists and idea is empty, or just to show it
    if (migratedProject.treatment && migratedProject.treatment.length > 20) {
        setShowTreatment(true);
    }
  };

  const handleDeleteSavedProject = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    const newSavedList = savedProjects.filter(p => p.id !== id);
    setSavedProjects(newSavedList);
    localStorage.setItem('cineprompt_saves', JSON.stringify(newSavedList));
  };

  const handleExportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${(project.title || 'project').replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const handlePublish = async () => {
      setIsPublishing(true);
      try {
          await generatePDF(project);
      } catch (error) {
          console.error(error);
          alert("Failed to generate PDF. Check console for details.");
      } finally {
          setIsPublishing(false);
      }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        try {
          const importedProject = JSON.parse(content);
          if (importedProject.shots && Array.isArray(importedProject.shots)) {
             const migrated = migrateProjectData(importedProject);
             setProject({
                ...migrated,
                id: migrated.id || `proj-${Date.now()}`,
             });
             setIdea(migrated.originalIdea || '');
          } else {
            alert("Invalid project file format.");
          }
        } catch (err) {
          console.error(err);
          alert("Failed to parse project file.");
        }
      }
    };
    reader.readAsText(fileObj);
    event.target.value = ''; // Reset
  };

  const handleGenerate = async () => {
    // Allow generation if either idea or treatment is present
    const hasIdea = idea.trim().length > 0;
    const hasTreatment = project.treatment && project.treatment.trim().length > 0;
    
    if (!hasIdea && !hasTreatment) return;

    setIsLoading(true);
    try {
      // Construct a comprehensive prompt using both idea and treatment
      let generationContext = idea;
      if (hasTreatment) {
        generationContext += `\n\nFILM TREATMENT:\n${project.treatment}`;
      }

      // Step 1: Generate Assets & Treatment
      const assets = await generateProjectAssets(generationContext, {
        actorCount: assetCounts.actors,
        characterCount: assetCounts.characters,
        propCount: assetCounts.props,
        sceneCount: assetCounts.scenes
      });
      
      // Step 2: Generate Storyboard using those assets
      const generatedShots = await generateStoryboard(
          generationContext, 
          assets.actors, 
          assets.costumes, 
          assets.characters, 
          assets.props, 
          assets.scenes,
          assetCounts.shots // Pass the desired shot count
      );
      
      // Step 3: Auto-tag the text
      const taggedShots = generatedShots.map(shot => ({
        ...shot,
        // Tag everything
        initialScenePrompt: autoTagText(shot.initialScenePrompt, assets.characters, assets.props, assets.scenes),
        actionPrompt: autoTagText(shot.actionPrompt, assets.characters, assets.props, assets.scenes),
        // Dialog lines are already parsed in generateStoryboard, but the legacy string might need tagging if used
        dialog: autoTagText(shot.dialog, assets.characters, assets.props, assets.scenes)
      }));

      setProject(prev => ({
        ...prev,
        title: prev.title === 'Untitled Project' ? 'New Storyboard' : prev.title,
        originalIdea: idea,
        treatment: assets.treatment, // Update with generated treatment
        actors: assets.actors,
        costumes: assets.costumes,
        props: assets.props,
        scenes: assets.scenes,
        characters: assets.characters,
        shots: taggedShots,
        lastModified: Date.now()
      }));
      
      setShowTreatment(true);

    } catch (error) {
      console.error("Error generating storyboard:", error);
      alert("Failed to generate storyboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickGenerate = async () => {
    if (!newShotPrompt.trim()) return;
    setIsGeneratingShot(true);
    setDebugLog('Generating...');
    try {
        const { shot: newShotRaw, raw } = await generateSingleShot(
            newShotPrompt, 
            project.actors, 
            project.costumes, 
            project.characters, 
            project.props, 
            project.scenes
        );
        
        setDebugLog(raw);

        // Auto-tag fields
        const newShot = {
            ...newShotRaw,
            sequenceOrder: project.shots.length + 1,
            initialScenePrompt: autoTagText(newShotRaw.initialScenePrompt, project.characters, project.props, project.scenes),
            actionPrompt: autoTagText(newShotRaw.actionPrompt, project.characters, project.props, project.scenes),
            dialog: autoTagText(newShotRaw.dialog, project.characters, project.props, project.scenes)
        };

        setProject(prev => ({
            ...prev,
            shots: [...prev.shots, newShot],
            lastModified: Date.now()
        }));
        
        setNewShotPrompt('');

    } catch (error) {
        console.error("Error generating shot:", error);
        setDebugLog(prev => prev + '\n\nERROR: ' + String(error));
        alert("Failed to generate shot.");
    } finally {
        setIsGeneratingShot(false);
    }
  };

  const handleUpdateShot = (updatedShot: Shot) => {
    setProject(prev => ({
      ...prev,
      shots: prev.shots.map(s => s.id === updatedShot.id ? updatedShot : s)
    }));
  };

  const handleDeleteShot = (id: string) => {
    setProject(prev => ({
      ...prev,
      shots: prev.shots.filter(s => s.id !== id)
    }));
  };

  const handleAddShot = () => {
    const newShot: Shot = {
      id: `shot-${Date.now()}`,
      sequenceOrder: project.shots.length + 1,
      title: `Scene ${project.shots.length + 1}`,
      initialScenePrompt: '',
      actionPrompt: '',
      dialog: '',
      dialogueLines: [],
      cameraInstructions: [],
      isExpanded: true
    };
    setProject(prev => ({ ...prev, shots: [...prev.shots, newShot] }));
  };

  // Managers
  const handleUpdateActors = (newActors: Actor[]) => {
      setProject(prev => ({ ...prev, actors: newActors }));
  };

  const handleUpdateCostumes = (newCostumes: Costume[]) => {
    setProject(prev => ({ ...prev, costumes: newCostumes }));
  };

  const handleUpdateProps = (newProps: Prop[]) => {
    setProject(prev => ({ ...prev, props: newProps }));
  };

  const handleUpdateScenes = (newScenes: Scene[]) => {
    setProject(prev => ({ ...prev, scenes: newScenes }));
  };

  const handleUpdateCharacters = (newChars: Character[]) => {
    setProject(prev => ({ ...prev, characters: newChars }));
  };

  const toggleTreatment = () => {
      setShowTreatment(!showTreatment);
      // Pre-fill if empty when opening
      if (!showTreatment && (!project.treatment || project.treatment.trim() === '')) {
          setProject(p => ({...p, treatment: TREATMENT_TEMPLATE}));
      }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-zinc-200 font-sans selection:bg-indigo-500/30">
      
      <LoadProjectModal 
        isOpen={showLoadModal} 
        onClose={() => setShowLoadModal(false)}
        projects={savedProjects}
        onLoad={handleLoadProject}
        onDelete={handleDeleteSavedProject}
        onRename={handleRenameSavedProject}
      />

      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">CP</div>
            <span className="font-bold tracking-tight text-lg">CinePrompt AI</span>
          </div>
          
          <div className="flex items-center gap-2">
             <input 
               type="file" 
               ref={fileInputRef}
               onChange={handleFileChange}
               className="hidden"
               accept=".json"
             />
             
             {/* Import/Export Group */}
             <div className="flex items-center bg-zinc-800 rounded-md p-0.5 border border-zinc-700 mr-2">
               <button 
                 onClick={handleImportClick}
                 className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                 title="Import JSON Project"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
               </button>
               <div className="w-px h-4 bg-zinc-700 mx-0.5"></div>
               <button 
                 onClick={handleExportProject}
                 className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                 title="Export JSON Project"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               </button>
             </div>

             <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="text-xs font-bold bg-white text-black hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors border border-transparent shadow-lg shadow-white/10 flex items-center gap-1.5"
             >
                {isPublishing ? (
                   <svg className="animate-spin h-3 w-3 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                )}
                Publish PDF
             </button>

             <button 
               onClick={() => setShowLoadModal(true)}
               className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md transition-colors border border-zinc-700"
             >
               Load
             </button>
             <button 
               id="save-btn"
               onClick={handleSaveProject}
               className="text-xs font-medium bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-md transition-colors"
             >
               Save
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        
        {/* Project Header / Idea Input */}
        <div className="mb-8 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-4 px-1">
             <input 
               value={project.title}
               onChange={(e) => setProject(p => ({...p, title: e.target.value}))}
               className="bg-transparent text-2xl font-bold text-white focus:outline-none border-b-2 border-transparent focus:border-zinc-700 w-full max-w-md placeholder-zinc-700"
               placeholder="Project Title"
             />
             <div className="text-xs text-zinc-600">
               {project.shots.length} shots
             </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
             <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
               <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
               Initial Concept
             </h2>
             <textarea
               value={idea}
               onChange={(e) => setIdea(e.target.value)}
               className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all resize-none text-base leading-relaxed h-24"
               placeholder="Describe your movie scene idea here (e.g., 'A cyberpunk detective walking through a rainy neon market seeking a rogue android')..."
             />

             {/* Treatment Toggle & Editor */}
             <div className="mt-3">
                <button 
                  onClick={toggleTreatment} 
                  className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                   <svg className={`w-3 h-3 transition-transform ${showTreatment ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                   {showTreatment ? 'Hide Film Treatment' : 'Add Full Film Treatment'}
                </button>
                
                {showTreatment && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                      <div className="relative">
                         <div className="absolute top-3 right-3 text-[10px] text-zinc-600 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                            Logline • Synopsis • Characters • Arc • Tone
                         </div>
                         <textarea
                            value={project.treatment}
                            onChange={(e) => setProject(p => ({...p, treatment: e.target.value}))}
                            className="w-full bg-zinc-950/80 border border-zinc-700/50 rounded-xl p-4 text-zinc-300 placeholder-zinc-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all text-sm leading-relaxed font-mono custom-scrollbar"
                            placeholder="Detailed treatment..."
                            rows={12}
                         />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 ml-1">Providing a detailed treatment helps the AI generate more consistent characters and scenes.</p>
                  </div>
                )}
             </div>
             
             {/* Settings Panel */}
             <div className="mt-4 border-t border-zinc-800 pt-3">
               <button 
                 onClick={() => setShowSettings(!showSettings)}
                 className="text-xs flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors font-medium mb-3"
               >
                  <svg className={`w-3.5 h-3.5 transition-transform ${showSettings ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Generation Settings
               </button>
               
               {showSettings && (
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-black/20 p-4 rounded-lg animate-in slide-in-from-top-2">
                   {[
                     { label: 'Actors', key: 'actors' },
                     { label: 'Characters', key: 'characters' },
                     { label: 'Scenes', key: 'scenes' },
                     { label: 'Props', key: 'props' },
                     { label: 'Shots', key: 'shots' },
                   ].map(({ label, key }) => (
                     <div key={key}>
                       <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">{label}</label>
                       <div className="flex items-center">
                         <input
                           type="number"
                           min="1"
                           max="20"
                           value={(assetCounts as any)[key]}
                           onChange={(e) => setAssetCounts(prev => ({ ...prev, [key]: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) }))}
                           className="bg-zinc-950 border border-zinc-700 rounded-l px-3 py-1.5 text-sm w-full focus:outline-none focus:border-indigo-500 text-center"
                         />
                         <div className="flex flex-col border-y border-r border-zinc-700 rounded-r bg-zinc-900">
                           <button 
                              onClick={() => setAssetCounts(prev => ({ ...prev, [key]: Math.min(20, (prev as any)[key] + 1) }))}
                              className="px-2 hover:bg-zinc-800 text-[8px] text-zinc-400 border-b border-zinc-700 h-1/2 flex items-center"
                           >▲</button>
                           <button 
                              onClick={() => setAssetCounts(prev => ({ ...prev, [key]: Math.max(1, (prev as any)[key] - 1) }))}
                              className="px-2 hover:bg-zinc-800 text-[8px] text-zinc-400 h-1/2 flex items-center"
                           >▼</button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             <div className="mt-4 flex justify-end">
               <button
                 onClick={handleGenerate}
                 disabled={isLoading || (!idea.trim() && !project.treatment?.trim())}
                 className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
               >
                 {isLoading ? (
                   <>
                     <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Directing AI...
                   </>
                 ) : (
                   'Generate Ideas'
                 )}
               </button>
             </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
            {/* Left Sidebar - Boards */}
            <div 
              className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 flex flex-col gap-6 
                         lg:sticky lg:top-[5rem] lg:h-[calc(100vh-6rem)] lg:overflow-y-auto 
                         custom-scrollbar lg:pb-10 lg:pr-1 z-40"
            >
               <div className="flex items-center gap-2 text-zinc-500 border-b border-zinc-800 pb-2 mb-2 bg-[#0f0f10]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f0f10]/60 sticky top-0 z-10 lg:static">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                   <span className="text-sm font-bold uppercase tracking-wider">Assets & Boards</span>
               </div>

               {/* Cast (Linked Characters) Manager */}
               <CastManager
                  actors={project.actors}
                  costumes={project.costumes}
                  characters={project.characters}
                  onUpdateCharacters={handleUpdateCharacters}
               />

               {/* Scene Manager */}
               <SceneManager
                  scenes={project.scenes || []}
                  onUpdateScenes={handleUpdateScenes}
               />

               {/* Prop Manager */}
               <PropManager
                  props={project.props || []}
                  onUpdateProps={handleUpdateProps}
               />

               {/* Actor Manager */}
               <ActorManager 
                 actors={project.actors} 
                 onUpdateActors={handleUpdateActors}
               />

               {/* Costume Manager */}
               <CostumeManager 
                  costumes={project.costumes} 
                  onUpdateCostumes={handleUpdateCostumes}
               />
            </div>

            {/* Right Content - Storyboard List */}
            <div className="flex-grow w-full space-y-6">
              <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    Storyboard Sequence
                    <span className="text-sm font-normal text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">{project.shots.length} shots</span>
                  </h3>
                  <button 
                    onClick={handleAddShot}
                    className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors border border-zinc-700"
                  >
                    + Add Empty Shot
                  </button>
              </div>
              
              {project.shots.length === 0 && !isLoading && (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl opacity-50">
                  <svg className="w-16 h-16 mx-auto mb-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
                  <p className="text-zinc-500 text-lg">Your storyboard is empty.</p>
                  <p className="text-zinc-600 text-sm mt-1">Enter an idea above to get started or add a shot manually.</p>
                </div>
              )}

              {project.shots.map((shot, idx) => (
                <ShotCard 
                  key={shot.id} 
                  index={idx} 
                  shot={shot} 
                  project={project}
                  onUpdate={handleUpdateShot} 
                  onDelete={handleDeleteShot}
                />
              ))}

              {/* AI Shot Generator */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-6 shadow-xl">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      Generate Next Shot
                  </h3>
                  <div className="flex gap-3 items-start">
                      <textarea
                          value={newShotPrompt}
                          onChange={(e) => setNewShotPrompt(e.target.value)}
                          placeholder="Describe what happens next..."
                          className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 min-h-[80px] resize-y"
                      />
                      <button
                          onClick={handleQuickGenerate}
                          disabled={isGeneratingShot || !newShotPrompt.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors flex flex-col items-center justify-center gap-1 min-w-[100px] h-[80px]"
                      >
                          {isGeneratingShot ? (
                               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                          ) : (
                               <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                  <span>Generate</span>
                               </>
                          )}
                      </button>
                  </div>
              </div>

               {/* Debug Section */}
                {debugLog && (
                    <div className="mt-8 bg-black border border-red-900/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-red-500 font-mono text-xs font-bold">DEBUG: Last Add Shot Response</h3>
                             <button onClick={() => setDebugLog('')} className="text-[10px] text-zinc-600 hover:text-red-400">Clear</button>
                        </div>
                        <textarea 
                            className="w-full h-64 bg-zinc-950 text-zinc-400 font-mono text-[10px] p-2 border border-zinc-800 rounded focus:outline-none"
                            value={debugLog}
                            readOnly
                        />
                    </div>
                )}

            </div>
        </div>

      </main>
    </div>
  );
}
