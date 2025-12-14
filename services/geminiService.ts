
import { GoogleGenAI, Type } from "@google/genai";
import { Shot, Actor, Costume, Character, Prop, Scene, DialogueLine } from '../types';
import { parseDialogueStringToLines } from '../utils/textUtils';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

// Robust JSON extractor that handles markdown, extra text, and multiple objects
const extractJson = (text: string) => {
  // 1. Try generic JSON.parse first (fast path)
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue
  }

  // 2. Strip markdown code blocks
  let cleanText = text.replace(/```json\s*|```/gi, '').trim();
  
  // 3. Try parsing cleaned text
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // Continue
  }

  // 4. Brace counting extractor
  const findJsonString = (str: string, startChar: string, endChar: string) => {
     let startIndex = str.indexOf(startChar);
     if (startIndex === -1) return null;

     let balance = 0;
     let inString = false;
     let escape = false;

     for (let i = startIndex; i < str.length; i++) {
       const char = str[i];

       if (escape) {
         escape = false;
         continue;
       }

       if (char === '\\') {
         escape = true;
         continue;
       }

       if (char === '"') {
         inString = !inString;
         continue;
       }

       if (!inString) {
         if (char === startChar) {
           balance++;
         } else if (char === endChar) {
           balance--;
           if (balance === 0) {
             return str.substring(startIndex, i + 1);
           }
         }
       }
     }
     return null;
  };

  // Try extracting object or array
  const objectMatch = findJsonString(cleanText, '{', '}');
  const arrayMatch = findJsonString(cleanText, '[', ']');

  // Determine which one starts first or exists
  let candidate = null;
  const objIdx = objectMatch ? cleanText.indexOf(objectMatch) : -1;
  const arrIdx = arrayMatch ? cleanText.indexOf(arrayMatch) : -1;

  if (objectMatch && arrayMatch) {
    candidate = objIdx < arrIdx ? objectMatch : arrayMatch;
  } else {
    candidate = objectMatch || arrayMatch;
  }

  if (candidate) {
    try {
        return JSON.parse(candidate);
    } catch (e) {
        console.warn("Extracted JSON but failed to parse:", e);
        // Last ditch effort: Try to sanitize newlines in strings which is a common failure
        try {
            const sanitized = candidate.replace(/\n/g, "\\n");
            return JSON.parse(sanitized);
        } catch (e2) {
             // throw or return null
        }
    }
  }
  
  throw new Error("Could not extract or parse JSON");
};

// Helper to safely parse JSON that might be wrapped in markdown or contain extra text
const safeJsonParse = (text: string, fallback: any) => {
  if (!text) return fallback;
  try {
    return extractJson(text);
  } catch (e) {
    console.error("Failed to parse JSON response. Text length:", text?.length, "Error:", e);
    // Return fallback instead of crashing
    return fallback;
  }
};

export const generateProjectAssets = async (
  idea: string,
  options: {
    actorCount?: number;
    characterCount?: number;
    propCount?: number;
    sceneCount?: number;
  } = {}
): Promise<{
  actors: Actor[],
  costumes: Costume[],
  props: Prop[],
  scenes: Scene[],
  characters: Character[],
  treatment: string
}> => {
  const {
    actorCount = 5,
    characterCount = 5,
    propCount = 5,
    sceneCount = 5
  } = options;

  const ai = getAiClient();
  const prompt = `
    Analyze the following movie idea and create a detailed Film Treatment, along with a creative cast of characters, actors, costumes, props, and scenes.
    
    1. Create a Film Treatment including:
       - Logline: A one-sentence hook.
       - Synopsis: A brief overview (1-2 paragraphs).
       - Character Profiles: Focused profiles of key players.
       - Story Arc: The beginning, middle, and end.
       - Tone and Style: Visual and emotional blueprint.

    2. Create ${actorCount} distinct Actors. IMPORTANT: Their names MUST be simple, generic real-world names (e.g. "John Smith", "Sarah Jones"), NOT story character names. Provide detailed physical descriptions including age, specific ethnicity, hair color/style, eye color, height/body type, and distinct facial features.
    3. Create ${characterCount} distinct Costumes with names and visual descriptions.
    4. Create ${propCount} significant Props (items, weapons, vehicles, or artifacts) with names and visual details.
    5. Create ${sceneCount} distinct Scene (Location/Environment) with name and visual description. This should describe the place WITHOUT people.
    6. Create ${characterCount} distinct Characters (Roles) by combining an Actor and a Costume. Give the Character a distinct Role Name (e.g. "The Hero", "The Villain", "The Detective").

    STRICT CONSTRAINTS:
    - Keep descriptions concise (max 40 words).
    - Avoid flowery language.
    - Output pure JSON.

    Movie Idea: "${idea}"
  `;

  // We keep responseSchema here as it's usually stable for simple lists
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.5,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          treatment: {
            type: Type.OBJECT,
            properties: {
              logline: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              characterProfiles: { type: Type.STRING },
              storyArc: { type: Type.STRING },
              toneAndStyle: { type: Type.STRING }
            }
          },
          actors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          costumes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          props: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                roleName: { type: Type.STRING },
                actorName: { type: Type.STRING },
                costumeName: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const data = safeJsonParse(response.text || "{}", { 
      treatment: {},
      actors: [], 
      costumes: [], 
      props: [], 
      scenes: [], 
      characters: [] 
  });
  
  const timestamp = Date.now();

  const treatmentObj = data.treatment || {};
  const treatment = `🎯 Logline:
${treatmentObj.logline || ''}

📋 Synopsis:
${treatmentObj.synopsis || ''}

👥 Character Descriptions:
${treatmentObj.characterProfiles || ''}

🏆 Story Arc:
${treatmentObj.storyArc || ''}

🎭 Tone and Style:
${treatmentObj.toneAndStyle || ''}`;

  const actors: Actor[] = (data.actors || []).map((a: any, i: number) => ({
    id: `act-${timestamp}-${i}`,
    name: a.name,
    description: a.description
  }));

  const costumes: Costume[] = (data.costumes || []).map((c: any, i: number) => ({
    id: `cos-${timestamp}-${i}`,
    name: c.name,
    description: c.description
  }));

  const props: Prop[] = (data.props || []).map((p: any, i: number) => ({
    id: `prop-${timestamp}-${i}`,
    name: p.name,
    description: p.description
  }));

  const scenes: Scene[] = (data.scenes || []).map((s: any, i: number) => ({
    id: `scn-${timestamp}-${i}`,
    name: s.name,
    description: s.description
  }));

  const characters: Character[] = (data.characters || []).map((char: any, i: number) => {
    // Attempt to match names, fallback to first index if name match fails
    const actor = actors.find(a => a.name === char.actorName) || actors[i % actors.length];
    const costume = costumes.find(c => c.name === char.costumeName) || costumes[i % costumes.length];
    
    return {
      id: `char-${timestamp}-${i}`,
      name: char.roleName,
      actorId: actor ? actor.id : '',
      costumeId: costume ? costume.id : ''
    };
  }).filter((c: Character) => c.actorId && c.costumeId);

  return { actors, costumes, props, scenes, characters, treatment };
};

export const generateStoryboard = async (
  idea: string, 
  actors: Actor[], 
  costumes: Costume[],
  characters: Character[],
  props: Prop[] = [],
  scenes: Scene[] = []
): Promise<Shot[]> => {
  const ai = getAiClient();
  
  let context = "";
  if (actors && actors.length > 0) {
    context += "\n\nAVAILABLE ACTORS (Do not use these names directly, use the Role Names below):\n" + 
      actors.map(a => `- ${a.name}: ${a.description}`).join('\n');
  }

  if (costumes && costumes.length > 0) {
    context += "\n\nWARDROBE / COSTUMES:\n" + 
      costumes.map(c => `- ${c.name}: ${c.description}`).join('\n');
  }

  if (props && props.length > 0) {
    context += "\n\nKEY PROPS (Incorporate these into the scene where relevant):\n" + 
      props.map(p => `- ${p.name}: ${p.description}`).join('\n');
  }

  if (scenes && scenes.length > 0) {
    context += "\n\nLOCATIONS / SCENES (Use these for the initialScenePrompt):\n" + 
      scenes.map(s => `- ${s.name}: ${s.description}`).join('\n');
  }

  if (characters && characters.length > 0) {
    context += "\n\nDEFINED ROLES (Use these names in your prompts):\n";
    characters.forEach(char => {
      const actor = actors.find(a => a.id === char.actorId);
      const costume = costumes.find(c => c.id === char.costumeId);
      if (actor && costume) {
        context += `- Name: "${char.name}" (is played by actor ${actor.name} wearing ${costume.name})\n`;
      }
    });
  }

  const prompt = `
    Act as a professional cinematographer and director. 
    Break down the following movie idea into a sequence of exactly 1 distinct storyboard shot.
    ${context}

    IMPORTANT: When describing characters in "actionPrompt", YOU MUST use the exact Role Names provided in the "DEFINED ROLES" list (e.g. "${characters.map(c => c.name).join('", "')}"). Do not use the Actor names directly.

    STRICT CONSTRAINTS:
    - Titles must be very short (max 5 words).
    - Descriptions must be concise (max 30 words per field).
    - DO NOT write long paragraphs.
    - Output valid JSON ARRAY.

    For each shot, provide a JSON object with:
    1. "title" (e.g., "The Setup").
    2. "initialScenePrompt": A visual description of the static starting frame location. DESCRIBE THE SET ONLY. DO NOT INCLUDE ANY CHARACTERS OR PEOPLE IN THIS FIELD.
    3. "actionPrompt": A description of the movement and action. Characters enter or perform actions here. Use Role Names.
    4. "dialogue": An array of objects, each with "speaker" and "text".
    5. "cameraInstructions": An array of objects, each with "category" (Shot/Angle/Movement), "value", and "timing" (e.g. "0:00").

    Movie Idea: "${idea}"
    
    RESPONSE FORMAT:
    [
      {
        "title": "...",
        "initialScenePrompt": "...",
        "actionPrompt": "...",
        "dialogue": [{"speaker": "...", "text": "..."}],
        "cameraInstructions": [{"category": "Shot", "value": "Wide", "timing": "0:00"}]
      }
    ]
  `;

  // Removed strict schema to prevent 21 21... loops on complex nested structures
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.6,
      // responseMimeType: 'application/json', // Disabled to allow natural JSON generation
      // responseSchema: ... // Disabled
    }
  });

  let rawShots = safeJsonParse(response.text || '[]', []);

  // Ensure rawShots is an array
  if (!Array.isArray(rawShots)) {
    // Attempt to recover if the model returned an object wrapping the array
    const possibleArray = Object.values(rawShots).find(val => Array.isArray(val));
    if (possibleArray) {
      rawShots = possibleArray;
    } else {
      console.warn("AI response was not an array:", rawShots);
      // Fallback: if it's a single object (Shot), wrap in array
      if (rawShots && typeof rawShots === 'object' && rawShots.title) {
        rawShots = [rawShots];
      } else {
        rawShots = [];
      }
    }
  }

  return rawShots.map((s: any, index: number) => {
    
    // Process Structured Dialogue
    let dialogueLines: DialogueLine[] = [];
    if (Array.isArray(s.dialogue)) {
        dialogueLines = s.dialogue.map((d: any, i: number) => {
            const speakerName = d.speaker || '';
            const char = characters.find(c => c.name.toLowerCase() === speakerName.toLowerCase());
            return {
                id: `dlg-${Date.now()}-${index}-${i}`,
                characterId: char ? char.id : '', // Empty if not found/generic
                text: d.text || ''
            };
        });
    } else if (s.dialog) {
        // Fallback to legacy parsing if model output simple string
        dialogueLines = parseDialogueStringToLines(s.dialog, characters);
    }

    // Reconstruct string for legacy support
    const dialogText = dialogueLines.map(l => {
        const char = characters.find(c => c.id === l.characterId);
        return `${char ? char.name : 'Unknown'}: "${l.text}"`;
    }).join('\n');

    return {
      id: `shot-${Date.now()}-${index}`,
      sequenceOrder: index + 1,
      title: s.title || `Shot ${index + 1}`,
      initialScenePrompt: s.initialScenePrompt || '',
      actionPrompt: s.actionPrompt || '',
      dialog: dialogText, // Use reconstructed text
      dialogueLines: dialogueLines,
      // Defensive check: ensure cameraInstructions is an array before mapping
      cameraInstructions: (Array.isArray(s.cameraInstructions) ? s.cameraInstructions : []).map((c: any, i: number) => ({
        id: `cam-${Date.now()}-${index}-${i}`,
        category: c.category || 'Shot',
        value: c.value || 'Wide',
        timing: c.timing || '0:00'
      })),
      isExpanded: true
    };
  });
};

export const generateSingleShot = async (
  shotPrompt: string, 
  actors: Actor[], 
  costumes: Costume[],
  characters: Character[],
  props: Prop[] = [],
  scenes: Scene[] = []
): Promise<{ shot: Shot; raw: string }> => {
  const ai = getAiClient();
  
  let context = "";
  if (actors && actors.length > 0) {
    context += "\n\nAVAILABLE ACTORS (Do not use these names directly, use the Role Names below):\n" + 
      actors.map(a => `- ${a.name}: ${a.description}`).join('\n');
  }

  if (costumes && costumes.length > 0) {
    context += "\n\nWARDROBE / COSTUMES:\n" + 
      costumes.map(c => `- ${c.name}: ${c.description}`).join('\n');
  }

  if (props && props.length > 0) {
    context += "\n\nKEY PROPS (Incorporate these into the scene where relevant):\n" + 
      props.map(p => `- ${p.name}: ${p.description}`).join('\n');
  }

  if (scenes && scenes.length > 0) {
    context += "\n\nLOCATIONS / SCENES (Use these for the initialScenePrompt):\n" + 
      scenes.map(s => `- ${s.name}: ${s.description}`).join('\n');
  }

  if (characters && characters.length > 0) {
    context += "\n\nDEFINED ROLES (Use these names in your prompts):\n";
    characters.forEach(char => {
      const actor = actors.find(a => a.id === char.actorId);
      const costume = costumes.find(c => c.id === char.costumeId);
      if (actor && costume) {
        context += `- Name: "${char.name}" (is played by actor ${actor.name} wearing ${costume.name})\n`;
      }
    });
  }

  const prompt = `
    Act as a professional cinematographer. 
    Create a single detailed storyboard shot based on the following description: "${shotPrompt}"
    
    ${context}

    IMPORTANT: When describing characters in "actionPrompt", YOU MUST use the exact Role Names provided in the "DEFINED ROLES" list (e.g. "${characters.map(c => c.name).join('", "')}"). Do not use the Actor names directly.

    STRICT CONSTRAINTS:
    - Titles must be very short (max 5 words).
    - Descriptions must be concise (max 30 words per field).
    - DO NOT write long paragraphs.
    - Output valid JSON.

    Provide a JSON object with the following fields:
    1. "title"
    2. "initialScenePrompt" (visual description of static set only, NO people)
    3. "actionPrompt" (action description with characters)
    4. "dialogue" (array of {speaker, text})
    5. "cameraInstructions" (array of {category, value, timing})
    
    Example Structure:
    {
       "title": "...",
       "initialScenePrompt": "...",
       "actionPrompt": "...",
       "dialogue": [...],
       "cameraInstructions": [...]
    }
  `;

  // Removed strict schema to prevent token loops
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.6,
      // responseMimeType: 'application/json', // Disabled
      // responseSchema: ... // Disabled
    }
  });

  const rawText = response.text || '{}';
  const s = safeJsonParse(rawText, {});
  const index = Date.now(); // Temp index replacement

  // Process Structured Dialogue
  let dialogueLines: DialogueLine[] = [];
  if (Array.isArray(s.dialogue)) {
      dialogueLines = s.dialogue.map((d: any, i: number) => {
          const speakerName = d.speaker || '';
          const char = characters.find(c => c.name.toLowerCase() === speakerName.toLowerCase());
          return {
              id: `dlg-${index}-${i}`,
              characterId: char ? char.id : '',
              text: d.text || ''
          };
      });
  }

  const dialogText = dialogueLines.map(l => {
      const char = characters.find(c => c.id === l.characterId);
      return `${char ? char.name : 'Unknown'}: "${l.text}"`;
  }).join('\n');

  const shot: Shot = {
    id: `shot-${index}`,
    sequenceOrder: 999, // Placeholder, should be set by consumer
    title: s.title || 'New Shot',
    initialScenePrompt: s.initialScenePrompt || '',
    actionPrompt: s.actionPrompt || '',
    dialog: dialogText,
    dialogueLines: dialogueLines,
    cameraInstructions: (Array.isArray(s.cameraInstructions) ? s.cameraInstructions : []).map((c: any, i: number) => ({
      id: `cam-${index}-${i}`,
      category: c.category || 'Shot',
      value: c.value || 'Wide',
      timing: c.timing || '0:00'
    })),
    isExpanded: true
  };

  return { shot, raw: rawText };
};
