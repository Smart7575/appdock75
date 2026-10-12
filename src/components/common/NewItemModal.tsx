/**
 * iOS Dev Hub - Global New Item Quick Creation Modal
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Lightbulb,
  FolderPlus,
  CheckSquare,
  Tag,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  IdeaCategory,
  TaskType,
  TaskPriority,
  ReleaseStatus,
  DevelopmentSubstatus,
  DEVELOPMENT_SUBSTATUSES,
} from '../../types';
import { ProjectImagePicker } from '../projects/ProjectImagePicker';

interface NewItemModalProps {
  type: 'idea' | 'project' | 'task' | 'release' | null;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  type,
  onClose,
  onNavigate,
}) => {
  const { db, activeProjectId, addIdea, addProject, addTask, addRelease } = useData();
  const { user } = useAuth();
  const bundlePrefix = (user?.settings?.bundlePrefix || 'indie').trim().toLowerCase().replace(/[^a-z0-9.-]/g, '') || 'indie';

  // Idea state
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<IdeaCategory>('Productivity');

  // Project state - strictly starts with completely empty fields
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projIcon, setProjIcon] = useState('');
  const [projBundle, setProjBundle] = useState('');
  const [projDevSubstatus, setProjDevSubstatus] = useState<DevelopmentSubstatus>('Design');

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('Feature');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Medium');
  const [taskStatusId, setTaskStatusId] = useState(db.statuses[1]?.id || 'status-todo');
  const [taskProjectId, setTaskProjectId] = useState(activeProjectId || db.projects[0]?.id || '');

  // Release state
  const [relVersion, setRelVersion] = useState('1.0.0');
  const [relBuild, setRelBuild] = useState(1);
  const [relName, setRelName] = useState('');
  const [relProjectId, setRelProjectId] = useState(activeProjectId || db.projects[0]?.id || '');

  const resetAllFields = () => {
    setIdeaTitle('');
    setIdeaDesc('');
    setIdeaCategory('Productivity');
    setProjName('');
    setProjDesc('');
    setProjIcon('');
    setProjBundle('');
    setProjDevSubstatus('Design');
    setTaskTitle('');
    setTaskType('Feature');
    setTaskPriority('Medium');
    setTaskStatusId(db.statuses[1]?.id || 'status-todo');
    setTaskProjectId(activeProjectId || db.projects[0]?.id || '');
    setRelVersion('1.0.0');
    setRelBuild(1);
    setRelName('');
    setRelProjectId(activeProjectId || db.projects[0]?.id || '');
  };

  // Reset fields to completely empty whenever modal opens or item type switches
  useEffect(() => {
    if (type) {
      resetAllFields();
    }
  }, [type, activeProjectId]);

  const handleClose = () => {
    resetAllFields();
    onClose();
  };

  if (!type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'idea') {
      addIdea({
        title: ideaTitle,
        description: ideaDesc,
        tags: ['NewIdea'],
        category: ideaCategory,
        scores: { impact: 7, effort: 5, market: 7, fun: 8 },
        status: 'New',
      });
      resetAllFields();
      onClose();
      onNavigate('ideas');
    } else if (type === 'project') {
      const bundleToUse = projBundle.trim() || `com.${bundlePrefix}.${projName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'app'}`;
      addProject({
        name: projName.trim(),
        description: projDesc.trim() || 'Custom iOS application project.',
        icon: projIcon.trim() || undefined,
        bundleId: bundleToUse,
        platforms: ['iPhone', 'iPad'],
        minIOS: 'iOS 17.0',
        stack: {
          uiFramework: 'SwiftUI',
          swiftVersion: '6.0',
          xcodeVersion: '16.1',
          minIOS: 'iOS 17.0',
        },
        status: 'In development',
        devSubstatus: projDevSubstatus || 'Design',
        dates: { startDate: new Date().toISOString().split('T')[0] },
      });
      resetAllFields();
      onClose();
      onNavigate('projects');
    } else if (type === 'task') {
      addTask({
        projectId: taskProjectId || db.projects[0]?.id,
        title: taskTitle,
        description: '',
        type: taskType,
        priority: taskPriority,
        statusId: taskStatusId,
        labels: [],
      });
      resetAllFields();
      onClose();
      onNavigate('projects');
    } else if (type === 'release') {
      addRelease({
        projectId: relProjectId || db.projects[0]?.id,
        version: relVersion,
        build: Number(relBuild),
        name: relName,
        status: 'Planned',
        notes: { rejectionLog: [] },
        locales: { 'en-US': `What's New in Version ${relVersion}:\n• Bug fixes and polish.` },
      });
      resetAllFields();
      onClose();
      onNavigate('releases');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            {type === 'idea' && <Lightbulb className="w-5 h-5 text-amber-400" />}
            {type === 'project' && <FolderPlus className="w-5 h-5 text-blue-400" />}
            {type === 'task' && <CheckSquare className="w-5 h-5 text-emerald-400" />}
            {type === 'release' && <Tag className="w-5 h-5 text-purple-400" />}
            <h3 className="text-sm font-bold text-white capitalize">New {type}</h3>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {type === 'idea' && (
            <>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Idea Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FocusDeck Pomodoro"
                  value={ideaTitle}
                  onChange={e => setIdeaTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe your idea concept..."
                  value={ideaDesc}
                  onChange={e => setIdeaDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </>
          )}

          {type === 'project' && (
            <>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lumina Camera"
                  value={projName}
                  onChange={e => {
                    const newName = e.target.value;
                    setProjName(newName);
                    if (!projBundle || projBundle.startsWith('com.') || projBundle.startsWith(`com.${bundlePrefix}.`)) {
                      const cleanSuffix = newName.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setProjBundle(cleanSuffix ? `com.${bundlePrefix}.${cleanSuffix}` : '');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Manual camera app for indie creators with live ProRes Log recording..."
                  value={projDesc}
                  onChange={e => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* App Icon / Image Picker */}
              <ProjectImagePicker
                value={projIcon}
                onChange={setProjIcon}
                projectName={projName || 'App'}
              />

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bundle Identifier</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. com.${bundlePrefix}.luminacamera`}
                  value={projBundle}
                  onChange={e => setProjBundle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">Initial Development Subphase</label>
                  <span className="text-[10px] text-blue-400 font-mono">
                    Phase {DEVELOPMENT_SUBSTATUSES.find(s => s.id === projDevSubstatus)?.step || 1} of 7
                  </span>
                </div>
                <select
                  value={projDevSubstatus}
                  onChange={e => setProjDevSubstatus(e.target.value as DevelopmentSubstatus)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {DEVELOPMENT_SUBSTATUSES.map(sub => (
                    <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                      {sub.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {DEVELOPMENT_SUBSTATUSES.find(s => s.id === projDevSubstatus)?.description}
                </p>
              </div>
            </>
          )}

          {type === 'task' && (
            <>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project</label>
                <select
                  value={taskProjectId}
                  onChange={e => setTaskProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  {db.projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add iOS 18 interactive widget"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </>
          )}

          {type === 'release' && (
            <>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project</label>
                <select
                  value={relProjectId}
                  onChange={e => setRelProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  {db.projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">SemVer Version</label>
                  <input
                    type="text"
                    required
                    value={relVersion}
                    onChange={e => setRelVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Build Number</label>
                  <input
                    type="number"
                    required
                    value={relBuild}
                    onChange={e => setRelBuild(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-slate-100"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
