
import JSZip from 'jszip';
import { StoryboardProject } from '../types';
import { getImageFromDB, saveImageToDB } from './dbService';

export const exportProjectAsZip = async (project: StoryboardProject) => {
  const zip = new JSZip();

  // Add project JSON
  zip.file("project.json", JSON.stringify(project, null, 2));

  const imgFolder = zip.folder("images");
  if (imgFolder) {
    // Helper to add image if exists
    const addImageToZip = async (id: string) => {
      try {
        const blob = await getImageFromDB(id);
        if (blob) {
          // Detect extension from MIME type
          let ext = 'bin';
          if (blob.type === 'image/jpeg') ext = 'jpg';
          else if (blob.type === 'image/png') ext = 'png';
          else if (blob.type === 'image/webp') ext = 'webp';
          
          imgFolder.file(`${id}.${ext}`, blob);
        }
      } catch (e) {
        console.warn(`Failed to export image for ${id}`, e);
      }
    };

    // Collect all unique image IDs from all entities
    const imageIds = new Set<string>();
    
    // Actors
    project.actors.forEach(a => imageIds.add(a.id));
    // Costumes
    project.costumes.forEach(c => imageIds.add(c.id));
    // Props
    project.props.forEach(p => imageIds.add(p.id));
    // Scenes
    project.scenes.forEach(s => imageIds.add(s.id));
    // Characters
    project.characters.forEach(c => imageIds.add(c.id));
    // Shots
    project.shots.forEach(s => imageIds.add(s.id));

    await Promise.all(Array.from(imageIds).map(id => addImageToZip(id)));
  }

  const content = await zip.generateAsync({ type: "blob" });
  
  // Trigger download
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(project.title || 'project').replace(/\s+/g, '_').replace(/[^\w\d_-]/g, '')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importProjectFromZip = async (file: File): Promise<StoryboardProject> => {
  const zip = await JSZip.loadAsync(file);
  
  const projectFile = zip.file("project.json");
  if (!projectFile) {
    throw new Error("Invalid archive: project.json missing");
  }

  const projectJson = await projectFile.async("string");
  const project: StoryboardProject = JSON.parse(projectJson);

  // Restore images
  const imgFolder = zip.folder("images");
  if (imgFolder) {
    const promises: Promise<void>[] = [];
    
    imgFolder.forEach((relativePath, fileEntry) => {
      if (!fileEntry.dir) {
          const promise = (async () => {
            const blob = await fileEntry.async("blob");
            // Extract ID from filename (remove extension)
            const id = relativePath.split('.').slice(0, -1).join('.'); 
            if (id) {
                await saveImageToDB(id, blob);
            }
          })();
          promises.push(promise);
      }
    });
    
    await Promise.all(promises);
  }

  return project;
};
