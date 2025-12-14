
import React, { useState, useEffect, useRef } from 'react';
import { saveImageToDB, getImageFromDB, deleteImageFromDB } from '../services/dbService';

interface ImageUploaderProps {
  id: string;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, className = "w-64 aspect-video" }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const blob = await getImageFromDB(id);
        if (active && blob) {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        } else {
            setImageUrl(null);
        }
      } catch (e) {
        console.error("Error loading image", e);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      await saveImageToDB(id, file);
      const url = URL.createObjectURL(file);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(url);
    } catch (err) {
      console.error("Failed to upload", err);
      alert("Failed to save image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this image?")) return;
    try {
      await deleteImageFromDB(id);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className={`relative group shrink-0 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {isLoading ? (
         <div className="w-full h-full bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center">
            <svg className="animate-spin h-4 w-4 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
         </div>
      ) : imageUrl ? (
        <div className="relative w-full h-full rounded-lg overflow-hidden border border-zinc-700 cursor-pointer" onClick={triggerUpload}>
          <img src={imageUrl} alt="Asset" className="w-full h-full object-cover" />
          <button
            onClick={handleDelete}
            className="absolute top-0 right-0 bg-black/60 hover:bg-red-500/80 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove Image"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      ) : (
        <button
          onClick={triggerUpload}
          className="w-full h-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 border-dashed hover:border-zinc-600 rounded-lg flex flex-col items-center justify-center gap-1 transition-all group"
          title="Upload Image"
        >
          <svg className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span className="text-[8px] text-zinc-600 group-hover:text-zinc-400 font-medium uppercase">Img</span>
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
