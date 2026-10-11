import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Tag,
  Camera,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Smartphone,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Project } from '../../types';
import { ReleasedProjectTile } from './ReleasedProjectTile';
import { ProjectImageModal } from '../projects/ProjectImageModal';

interface ReleasedProjectsViewProps {
  onNavigate: (view: string) => void;
  onOpenNewModal: (type: 'idea' | 'project' | 'task' | 'release') => void;
}

export const ReleasedProjectsView: React.FC<ReleasedProjectsViewProps> = ({
  onNavigate,
  onOpenNewModal,
}) => {
  const { db, setActiveProjectId } = useData();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [selectedProjectForImage, setSelectedProjectForImage] = useState<Project | null>(null);

  // Exclusively released projects (status === 'Released')
  const releasedProjects = useMemo(() => {
    return db.projects.filter(p => p.status === 'Released');
  }, [db.projects]);

  // Filtered released projects
  const filteredProjects = useMemo(() => {
    return releasedProjects.filter(p => {
      if (platformFilter !== 'All' && !p.platforms.includes(platformFilter as any)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBundle = p.bundleId.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesBundle && !matchesDesc) return false;
      }
      return true;
    });
  }, [releasedProjects, searchQuery, platformFilter]);

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    onNavigate('projects');
  };

  const handleNavigateToReleases = (projectId: string) => {
    setActiveProjectId(projectId);
    onNavigate('releases');
  };

  // Metrics
  const totalPlatforms = new Set(
    releasedProjects.flatMap(p => p.platforms)
  ).size;

  const totalProductionReleases = db.releases.filter(
    r => r.status === 'Released' && releasedProjects.some(p => p.id === r.projectId)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Rocket className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Released Projects
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              {releasedProjects.length} {releasedProjects.length === 1 ? 'Live App' : 'Live Apps'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Overzicht van al uw uitgebrachte iOS applicaties live in de Apple App Store, inclusief app iconen en artwork.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenNewModal('project')}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>New Project</span>
          </button>

          <button
            onClick={() => onOpenNewModal('release')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>New Release</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards for Released Apps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Live Applications</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {releasedProjects.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Published on App Store
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Target Platforms</span>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {totalPlatforms || 1}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            iOS, watchOS, iPadOS...
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Production Builds</span>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {totalProductionReleases || releasedProjects.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Approved release versions
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Status</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>100%</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Production Quality
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search released apps by name, bundle ID, keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All Platforms</option>
            <option value="iPhone">iPhone</option>
            <option value="iPad">iPad</option>
            <option value="Apple Watch">Apple Watch</option>
            <option value="Mac Catalyst">Mac Catalyst</option>
            <option value="visionOS">visionOS</option>
          </select>
        </div>
      </div>

      {/* Main Content: Tiles Grid ("Tegeltjes met afbeelding") */}
      {filteredProjects.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Rocket className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {releasedProjects.length === 0
                ? 'Geen Released Projects'
                : 'Geen resultaten voor uw zoekopdracht'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {releasedProjects.length === 0
                ? 'U heeft momenteel geen projecten gemarkeerd als Released. Zodra een project de status "Released" krijgt in de project-instellingen, verschijnt het hier met zijn app-tegel en afbeelding.'
                : 'Probeer een andere zoekterm of platformfilter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(project => (
            <ReleasedProjectTile
              key={project.id}
              project={project}
              releases={db.releases}
              onOpenProject={handleOpenProject}
              onNavigateToReleases={handleNavigateToReleases}
              onEditImage={proj => setSelectedProjectForImage(proj)}
            />
          ))}
        </div>
      )}

      {/* Project Image Modal */}
      <ProjectImageModal
        project={selectedProjectForImage}
        isOpen={!!selectedProjectForImage}
        onClose={() => setSelectedProjectForImage(null)}
      />
    </div>
  );
};
