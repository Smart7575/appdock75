/**
 * iOS Dev Hub - Sidebar Navigation (Desktop) & Tab Bar (Mobile)
 * Strictly matches PRD Section 7 Information Architecture.
 */

import React from 'react';
import {
  LayoutDashboard,
  Lightbulb,
  FolderGit2,
  Rocket,
  Tag,
  Settings,
  LogOut,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { db } = useData();
  const { user, signOut } = useAuth();

  const releasedCount = db.projects.filter(p => p.status === 'Released').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: LayoutDashboard, count: undefined },
    { id: 'ideas', label: 'Ideas', mobileLabel: 'Ideas', icon: Lightbulb, count: db.ideas.length },
    { id: 'projects', label: 'Projects', mobileLabel: 'Projects', icon: FolderGit2, count: db.projects.filter(p => p.status !== 'Released').length },
    { id: 'released', label: 'Released', mobileLabel: 'Released', icon: Rocket, count: releasedCount },
    { id: 'releases', label: 'Releases and Builds', mobileLabel: 'Releases', icon: Tag, count: db.releases.filter(r => r.status !== 'Released').length },
    { id: 'time', label: 'Time Tracker', mobileLabel: 'Timer', icon: Clock, count: (db.timeLogs || []).length },
    { id: 'settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings, count: undefined },
  ];

  return (
    <>
      {/* iPad & Desktop Sidebar: Flex column fitting viewport height without outer scroll */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-900/60 shrink-0 h-full overflow-hidden">
        {/* Header / Section Label */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Workspace
          </div>
        </div>

        {/* Scrollable Middle Navigation Links */}
        <div className="flex-1 min-h-0 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded shrink-0">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pinned Footer: User Info + Prominent Red Log Out Button + Safe Area */}
        <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-slate-800/80 bg-slate-900/60 mt-auto shrink-0 space-y-2.5">
          {user && (
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="w-full min-h-[44px] flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
              title="Account Settings"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </button>
          )}
          <button
            onClick={signOut}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            title="Log Out of AppDock75"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* iPhone Tab Bar (Bottom Nav, no max-height, with safe-area-inset-bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-stretch justify-around px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))] z-40">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] py-1 px-0.5 text-[10px] leading-tight font-medium transition-colors cursor-pointer ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
