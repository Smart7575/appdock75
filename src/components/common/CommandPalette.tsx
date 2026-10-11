/**
 * iOS Dev Hub - Command Palette (⌘K)
 * Fast search and keyboard navigation across all entities.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Lightbulb,
  FolderGit2,
  Rocket,
  CheckSquare,
  Tag,
  Archive,
  Wrench,
  Settings,
  Plus,
  Trash2,
  Download,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenNewModal: (type: 'idea' | 'project' | 'task' | 'release') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewModal,
}) => {
  const { db, setActiveProjectId, purgeDemoData, hasDemoData } = useData();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close on Escape or open on ⌘K / /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search items index
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const items: Array<{
      id: string;
      title: string;
      category: string;
      icon: any;
      action: () => void;
      badge?: string;
    }> = [];

    // Quick Actions
    items.push({
      id: 'act-new-idea',
      title: 'Create New Idea',
      category: 'Actions',
      icon: Plus,
      action: () => { onClose(); onOpenNewModal('idea'); },
    });
    items.push({
      id: 'act-new-proj',
      title: 'Create New Project',
      category: 'Actions',
      icon: Plus,
      action: () => { onClose(); onOpenNewModal('project'); },
    });
    items.push({
      id: 'act-new-task',
      title: 'Create New Task',
      category: 'Actions',
      icon: Plus,
      action: () => { onClose(); onOpenNewModal('task'); },
    });
    items.push({
      id: 'act-new-rel',
      title: 'Create New Release',
      category: 'Actions',
      icon: Plus,
      action: () => { onClose(); onOpenNewModal('release'); },
    });

    if (hasDemoData) {
      items.push({
        id: 'act-purge-demo',
        title: 'Remove Demo Data',
        category: 'Actions',
        icon: Trash2,
        action: () => { onClose(); purgeDemoData(); },
      });
    }

    // Navigation sections
    items.push({
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: ArrowRight,
      action: () => { onClose(); onNavigate('dashboard'); },
    });
    items.push({
      id: 'nav-ideas',
      title: 'Go to Ideas & Brainstorm',
      category: 'Navigation',
      icon: Lightbulb,
      action: () => { onClose(); onNavigate('ideas'); },
    });
    items.push({
      id: 'nav-projects',
      title: 'Go to Projects Workspace',
      category: 'Navigation',
      icon: FolderGit2,
      action: () => { onClose(); onNavigate('projects'); },
    });
    items.push({
      id: 'nav-released',
      title: 'Go to Released Projects',
      category: 'Navigation',
      icon: Rocket,
      action: () => { onClose(); onNavigate('released'); },
    });
    items.push({
      id: 'nav-releases',
      title: 'Go to Releases & Changelogs',
      category: 'Navigation',
      icon: Tag,
      action: () => { onClose(); onNavigate('releases'); },
    });
    items.push({
      id: 'nav-archive',
      title: 'Go to App Archive',
      category: 'Navigation',
      icon: Archive,
      action: () => { onClose(); onNavigate('archive'); },
    });
    items.push({
      id: 'nav-tools',
      title: 'Go to iOS Development Tools',
      category: 'Navigation',
      icon: Wrench,
      action: () => { onClose(); onNavigate('tools'); },
    });
    items.push({
      id: 'nav-settings',
      title: 'Go to Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => { onClose(); onNavigate('settings'); },
    });

    // Projects
    db.projects.forEach(p => {
      items.push({
        id: `p-${p.id}`,
        title: p.name,
        category: 'Projects',
        icon: FolderGit2,
        badge: p.status,
        action: () => {
          setActiveProjectId(p.id);
          onClose();
          onNavigate('projects');
        },
      });
    });

    // Ideas
    db.ideas.forEach(i => {
      items.push({
        id: `i-${i.id}`,
        title: i.title,
        category: 'Ideas',
        icon: Lightbulb,
        badge: i.status,
        action: () => {
          onClose();
          onNavigate('ideas');
        },
      });
    });

    // Tasks
    db.tasks.forEach(t => {
      items.push({
        id: `t-${t.id}`,
        title: t.title,
        category: 'Tasks',
        icon: CheckSquare,
        badge: t.priority,
        action: () => {
          setActiveProjectId(t.projectId);
          onClose();
          onNavigate('projects');
        },
      });
    });

    // Filter by query
    if (!q) return items.slice(0, 8);
    return items.filter(
      item => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, db, hasDemoData, onClose, onNavigate, onOpenNewModal, purgeDemoData, setActiveProjectId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, project, idea, or task..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="w-full px-3 py-3.5 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching commands or items found for "{query}".
            </div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-600/20 text-blue-200' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
