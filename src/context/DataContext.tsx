/**
 * iOS Dev Hub - Core Data Context & Lifecycle Workspace Engine
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Idea,
  Project,
  WorkflowStatus,
  Task,
  Release,
  ChangelogEntry,
  ChecklistItem,
  PrivacyPermission,
  CertificateReminder,
  NotificationItem,
  AppStoreQuestionItem,
} from '../types';
import {
  UserDatabase,
  loadUserDatabase,
  saveUserDatabase,
  removeDemoData,
  restoreDemoData,
  keepDemoItem,
  createEmptyDatabase,
  DEFAULT_CHECKLIST_TEMPLATE,
  DEFAULT_APP_STORE_QUESTIONS,
  sanitizeDatabaseChecklists,
  exportUserDataAsJson,
} from '../services/storage';
import {
  saveWorkspaceToFirestore,
  loadWorkspaceFromFirestore,
  subscribeToWorkspace,
} from '../services/firebase';
import { useAuth } from './AuthContext';

interface DataContextType {
  db: UserDatabase;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  hasDemoData: boolean;

  // Demo data controls
  purgeDemoData: () => void;
  reloadDemoData: () => void;
  keepItemAsMine: (type: 'idea' | 'project' | 'task' | 'release', id: string) => void;

  // Full Database Import & Export
  exportFullDatabase: () => string;
  importDatabase: (incomingData: any, mode?: 'replace' | 'merge') => Promise<{
    success: boolean;
    stats: { projects: number; tasks: number; ideas: number; releases: number; changelogs: number };
    error?: string;
  }>;

  // Idea CRUD
  addIdea: (idea: Omit<Idea, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'comments' | 'timeline'>) => Idea;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  addIdeaComment: (ideaId: string, text: string) => void;
  convertIdeaToProject: (ideaId: string, overrides?: Partial<Project>) => Project;

  // Project CRUD
  addProject: (project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'links' | 'assetSpecs' | 'localizedListings'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Statuses & Kanban
  updateStatuses: (statuses: WorkflowStatus[]) => void;
  addStatus: (status: Omit<WorkflowStatus, 'id'>) => void;
  deleteStatus: (statusId: string, fallbackStatusId?: string) => void;

  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order' | 'loggedMinutes'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, targetStatusId: string, newOrder?: number) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  logTaskTime: (taskId: string, minutes: number) => void;

  // Release CRUD
  addRelease: (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => Release;
  updateRelease: (id: string, updates: Partial<Release>) => void;
  deleteRelease: (id: string) => void;
  markAsReleased: (releaseId: string, releaseDate: string) => void;
  addChangelogEntry: (entry: Omit<ChangelogEntry, 'id'>) => ChangelogEntry;
  updateChangelogEntry: (id: string, updates: Partial<ChangelogEntry>) => void;
  deleteChangelogEntry: (id: string) => void;
  generateReleaseNotes: (releaseId: string, locale?: string) => string;

  // Tools & Checklists
  toggleChecklist: (id: string, projectId?: string) => void;
  resetChecklist: (projectId?: string) => void;
  updatePrivacyPermission: (key: string, updates: Partial<PrivacyPermission>) => void;
  addCertificate: (cert: Omit<CertificateReminder, 'id' | 'daysRemaining'>) => void;
  deleteCertificate: (id: string) => void;

  // Standard Checklist Template (Global for all apps)
  checklistTemplate: ChecklistItem[];
  addChecklistTemplateItem: (item: { title: string; description: string; category?: string; required?: boolean; position?: 'start' | 'end' }) => void;
  updateChecklistTemplateItem: (id: string, updates: Partial<ChecklistItem>) => void;
  deleteChecklistTemplateItem: (id: string) => void;
  reorderChecklistTemplate: (newItems: ChecklistItem[]) => void;
  moveChecklistTemplateItem: (id: string, direction: 'up' | 'down') => void;
  resetChecklistTemplate: () => void;
  syncChecklistTemplateToAllProjects: () => void;

  // App Store Info Q&A (Global template synchronizing across all projects)
  appStoreQuestions: AppStoreQuestionItem[];
  addAppStoreQuestion: (question: Omit<AppStoreQuestionItem, 'id' | 'order'>) => AppStoreQuestionItem;
  updateAppStoreQuestion: (id: string, updates: Partial<AppStoreQuestionItem>) => void;
  deleteAppStoreQuestion: (id: string) => void;
  reorderAppStoreQuestion: (id: string, direction: 'up' | 'down') => void;
  resetAppStoreQuestions: () => void;
  updateProjectAppStoreAnswer: (projectId: string, questionId: string, answer: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [db, setDb] = useState<UserDatabase>(() => createEmptyDatabase());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Load database whenever active user switches and sync with Firestore (appdock75)
  useEffect(() => {
    if (user?.id) {
      const localDb = loadUserDatabase(user.id);
      setDb(localDb);
      if (localDb.projects.length > 0) {
        setActiveProjectId(localDb.projects[0].id);
      } else {
        setActiveProjectId(null);
      }

      const wasPurgedLocally =
        localDb.demoPurged === true ||
        localStorage.getItem(`ios_dev_hub_data_${user.id}_demo_purged`) === 'true' ||
        localStorage.getItem('ios_dev_hub_global_demo_purged') === 'true' ||
        (localDb.projects.length === 0 && localDb.ideas.length === 0) ||
        (!localDb.projects.some(p => p.isDemo) && !localDb.ideas.some(i => i.isDemo) && !localDb.tasks.some(t => t.isDemo));

      // Check remote Firestore workspace
      loadWorkspaceFromFirestore(user.id).then(remoteDb => {
        if (remoteDb) {
          const isPurged =
            remoteDb.demoPurged === true ||
            wasPurgedLocally ||
            localDb.demoPurged === true ||
            localStorage.getItem(`ios_dev_hub_data_${user.id}_demo_purged`) === 'true' ||
            localStorage.getItem('ios_dev_hub_global_demo_purged') === 'true' ||
            (!remoteDb.projects.some(p => p.isDemo) && !remoteDb.ideas.some(i => i.isDemo));

          // Preserve custom checklist template if remote Firestore document lacked it
          if (!remoteDb.checklistTemplate || remoteDb.checklistTemplate.length === 0) {
            if (localDb.checklistTemplate && localDb.checklistTemplate.length > 0) {
              remoteDb.checklistTemplate = localDb.checklistTemplate;
            }
          }

          // Reconcile project substatus (devSubstatus)
          remoteDb.projects = (remoteDb.projects || []).map(rp => {
            const lp = (localDb.projects || []).find(p => p.id === rp.id);
            if (lp && lp.devSubstatus && (!rp.devSubstatus || (rp.devSubstatus === 'Design' && lp.devSubstatus !== 'Design'))) {
              return { ...rp, devSubstatus: lp.devSubstatus };
            }
            return rp;
          });

          let finalDb = remoteDb;
          if (isPurged) {
            finalDb = {
              ...remoteDb,
              ideas: (remoteDb.ideas || []).filter(i => !i.isDemo),
              projects: (remoteDb.projects || []).filter(p => !p.isDemo),
              tasks: (remoteDb.tasks || []).filter(t => !t.isDemo),
              releases: (remoteDb.releases || []).filter(r => !r.isDemo),
              changelogEntries: (remoteDb.changelogEntries || []).filter(c => {
                const rel = (remoteDb.releases || []).find(r => r.id === c.releaseId);
                return rel && !rel.isDemo;
              }),
              archivedApps: (remoteDb.archivedApps || []).filter(a => !a.isDemo),
              demoPurged: true,
            };
            try {
              localStorage.setItem(`ios_dev_hub_data_${user.id}_demo_purged`, 'true');
              localStorage.setItem('ios_dev_hub_global_demo_purged', 'true');
            } catch {}
          }
          const sanitized = sanitizeDatabaseChecklists(finalDb, user.id);
          setDb(sanitized);
          saveUserDatabase(user.id, sanitized);
          // Always save the reconciled workspace back to Firestore to ensure cloud sync
          saveWorkspaceToFirestore(user.id, sanitized);
          if (sanitized.projects.length > 0) {
            setActiveProjectId(sanitized.projects[0].id);
          } else {
            setActiveProjectId(null);
          }
        } else {
          // Push initial data to Cloud Firestore so the workspace is immediately backed by the database
          saveWorkspaceToFirestore(user.id, localDb);
        }
      }).catch(() => {
        // Fallback gracefully on local storage
      });

      // Subscribe to real-time changes
      const unsubscribe = subscribeToWorkspace(user.id, (remoteUpdate) => {
        if (remoteUpdate) {
          const isPurged =
            remoteUpdate.demoPurged === true ||
            wasPurgedLocally ||
            localDb.demoPurged === true ||
            localStorage.getItem(`ios_dev_hub_data_${user.id}_demo_purged`) === 'true' ||
            localStorage.getItem('ios_dev_hub_global_demo_purged') === 'true' ||
            (!remoteUpdate.projects.some(p => p.isDemo) && !remoteUpdate.ideas.some(i => i.isDemo));

          // Preserve checklist template if missing in update
          if (!remoteUpdate.checklistTemplate || remoteUpdate.checklistTemplate.length === 0) {
            if (localDb.checklistTemplate && localDb.checklistTemplate.length > 0) {
              remoteUpdate.checklistTemplate = localDb.checklistTemplate;
            }
          }

          // Reconcile project substatus (devSubstatus)
          remoteUpdate.projects = (remoteUpdate.projects || []).map(rp => {
            const lp = (localDb.projects || []).find(p => p.id === rp.id);
            if (lp && lp.devSubstatus && (!rp.devSubstatus || (rp.devSubstatus === 'Design' && lp.devSubstatus !== 'Design'))) {
              return { ...rp, devSubstatus: lp.devSubstatus };
            }
            return rp;
          });

          let finalUpdate = remoteUpdate;
          if (isPurged) {
            finalUpdate = {
              ...remoteUpdate,
              ideas: (remoteUpdate.ideas || []).filter(i => !i.isDemo),
              projects: (remoteUpdate.projects || []).filter(p => !p.isDemo),
              tasks: (remoteUpdate.tasks || []).filter(t => !t.isDemo),
              releases: (remoteUpdate.releases || []).filter(r => !r.isDemo),
              changelogEntries: (remoteUpdate.changelogEntries || []).filter(c => {
                const rel = (remoteUpdate.releases || []).find(r => r.id === c.releaseId);
                return rel && !rel.isDemo;
              }),
              archivedApps: (remoteUpdate.archivedApps || []).filter(a => !a.isDemo),
              demoPurged: true,
            };
            try {
              localStorage.setItem(`ios_dev_hub_data_${user.id}_demo_purged`, 'true');
            } catch {}
          }
          const sanitized = sanitizeDatabaseChecklists(finalUpdate, user.id);
          setDb(sanitized);
          saveUserDatabase(user.id, sanitized);
        }
      }, () => {
        // Safe onError callback
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      setDb(createEmptyDatabase());
      setActiveProjectId(null);
    }
  }, [user?.id]);

  const commit = useCallback((newDb: UserDatabase) => {
    setDb(newDb);
    if (user?.id) {
      saveUserDatabase(user.id, newDb);
      saveWorkspaceToFirestore(user.id, newDb);
    }
  }, [user?.id]);

  const hasDemoData = useMemo(() => {
    return (
      db.ideas.some(i => i.isDemo) ||
      db.projects.some(p => p.isDemo) ||
      db.tasks.some(t => t.isDemo) ||
      db.releases.some(r => r.isDemo) ||
      db.archivedApps.some(a => a.isDemo)
    );
  }, [db]);

  const purgeDemoData = useCallback(() => {
    if (!user?.id) return;
    const cleaned = removeDemoData(user.id);
    try {
      localStorage.setItem(`ios_dev_hub_data_${user.id}_demo_purged`, 'true');
      localStorage.setItem('ios_dev_hub_global_demo_purged', 'true');
    } catch {}
    commit(cleaned);
    if (activeProjectId && !cleaned.projects.some(p => p.id === activeProjectId)) {
      setActiveProjectId(cleaned.projects[0]?.id || null);
    }
  }, [user?.id, activeProjectId, commit]);

  const reloadDemoData = useCallback(() => {
    if (!user?.id) return;
    const restored = restoreDemoData(user.id);
    commit(restored);
    if (!activeProjectId && restored.projects.length > 0) {
      setActiveProjectId(restored.projects[0].id);
    }
  }, [user?.id, activeProjectId, commit]);

  const keepItemAsMine = useCallback((type: 'idea' | 'project' | 'task' | 'release', id: string) => {
    if (!user?.id) return;
    const updated = keepDemoItem(user.id, type as any, id);
    commit(updated);
  }, [user?.id, commit]);

  // Full Database Import & Export Handlers
  const exportFullDatabase = useCallback((): string => {
    if (user) {
      return exportUserDataAsJson(user, db);
    }
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      application: 'AppDock75',
      version: '1.0.0',
      data: db,
    };
    return JSON.stringify(exportPayload, null, 2);
  }, [user, db]);

  const importDatabase = useCallback(async (
    incomingRaw: any,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<{
    success: boolean;
    stats: { projects: number; tasks: number; ideas: number; releases: number; changelogs: number };
    error?: string;
  }> => {
    if (!user?.id) {
      return {
        success: false,
        stats: { projects: 0, tasks: 0, ideas: 0, releases: 0, changelogs: 0 },
        error: 'No active user found. Please sign in to import workspace data.',
      };
    }

    try {
      let dataObj: any = incomingRaw;
      if (typeof incomingRaw === 'string') {
        dataObj = JSON.parse(incomingRaw);
      }

      // Support { data: { ... } }, { workspace: { ... } }, or root database structure
      const src = dataObj.data || dataObj.workspace || dataObj.db || dataObj;

      if (!src || typeof src !== 'object') {
        return {
          success: false,
          stats: { projects: 0, tasks: 0, ideas: 0, releases: 0, changelogs: 0 },
          error: 'Invalid file format. The file does not contain valid AppDock75 workspace data.',
        };
      }

      let newDb: UserDatabase;
      if (mode === 'replace') {
        newDb = {
          ideas: Array.isArray(src.ideas) ? src.ideas : [],
          projects: Array.isArray(src.projects) ? src.projects : [],
          tasks: Array.isArray(src.tasks) ? src.tasks : [],
          releases: Array.isArray(src.releases) ? src.releases : [],
          changelogEntries: Array.isArray(src.changelogEntries) ? src.changelogEntries : [],
          archivedApps: [],
          statuses: Array.isArray(src.statuses) && src.statuses.length > 0 ? src.statuses : db.statuses,
          checklists: Array.isArray(src.checklists) ? src.checklists : [],
          checklistTemplate: Array.isArray(src.checklistTemplate) && src.checklistTemplate.length > 0 ? src.checklistTemplate : db.checklistTemplate,
          appStoreInfoTemplate: Array.isArray(src.appStoreInfoTemplate) && src.appStoreInfoTemplate.length > 0 ? src.appStoreInfoTemplate : db.appStoreInfoTemplate,
          privacyPermissions: Array.isArray(src.privacyPermissions) && src.privacyPermissions.length > 0 ? src.privacyPermissions : db.privacyPermissions,
          certificates: Array.isArray(src.certificates) ? src.certificates : db.certificates,
          notifications: Array.isArray(src.notifications) ? src.notifications : [],
          demoPurged: src.demoPurged ?? true,
        };
      } else {
        // Merge mode: combine entities avoiding duplicate IDs
        const existingProjectIds = new Set(db.projects.map(p => p.id));
        const mergedProjects = [
          ...db.projects,
          ...(Array.isArray(src.projects) ? src.projects : []).filter((p: Project) => !existingProjectIds.has(p.id)),
        ];

        const existingIdeaIds = new Set(db.ideas.map(i => i.id));
        const mergedIdeas = [
          ...db.ideas,
          ...(Array.isArray(src.ideas) ? src.ideas : []).filter((i: Idea) => !existingIdeaIds.has(i.id)),
        ];

        const existingTaskIds = new Set(db.tasks.map(t => t.id));
        const mergedTasks = [
          ...db.tasks,
          ...(Array.isArray(src.tasks) ? src.tasks : []).filter((t: Task) => !existingTaskIds.has(t.id)),
        ];

        const existingReleaseIds = new Set(db.releases.map(r => r.id));
        const mergedReleases = [
          ...db.releases,
          ...(Array.isArray(src.releases) ? src.releases : []).filter((r: Release) => !existingReleaseIds.has(r.id)),
        ];

        const existingChangelogIds = new Set(db.changelogEntries.map(c => c.id));
        const mergedChangelogs = [
          ...db.changelogEntries,
          ...(Array.isArray(src.changelogEntries) ? src.changelogEntries : []).filter((c: ChangelogEntry) => !existingChangelogIds.has(c.id)),
        ];

        newDb = {
          ...db,
          projects: mergedProjects,
          ideas: mergedIdeas,
          tasks: mergedTasks,
          releases: mergedReleases,
          changelogEntries: mergedChangelogs,
          archivedApps: [],
          appStoreInfoTemplate: Array.isArray(src.appStoreInfoTemplate) && src.appStoreInfoTemplate.length > 0 ? src.appStoreInfoTemplate : db.appStoreInfoTemplate,
          statuses: Array.isArray(src.statuses) && src.statuses.length > 0 ? src.statuses : db.statuses,
        };
      }

      const sanitized = sanitizeDatabaseChecklists(newDb, user.id);
      commit(sanitized);

      if (sanitized.projects.length > 0) {
        setActiveProjectId(sanitized.projects[0].id);
      }

      return {
        success: true,
        stats: {
          projects: sanitized.projects.length,
          tasks: sanitized.tasks.length,
          ideas: sanitized.ideas.length,
          releases: sanitized.releases.length,
          changelogs: sanitized.changelogEntries.length,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        stats: { projects: 0, tasks: 0, ideas: 0, releases: 0, changelogs: 0 },
        error: err?.message || 'Error parsing or processing backup data.',
      };
    }
  }, [user?.id, db, commit]);

  // Idea CRUD
  const addIdea = useCallback((ideaData: Omit<Idea, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'comments' | 'timeline'>): Idea => {
    const newIdea: Idea = {
      ...ideaData,
      id: `idea-${Date.now()}`,
      userId: user?.id || 'anonymous',
      comments: [],
      timeline: [{ id: `tl-${Date.now()}`, event: 'Created idea note', date: new Date().toISOString().split('T')[0] }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };
    commit({ ...db, ideas: [newIdea, ...db.ideas] });
    return newIdea;
  }, [db, user?.id, commit]);

  const updateIdea = useCallback((id: string, updates: Partial<Idea>) => {
    const nextIdeas = db.ideas.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i);
    commit({ ...db, ideas: nextIdeas });
  }, [db, commit]);

  const deleteIdea = useCallback((id: string) => {
    const ideaToDelete = db.ideas.find(i => i.id === id);
    const remainingIdeas = db.ideas.filter(i => i.id !== id);
    const noMoreDemoIdeas = !remainingIdeas.some(i => i.isDemo);
    const isPurged = db.demoPurged === true || (ideaToDelete?.isDemo && noMoreDemoIdeas && !db.projects.some(p => p.isDemo));
    if (isPurged && user?.id) {
      try {
        localStorage.setItem(`ios_dev_hub_data_${user.id}_demo_purged`, 'true');
      } catch {}
    }
    commit({ ...db, ideas: remainingIdeas, demoPurged: isPurged ? true : db.demoPurged });
  }, [db, commit, user?.id]);

  const addIdeaComment = useCallback((ideaId: string, text: string) => {
    const nextIdeas = db.ideas.map(i => {
      if (i.id !== ideaId) return i;
      const newComment = {
        id: `cm-${Date.now()}`,
        author: user?.name || 'Developer',
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      return {
        ...i,
        comments: [...i.comments, newComment],
        updatedAt: new Date().toISOString(),
      };
    });
    commit({ ...db, ideas: nextIdeas });
  }, [db, user?.name, commit]);

  // Convert Idea to Project (in max 3 clicks as specified by PRD §1)
  const convertIdeaToProject = useCallback((ideaId: string, overrides?: Partial<Project>): Project => {
    const idea = db.ideas.find(i => i.id === ideaId);
    const cleanBundleSuffix = (idea?.title || 'app').toLowerCase().replace(/[^a-z0-9]/g, '');
    const newProjId = `proj-${Date.now()}`;
    const bundlePrefix = (user?.settings?.bundlePrefix || 'indie').trim().toLowerCase().replace(/[^a-z0-9.-]/g, '') || 'indie';

    const newProject: Project = {
      id: newProjId,
      userId: user?.id || 'anonymous',
      name: idea?.title || 'New iOS Project',
      description: idea?.description || 'Built from idea brainstorm workspace.',
      bundleId: `com.${bundlePrefix}.${cleanBundleSuffix || 'app'}`,
      platforms: ['iPhone', 'iPad'],
      minIOS: 'iOS 17.0',
      stack: {
        uiFramework: 'SwiftUI',
        swiftVersion: '6.0',
        xcodeVersion: '16.1',
        minIOS: 'iOS 17.0',
        architecture: 'MVVM + SwiftData',
      },
      status: overrides?.status || 'In development',
      devSubstatus: overrides?.devSubstatus || 'Design',
      dates: {
        startDate: new Date().toISOString().split('T')[0],
      },
      ideaId,
      links: [],
      assetSpecs: [
        { id: `ass-icon-${Date.now()}`, title: 'App Store Icon Master (1024×1024)', requiredSize: '1024 × 1024 px PNG', completed: false },
        { id: `ass-scr-${Date.now()}`, title: 'iPhone 6.9" Display Screenshots', requiredSize: '1320 × 2868 px', completed: false },
      ],
      localizedListings: [
        {
          locale: 'en-US',
          title: idea?.title || 'App Name',
          subtitle: 'Clean & modern iOS experience',
          keywords: idea?.tags.join(',') || 'ios,swift,app',
          description: idea?.description || 'Your daily companion on iOS.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
      ...overrides,
    };

    // Update Idea status to Converted & link project
    const nextIdeas = db.ideas.map(i => {
      if (i.id !== ideaId) return i;
      return {
        ...i,
        status: 'Converted' as const,
        projectId: newProjId,
        timeline: [
          ...i.timeline,
          { id: `tl-${Date.now()}`, event: `Converted into project "${newProject.name}"`, date: new Date().toISOString().split('T')[0] },
        ],
        updatedAt: new Date().toISOString(),
      };
    });

    // Create 3 standard starting tasks for the new project
    const starterTasks: Task[] = [
      {
        id: `tsk-${Date.now()}-1`,
        projectId: newProjId,
        title: 'Initialize Xcode project with SwiftUI & SwiftData',
        description: `Setup git repo, project targets, bundle ID ${newProject.bundleId}, and Swift 6 strict concurrency checks.`,
        type: 'Chore',
        priority: 'High',
        statusId: 'status-todo',
        labels: ['Xcode', 'SwiftUI', 'Setup'],
        subtasks: [
          { id: `st-${Date.now()}-1`, title: 'Create Xcode project file', completed: false },
          { id: `st-${Date.now()}-2`, title: 'Configure App Group & Entitlements', completed: false },
        ],
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `tsk-${Date.now()}-2`,
        projectId: newProjId,
        title: 'Design core interactive prototype',
        description: 'Map out the primary view hierarchy and state navigation.',
        type: 'Design',
        priority: 'Medium',
        statusId: 'status-todo',
        labels: ['UI', 'UX'],
        subtasks: [],
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `tsk-${Date.now()}-3`,
        projectId: newProjId,
        title: 'Prepare App Store Connect app record & Bundle ID',
        description: 'Register App ID in Apple Developer Portal and create placeholder in App Store Connect.',
        type: 'Feature',
        priority: 'Medium',
        statusId: 'status-backlog',
        labels: ['AppStore', 'Setup'],
        subtasks: [],
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Initialize fresh, 100% unchecked checklist items for the new project based on active checklist template
    const templateToUse = (db.checklistTemplate && db.checklistTemplate.length > 0)
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    const newProjectChecklists: ChecklistItem[] = templateToUse.map(c => ({
      ...c,
      id: `chk-${newProjId}-${c.id}`,
      projectId: newProjId,
      done: false,
    }));

    commit({
      ...db,
      projects: [newProject, ...db.projects],
      ideas: nextIdeas,
      tasks: [...starterTasks, ...db.tasks],
      checklists: [...newProjectChecklists, ...db.checklists],
    });

    setActiveProjectId(newProjId);
    return newProject;
  }, [db, user?.id, commit]);

  // Project CRUD
  const addProject = useCallback((projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'links' | 'assetSpecs' | 'localizedListings'>): Project => {
    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
      ...projectData,
      devSubstatus:
        projectData.devSubstatus ||
        (projectData.status === 'In development' ? 'Design' : undefined),
      id: newProjectId,
      userId: user?.id || 'anonymous',
      links: [],
      assetSpecs: [
        { id: `ass-1-${Date.now()}`, title: 'App Store Icon 1024×1024', requiredSize: '1024 × 1024 px PNG', completed: false },
        { id: `ass-2-${Date.now()}`, title: 'iPhone 6.9" Screenshots', requiredSize: '1320 × 2868 px', completed: false },
      ],
      localizedListings: [
        {
          locale: 'en-US',
          title: projectData.name,
          subtitle: 'Designed for iOS',
          keywords: 'ios,swiftui,mobile',
          description: projectData.description,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };

    // Initialize fresh, 100% unchecked checklist items for the new project based on active checklist template
    const templateToUse = (db.checklistTemplate && db.checklistTemplate.length > 0)
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    const newProjectChecklists: ChecklistItem[] = templateToUse.map(c => ({
      ...c,
      id: `chk-${newProjectId}-${c.id}`,
      projectId: newProjectId,
      done: false,
    }));

    commit({
      ...db,
      projects: [newProject, ...db.projects],
      checklists: [...newProjectChecklists, ...db.checklists],
    });
    setActiveProjectId(newProject.id);
    return newProject;
  }, [db, user?.id, commit]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    const nextProjects = db.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    commit({ ...db, projects: nextProjects });
  }, [db, commit]);

  const deleteProject = useCallback((id: string) => {
    const projToDelete = db.projects.find(p => p.id === id);
    const remaining = db.projects.filter(p => p.id !== id);
    const hasNoDemoProjects = !remaining.some(p => p.isDemo);
    const isPurged = db.demoPurged === true || projToDelete?.isDemo || hasNoDemoProjects;
    if (isPurged && user?.id) {
      try {
        localStorage.setItem(`ios_dev_hub_data_${user.id}_demo_purged`, 'true');
      } catch {}
    }
    commit({
      ...db,
      projects: remaining,
      tasks: db.tasks.filter(t => t.projectId !== id),
      releases: db.releases.filter(r => r.projectId !== id),
      checklists: db.checklists.filter(c => c.projectId !== id),
      demoPurged: isPurged ? true : db.demoPurged,
    });
    if (activeProjectId === id) {
      setActiveProjectId(remaining[0]?.id || null);
    }
  }, [db, activeProjectId, commit, user?.id]);

  // Workflow Statuses
  const updateStatuses = useCallback((statuses: WorkflowStatus[]) => {
    commit({ ...db, statuses });
  }, [db, commit]);

  const addStatus = useCallback((statusData: Omit<WorkflowStatus, 'id'>) => {
    const newStatus: WorkflowStatus = {
      ...statusData,
      id: `status-${Date.now()}`,
    };
    commit({ ...db, statuses: [...db.statuses, newStatus] });
  }, [db, commit]);

  const deleteStatus = useCallback((statusId: string, fallbackStatusId = 'status-todo') => {
    const updatedTasks = db.tasks.map(t => t.statusId === statusId ? { ...t, statusId: fallbackStatusId } : t);
    commit({
      ...db,
      statuses: db.statuses.filter(s => s.id !== statusId),
      tasks: updatedTasks,
    });
  }, [db, commit]);

  // Task CRUD
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order' | 'loggedMinutes'>): Task => {
    const projectTasks = db.tasks.filter(t => t.projectId === taskData.projectId);
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      subtasks: [],
      order: projectTasks.length,
      loggedMinutes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };
    commit({ ...db, tasks: [newTask, ...db.tasks] });
    return newTask;
  }, [db, commit]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const nextTasks = db.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    commit({ ...db, tasks: nextTasks });
  }, [db, commit]);

  const deleteTask = useCallback((id: string) => {
    commit({ ...db, tasks: db.tasks.filter(t => t.id !== id) });
  }, [db, commit]);

  const moveTask = useCallback((taskId: string, targetStatusId: string, newOrder?: number) => {
    const nextTasks = db.tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          statusId: targetStatusId,
          order: newOrder !== undefined ? newOrder : t.order,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    commit({ ...db, tasks: nextTasks });
  }, [db, commit]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    const nextTasks = db.tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
        updatedAt: new Date().toISOString(),
      };
    });
    commit({ ...db, tasks: nextTasks });
  }, [db, commit]);

  const addSubtask = useCallback((taskId: string, title: string) => {
    const nextTasks = db.tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [...t.subtasks, { id: `st-${Date.now()}`, title, completed: false }],
        updatedAt: new Date().toISOString(),
      };
    });
    commit({ ...db, tasks: nextTasks });
  }, [db, commit]);

  const logTaskTime = useCallback((taskId: string, minutes: number) => {
    const nextTasks = db.tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        loggedMinutes: (t.loggedMinutes || 0) + minutes,
        updatedAt: new Date().toISOString(),
      };
    });
    commit({ ...db, tasks: nextTasks });
  }, [db, commit]);

  // Release CRUD
  const addRelease = useCallback((releaseData: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>): Release => {
    const newRelease: Release = {
      ...releaseData,
      id: `rel-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };
    commit({ ...db, releases: [newRelease, ...db.releases] });
    return newRelease;
  }, [db, commit]);

  const updateRelease = useCallback((id: string, updates: Partial<Release>) => {
    const nextReleases = db.releases.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
    commit({ ...db, releases: nextReleases });
  }, [db, commit]);

  const deleteRelease = useCallback((id: string) => {
    commit({
      ...db,
      releases: db.releases.filter(r => r.id !== id),
      changelogEntries: db.changelogEntries.filter(c => c.releaseId !== id),
    });
  }, [db, commit]);

  const markAsReleased = useCallback((releaseId: string, releaseDate: string) => {
    const release = db.releases.find(r => r.id === releaseId);
    if (!release) return;

    const nextReleases = db.releases.map(r => {
      if (r.id !== releaseId) return r;
      return {
        ...r,
        status: 'Released' as const,
        releasedDate: releaseDate,
        updatedAt: new Date().toISOString(),
      };
    });

    // Also update associated project to Released status if found
    const nextProjects = db.projects.map(p => {
      if (p.id === release.projectId && p.status !== 'Released') {
        return {
          ...p,
          status: 'Released' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    commit({
      ...db,
      releases: nextReleases,
      projects: nextProjects,
    });
  }, [db, commit]);

  const addChangelogEntry = useCallback((entryData: Omit<ChangelogEntry, 'id'>): ChangelogEntry => {
    const newEntry: ChangelogEntry = {
      ...entryData,
      id: `cl-${Date.now()}`,
    };
    commit({ ...db, changelogEntries: [...db.changelogEntries, newEntry] });
    return newEntry;
  }, [db, commit]);

  const updateChangelogEntry = useCallback((id: string, updates: Partial<ChangelogEntry>) => {
    commit({
      ...db,
      changelogEntries: db.changelogEntries.map(c => c.id === id ? { ...c, ...updates } : c),
    });
  }, [db, commit]);

  const deleteChangelogEntry = useCallback((id: string) => {
    commit({
      ...db,
      changelogEntries: db.changelogEntries.filter(c => c.id !== id),
    });
  }, [db, commit]);

  const generateReleaseNotes = useCallback((releaseId: string, locale = 'en-US'): string => {
    const release = db.releases.find(r => r.id === releaseId);
    if (!release) return '';

    const entries = db.changelogEntries.filter(c => c.releaseId === releaseId);
    let text = `What's New in Version ${release.version}:\n`;

    if (entries.length > 0) {
      for (const item of entries) {
        text += `• [${item.type}] ${item.text}\n`;
      }
    } else {
      text += `• Performance improvements and bug fixes for the smoothest iOS experience.\n`;
    }

    text += `\nThank you for using our app! If you enjoy it, please consider leaving a review on the App Store.`;
    return text.slice(0, 4000); // Respect 4000 App Store character boundary
  }, [db]);

  // Standard Checklist Template CRUD (Global for all apps)
  const checklistTemplate = useMemo(() => {
    return db.checklistTemplate && db.checklistTemplate.length > 0
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;
  }, [db.checklistTemplate]);

  const addChecklistTemplateItem = useCallback((item: { title: string; description: string; category?: string; required?: boolean; position?: 'start' | 'end' }) => {
    const newItemId = `chk-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const templateItem: ChecklistItem = {
      id: newItemId,
      title: item.title.trim(),
      description: item.description.trim(),
      category: item.category?.trim() || 'App Store Submission',
      done: false,
      required: item.required ?? true,
    };

    const currentTemplate = db.checklistTemplate && db.checklistTemplate.length > 0
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    const updatedTemplate = item.position === 'start'
      ? [templateItem, ...currentTemplate]
      : [...currentTemplate, templateItem];

    // Ensure every project has all items from updatedTemplate
    let updatedChecklists = [...db.checklists];
    const existingProjects = db.projects || [];

    for (const proj of existingProjects) {
      const projItems = updatedChecklists.filter(c => c.projectId === proj.id);
      for (const tpl of updatedTemplate) {
        const hasItem = projItems.some(
          c =>
            c.id === `chk-${proj.id}-${tpl.id}` ||
            c.id.endsWith(`-${tpl.id}`) ||
            c.id === tpl.id ||
            (c.title === tpl.title && c.category === tpl.category)
        );
        if (!hasItem) {
          const newItem: ChecklistItem = {
            ...tpl,
            id: `chk-${proj.id}-${tpl.id}`,
            projectId: proj.id,
            done: false,
          };
          updatedChecklists.push(newItem);
          projItems.push(newItem);
        }
      }
    }

    commit({
      ...db,
      checklistTemplate: updatedTemplate,
      checklists: updatedChecklists,
    });
  }, [db, commit]);

  const updateChecklistTemplateItem = useCallback((id: string, updates: Partial<ChecklistItem>) => {
    const currentTemplate = db.checklistTemplate && db.checklistTemplate.length > 0
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    const oldItem = currentTemplate.find(t => t.id === id);
    const updatedTemplate = currentTemplate.map(t => (t.id === id ? { ...t, ...updates } : t));

    // Update corresponding items across projects (keeps the done state intact!)
    const updatedChecklists = db.checklists.map(c => {
      const isMatch =
        c.id.includes(id) ||
        (oldItem && c.title === oldItem.title && c.category === oldItem.category);

      if (isMatch) {
        return {
          ...c,
          title: updates.title !== undefined ? updates.title : c.title,
          description: updates.description !== undefined ? updates.description : c.description,
          category: updates.category !== undefined ? updates.category : c.category,
          required: updates.required !== undefined ? updates.required : c.required,
        };
      }
      return c;
    });

    commit({
      ...db,
      checklistTemplate: updatedTemplate,
      checklists: updatedChecklists,
    });
  }, [db, commit]);

  const deleteChecklistTemplateItem = useCallback((id: string) => {
    const currentTemplate = db.checklistTemplate && db.checklistTemplate.length > 0
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    const itemToDelete = currentTemplate.find(t => t.id === id);
    const updatedTemplate = currentTemplate.filter(t => t.id !== id);

    // Remove corresponding items from projects
    const updatedChecklists = db.checklists.filter(c => {
      if (c.id.includes(id)) return false;
      if (itemToDelete && c.title === itemToDelete.title && c.category === itemToDelete.category) return false;
      return true;
    });

    commit({
      ...db,
      checklistTemplate: updatedTemplate,
      checklists: updatedChecklists,
    });
  }, [db, commit]);

  const reorderChecklistTemplate = useCallback((newOrderedTemplate: ChecklistItem[]) => {
    commit({
      ...db,
      checklistTemplate: newOrderedTemplate,
    });
  }, [db, commit]);

  const moveChecklistTemplateItem = useCallback((id: string, direction: 'up' | 'down') => {
    const currentTemplate = db.checklistTemplate && db.checklistTemplate.length > 0
      ? [...db.checklistTemplate]
      : DEFAULT_CHECKLIST_TEMPLATE.map(c => ({ ...c }));

    const index = currentTemplate.findIndex(t => t.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentTemplate.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const [moved] = currentTemplate.splice(index, 1);
    currentTemplate.splice(targetIndex, 0, moved);

    commit({
      ...db,
      checklistTemplate: currentTemplate,
    });
  }, [db, commit]);

  const resetChecklistTemplate = useCallback(() => {
    const defaultTemplate = DEFAULT_CHECKLIST_TEMPLATE.map(c => ({ ...c }));
    commit({
      ...db,
      checklistTemplate: defaultTemplate,
    });
  }, [db, commit]);

  const syncChecklistTemplateToAllProjects = useCallback(() => {
    const activeTemplate = db.checklistTemplate && db.checklistTemplate.length > 0
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    let updatedChecklists = [...db.checklists];

    for (const proj of db.projects) {
      const projItems = updatedChecklists.filter(c => c.projectId === proj.id);
      for (const tpl of activeTemplate) {
        const hasItem = projItems.some(
          c =>
            c.id === `chk-${proj.id}-${tpl.id}` ||
            c.id.endsWith(`-${tpl.id}`) ||
            c.id === tpl.id ||
            (c.title === tpl.title && c.category === tpl.category)
        );
        if (!hasItem) {
          const newItem: ChecklistItem = {
            ...tpl,
            id: `chk-${proj.id}-${tpl.id}`,
            projectId: proj.id,
            done: false,
          };
          updatedChecklists.push(newItem);
          projItems.push(newItem);
        }
      }
    }

    commit({
      ...db,
      checklists: updatedChecklists,
    });
  }, [db, commit]);

  // Checklists & Tools
  const toggleChecklist = useCallback((id: string, projectId?: string) => {
    if (db.checklists.some(c => c.id === id)) {
      commit({
        ...db,
        checklists: db.checklists.map(c => c.id === id ? { ...c, done: !c.done } : c),
      });
    } else {
      // If toggling an item that was rendered from template for a project
      const templateToUse = db.checklistTemplate && db.checklistTemplate.length > 0
        ? db.checklistTemplate
        : DEFAULT_CHECKLIST_TEMPLATE;
      const templateMatch = templateToUse.find(t => id.includes(t.id));
      if (templateMatch) {
        let targetProjId = projectId || activeProjectId || undefined;
        if (!targetProjId && id.startsWith('chk-')) {
          const withoutPrefix = id.slice(4);
          const tplIndex = withoutPrefix.lastIndexOf(templateMatch.id);
          if (tplIndex > 1) {
            targetProjId = withoutPrefix.slice(0, tplIndex - 1);
          }
        }

        const newItem: ChecklistItem = {
          ...templateMatch,
          id,
          projectId: targetProjId,
          done: true,
        };
        commit({
          ...db,
          checklists: [...db.checklists, newItem],
        });
      }
    }
  }, [db, activeProjectId, commit]);

  const resetChecklist = useCallback((projectId?: string) => {
    const templateToUse = db.checklistTemplate && db.checklistTemplate.length > 0
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    if (projectId) {
      const hasForProj = db.checklists.some(c => c.projectId === projectId);
      if (hasForProj) {
        commit({
          ...db,
          checklists: db.checklists.map(c => c.projectId === projectId ? { ...c, done: false } : c),
        });
      } else {
        const freshItems: ChecklistItem[] = templateToUse.map(c => ({
          ...c,
          id: `chk-${projectId}-${c.id}`,
          projectId,
          done: false,
        }));
        commit({
          ...db,
          checklists: [...freshItems, ...db.checklists.filter(c => c.projectId !== projectId)],
        });
      }
    } else {
      commit({
        ...db,
        checklists: db.checklists.map(c => ({ ...c, done: false })),
      });
    }
  }, [db, commit]);

  const updatePrivacyPermission = useCallback((key: string, updates: Partial<PrivacyPermission>) => {
    commit({
      ...db,
      privacyPermissions: db.privacyPermissions.map(p => p.key === key ? { ...p, ...updates } : p),
    });
  }, [db, commit]);

  const addCertificate = useCallback((certData: Omit<CertificateReminder, 'id' | 'daysRemaining'>) => {
    const today = new Date();
    const expiry = new Date(certData.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const newCert: CertificateReminder = {
      ...certData,
      id: `cert-${Date.now()}`,
      daysRemaining: diffDays,
    };
    commit({ ...db, certificates: [...db.certificates, newCert] });
  }, [db, commit]);

  const deleteCertificate = useCallback((id: string) => {
    commit({
      ...db,
      certificates: db.certificates.filter(c => c.id !== id),
    });
  }, [db, commit]);

  const markNotificationRead = useCallback((id: string) => {
    commit({
      ...db,
      notifications: db.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    });
  }, [db, commit]);

  const clearNotifications = useCallback(() => {
    commit({ ...db, notifications: [] });
  }, [db, commit]);

  // App Store Info Q&A (Global template synchronizing across all projects)
  const appStoreQuestions: AppStoreQuestionItem[] = useMemo(() => {
    return Array.isArray(db.appStoreInfoTemplate) && db.appStoreInfoTemplate.length > 0
      ? db.appStoreInfoTemplate
      : DEFAULT_APP_STORE_QUESTIONS;
  }, [db.appStoreInfoTemplate]);

  const addAppStoreQuestion = useCallback((questionData: Omit<AppStoreQuestionItem, 'id' | 'order'>): AppStoreQuestionItem => {
    const current = Array.isArray(db.appStoreInfoTemplate) && db.appStoreInfoTemplate.length > 0
      ? [...db.appStoreInfoTemplate]
      : DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q }));

    const newQuestion: AppStoreQuestionItem = {
      ...questionData,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order: current.length + 1,
    };

    const updated = [...current, newQuestion];
    commit({
      ...db,
      appStoreInfoTemplate: updated,
    });
    return newQuestion;
  }, [db, commit]);

  const updateAppStoreQuestion = useCallback((id: string, updates: Partial<AppStoreQuestionItem>) => {
    const current = Array.isArray(db.appStoreInfoTemplate) && db.appStoreInfoTemplate.length > 0
      ? [...db.appStoreInfoTemplate]
      : DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q }));

    const updated = current.map(q => q.id === id ? { ...q, ...updates } : q);
    commit({
      ...db,
      appStoreInfoTemplate: updated,
    });
  }, [db, commit]);

  const bulkUpdateAppStoreQuestions = useCallback((updates: { id: string; changes: Partial<AppStoreQuestionItem> }[]) => {
    const current = Array.isArray(db.appStoreInfoTemplate) && db.appStoreInfoTemplate.length > 0
      ? [...db.appStoreInfoTemplate]
      : DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q }));

    const updated = current.map(q => {
      const update = updates.find(u => u.id === q.id);
      return update ? { ...q, ...update.changes } : q;
    });

    commit({
      ...db,
      appStoreInfoTemplate: updated,
    });
  }, [db, commit]);

  const deleteAppStoreQuestion = useCallback((id: string) => {
    const current = Array.isArray(db.appStoreInfoTemplate) && db.appStoreInfoTemplate.length > 0
      ? [...db.appStoreInfoTemplate]
      : DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q }));

    const updated = current.filter(q => q.id !== id);
    const reindexed = updated.map((q, idx) => ({ ...q, order: idx + 1 }));

    commit({
      ...db,
      appStoreInfoTemplate: reindexed,
    });
  }, [db, commit]);

  const reorderAppStoreQuestion = useCallback((id: string, direction: 'up' | 'down') => {
    const current = Array.isArray(db.appStoreInfoTemplate) && db.appStoreInfoTemplate.length > 0
      ? [...db.appStoreInfoTemplate]
      : DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q }));

    const index = current.findIndex(q => q.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === current.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const [moved] = current.splice(index, 1);
    current.splice(targetIndex, 0, moved);

    const reordered = current.map((q, idx) => ({ ...q, order: idx + 1 }));
    commit({
      ...db,
      appStoreInfoTemplate: reordered,
    });
  }, [db, commit]);

  const resetAppStoreQuestions = useCallback(() => {
    commit({
      ...db,
      appStoreInfoTemplate: DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q })),
    });
  }, [db, commit]);

  const updateProjectAppStoreAnswer = useCallback((projectId: string, questionId: string, answer: string) => {
    const project = db.projects.find(p => p.id === projectId);
    if (!project) return;

    const currentAnswers = project.appStoreAnswers || {};
    const updatedAnswers = {
      ...currentAnswers,
      [questionId]: answer,
    };

    const updatedProjects = db.projects.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        appStoreAnswers: updatedAnswers,
        updatedAt: new Date().toISOString(),
      };
    });

    commit({
      ...db,
      projects: updatedProjects,
    });
  }, [db, commit]);

  return (
    <DataContext.Provider
      value={{
        db,
        activeProjectId,
        setActiveProjectId,
        hasDemoData,
        purgeDemoData,
        reloadDemoData,
        keepItemAsMine,
        exportFullDatabase,
        importDatabase,
        addIdea,
        updateIdea,
        deleteIdea,
        addIdeaComment,
        convertIdeaToProject,
        addProject,
        updateProject,
        deleteProject,
        updateStatuses,
        addStatus,
        deleteStatus,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        toggleSubtask,
        addSubtask,
        logTaskTime,
        addRelease,
        updateRelease,
        deleteRelease,
        markAsReleased,
        addChangelogEntry,
        updateChangelogEntry,
        deleteChangelogEntry,
        generateReleaseNotes,
        toggleChecklist,
        resetChecklist,
        updatePrivacyPermission,
        addCertificate,
        deleteCertificate,
        checklistTemplate,
        addChecklistTemplateItem,
        updateChecklistTemplateItem,
        deleteChecklistTemplateItem,
        reorderChecklistTemplate,
        moveChecklistTemplateItem,
        resetChecklistTemplate,
        syncChecklistTemplateToAllProjects,
        appStoreQuestions,
        addAppStoreQuestion,
        updateAppStoreQuestion,
        bulkUpdateAppStoreQuestions,
        deleteAppStoreQuestion,
        reorderAppStoreQuestion,
        resetAppStoreQuestions,
        updateProjectAppStoreAnswer,
        markNotificationRead,
        clearNotifications,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProviderComponent');
  }
  return context;
};
