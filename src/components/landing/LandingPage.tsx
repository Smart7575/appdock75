/**
 * iOS Dev Hub - Landing Page (Visitor Role)
 * PRD Section 4: "Visitor: Niet ingelogd; ziet landingspagina, login en registratie"
 * Strictly English interface, Apple indie developer aesthetic.
 */

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  FolderGit2,
  Columns,
  Tag,
  Rocket,
  ShieldCheck,
  CheckCircle,
  Lightbulb,
  Apple,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onExploreDemo,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/20 selection:text-blue-300">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="font-bold text-sm tracking-tight text-white">
            AppDock75
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('login')}
            className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 lg:py-24 space-y-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Indie iOS Developers & Small Teams</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            The Complete Lifecycle Workspace for iOS Apps.
          </h1>

          <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            From initial idea brainstorms and customizable Kanban boards to TestFlight releases,
            App Store changelogs, and published app archiving. Replace scattered notes, boards, and bookmarks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Explore Instant Demo (No signup required)</span>
            </button>
          </div>
        </div>

        {/* Hero Image Showcase */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
          <img
            src="/src/assets/images/hero_ios_workspace_1791271788673.jpg"
            alt="AppDock75 Workspace Studio"
            className="w-full h-auto object-cover max-h-[500px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
              SwiftUI · SwiftData · iOS 18 · TestFlight
            </span>
            <span className="hidden sm:inline bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
              Firebase & Cloud Sync Enabled
            </span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Idea & Concept Hub</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capture concept notes in seconds. Organize by category, status, and tags. Convert any validated idea into an iOS project in 3 clicks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Columns className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Custom Kanban Workflows</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define your own columns, colors, and WIP limits. Manage subtasks, bug fixes, and feature priorities with seamless touch and iPad support.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Releases & "What's New"</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Categorize changes by Added, Fixed, Performance, and Security. Generate 4,000-character App Store release notes in under 2 minutes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">App Store Showcase</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Showcase live released apps with App Store badges, icon artwork, production metadata, and direct store links.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Apple Compliance Suite</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pre-flight App Store checklists, Info.plist usage descriptions, Apple review rejection logs, and 100-character keyword limit counters.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Instant Demo Data</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every new user starts with a pre-configured sample project (HabitPulse) and demo data. Purge demo items anytime with 1 click.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>AppDock75 · English Product Interface · Firebase Connected</p>
      </footer>
    </div>
  );
};
