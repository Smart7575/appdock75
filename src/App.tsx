/**
 * iOS Dev Hub - Core Application Component
 * Strictly English interface as mandated by PRD.
 */

import React, { useState, useEffect } from 'react';
import { AuthProviderComponent, useAuth } from './context/AuthContext';
import { DataProviderComponent } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { NewItemModal } from './components/common/NewItemModal';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/landing/LandingPage';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { IdeasView } from './components/ideas/IdeasView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ReleasedProjectsView } from './components/released/ReleasedProjectsView';
import { ReleasesView } from './components/releases/ReleasesView';
import { ArchiveView } from './components/archive/ArchiveView';
import { ToolsView } from './components/tools/ToolsView';
import { SettingsView } from './components/settings/SettingsView';

const WorkspaceShell: React.FC = () => {
  const { isAuthenticated, isLoading, loginAsDemo } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{ open: boolean; mode: 'login' | 'register' }>({
    open: false,
    mode: 'login',
  });
  const [newItemType, setNewItemType] = useState<'idea' | 'project' | 'task' | 'release' | null>(null);

  // Keyboard shortcut listeners (PRD §10: N for new item, / or ⌘K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (!isInput) {
        if (e.key === '/') {
          e.preventDefault();
          setIsCommandPaletteOpen(true);
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setNewItemType('task');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span>Loading AppDock75...</span>
        </div>
      </div>
    );
  }

  // If visitor is not authenticated, show Landing Page with Auth options (PRD Section 4)
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onOpenAuth={mode => setAuthModalState({ open: true, mode: mode || 'login' })}
          onExploreDemo={() => {
            // Instant demo fast-track
            loginAsDemo();
          }}
        />
        <AuthModal
          isOpen={authModalState.open}
          onClose={() => setAuthModalState({ ...authModalState, open: false })}
          defaultMode={authModalState.mode}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        currentView={currentView}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNavigate={setCurrentView}
        onOpenNewModal={type => setNewItemType(type)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar & Mobile Tab Bar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentView}
              onOpenNewModal={type => setNewItemType(type)}
            />
          )}

          {currentView === 'ideas' && (
            <IdeasView onNavigate={setCurrentView} />
          )}

          {currentView === 'projects' && (
            <ProjectsView
              onNavigate={setCurrentView}
              onOpenNewModal={type => setNewItemType(type)}
            />
          )}

          {currentView === 'released' && (
            <ReleasedProjectsView
              onNavigate={setCurrentView}
              onOpenNewModal={type => setNewItemType(type)}
            />
          )}

          {currentView === 'releases' && (
            <ReleasesView />
          )}

          {currentView === 'archive' && (
            <ArchiveView onNavigate={setCurrentView} />
          )}

          {currentView === 'tools' && (
            <ToolsView />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
        onOpenNewModal={type => setNewItemType(type)}
      />

      {/* Quick New Item Creator Modal */}
      <NewItemModal
        type={newItemType}
        onClose={() => setNewItemType(null)}
        onNavigate={setCurrentView}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProviderComponent>
        <DataProviderComponent>
          <WorkspaceShell />
        </DataProviderComponent>
      </AuthProviderComponent>
    </ThemeProvider>
  );
}
