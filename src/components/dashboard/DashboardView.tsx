/**
 * iOS Dev Hub - Dashboard View
 * Matches PRD Section 8.1:
 * - Active projects with progress indicators (% done)
 * - Tasks due today/this week
 * - Upcoming releases & deadlines
 * - Recently captured ideas with fast capture input
 * - Latest published app summary
 * - Quick action buttons: New idea, New project, New release
 * - Demo data banner with 1-click removal
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  FolderGit2,
  Lightbulb,
  Tag,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DevSubstatusPipeline } from '../projects/DevSubstatusPipeline';
import {
  DevelopmentSubstatus,
  DEVELOPMENT_SUBSTATUSES,
  calculateSubphaseProgress,
} from '../../types';
import { getProjectColorTheme } from '../../utils/projectColors';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenNewModal: (type: 'idea' | 'project' | 'task' | 'release') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewModal,
}) => {
  const {
    db,
    setActiveProjectId,
    addIdea,
    updateProject,
  } = useData();

  const [quickIdeaTitle, setQuickIdeaTitle] = useState('');

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIdeaTitle.trim()) return;
    addIdea({
      title: quickIdeaTitle.trim(),
      description: 'Quick captured from dashboard.',
      tags: ['QuickCapture'],
      category: 'Productivity',
      scores: { impact: 7, effort: 5, market: 7, fun: 7 },
      status: 'New',
    });
    setQuickIdeaTitle('');
  };

  // Metrics calculation - active projects strictly sorted alphabetically (A -> Z)
  const activeProjects = useMemo(() => {
    return [...db.projects]
      .filter(p => p.status !== 'Archived' && p.status !== 'Released')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [db.projects]);

  const openTasks = db.tasks.filter(t => {
    const status = db.statuses.find(s => s.id === t.statusId);
    return status?.type !== 'Done' && status?.type !== 'Cancelled';
  });
  const upcomingReleases = db.releases.filter(r => r.status !== 'Released');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Developer Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your indie iOS pipeline from initial concepts to App Store production.
          </p>
        </div>

        {/* Quick Actions (PRD Section 8.1) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenNewModal('idea')}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>New Idea</span>
          </button>
          <button
            onClick={() => onOpenNewModal('project')}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
            <span>New Project</span>
          </button>
          <button
            onClick={() => onOpenNewModal('release')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>New Release</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid - Workflow order: Ideas -> Projects -> Tasks -> Releases */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Brainstorm Ideas */}
        <div
          onClick={() => onNavigate('ideas')}
          className="stat-card-ideas p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Brainstorm Ideas</span>
            <Lightbulb className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {db.ideas.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {db.ideas.filter(i => i.status === 'Validated').length} validated opportunities
          </div>
        </div>

        {/* 2. Active Projects */}
        <div
          onClick={() => onNavigate('projects')}
          className="stat-card-projects p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active Projects</span>
            <FolderGit2 className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {activeProjects.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {db.projects.filter(p => p.status === 'In development').length} in active development
          </div>
        </div>

        {/* 3. Open Tasks */}
        <div
          onClick={() => onNavigate('projects')}
          className="stat-card-tasks p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Open Tasks</span>
            <Clock className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {openTasks.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across all project boards
          </div>
        </div>

        {/* 4. Upcoming Releases */}
        <div
          onClick={() => onNavigate('releases')}
          className="stat-card-releases p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Upcoming Releases</span>
            <Tag className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {upcomingReleases.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {db.releases.filter(r => r.status === 'In TestFlight').length} currently in TestFlight
          </div>
        </div>
      </div>

      {/* Quick Idea Capture Input (PRD §8.2) */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <form onSubmit={handleQuickCapture} className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder='Quick capture: "Type an idea and press Enter"...'
            value={quickIdeaTitle}
            onChange={e => setQuickIdeaTitle(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!quickIdeaTitle.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Capture
          </button>
        </form>
      </div>

      {/* Main Content - Full-Width Active Projects */}
      <div className="w-full">
        {/* Active Projects & Progress Indicators (Full Width, Alphabetically Sorted) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 w-full shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Active Projects</h2>
                <span className="text-xs font-mono font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {activeProjects.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of active iOS project workspaces — sorted alphabetically (A–Z)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenNewModal('project')}
                className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-slate-300 hover:text-white px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View all in Projects</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {activeProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No active projects. Start by creating a project or converting an idea.
              </div>
            ) : (
              activeProjects.map((proj, idx) => {
                const projectTasks = db.tasks.filter(t => t.projectId === proj.id);
                const doneTasks = projectTasks.filter(t => {
                  const status = db.statuses.find(s => s.id === t.statusId);
                  return status?.type === 'Done';
                });
                const currentStepInfo =
                  DEVELOPMENT_SUBSTATUSES.find(s => s.id === (proj.devSubstatus || 'Design')) ||
                  DEVELOPMENT_SUBSTATUSES[0];
                // 7 subphases, each counts for 1/7, rounded up to whole numbers (Math.ceil)
                const percent = calculateSubphaseProgress(proj.devSubstatus);
                const colorTheme = getProjectColorTheme(proj, idx);

                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      onNavigate('projects');
                    }}
                    className={`p-4 sm:p-5 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 ${colorTheme.cardBorder} transition-all cursor-pointer group shadow-sm`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {proj.icon ? (
                          <img
                            src={proj.icon}
                            alt={proj.name}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700/80 shadow-md shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-700 shrink-0 shadow-sm">
                            {proj.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          {/* Distinct Colored Title Field (Light & Dark Mode) */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border font-bold text-sm tracking-tight transition-transform group-hover:scale-[1.01] ${colorTheme.titleField}`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${colorTheme.dot}`} />
                              <span className="truncate">{proj.name}</span>
                            </span>
                            {proj.isDemo && (
                              <span className="text-[10px] font-medium text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                Demo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                            <span className="font-mono text-slate-300">{proj.bundleId}</span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="shrink-0 text-slate-400">{proj.stack.uiFramework} ({proj.minIOS}+)</span>
                            {proj.description && (
                              <>
                                <span aria-hidden="true" className="text-slate-600 hidden sm:inline">·</span>
                                <span className="text-slate-500 truncate max-w-md hidden sm:inline">{proj.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <span className="text-xs font-mono tabular-nums text-slate-300 font-semibold px-2.5 py-1 bg-slate-900/60 rounded-md border border-slate-800 flex items-center gap-1.5 shadow-sm">
                          <span className="text-[11px] text-slate-400 font-sans font-normal">Fase {currentStepInfo.step}/7 ·</span>
                          <span>{percent}% Done</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with Project Color Theme based on subphase progress */}
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-2.5">
                      <div
                        className={`h-full ${colorTheme.progressBar} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{doneTasks.length} of {projectTasks.length} tasks completed · Fase {currentStepInfo.step}/7 ({currentStepInfo.name})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Status: {proj.status}</span>
                        {proj.status === 'In development' && (
                          <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded">
                            {proj.devSubstatus || 'Design'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Development Substatus Pipeline (When In Development) */}
                    {proj.status === 'In development' && (
                      <div
                        className="mt-3.5 pt-3 border-t border-slate-800/80"
                        onClick={e => e.stopPropagation()}
                      >
                        <DevSubstatusPipeline
                          currentSubstatus={proj.devSubstatus || 'Design'}
                          onSelectSubstatus={newSub => {
                            updateProject(proj.id, { devSubstatus: newSub });
                          }}
                          compact
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
