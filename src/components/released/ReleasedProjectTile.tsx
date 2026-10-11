import React from 'react';
import {
  ExternalLink,
  FolderGit2,
  Tag,
  Camera,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Edit2,
  Smartphone,
} from 'lucide-react';
import { Project, Release } from '../../types';

interface ReleasedProjectTileProps {
  project: Project;
  releases?: Release[];
  onOpenProject: (projectId: string) => void;
  onNavigateToReleases?: (projectId: string) => void;
  onEditImage: (project: Project) => void;
  compact?: boolean;
}

export const ReleasedProjectTile: React.FC<ReleasedProjectTileProps> = ({
  project,
  releases = [],
  onOpenProject,
  onNavigateToReleases,
  onEditImage,
  compact = false,
}) => {
  // Find store link if configured
  const storeLink = project.links.find(
    l => l.category === 'Store' || l.url.includes('apple.com') || l.url.includes('testflight')
  );

  // Latest release
  const projectReleases = releases.filter(r => r.projectId === project.id);
  const latestRelease = projectReleases[0];

  return (
    <div className="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 hover:border-slate-700/80 hover:shadow-xl hover:shadow-emerald-500/5 transition-all p-5 flex flex-col justify-between overflow-hidden">
      {/* Decorative subtle background aura */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors" />

      <div>
        {/* Header: App Image/Icon + Badges */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="relative group/icon cursor-pointer" onClick={() => onEditImage(project)}>
            {project.icon ? (
              <img
                src={project.icon}
                alt={project.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover ring-1 ring-slate-700/80 shadow-md group-hover/icon:scale-105 group-hover/icon:ring-blue-500/60 transition-all bg-slate-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-blue-600/20 text-emerald-300 border border-emerald-500/30 flex flex-col items-center justify-center font-bold text-base shadow-md group-hover/icon:border-blue-500/60 transition-colors">
                <span>{project.name.slice(0, 2).toUpperCase()}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">No Icon</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover/icon:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium backdrop-blur-[1px]">
              <Camera className="w-4 h-4 mr-1" />
              <span>Edit</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Released</span>
              </span>

              {project.isDemo && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Demo
                </span>
              )}
            </div>

            {latestRelease && (
              <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                v{latestRelease.version} ({latestRelease.build})
              </span>
            )}
          </div>
        </div>

        {/* Title & Bundle ID */}
        <div className="space-y-1 mb-2.5">
          <h3
            onClick={() => onOpenProject(project.id)}
            className="text-base font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer tracking-tight"
          >
            {project.name}
          </h3>
          <p className="font-mono text-xs text-slate-400 truncate">
            {project.bundleId}
          </p>
        </div>

        {/* App Description */}
        <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 mb-3.5">
          {project.description || 'Native iOS application live in production.'}
        </p>

        {/* Platforms Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
          {project.platforms.map(platform => (
            <span
              key={platform}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
            >
              {platform}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {project.stack.uiFramework} · {project.minIOS}+
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {storeLink ? (
            <a
              href={storeLink.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>{storeLink.title || 'App Store'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-[11px] text-slate-500 italic">
              Live on Apple App Store
            </span>
          )}

          <button
            type="button"
            onClick={() => onEditImage(project)}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Update app icon / artwork"
          >
            <Camera className="w-3 h-3" />
            <span>Change Image</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenProject(project.id)}
            className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm shadow-blue-500/20"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToReleases && onNavigateToReleases(project.id)}
            className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 border border-slate-700/60"
          >
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span>Releases</span>
          </button>
        </div>
      </div>
    </div>
  );
};
