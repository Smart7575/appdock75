/**
 * iOS Dev Hub - Projects Workspace & Kanban Board
 * Fully implements PRD Sections 8.3 & 8.4:
 * - Tabs: Overview, Board (Kanban), Tasks, Notes & Docs, Releases, Assets, Checklists, Activity
 * - Custom workflow statuses with WIP limits
 * - Touch & iPad friendly card moves
 * - Swimlanes (by priority or label)
 * - Subtasks checklist & task time logging
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Columns,
  List,
  FileText,
  Tag,
  Image as ImageIcon,
  CheckSquare,
  Activity,
  Calendar,
  Layers,
  ChevronRight,
  MoreVertical,
  ExternalLink,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  ShieldAlert,
  Camera,
  Cloud,
  Database,
  Globe,
  Apple,
  Store,
  Check,
  Link2,
  Save,
  HardDrive,
  Folder,
  Copy,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  Project,
  Task,
  TaskType,
  TaskPriority,
  ProjectPlatform,
  DevelopmentSubstatus,
  DEVELOPMENT_SUBSTATUSES,
  ProjectColor,
  calculateSubphaseProgress,
  ProjectCustomInfo,
} from '../../types';
import { DEFAULT_CHECKLIST_TEMPLATE } from '../../services/storage';
import { DevSubstatusPipeline } from './DevSubstatusPipeline';
import { ProjectImagePicker } from './ProjectImagePicker';
import { ProjectImageModal } from './ProjectImageModal';
import { getProjectColorTheme, PROJECT_COLOR_THEMES } from '../../utils/projectColors';

interface ProjectsViewProps {
  onNavigate: (view: string) => void;
  onOpenNewModal: (type: 'idea' | 'project' | 'task' | 'release') => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onNavigate,
  onOpenNewModal,
}) => {
  const {
    db,
    activeProjectId,
    setActiveProjectId,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleSubtask,
    addSubtask,
    logTaskTime,
    keepItemAsMine,
    toggleChecklist,
    resetChecklist,
  } = useData();

  // Active Tab inside Project
  const [activeTab, setActiveTab] = useState<
    'overview' | 'checklists' | 'tasks' | 'board' | 'notes' | 'releases' | 'assets' | 'activity'
  >('overview');

  // Kanban filters & options
  const [boardSearch, setBoardSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [swimlaneMode, setSwimlaneMode] = useState<'none' | 'priority' | 'type'>('none');

  // Task modal & edit
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickStatusTarget, setQuickStatusTarget] = useState<string>('status-todo');

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'Feature' as TaskType,
    priority: 'Medium' as TaskPriority,
    statusId: 'status-todo',
    labels: '',
    dueDate: '',
    releaseId: '',
  });

  // Project edit modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    icon: '',
    color: undefined as ProjectColor | undefined,
    bundleId: 'com.indie.app',
    platforms: ['iPhone', 'iPad'] as ProjectPlatform[],
    minIOS: 'iOS 17.0',
    uiFramework: 'SwiftUI' as 'SwiftUI' | 'UIKit' | 'Hybrid',
    swiftVersion: '6.0',
    xcodeVersion: '16.1',
    status: 'In development' as const,
    devSubstatus: 'Design' as DevelopmentSubstatus,
  });

  // Notes editor
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Active project selection
  const currentProject = useMemo(() => {
    return db.projects.find(p => p.id === activeProjectId) || db.projects[0];
  }, [db.projects, activeProjectId]);

  // Project Resources & External Links state
  const [resProjectFolder, setResProjectFolder] = useState('');
  const [resOneDriveUrl, setResOneDriveUrl] = useState('');
  const [resExternalDiskPath, setResExternalDiskPath] = useState('');
  const [showDualFolderFields, setShowDualFolderFields] = useState(false);
  const [resDatabaseName, setResDatabaseName] = useState('');
  const [resDatabaseUrl, setResDatabaseUrl] = useState('');
  const [resVercelUrl, setResVercelUrl] = useState('');
  const [resAppStoreConnectUrl, setResAppStoreConnectUrl] = useState('');
  const [resAppStoreUrl, setResAppStoreUrl] = useState('');
  const [resCustomLinks, setResCustomLinks] = useState<ProjectCustomInfo[]>([]);
  const [resSavedFeedback, setResSavedFeedback] = useState(false);
  const [finderToast, setFinderToast] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      const oneDrive = currentProject.oneDriveUrl || '';
      const extDisk = currentProject.externalDiskPath || '';
      setResOneDriveUrl(oneDrive);
      setResExternalDiskPath(extDisk);
      setResProjectFolder(oneDrive || extDisk || '');
      setResDatabaseName(currentProject.databaseName || '');
      setResDatabaseUrl(currentProject.databaseUrl || '');
      setResVercelUrl(currentProject.vercelUrl || '');
      setResAppStoreConnectUrl(currentProject.appStoreConnectUrl || '');
      setResAppStoreUrl(currentProject.appStoreUrl || '');
      setResCustomLinks(currentProject.customLinks || []);
    }
  }, [currentProject?.id]);

  const handleSaveResources = (
    customLinksOverride?: ProjectCustomInfo[],
    fieldOverrides?: {
      projectFolder?: string;
      oneDriveUrl?: string;
      externalDiskPath?: string;
      databaseName?: string;
      databaseUrl?: string;
      vercelUrl?: string;
      appStoreConnectUrl?: string;
      appStoreUrl?: string;
    }
  ) => {
    if (!currentProject) return;
    const linksToSave = customLinksOverride !== undefined ? customLinksOverride : resCustomLinks;

    let computedOneDrive = resOneDriveUrl.trim();
    let computedExtDisk = resExternalDiskPath.trim();

    if (fieldOverrides?.oneDriveUrl !== undefined) {
      computedOneDrive = fieldOverrides.oneDriveUrl.trim();
    }
    if (fieldOverrides?.externalDiskPath !== undefined) {
      computedExtDisk = fieldOverrides.externalDiskPath.trim();
    }
    if (fieldOverrides?.projectFolder !== undefined) {
      const folderVal = fieldOverrides.projectFolder.trim();
      if (!folderVal) {
        computedOneDrive = '';
        computedExtDisk = '';
      } else if (folderVal.startsWith('http://') || folderVal.startsWith('https://')) {
        computedOneDrive = folderVal;
        computedExtDisk = '';
      } else {
        computedExtDisk = folderVal;
        computedOneDrive = '';
      }
    }

    updateProject(currentProject.id, {
      oneDriveUrl: computedOneDrive,
      externalDiskPath: computedExtDisk,
      databaseName: (fieldOverrides?.databaseName !== undefined ? fieldOverrides.databaseName : resDatabaseName).trim(),
      databaseUrl: (fieldOverrides?.databaseUrl !== undefined ? fieldOverrides.databaseUrl : resDatabaseUrl).trim(),
      vercelUrl: (fieldOverrides?.vercelUrl !== undefined ? fieldOverrides.vercelUrl : resVercelUrl).trim(),
      appStoreConnectUrl: (fieldOverrides?.appStoreConnectUrl !== undefined ? fieldOverrides.appStoreConnectUrl : resAppStoreConnectUrl).trim(),
      appStoreUrl: (fieldOverrides?.appStoreUrl !== undefined ? fieldOverrides.appStoreUrl : resAppStoreUrl).trim(),
      customLinks: linksToSave,
    });
    setResSavedFeedback(true);
    setTimeout(() => setResSavedFeedback(false), 2500);
  };

  const handleOpenFolder = (targetVal?: string) => {
    const raw = (targetVal !== undefined ? targetVal : (resProjectFolder || resOneDriveUrl || resExternalDiskPath)).trim();
    if (!raw) return;

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      window.open(raw, '_blank', 'noreferrer');
    } else {
      const cleanPath = raw.replace(/^file:\/\//, '');
      const fileUrl = raw.startsWith('file://') ? raw : `file://${raw.startsWith('/') ? '' : '/'}${raw}`;

      try {
        navigator.clipboard.writeText(cleanPath);
        setFinderToast('Path copied to clipboard! In Finder, press ⌘+Shift+G to jump to folder.');
        setTimeout(() => setFinderToast(null), 4000);
      } catch {}

      const a = document.createElement('a');
      a.href = fileUrl;
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleCopyFolderPath = (targetVal?: string) => {
    const raw = (targetVal !== undefined ? targetVal : (resProjectFolder || resExternalDiskPath || resOneDriveUrl)).trim();
    if (!raw) return;
    const cleanPath = raw.replace(/^file:\/\//, '');
    try {
      navigator.clipboard.writeText(cleanPath);
      setFinderToast('Path copied to clipboard! In Finder, press ⌘+Shift+G to jump to folder.');
      setTimeout(() => setFinderToast(null), 4000);
    } catch {}
  };

  const handleOpenInFinder = () => {
    handleOpenFolder(resExternalDiskPath || resProjectFolder);
  };

  const handleCopyFinderPath = () => {
    handleCopyFolderPath(resExternalDiskPath || resProjectFolder);
  };

  const handleAddCustomInfoRow = () => {
    const newRow: ProjectCustomInfo = {
      id: `info-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: '',
      url: '',
      notes: '',
    };
    const updated = [...resCustomLinks, newRow];
    setResCustomLinks(updated);
    handleSaveResources(updated);
  };

  const handleUpdateCustomInfoRow = (id: string, field: 'title' | 'url' | 'notes', value: string) => {
    const updated = resCustomLinks.map(row => (row.id === id ? { ...row, [field]: value } : row));
    setResCustomLinks(updated);
  };

  const handleRemoveCustomInfoRow = (id: string) => {
    const updated = resCustomLinks.filter(row => row.id !== id);
    setResCustomLinks(updated);
    handleSaveResources(updated);
  };

  // Tasks belonging to current project
  const projectTasks = useMemo(() => {
    if (!currentProject) return [];
    return db.tasks.filter(t => t.projectId === currentProject.id);
  }, [db.tasks, currentProject]);

  const filteredTasks = useMemo(() => {
    return projectTasks.filter(t => {
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (boardSearch) {
        const q = boardSearch.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchLabel = t.labels.some(l => l.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchLabel) return false;
      }
      return true;
    });
  }, [projectTasks, typeFilter, priorityFilter, boardSearch]);

  const releasesForProject = useMemo(() => {
    if (!currentProject) return [];
    return db.releases.filter(r => r.projectId === currentProject.id);
  }, [db.releases, currentProject]);

  const projectChecklists = useMemo(() => {
    if (!currentProject) return [];
    const items = db.checklists.filter(c => c.projectId === currentProject.id);
    // Default to clean, completely unchecked items for newly started projects based on active template
    const templateToUse = db.checklistTemplate && db.checklistTemplate.length > 0
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    if (items.length > 0) {
      // Sort existing project checklist items according to template order
      return [...items].sort((a, b) => {
        const indexA = templateToUse.findIndex(t => a.id.includes(t.id) || (a.title === t.title && a.category === t.category));
        const indexB = templateToUse.findIndex(t => b.id.includes(t.id) || (b.title === t.title && b.category === t.category));
        const posA = indexA === -1 ? 9999 : indexA;
        const posB = indexB === -1 ? 9999 : indexB;
        return posA - posB;
      });
    }

    return templateToUse.map(c => ({
      ...c,
      id: `chk-${currentProject.id}-${c.id}`,
      projectId: currentProject.id,
      done: false,
    }));
  }, [db.checklists, db.checklistTemplate, currentProject]);

  const completedChecklistCount = projectChecklists.filter(c => c.done).length;
  const checklistPercent = projectChecklists.length > 0 ? Math.round((completedChecklistCount / projectChecklists.length) * 100) : 0;

  const openNewTaskModal = (statusId = 'status-todo') => {
    setSelectedTask(null);
    setTaskForm({
      title: '',
      description: '',
      type: 'Feature',
      priority: 'Medium',
      statusId,
      labels: '',
      dueDate: '',
      releaseId: releasesForProject[0]?.id || '',
    });
    setIsEditingTask(true);
  };

  const openEditTaskModal = (task: Task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      statusId: task.statusId,
      labels: task.labels.join(', '),
      dueDate: task.dueDate || '',
      releaseId: task.releaseId || '',
    });
    setIsEditingTask(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    const labels = taskForm.labels.split(',').map(l => l.trim()).filter(Boolean);

    if (selectedTask) {
      updateTask(selectedTask.id, {
        title: taskForm.title,
        description: taskForm.description,
        type: taskForm.type,
        priority: taskForm.priority,
        statusId: taskForm.statusId,
        labels,
        dueDate: taskForm.dueDate || undefined,
        releaseId: taskForm.releaseId || undefined,
      });
    } else {
      addTask({
        projectId: currentProject.id,
        title: taskForm.title,
        description: taskForm.description,
        type: taskForm.type,
        priority: taskForm.priority,
        statusId: taskForm.statusId,
        labels,
        dueDate: taskForm.dueDate || undefined,
        releaseId: taskForm.releaseId || undefined,
      });
    }
    setIsEditingTask(false);
    setSelectedTask(null);
  };

  const handleQuickAddTask = (statusId: string) => {
    if (!quickTaskTitle.trim() || !currentProject) return;
    addTask({
      projectId: currentProject.id,
      title: quickTaskTitle.trim(),
      description: '',
      type: 'Feature',
      priority: 'Medium',
      statusId,
      labels: [],
    });
    setQuickTaskTitle('');
  };

  const openProjectSettings = () => {
    if (!currentProject) return;
    setProjectForm({
      name: currentProject.name,
      description: currentProject.description,
      icon: currentProject.icon || '',
      color: currentProject.color,
      bundleId: currentProject.bundleId,
      platforms: currentProject.platforms,
      minIOS: currentProject.minIOS,
      uiFramework: currentProject.stack.uiFramework,
      swiftVersion: currentProject.stack.swiftVersion,
      xcodeVersion: currentProject.stack.xcodeVersion,
      status: currentProject.status as any,
      devSubstatus: currentProject.devSubstatus || 'Design',
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    updateProject(currentProject.id, {
      name: projectForm.name,
      description: projectForm.description,
      icon: projectForm.icon || undefined,
      color: projectForm.color,
      bundleId: projectForm.bundleId,
      platforms: projectForm.platforms,
      minIOS: projectForm.minIOS,
      stack: {
        ...currentProject.stack,
        uiFramework: projectForm.uiFramework,
        swiftVersion: projectForm.swiftVersion,
        xcodeVersion: projectForm.xcodeVersion,
        minIOS: projectForm.minIOS,
      },
      status: projectForm.status,
      devSubstatus:
        projectForm.status === 'In development'
          ? projectForm.devSubstatus
          : undefined,
    });
    setShowProjectModal(false);
  };

  if (!currentProject) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white">No Projects Available</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Create your first project or promote an existing idea from your brainstorm board.
        </p>
        <button
          onClick={() => onOpenNewModal('project')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Create Project
        </button>
      </div>
    );
  }

  // Progress calculation
  const doneTasks = projectTasks.filter(t => {
    const s = db.statuses.find(status => status.id === t.statusId);
    return s?.type === 'Done';
  });
  const progressPercent = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;
  const colorTheme = getProjectColorTheme(currentProject);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Project Switcher Bar & Meta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="relative group/avatar cursor-pointer shrink-0"
            onClick={() => setShowImageModal(true)}
            title="Click to change or upload app icon"
          >
            {currentProject.icon ? (
              <img
                src={currentProject.icon}
                alt={currentProject.name}
                className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-700 shadow-sm group-hover/avatar:ring-blue-500 transition-all bg-slate-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm group-hover/avatar:border-blue-500 transition-colors">
                {currentProject.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Camera className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-sm tracking-tight ${colorTheme.titleField}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${colorTheme.dot}`} />
                <select
                  value={currentProject.id}
                  onChange={e => setActiveProjectId(e.target.value)}
                  className="bg-transparent font-bold text-sm cursor-pointer focus:outline-none"
                >
                  {db.projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentProject.isDemo && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Demo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
              <span className="font-mono text-slate-300">{currentProject.bundleId}</span>
              <span aria-hidden="true">·</span>
              <span>{currentProject.stack.uiFramework} (Swift {currentProject.stack.swiftVersion})</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">{currentProject.status}</span>
              {currentProject.status === 'In development' && (
                <>
                  <span aria-hidden="true">·</span>
                  <div className="inline-flex items-center gap-1.5">
                    <span className="text-slate-400">Subphase:</span>
                    <select
                      value={currentProject.devSubstatus || 'Design'}
                      onChange={e =>
                        updateProject(currentProject.id, {
                          devSubstatus: e.target.value as DevelopmentSubstatus,
                        })
                      }
                      className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-blue-300 font-medium px-2 py-0.5 rounded text-[11px] cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      {DEVELOPMENT_SUBSTATUSES.map(sub => (
                        <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {currentProject.isDemo && (
            <button
              onClick={() => keepItemAsMine('project', currentProject.id)}
              className="px-2.5 py-1 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg cursor-pointer"
            >
              Keep as My Data
            </button>
          )}

          <button
            onClick={openProjectSettings}
            className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Project Settings
          </button>

          <button
            onClick={() => openNewTaskModal()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Development Subphases Pipeline Visual Tracker (PRD & User Req 5) */}
      {currentProject.status === 'In development' && (
        <DevSubstatusPipeline
          currentSubstatus={currentProject.devSubstatus || 'Design'}
          onSelectSubstatus={sub => updateProject(currentProject.id, { devSubstatus: sub })}
          showDescriptions
        />
      )}

      {/* Navigation Tabs inside Project (PRD Section 8.3) */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800/80 pb-1 scrollbar-none text-xs">
        {[
          { id: 'overview', label: 'Overview', icon: FolderGit2 },
          { id: 'checklists', label: 'Checklists', icon: CheckSquare },
          { id: 'tasks', label: 'Task List', icon: List },
          { id: 'board', label: 'Kanban Board', icon: Columns },
          { id: 'notes', label: 'Notes & Docs', icon: FileText },
          { id: 'releases', label: 'Releases', icon: Tag },
          { id: 'assets', label: 'Assets & ASO', icon: ImageIcon },
          { id: 'activity', label: 'Activity', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: KANBAN BOARD (PRD §8.4) */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* Board Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="relative min-w-40">
                <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter cards..."
                  value={boardSearch}
                  onChange={e => setBoardSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Feature">Feature</option>
                <option value="Bug">Bug</option>
                <option value="Chore">Chore</option>
                <option value="Design">Design</option>
                <option value="Research">Research</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={swimlaneMode}
                onChange={e => setSwimlaneMode(e.target.value as any)}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="none">No Swimlanes</option>
                <option value="priority">Swimlanes: Priority</option>
                <option value="type">Swimlanes: Type</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono tabular-nums">{doneTasks.length}/{projectTasks.length} Done ({progressPercent}%)</span>
            </div>
          </div>

          {/* Kanban Columns Canvas */}
          <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[600px]">
            {db.statuses.map(status => {
              const columnTasks = filteredTasks.filter(t => t.statusId === status.id);
              const isOverWip = status.wipLimit && columnTasks.length > status.wipLimit;

              return (
                <div
                  key={status.id}
                  className="w-72 shrink-0 bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex flex-col max-h-[calc(100vh-14rem)]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-semibold text-xs text-slate-200 truncate">
                        {status.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {status.wipLimit && (
                        <span
                          className={`text-[10px] font-mono px-1 rounded ${
                            isOverWip ? 'bg-rose-500/20 text-rose-300' : 'text-slate-500'
                          }`}
                          title={`WIP Limit: ${status.wipLimit}`}
                        >
                          max {status.wipLimit}
                        </span>
                      )}
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {columnTasks.length}
                      </span>
                      <button
                        onClick={() => openNewTaskModal(status.id)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                        title="Add task in this column"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cards List (Touch & iPad accessible move controls) */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {columnTasks.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-slate-600 border border-dashed border-slate-800 rounded-lg">
                        Empty column
                      </div>
                    ) : (
                      columnTasks.map(task => {
                        const linkedRelease = db.releases.find(r => r.id === task.releaseId);
                        const doneSubtasks = task.subtasks.filter(s => s.completed).length;

                        return (
                          <div
                            key={task.id}
                            className="p-3 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all shadow-sm hover:border-slate-600 group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                {task.type}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-semibold ${
                                    task.priority === 'Urgent'
                                      ? 'text-rose-400'
                                      : task.priority === 'High'
                                      ? 'text-amber-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                                {task.isDemo && (
                                  <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded">
                                    Demo
                                  </span>
                                )}
                              </div>
                            </div>

                            <h4
                              onClick={() => openEditTaskModal(task)}
                              className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors cursor-pointer leading-snug mb-1"
                            >
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {/* Subtasks Progress */}
                            {task.subtasks.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-2">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>
                                  {doneSubtasks}/{task.subtasks.length} subtasks
                                </span>
                              </div>
                            )}

                            {/* Linked Release & Due Date */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-700/40">
                              <div className="flex items-center gap-1.5 truncate">
                                {linkedRelease && (
                                  <span className="text-purple-400 font-mono">
                                    v{linkedRelease.version}
                                  </span>
                                )}
                                {task.dueDate && <span>Due {task.dueDate}</span>}
                              </div>

                              {/* Column mover select (optimal for iPad touch without drag lag) */}
                              <select
                                value={task.statusId}
                                onChange={e => moveTask(task.id, e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded px-1 py-0.5 focus:outline-none cursor-pointer"
                              >
                                {db.statuses.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: OVERVIEW (PRD §8.3) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Project Identity & Scope</h3>
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Change Icon</span>
                </button>
              </div>

              {/* App Icon / Visual Artwork Display */}
              <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3.5 min-w-0">
                  {currentProject.icon ? (
                    <img
                      src={currentProject.icon}
                      alt={currentProject.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-700 shadow-md bg-slate-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base shrink-0">
                      {currentProject.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      App Store Icon & Visual Artwork
                    </span>
                    <h4 className="text-xs font-bold text-white mt-0.5 truncate">{currentProject.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {currentProject.icon ? 'Custom artwork configured for project tiles' : 'Geen afbeelding vastgelegd. Klik om toe te voegen.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20 shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload / Kies</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                {currentProject.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-[10px] text-slate-400">Bundle Identifier</span>
                  <p className="font-mono text-slate-200 mt-0.5">{currentProject.bundleId}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-[10px] text-slate-400">Deployment Target</span>
                  <p className="text-slate-200 mt-0.5">{currentProject.minIOS}+</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-[10px] text-slate-400">Swift & Xcode</span>
                  <p className="text-slate-200 mt-0.5">Swift {currentProject.stack.swiftVersion} · Xcode {currentProject.stack.xcodeVersion}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Target Apple Platforms
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {currentProject.platforms.map(plat => (
                    <span key={plat} className="text-xs px-2.5 py-1 bg-slate-800 text-slate-200 rounded-lg border border-slate-700">
                      {plat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* App Resources & External Links (OneDrive, Database, Vercel, App Store Connect, Apple Store) */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>App Resources & Deployments</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Project folder, database credentials, Vercel deployment, and App Store links for this app.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {resSavedFeedback && (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" />
                      <span>Saved!</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveResources()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Resource fields grid */}
              <div className="space-y-3.5 text-xs">
                {/* 1. Project Folder Link (Combined or Separate Views) */}
                <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-sky-400" />
                        <span>Project Folder Link</span>
                      </label>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                        OneDrive Cloud URL or Local Disk Path
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDualFolderFields(!showDualFolderFields)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer font-medium self-start sm:self-auto"
                    >
                      <Layers className="w-3 h-3" />
                      <span>{showDualFolderFields ? 'Combine into 1 Field' : 'Switch to 2 Separate Fields'}</span>
                    </button>
                  </div>

                  {!showDualFolderFields ? (
                    /* COMBINED 1 FIELD MODE (Clickable & auto-detecting) */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400">
                          Enter OneDrive cloud URL or local disk folder path (e.g. /Volumes/...):
                        </span>

                        {resProjectFolder.trim() && (
                          <div className="flex items-center gap-2">
                            {(resProjectFolder.trim().startsWith('http://') || resProjectFolder.trim().startsWith('https://')) ? (
                              <a
                                href={resProjectFolder.trim()}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 text-[11px] font-semibold text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Open OneDrive / Cloud Folder in browser"
                              >
                                <span>Open Cloud Folder</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenFolder(resProjectFolder)}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Open this folder path in Finder"
                                >
                                  <HardDrive className="w-3 h-3 text-blue-400" />
                                  <span>Open in Finder</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyFolderPath(resProjectFolder)}
                                  className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-700/80 hover:bg-slate-700 rounded-lg border border-slate-600/70 flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Copy path for Finder (⌘+Shift+G)"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Path</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="https://onedrive.live.com/... OR /Volumes/ExternalDrive/Projects/..."
                          value={resProjectFolder}
                          onChange={e => {
                            const val = e.target.value;
                            setResProjectFolder(val);
                            if (val.trim().startsWith('http://') || val.trim().startsWith('https://')) {
                              setResOneDriveUrl(val);
                              setResExternalDiskPath('');
                            } else {
                              setResExternalDiskPath(val);
                              setResOneDriveUrl('');
                            }
                          }}
                          onBlur={() => handleSaveResources(undefined, { projectFolder: resProjectFolder })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    /* DUAL 2 FIELDS MODE */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-1">
                      {/* OneDrive Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-medium text-slate-300 flex items-center gap-1.5 text-slate-200">
                            <Folder className="w-3.5 h-3.5 text-sky-400" />
                            <span>OneDrive Folder Link</span>
                          </label>
                          {resOneDriveUrl.trim() && (
                            <a
                              href={resOneDriveUrl.trim().startsWith('http') ? resOneDriveUrl.trim() : `https://${resOneDriveUrl.trim()}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 font-medium"
                              title="Open OneDrive folder"
                            >
                              <span>Open OneDrive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          placeholder="https://onedrive.live.com/... or cloud folder URL"
                          value={resOneDriveUrl}
                          onChange={e => {
                            setResOneDriveUrl(e.target.value);
                            setResProjectFolder(e.target.value);
                          }}
                          onBlur={() => handleSaveResources(undefined, { oneDriveUrl: resOneDriveUrl })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Local Disk Path Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-medium text-slate-300 flex items-center gap-1.5 text-slate-200">
                            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                            <span>Local / External Disk Path</span>
                          </label>
                          {resExternalDiskPath.trim() && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenFolder(resExternalDiskPath)}
                                className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                title="Click to open this path in Finder"
                              >
                                <span>Open in Finder</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyFolderPath(resExternalDiskPath)}
                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                                title="Copy path for Finder (⌘+Shift+G)"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy Path</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="/Volumes/ExternalDrive/Projects/... or ~/Projects/..."
                          value={resExternalDiskPath}
                          onChange={e => {
                            setResExternalDiskPath(e.target.value);
                            setResProjectFolder(e.target.value);
                          }}
                          onBlur={() => handleSaveResources(undefined, { externalDiskPath: resExternalDiskPath })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  )}

                  {finderToast && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 animate-in fade-in pt-1">
                      <Check className="w-3 h-3 shrink-0" />
                      <span>{finderToast}</span>
                    </div>
                  )}
                </div>

                {/* 2. Database Name & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-purple-400" />
                      <span>Database Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HabitPulse_Prod, appdock_postgres..."
                      value={resDatabaseName}
                      onChange={e => setResDatabaseName(e.target.value)}
                      onBlur={() => handleSaveResources()}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-slate-300 flex items-center gap-1.5 text-slate-200">
                        <Link2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Database Link / Dashboard URL</span>
                      </label>
                      {resDatabaseUrl.trim() && (
                        <a
                          href={resDatabaseUrl.trim().startsWith('http') ? resDatabaseUrl.trim() : `https://${resDatabaseUrl.trim()}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Open Dashboard</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="https://console.cloud.google.com/sql/... or database dashboard URL"
                      value={resDatabaseUrl}
                      onChange={e => setResDatabaseUrl(e.target.value)}
                      onBlur={() => handleSaveResources()}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                {/* 3. Vercel Deployment */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-300 flex items-center gap-1.5 text-slate-200">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Vercel Deployment URL</span>
                    </label>
                    {resVercelUrl.trim() && (
                      <a
                        href={resVercelUrl.trim().startsWith('http') ? resVercelUrl.trim() : `https://${resVercelUrl.trim()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Open Web App</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="https://your-project.vercel.app..."
                    value={resVercelUrl}
                    onChange={e => setResVercelUrl(e.target.value)}
                    onBlur={() => handleSaveResources()}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>

                {/* 4. App Store Connect & Apple Store Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-slate-300 flex items-center gap-1.5 text-slate-200">
                        <Apple className="w-3.5 h-3.5 text-blue-400" />
                        <span>App Store Connect Link</span>
                      </label>
                      {resAppStoreConnectUrl.trim() && (
                        <a
                          href={resAppStoreConnectUrl.trim().startsWith('http') ? resAppStoreConnectUrl.trim() : `https://${resAppStoreConnectUrl.trim()}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Open Connect</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="https://appstoreconnect.apple.com/apps/..."
                      value={resAppStoreConnectUrl}
                      onChange={e => setResAppStoreConnectUrl(e.target.value)}
                      onBlur={() => handleSaveResources()}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-slate-300 flex items-center gap-1.5 text-slate-200">
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                        <span>Apple App Store Link</span>
                      </label>
                      {resAppStoreUrl.trim() && (
                        <a
                          href={resAppStoreUrl.trim().startsWith('http') ? resAppStoreUrl.trim() : `https://${resAppStoreUrl.trim()}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Open App Store</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="https://apps.apple.com/app/id..."
                      value={resAppStoreUrl}
                      onChange={e => setResAppStoreUrl(e.target.value)}
                      onBlur={() => handleSaveResources()}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information & Custom Documentation Table */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Additional Information & Documentation</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Custom links and metadata with Title, Link, and Notes columns.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddCustomInfoRow}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Table or rows list */}
              {resCustomLinks.length === 0 ? (
                <div className="p-6 text-center bg-slate-800/30 border border-slate-800/60 rounded-xl text-xs text-slate-400 space-y-2">
                  <p>No additional information added yet.</p>
                  <button
                    type="button"
                    onClick={handleAddCustomInfoRow}
                    className="text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add first row (Title, Link & Notes)
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3 min-w-[150px]">Title</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Link / URL</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Notes / Comments</th>
                        <th className="py-2.5 px-2 w-14 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {resCustomLinks.map(row => (
                        <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 align-top">
                            <input
                              type="text"
                              placeholder="e.g. Figma, API Specs, TestFlight..."
                              value={row.title}
                              onChange={e => handleUpdateCustomInfoRow(row.id, 'title', e.target.value)}
                              onBlur={() => handleSaveResources()}
                              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                            />
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                placeholder="https://..."
                                value={row.url}
                                onChange={e => handleUpdateCustomInfoRow(row.id, 'url', e.target.value)}
                                onBlur={() => handleSaveResources()}
                                className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                              />
                              {row.url && row.url.trim() && (
                                <a
                                  href={row.url.trim().startsWith('http') ? row.url.trim() : `https://${row.url.trim()}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shrink-0"
                                  title="Open link in new tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <textarea
                              rows={1}
                              placeholder="Optional notes or details..."
                              value={row.notes || ''}
                              onChange={e => handleUpdateCustomInfoRow(row.id, 'notes', e.target.value)}
                              onBlur={() => handleSaveResources()}
                              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-y min-h-[34px]"
                            />
                          </td>
                          <td className="py-2.5 px-2 align-top text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomInfoRow(row.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-3">Milestone Progress</h3>
              <div className="space-y-3">
                {currentProject.status === 'In development' && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        Development Phase (Phase {DEVELOPMENT_SUBSTATUSES.find(s => s.id === (currentProject.devSubstatus || 'Design'))?.step || 1}/7: {currentProject.devSubstatus || 'Design'})
                      </span>
                      <span className="font-mono text-white font-bold">{calculateSubphaseProgress(currentProject.devSubstatus)}% Done</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${calculateSubphaseProgress(currentProject.devSubstatus)}%` }} />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Board Tasks Completed</span>
                    <span className="font-mono text-slate-300 font-medium">{progressPercent}% ({doneTasks.length}/{projectTasks.length})</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-2 text-slate-400 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span className="text-slate-200">{currentProject.dates.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Release:</span>
                    <span className="text-slate-200">{currentProject.dates.targetDate || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Development Subphases Breakdown Card */}
            {currentProject.status === 'In development' && (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Development Pipeline</h3>
                    <p className="text-[11px] text-slate-400">7-Stage iOS Lifecycle</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Phase {DEVELOPMENT_SUBSTATUSES.find(s => s.id === (currentProject.devSubstatus || 'Design'))?.step || 1}/7 · {calculateSubphaseProgress(currentProject.devSubstatus)}% Done
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {DEVELOPMENT_SUBSTATUSES.map(sub => {
                    const currentStep = DEVELOPMENT_SUBSTATUSES.find(s => s.id === currentProject.devSubstatus)?.step || 1;
                    const isDone = sub.step < currentStep;
                    const isCurrent = sub.id === currentProject.devSubstatus;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => updateProject(currentProject.id, { devSubstatus: sub.id })}
                        className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isCurrent
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : isDone
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isDone
                                ? 'bg-emerald-500 text-slate-950'
                                : isCurrent
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {sub.step}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{sub.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{sub.description}</p>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-[10px] uppercase font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 shrink-0">
                            Current
                          </span>
                        ) : isDone ? (
                          <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                            Done
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 hover:text-blue-400 shrink-0">
                            Select
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TASKS LIST (PRD §8.3) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-white">All Tasks ({projectTasks.length})</span>
            <button
              onClick={() => openNewTaskModal()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Task</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Subtasks</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {projectTasks.map(task => {
                  const status = db.statuses.find(s => s.id === task.statusId);
                  return (
                    <tr key={task.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-medium text-white max-w-sm truncate">
                        <span onClick={() => openEditTaskModal(task)} className="hover:text-blue-400 cursor-pointer">
                          {task.title}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{task.type}</td>
                      <td className="py-3 px-3">
                        <span className={task.priority === 'Urgent' ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium" style={{ color: status?.color }}>
                          {status?.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditTaskModal(task)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer mr-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NOTES & DOCS (PRD §8.3 & §10 Security) */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              <strong>Security Policy:</strong> Never store Apple certificates, private p12 keys, or cloud secrets in notes or links.
            </span>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Architecture & ADR Notes</h3>
              <button
                onClick={() => {
                  if (isEditingNotes) {
                    updateProject(currentProject.id, { notesMarkdown: notesText });
                    setIsEditingNotes(false);
                  } else {
                    setNotesText(currentProject.notesMarkdown || '');
                    setIsEditingNotes(true);
                  }
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer"
              >
                {isEditingNotes ? 'Save Notes' : 'Edit Markdown'}
              </button>
            </div>

            {isEditingNotes ? (
              <textarea
                rows={10}
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            ) : (
              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {currentProject.notesMarkdown || 'No architecture notes documented yet.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: RELEASES SUBTAB */}
      {activeTab === 'releases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-white">Releases for {currentProject.name}</span>
            <button
              onClick={() => onNavigate('releases')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg cursor-pointer"
            >
              Open Full Release Manager
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {releasesForProject.map(rel => (
              <div key={rel.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-sm">v{rel.version} (Build {rel.build})</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {rel.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">{rel.name}</p>
                <div className="text-[11px] text-slate-400">
                  {rel.releasedDate ? `Released: ${rel.releasedDate}` : `Target: ${rel.plannedDate || 'TBD'}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ASSETS & ASO (PRD §8.3 & §8.7) */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">App Store Screenshots & Icon Planner</h3>
            <div className="space-y-2">
              {currentProject.assetSpecs.map(spec => (
                <div
                  key={spec.id}
                  onClick={() => {
                    const updatedSpecs = currentProject.assetSpecs.map(s =>
                      s.id === spec.id ? { ...s, completed: !s.completed } : s
                    );
                    updateProject(currentProject.id, { assetSpecs: updatedSpecs });
                  }}
                  className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors border border-slate-800 hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={spec.completed}
                      onChange={() => {
                        const updatedSpecs = currentProject.assetSpecs.map(s =>
                          s.id === spec.id ? { ...s, completed: !s.completed } : s
                        );
                        updateProject(currentProject.id, { assetSpecs: updatedSpecs });
                      }}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-500"
                    />
                    <div>
                      <span className={`font-medium ${spec.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {spec.title}
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono">{spec.requiredSize}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                    spec.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {spec.completed ? 'Ready ✓' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">App Store Localized Listings</h3>
            {currentProject.localizedListings.map(loc => (
              <div key={loc.locale} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-200">{loc.locale}</span>
                <p className="text-slate-300"><strong>Title:</strong> {loc.title}</p>
                <p className="text-slate-300"><strong>Subtitle:</strong> {loc.subtitle}</p>
                <p className="text-slate-400 font-mono"><strong>Keywords ({loc.keywords.length}/100 chars):</strong> {loc.keywords}</p>
                <p className="text-slate-300"><strong>Description:</strong> {loc.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CHECKLISTS (PRD §8.7) */}
      {activeTab === 'checklists' && (
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">App Store Pre-Submission Checklist</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {completedChecklistCount} of {projectChecklists.length} tasks completed ({checklistPercent}%)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('settings:checklist')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Open standard checklist template manager in Settings"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Standard Checklist</span>
                </button>
                <button
                  type="button"
                  onClick={() => resetChecklist(currentProject.id)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-slate-700/60"
                  title="Reset all checklist items for this project to unchecked"
                >
                  <span>Deselect All</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {projectChecklists.map((chk, idx) => (
                <div
                  key={chk.id}
                  onClick={() => toggleChecklist(chk.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    chk.done
                      ? 'bg-slate-800/30 border-slate-800/60 opacity-80'
                      : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={chk.done}
                    onChange={() => toggleChecklist(chk.id)}
                    className="w-4 h-4 rounded text-blue-600 mt-0.5 cursor-pointer accent-blue-500 shrink-0"
                  />
                  <div className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5 border border-slate-700/60" title={`Step ${idx + 1}`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold ${chk.done ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {chk.title}
                      </span>
                      {chk.category && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
                          {chk.category}
                        </span>
                      )}
                      {chk.required && (
                        <span className="text-[10px] text-rose-400 font-medium px-1.5 py-0.2 bg-rose-500/10 rounded border border-rose-500/20">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 mt-1 leading-relaxed">{chk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-3">Project History</h3>
          <div className="space-y-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Project created on {new Date(currentProject.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last updated on {new Date(currentProject.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Task Edit / Add Modal */}
      {isEditingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-3">
              {selectedTask ? 'Edit Task' : 'New Kanban Task'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement StoreKit 2 paywall"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Technical details, edge cases, acceptance criteria"
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={taskForm.type}
                    onChange={e => setTaskForm({ ...taskForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="Feature">Feature</option>
                    <option value="Bug">Bug</option>
                    <option value="Chore">Chore</option>
                    <option value="Design">Design</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Column Status</label>
                  <select
                    value={taskForm.statusId}
                    onChange={e => setTaskForm({ ...taskForm, statusId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                  >
                    {db.statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Target Release</label>
                <select
                  value={taskForm.releaseId}
                  onChange={e => setTaskForm({ ...taskForm, releaseId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                >
                  <option value="">None</option>
                  {releasesForProject.map(r => (
                    <option key={r.id} value={r.id}>Version {r.version} ({r.name || r.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Labels (comma separated)</label>
                <input
                  type="text"
                  placeholder="SwiftUI, HealthKit, iOS18"
                  value={taskForm.labels}
                  onChange={e => setTaskForm({ ...taskForm, labels: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                />
              </div>

              {/* Subtasks Management */}
              {selectedTask && (
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-300 block">Subtasks Checklist</span>
                  <div className="space-y-1">
                    {selectedTask.subtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => toggleSubtask(selectedTask.id, st.id)}
                          className="w-3.5 h-3.5 rounded text-blue-500 cursor-pointer"
                        />
                        <span className={st.completed ? 'line-through text-slate-500' : 'text-slate-300'}>
                          {st.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add subtask..."
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSubtaskTitle.trim()) return;
                        addSubtask(selectedTask.id, newSubtaskTitle.trim());
                        setNewSubtaskTitle('');
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                {selectedTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteTask(selectedTask.id);
                      setIsEditingTask(false);
                      setSelectedTask(null);
                    }}
                    className="text-rose-400 hover:underline text-xs cursor-pointer"
                  >
                    Delete Task
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingTask(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Save Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-3">Project Settings</h3>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"
                />
              </div>

              {/* App Icon / Image Picker */}
              <ProjectImagePicker
                value={projectForm.icon}
                onChange={icon => setProjectForm({ ...projectForm, icon })}
                projectName={projectForm.name || 'App'}
              />

              {/* Project Accent Color Swatches */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-medium text-slate-300">
                    Project Accent Color
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {projectForm.color ? PROJECT_COLOR_THEMES[projectForm.color].label : 'Auto matching'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                  {(['emerald', 'cyan', 'indigo', 'purple', 'amber', 'rose', 'teal', 'blue'] as ProjectColor[]).map(c => {
                    const theme = PROJECT_COLOR_THEMES[c];
                    const isSelected = projectForm.color === c || (!projectForm.color && currentProject.color === c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setProjectForm({ ...projectForm, color: c })}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-md' : 'hover:scale-105 opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: theme.hex }}
                        title={theme.label}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Bundle ID</label>
                  <input
                    type="text"
                    required
                    value={projectForm.bundleId}
                    onChange={e => setProjectForm({ ...projectForm, bundleId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={projectForm.status}
                    onChange={e => setProjectForm({ ...projectForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In development">In development</option>
                    <option value="Beta">Beta</option>
                    <option value="In review">In review</option>
                    <option value="Released">Released</option>
                    <option value="On hold">On hold</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {projectForm.status === 'In development' && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-medium text-slate-200">
                      Development Substatus
                    </label>
                    <span className="text-[10px] text-blue-400 font-mono">
                      Phase {DEVELOPMENT_SUBSTATUSES.find(s => s.id === projectForm.devSubstatus)?.step || 1} of 7
                    </span>
                  </div>
                  <select
                    value={projectForm.devSubstatus}
                    onChange={e =>
                      setProjectForm({
                        ...projectForm,
                        devSubstatus: e.target.value as DevelopmentSubstatus,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {DEVELOPMENT_SUBSTATUSES.map(sub => (
                      <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                        {sub.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    {DEVELOPMENT_SUBSTATUSES.find(s => s.id === projectForm.devSubstatus)?.description}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    deleteProject(currentProject.id);
                    setShowProjectModal(false);
                  }}
                  className="text-rose-400 hover:underline cursor-pointer"
                >
                  Delete Project
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct App Image Artwork Modal */}
      <ProjectImageModal
        project={currentProject}
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
      />
    </div>
  );
};
