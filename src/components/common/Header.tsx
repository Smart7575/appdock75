/**
 * iOS Dev Hub - Top Navigation Bar
 * Complies with Top Bar Contract: Zone 1 (Wordmark/Breadcrumbs), Zone 2 (Search/Filters), Zone 3 (Actions & Profile)
 */

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Sparkles,
  ShieldAlert,
  LogOut,
  User,
  Settings,
  FolderPlus,
  Lightbulb,
  Tag,
  CheckSquare,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentView: string;
  onOpenCommandPalette: () => void;
  onNavigate: (view: string) => void;
  onOpenNewModal: (type: 'idea' | 'project' | 'task' | 'release') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenCommandPalette,
  onNavigate,
  onOpenNewModal,
}) => {
  const { user, signOut } = useAuth();
  const { db, markNotificationRead, clearNotifications } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifs = db.notifications.filter(n => !n.read);

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    ideas: 'Ideas & Brainstorm',
    projects: 'Project Workspace',
    released: 'Released Projects',
    releases: 'Releases & Changelogs',
    archive: 'App Archive',
    tools: 'iOS Development Tools',
    settings: 'Settings & Data',
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Brand / View Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            AppDock75
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-medium text-slate-300 truncate">
            {viewTitles[currentView] || 'Workspace'}
          </span>
        </div>
      </div>

      {/* Zone 2: Search Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors cursor-pointer w-48 md:w-64"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">Quick jump or search...</span>
          <kbd className="ml-auto text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Zone 3: New Quick Action + Notifications + Profile */}
        <div className="flex items-center gap-2">
          {/* Mobile search trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {showNewMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNewMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl shadow-black/40 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { setShowNewMenu(false); onOpenNewModal('idea'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    New Idea
                  </button>
                  <button
                    onClick={() => { setShowNewMenu(false); onOpenNewModal('project'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                    New Project
                  </button>
                  <button
                    onClick={() => { setShowNewMenu(false); onOpenNewModal('task'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    New Kanban Task
                  </button>
                  <button
                    onClick={() => { setShowNewMenu(false); onOpenNewModal('release'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    New Release
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-40 text-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
                    <span className="font-semibold text-slate-200">Notifications</span>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {db.notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-500">
                        No notifications right now
                      </div>
                    ) : (
                      db.notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                            !n.read ? 'bg-slate-800/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-medium text-slate-200">{n.title}</span>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Button (Light Mode / Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-500" />
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span className="hidden md:inline text-xs font-medium text-slate-300 max-w-28 truncate">
                {user?.name || 'Developer'}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-40 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-medium text-slate-200 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
                      <span>Auth:</span>
                      {user?.providers.map(p => (
                        <span key={p} className="capitalize text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowUserMenu(false); onNavigate('settings'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); onNavigate('settings'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    Data & Export
                  </button>

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={() => { setShowUserMenu(false); signOut(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
