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
import { LoginView } from './components/auth/LoginView';
import { LandingPage } from './components/landing/LandingPage';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { IdeasView } from './components/ideas/IdeasView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ReleasedProjectsView } from './components/released/ReleasedProjectsView';
import { ReleasesView } from './components/releases/ReleasesView';
import { TimeTrackerView } from './components/timetracker/TimeTrackerView';
import { SettingsView } from './components/settings/SettingsView';

const WorkspaceShell: React.FC = () => {
  const { isAuthenticated, isLoading, loginAsDemo } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'workflow' | 'checklist' | 'data' | 'security'>('profile');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [unauthScreen, setUnauthScreen] = useState<'login' | 'landing'>('login');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [newItemType, setNewItemType] = useState<'idea' | 'project' | 'task' | 'release' | null>(null);

  const handleNavigate = (view: string) => {
    if (view === 'settings:checklist' || view === 'settings/checklist') {
      setSettingsTab('checklist');
      setCurrentView('settings');
    } else if (view.startsWith('settings:')) {
      const tab = view.split(':')[1] as any;
      setSettingsTab(tab);
      setCurrentView('settings');
    } else {
      if (view === 'settings') {
        setSettingsTab('profile');
      }
      setCurrentView(view);
    }
  };

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

  // When visitor is not logged in: start directly with Login Screen (Inlogscherm)
  if (!isAuthenticated) {
    if (unauthScreen === 'landing') {
      return (
        <LandingPage
          onOpenAuth={mode => {
            setAuthInitialMode(mode || 'login');
            setUnauthScreen('login');
          }}
          onExploreDemo={() => {
            loginAsDemo();
          }}
        />
      );
    }

    return (
      <LoginView
        initialMode={authInitialMode}
        onExploreLandingPage={() => setUnauthScreen('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        currentView={currentView}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNavigate={handleNavigate}
        onOpenNewModal={type => setNewItemType(type)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar & Mobile Tab Bar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenNewModal={type => setNewItemType(type)}
            />
          )}

          {currentView === 'ideas' && (
            <IdeasView onNavigate={handleNavigate} />
          )}

          {currentView === 'projects' && (
            <ProjectsView
              onNavigate={handleNavigate}
              onOpenNewModal={type => setNewItemType(type)}
            />
          )}

          {currentView === 'released' && (
            <ReleasedProjectsView
              onNavigate={handleNavigate}
              onOpenNewModal={type => setNewItemType(type)}
            />
          )}

          {currentView === 'releases' && (
            <ReleasesView />
          )}

          {currentView === 'time' && (
            <TimeTrackerView
              onNavigate={handleNavigate}
              onOpenNewModal={type => setNewItemType(type)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              initialTab={settingsTab}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenNewModal={type => setNewItemType(type)}
      />

      {/* Quick New Item Creator Modal */}
      <NewItemModal
        type={newItemType}
        onClose={() => setNewItemType(null)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class WorkspaceErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[WorkspaceErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-center shadow-2xl">
            <h2 className="text-base font-bold text-white">Something went wrong</h2>
            <p className="text-xs text-slate-400 break-words">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProviderComponent>
        <DataProviderComponent>
          <WorkspaceErrorBoundary>
            <WorkspaceShell />
          </WorkspaceErrorBoundary>
        </DataProviderComponent>
      </AuthProviderComponent>
    </ThemeProvider>
  );
}
