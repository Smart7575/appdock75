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
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { db } = useData();
  const { signOut } = useAuth();

  const releasedCount = db.projects.filter(p => p.status === 'Released').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: undefined },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb, count: db.ideas.length },
    { id: 'projects', label: 'Projects', icon: FolderGit2, count: db.projects.filter(p => p.status !== 'Released').length },
    { id: 'released', label: 'Released', icon: Rocket, count: releasedCount },
    { id: 'releases', label: 'Releases and Builds', icon: Tag, count: db.releases.filter(r => r.status !== 'Released').length },
    { id: 'settings', label: 'Settings', icon: Settings, count: undefined },
  ];

  return (
    <>
      {/* Desktop Sidebar (240px - 260px) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-900/60 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {/* Navigation links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Prominent Red Log Out Button */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 mt-auto">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            title="Log Out of AppDock75"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Tab Bar (Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 z-40">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
