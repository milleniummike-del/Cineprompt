
import { jsPDF } from "jspdf";
import { StoryboardProject } from "../types";
import { getImageFromDB } from "./dbService";
import { autoTagText } from "../utils/textUtils";

// Constants for layout
const MARGIN = 20;
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const LINE_HEIGHT = 7;

// Image Constants (Double Size 16:9)
const IMG_WIDTH = 150; // Large width
const IMG_HEIGHT = 84.375; // 16:9 aspect ratio

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const expandTags = (html: string, project: StoryboardProject): string => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  
  // Remove the little 'x' buttons first
  tmp.querySelectorAll('.tag-remove').forEach(e => e.remove());
  
  // Expand Characters
  tmp.querySelectorAll('[data-char-id]').forEach(tag => {
     const id = tag.getAttribute('data-char-id');
     const char = project.characters.find(c => c.id === id);
     if (char) {
         const actor = project.actors.find(a => a.id === char.actorId);
         const costume = project.costumes.find(c => c.id === char.costumeId);
         // Format: Name (Actor Desc, Costume Desc)
         const actorDesc = actor ? `${actor.name} - ${actor.description}` : 'Unknown Actor';
         const costumeDesc = costume ? `${costume.name} - ${costume.description}` : 'Unknown Costume';
         const desc = `${char.name} (${actorDesc}, wearing ${costumeDesc})`;
         tag.replaceWith(desc);
     }
  });
  
  // Expand Props
  tmp.querySelectorAll('[data-prop-id]').forEach(tag => {
      const id = tag.getAttribute('data-prop-id');
      const prop = project.props.find(p => p.id === id);
      if (prop) {
          tag.replaceWith(`${prop.name} (${prop.description})`);
      }
   });
   
  // Expand Scenes
  tmp.querySelectorAll('[data-scene-id]').forEach(tag => {
      const id = tag.getAttribute('data-scene-id');
      const scene = project.scenes.find(s => s.id === id);
      if (scene) {
          tag.replaceWith(`${scene.name} (${scene.description})`);
      }
   });

  return tmp.textContent || tmp.innerText || "";
};

export const generatePDF = async (project: StoryboardProject) => {
  const doc = new jsPDF();
  let cursorY = MARGIN;

  const checkPageBreak = (heightNeeded: number) => {
    if (cursorY + heightNeeded > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      cursorY = MARGIN;
      return true;
    }
    return false;
  };

  const addHeader = (text: string, size = 16) => {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.text(text, MARGIN, cursorY);
    cursorY += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const addText = (text: string, label?: string, color: [number, number, number] = [0, 0, 0]) => {
    if (!text) return;
    doc.setTextColor(color[0], color[1], color[2]);
    
    if (label) {
        checkPageBreak(LINE_HEIGHT);
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", MARGIN, cursorY);
        doc.setFont("helvetica", "normal");
        
        const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 30);
        checkPageBreak(lines.length * 5);
        doc.text(lines as any, MARGIN + 30, cursorY);
        cursorY += (lines.length * 5) + 2;
    } else {
        const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
        checkPageBreak(lines.length * 5);
        doc.text(lines as any, MARGIN, cursorY);
        cursorY += (lines.length * 5) + 2;
    }
    doc.setTextColor(0, 0, 0); // Reset
  };

  // --- Title Page ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  const titleLines = doc.splitTextToSize(project.title, CONTENT_WIDTH);
  doc.text(titleLines as any, PAGE_WIDTH / 2, cursorY + 20, { align: 'center' });
  cursorY += 40;

  if (project.originalIdea) {
      addHeader("Concept", 14);
      addText(project.originalIdea);
      cursorY += 10;
  }

  // Treatment parsing
  if (project.treatment) {
     addHeader("Treatment", 14);
     
     // Robust emoji removal: removes standard ranges and specific template emojis
     const cleanTreatment = project.treatment
        .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
        .replace(/[🎯📋👥🏆🎭]/g, '')
        .trim();
     
     const treatmentLines = doc.splitTextToSize(cleanTreatment, CONTENT_WIDTH);
     checkPageBreak(treatmentLines.length * 5);
     doc.text(treatmentLines as any, MARGIN, cursorY);
     cursorY += (treatmentLines.length * 5) + 20;
  } else {
      cursorY += 20;
  }
  
  doc.addPage();
  cursorY = MARGIN;

  // --- Actors Section ---
  addHeader("Cast (Actors)", 18);
  cursorY += 5;

  for (const actor of project.actors) {
      checkPageBreak(IMG_HEIGHT + 40); // Check if image + text block fits
      
      let imgData = null;
      try {
          const blob = await getImageFromDB(actor.id);
          if (blob) imgData = await blobToBase64(blob);
      } catch (e) {}

      // Image centered
      const imgX = MARGIN + (CONTENT_WIDTH - IMG_WIDTH) / 2;

      if (imgData) {
          try {
              // 16:9 Double Size
              doc.addImage(imgData, "JPEG", imgX, cursorY, IMG_WIDTH, IMG_HEIGHT, undefined, 'FAST');
          } catch(e) {}
      } else {
          doc.setDrawColor(200, 200, 200);
          doc.rect(imgX, cursorY, IMG_WIDTH, IMG_HEIGHT);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("No Img", imgX + (IMG_WIDTH/2) - 5, cursorY + (IMG_HEIGHT/2));
      }
      cursorY += IMG_HEIGHT + 5;

      // Text below image
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(actor.name, MARGIN, cursorY + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(actor.description, CONTENT_WIDTH);
      doc.text(descLines as any, MARGIN, cursorY + 12);
      doc.setTextColor(0, 0, 0);

      cursorY += (descLines.length * 5) + 25;
  }

  doc.addPage();
  cursorY = MARGIN;

  // --- Characters Section ---
  addHeader("Character Roles", 18);
  cursorY += 5;

  for (const char of project.characters) {
      checkPageBreak(IMG_HEIGHT + 50);
      
      const actor = project.actors.find(a => a.id === char.actorId);
      const costume = project.costumes.find(c => c.id === char.costumeId);
      
      let imgData = null;
      try {
          const blob = await getImageFromDB(char.id);
          if (blob) imgData = await blobToBase64(blob);
      } catch (e) { console.error(e); }

      const imgX = MARGIN + (CONTENT_WIDTH - IMG_WIDTH) / 2;
      
      if (imgData) {
          try {
              doc.addImage(imgData, "JPEG", imgX, cursorY, IMG_WIDTH, IMG_HEIGHT, undefined, 'FAST');
          } catch (e) {
              doc.rect(imgX, cursorY, IMG_WIDTH, IMG_HEIGHT);
          }
      } else {
          doc.setDrawColor(200, 200, 200);
          doc.rect(imgX, cursorY, IMG_WIDTH, IMG_HEIGHT);
      }
      cursorY += IMG_HEIGHT + 5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(char.name, MARGIN, cursorY + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      cursorY += 12;

      const infoLines = [
          `Played by: ${actor?.name || 'Unknown'}`,
          `Costume: ${costume?.name || 'Unknown'}`,
      ];
      doc.text(infoLines as any, MARGIN, cursorY);
      cursorY += 15;

      if (actor || costume) {
          const desc = `${actor?.description || ''} wearing ${costume?.description || ''}`.trim();
          if (desc) {
              const descLines = doc.splitTextToSize(desc, CONTENT_WIDTH);
              doc.setTextColor(80, 80, 80);
              doc.setFontSize(9);
              doc.text(descLines as any, MARGIN, cursorY);
              doc.setTextColor(0, 0, 0);
              doc.setFontSize(10);
              cursorY += (descLines.length * 4);
          }
      }

      cursorY += 20;
  }

  doc.addPage();
  cursorY = MARGIN;

  // --- Scenes Section ---
  addHeader("Scenes & Locations", 18);
  cursorY += 5;

  for (const scene of project.scenes) {
      checkPageBreak(IMG_HEIGHT + 40);
      
      let imgData = null;
      try {
          const blob = await getImageFromDB(scene.id);
          if (blob) imgData = await blobToBase64(blob);
      } catch (e) {}

      const imgX = MARGIN + (CONTENT_WIDTH - IMG_WIDTH) / 2;

      if (imgData) {
          try {
              doc.addImage(imgData, "JPEG", imgX, cursorY, IMG_WIDTH, IMG_HEIGHT, undefined, 'FAST');
          } catch(e) {}
      } else {
          doc.setDrawColor(200, 200, 200);
          doc.rect(imgX, cursorY, IMG_WIDTH, IMG_HEIGHT);
      }
      cursorY += IMG_HEIGHT + 5;

      doc.setFont("helvetica", "bold");
      doc.text(scene.name, MARGIN, cursorY + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(scene.description, CONTENT_WIDTH);
      doc.text(descLines as any, MARGIN, cursorY + 12);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      cursorY += (descLines.length * 4) + 25;
  }

  // --- Props Section ---
  checkPageBreak(80); 
  addHeader("Key Props", 16);
  cursorY += 5;

  for (const prop of project.props) {
      checkPageBreak(IMG_HEIGHT + 40);
      
      let imgData = null;
      try {
          const blob = await getImageFromDB(prop.id);
          if (blob) imgData = await blobToBase64(blob);
      } catch (e) {}

      const imgX = MARGIN + (CONTENT_WIDTH - IMG_WIDTH) / 2;

      if (imgData) {
          try {
             doc.addImage(imgData, "JPEG", imgX, cursorY, IMG_WIDTH, IMG_HEIGHT, undefined, 'FAST');
          } catch(e) {}
      } else {
          doc.setDrawColor(220, 220, 220);
          doc.rect(imgX, cursorY, IMG_WIDTH, IMG_HEIGHT);
      }
      cursorY += IMG_HEIGHT + 5;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(prop.name, MARGIN, cursorY + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(prop.description, CONTENT_WIDTH);
      doc.text(descLines as any, MARGIN, cursorY + 12);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      cursorY += (descLines.length * 4) + 25;
  }


  doc.addPage();
  cursorY = MARGIN;

  // --- Storyboard Shots ---
  addHeader("Storyboard Sequence", 18);
  cursorY += 5;

  project.shots.forEach((shot, index) => {
      checkPageBreak(60);
      
      // Shot Header
      doc.setFillColor(240, 240, 240);
      doc.rect(MARGIN, cursorY, CONTENT_WIDTH, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`#${index + 1}  ${shot.title || 'Untitled Shot'}`, MARGIN + 2, cursorY + 5.5);
      cursorY += 12;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      // Content Columns
      const leftColX = MARGIN;
      const rightColX = MARGIN + (CONTENT_WIDTH / 2) + 5;
      const colWidth = (CONTENT_WIDTH / 2) - 5;
      
      const startY = cursorY;

      // Left Col: Scene & Action
      doc.setFont("helvetica", "bold");
      doc.text("Visuals:", leftColX, cursorY);
      cursorY += 4;
      doc.setFont("helvetica", "normal");

      // Auto-tag text first to capture untagged/implicit scenes, then expand them
      const sceneText = "SCENE: " + expandTags(autoTagText(shot.initialScenePrompt || "", project.characters, project.props, project.scenes), project);
      const actionText = "ACTION: " + expandTags(autoTagText(shot.actionPrompt || "", project.characters, project.props, project.scenes), project);
      
      const sceneLines: string[] = doc.splitTextToSize(sceneText, colWidth);
      doc.text(sceneLines as any, leftColX, cursorY);
      cursorY += (sceneLines.length * 4) + 2;

      const actionLines: string[] = doc.splitTextToSize(actionText, colWidth);
      doc.text(actionLines as any, leftColX, cursorY);
      cursorY += (actionLines.length * 4) + 4;
      
      const leftY = cursorY;
      
      // Right Col: Audio & Camera
      cursorY = startY;
      
      doc.setFont("helvetica", "bold");
      doc.text("Audio & Camera:", rightColX, cursorY);
      cursorY += 4;
      doc.setFont("helvetica", "normal");
      
      // Dialogue
      if (shot.dialogueLines && shot.dialogueLines.length > 0) {
          shot.dialogueLines.forEach(l => {
             const char = project.characters.find(c => c.id === l.characterId);
             const line = `${char ? char.name : 'Unknown'}: "${l.text}"`;
             const dLines: string[] = doc.splitTextToSize(line, colWidth);
             doc.text(dLines as any, rightColX, cursorY);
             cursorY += (dLines.length * 4);
          });
          cursorY += 2;
      } else if (shot.dialog) {
          const dLines: string[] = doc.splitTextToSize(shot.dialog, colWidth);
          doc.text(dLines as any, rightColX, cursorY);
          cursorY += (dLines.length * 4) + 2;
      }

      // Camera
      if (shot.cameraInstructions.length > 0) {
          doc.setTextColor(100, 100, 100);
          shot.cameraInstructions.forEach(inst => {
              const cLine = `[${inst.category}] ${inst.value} (${inst.timing})`;
              doc.text(cLine, rightColX, cursorY);
              cursorY += 4;
          });
          doc.setTextColor(0, 0, 0);
      }
      
      cursorY = Math.max(leftY, cursorY) + 10;
      
      // Separator
      doc.setDrawColor(220, 220, 220);
      doc.line(MARGIN, cursorY - 5, PAGE_WIDTH - MARGIN, cursorY - 5);
  });

  doc.save(`${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
};
