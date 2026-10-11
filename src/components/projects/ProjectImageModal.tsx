import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Project } from '../../types';
import { useData } from '../../context/DataContext';
import { ProjectImagePicker } from './ProjectImagePicker';

interface ProjectImageModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectImageModal: React.FC<ProjectImageModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const { updateProject } = useData();
  const [selectedImage, setSelectedImage] = useState(project?.icon || '');

  React.useEffect(() => {
    if (project) {
      setSelectedImage(project.icon || '');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSave = () => {
    updateProject(project.id, { icon: selectedImage });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">
              App Icon & Visual Artwork
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update artwork for <span className="text-slate-200 font-semibold">{project.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ProjectImagePicker
          value={selectedImage}
          onChange={setSelectedImage}
          projectName={project.name}
          label="App Icon Displayed on Tiles"
          description="This image appears on Released Project tiles, App Store cards, and your project overview."
        />

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Save App Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
