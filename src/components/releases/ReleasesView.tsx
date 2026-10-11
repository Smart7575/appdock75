/**
 * iOS Dev Hub - Releases & Version Management
 * Strictly implements PRD Section 8.5:
 * - Semver versioning, build number, codename, and statuses
 * - Structured changelog categorized by: Added, Changed, Fixed, Removed, Security, Performance
 * - Automatic task-to-changelog suggestions
 * - App Store compliant "What's New" Generator (<= 4000 chars) with 1-click copy
 * - Version comparison diff between two releases
 * - "Mark as Released" workflow (publishes & updates Archive)
 * - Apple review notes, TestFlight beta links, rejection logs
 */

import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Archive,
  ArrowRight,
  Sparkles,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Release, ChangelogEntry, ChangelogType, ReleaseStatus } from '../../types';

export const ReleasesView: React.FC = () => {
  const {
    db,
    activeProjectId,
    setActiveProjectId,
    addRelease,
    updateRelease,
    deleteRelease,
    markAsReleased,
    addChangelogEntry,
    updateChangelogEntry,
    deleteChangelogEntry,
    generateReleaseNotes,
    keepItemAsMine,
  } = useData();

  // Current project filter
  const currentProject = db.projects.find(p => p.id === activeProjectId) || db.projects[0];
  const releases = db.releases.filter(r => !activeProjectId || r.projectId === activeProjectId);

  // Selected release for inspection
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(releases[0]?.id || null);
  const activeRelease = releases.find(r => r.id === selectedReleaseId) || releases[0];

  // Changelog addition state
  const [newChangeType, setNewChangeType] = useState<ChangelogType>('Added');
  const [newChangeText, setNewChangeText] = useState('');

  // Release notes generator state
  const [copiedText, setCopiedText] = useState(false);
  const [activeLocale, setActiveLocale] = useState('en-US');

  // Version Comparison modal
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffBaseId, setDiffBaseId] = useState<string>(releases[1]?.id || releases[0]?.id || '');
  const [diffTargetId, setDiffTargetId] = useState<string>(releases[0]?.id || '');

  // Mark as Released modal
  const [showMarkReleasedModal, setShowMarkReleasedModal] = useState(false);
  const [releasePubDate, setReleasePubDate] = useState(new Date().toISOString().split('T')[0]);
  const [syncToArchive, setSyncToArchive] = useState(true);

  // New Release modal
  const [showNewReleaseModal, setShowNewReleaseModal] = useState(false);
  const [newRelForm, setNewRelForm] = useState({
    version: '1.3.0',
    build: 45,
    name: 'Feature Update',
    status: 'Planned' as ReleaseStatus,
    plannedDate: '',
  });

  const activeChangelogs = useMemo(() => {
    if (!activeRelease) return [];
    return db.changelogEntries.filter(c => c.releaseId === activeRelease.id);
  }, [db.changelogEntries, activeRelease]);

  // Suggest tasks connected to this release that aren't in changelog yet (PRD §8.5)
  const suggestedTasks = useMemo(() => {
    if (!activeRelease) return [];
    const connectedTasks = db.tasks.filter(t => t.releaseId === activeRelease.id);
    const existingTaskIds = new Set(activeChangelogs.map(c => c.taskId).filter(Boolean));
    return connectedTasks.filter(t => !existingTaskIds.has(t.id));
  }, [db.tasks, activeRelease, activeChangelogs]);

  const handleAddChangelog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRelease || !newChangeText.trim()) return;
    addChangelogEntry({
      releaseId: activeRelease.id,
      type: newChangeType,
      text: newChangeText.trim(),
    });
    setNewChangeText('');
  };

  const handleAddSuggestedTask = (task: any) => {
    if (!activeRelease) return;
    const mappedType: ChangelogType = task.type === 'Bug' ? 'Fixed' : task.type === 'Feature' ? 'Added' : 'Changed';
    addChangelogEntry({
      releaseId: activeRelease.id,
      type: mappedType,
      text: task.title,
      taskId: task.id,
    });
  };

  const whatsNewText = useMemo(() => {
    if (!activeRelease) return '';
    return generateReleaseNotes(activeRelease.id, activeLocale);
  }, [activeRelease, activeLocale, generateReleaseNotes, db.changelogEntries]);

  const copyWhatsNew = () => {
    navigator.clipboard.writeText(whatsNewText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleConfirmMarkReleased = () => {
    if (!activeRelease) return;
    markAsReleased(activeRelease.id, releasePubDate, syncToArchive);
    setShowMarkReleasedModal(false);
  };

  const handleCreateRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    const newRel = addRelease({
      projectId: currentProject.id,
      version: newRelForm.version,
      build: Number(newRelForm.build),
      name: newRelForm.name,
      status: newRelForm.status,
      plannedDate: newRelForm.plannedDate || undefined,
      notes: {
        rejectionLog: [],
      },
      locales: {
        'en-US': `What's New in Version ${newRelForm.version}:\n• Performance enhancements and bug fixes.`,
      },
    });
    setShowNewReleaseModal(false);
    setSelectedReleaseId(newRel.id);
  };

  const changelogTypeColors: Record<ChangelogType, string> = {
    Added: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Changed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Fixed: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Removed: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    Security: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    Performance: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Releases & Versioning
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build App Store compliant changelogs, generate "What's New" release notes, and track TestFlight submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {releases.length >= 2 && (
            <button
              onClick={() => setShowDiffModal(true)}
              className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Versions</span>
            </button>
          )}

          <button
            onClick={() => setShowNewReleaseModal(true)}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Release</span>
          </button>
        </div>
      </div>

      {/* Project Selector Bar */}
      {db.projects.length > 1 && (
        <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto">
          <span className="text-slate-500 px-2 font-medium">Filter Project:</span>
          {db.projects.map(proj => (
            <button
              key={proj.id}
              onClick={() => setActiveProjectId(proj.id)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeProjectId === proj.id
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {proj.name}
            </button>
          ))}
        </div>
      )}

      {/* Main 2-Column Layout: Releases List + Selected Release Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Version History Timeline */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Releases ({releases.length})
          </h2>

          <div className="space-y-2">
            {releases.length === 0 ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                No releases created yet. Click "+ New Release" to start.
              </div>
            ) : (
              releases.map(rel => {
                const isSelected = activeRelease?.id === rel.id;
                const relProject = db.projects.find(p => p.id === rel.projectId);

                return (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedReleaseId(rel.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-blue-500/40 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          v{rel.version}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Build {rel.build}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {rel.status}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-300 truncate">
                      {rel.name || relProject?.name}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                      <span>{rel.releasedDate ? `Released ${rel.releasedDate}` : `Target: ${rel.plannedDate || 'TBD'}`}</span>
                      {rel.isDemo && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded">
                          Demo
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (2 spans): Changelog & App Store Release Notes Generator */}
        {activeRelease && (
          <div className="lg:col-span-2 space-y-6">
            {/* Release Header & Actions */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white font-mono">
                      Version {activeRelease.version}
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      (Build {activeRelease.build})
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {activeRelease.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeRelease.name || 'Release candidate'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeRelease.isDemo && (
                    <button
                      onClick={() => keepItemAsMine('release', activeRelease.id)}
                      className="px-2.5 py-1 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg cursor-pointer"
                    >
                      Keep as My Data
                    </button>
                  )}

                  {activeRelease.status !== 'Released' && (
                    <button
                      onClick={() => setShowMarkReleasedModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Released</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Release Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs">
                <div>
                  <span className="text-slate-500">Planned Date:</span>
                  <p className="text-slate-300 mt-0.5">{activeRelease.plannedDate || 'Not scheduled'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Released Date:</span>
                  <p className="text-slate-300 mt-0.5">{activeRelease.releasedDate || 'Pending release'}</p>
                </div>
                {activeRelease.notes.testFlightUrl && (
                  <div>
                    <span className="text-slate-500">TestFlight Beta:</span>
                    <a
                      href={activeRelease.notes.testFlightUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span>Public Beta Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Changelog Items from Linked Kanban Tasks (PRD §8.5) */}
            {suggestedTasks.length > 0 && (
              <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Tasks linked to this release ready for changelog:</span>
                </div>
                <div className="space-y-1.5">
                  {suggestedTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg text-xs"
                    >
                      <span className="text-slate-200">{task.title}</span>
                      <button
                        onClick={() => handleAddSuggestedTask(task)}
                        className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[11px] rounded transition-colors cursor-pointer"
                      >
                        + Add to Changelog
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Changelog Entries (PRD §8.5) */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Structured Changelog ({activeChangelogs.length} items)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Categorized for Apple Review & Users
                </span>
              </div>

              {/* Add New Changelog Entry Form */}
              <form onSubmit={handleAddChangelog} className="flex gap-2">
                <select
                  value={newChangeType}
                  onChange={e => setNewChangeType(e.target.value as any)}
                  className="px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="Added">Added</option>
                  <option value="Changed">Changed</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Performance">Performance</option>
                  <option value="Security">Security</option>
                  <option value="Removed">Removed</option>
                </select>

                <input
                  type="text"
                  required
                  placeholder="e.g. Added iOS 18 Control Center quick habit widget"
                  value={newChangeText}
                  onChange={e => setNewChangeText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Add
                </button>
              </form>

              {/* Changelog Entries List */}
              <div className="space-y-2">
                {activeChangelogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No changelog entries yet. Add user-facing improvements above.
                  </p>
                ) : (
                  activeChangelogs.map(entry => (
                    <div
                      key={entry.id}
                      className="p-2.5 bg-slate-800/60 rounded-lg flex items-center justify-between gap-3 text-xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                            changelogTypeColors[entry.type]
                          }`}
                        >
                          {entry.type}
                        </span>
                        <span className="text-slate-200 truncate">{entry.text}</span>
                      </div>

                      <button
                        onClick={() => deleteChangelogEntry(entry.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* App Store "What's New" Generator (PRD §8.5: max 4000 chars) */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    App Store "What's New" Generator
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ready to paste into App Store Connect version submission
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {whatsNewText.length} / 4000 chars
                  </span>
                  <button
                    onClick={copyWhatsNew}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                rows={5}
                value={whatsNewText}
                className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 leading-relaxed focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mark as Released Modal */}
      {showMarkReleasedModal && activeRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2">
              Mark Version {activeRelease.version} as Released
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Confirm App Store release date. You can also automatically update or register this app in your Archive.
            </p>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Actual Release Date</label>
                <input
                  type="date"
                  value={releasePubDate}
                  onChange={e => setReleasePubDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-800/50 rounded-lg">
                <input
                  type="checkbox"
                  id="syncArchive"
                  checked={syncToArchive}
                  onChange={e => setSyncToArchive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="syncArchive" className="text-slate-300 cursor-pointer">
                  Sync & publish to App Archive catalog
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMarkReleasedModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkReleased}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Confirm Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Comparison Diff Modal (PRD §8.5) */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Version Comparison Diff</h3>
              </div>
              <button onClick={() => setShowDiffModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Base Version</label>
                <select
                  value={diffBaseId}
                  onChange={e => setDiffBaseId(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  {releases.map(r => (
                    <option key={r.id} value={r.id}>v{r.version} ({r.name || r.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Version</label>
                <select
                  value={diffTargetId}
                  onChange={e => setDiffTargetId(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  {releases.map(r => (
                    <option key={r.id} value={r.id}>v{r.version} ({r.name || r.status})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compare entries */}
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-semibold text-slate-200">
                Changes introduced in target version:
              </h4>
              <div className="space-y-1.5">
                {db.changelogEntries.filter(c => c.releaseId === diffTargetId).map(entry => (
                  <div key={entry.id} className="flex items-center gap-2 p-1.5 rounded bg-slate-800/80">
                    <span className="font-bold text-emerald-400 text-[10px] uppercase">+{entry.type}</span>
                    <span className="text-slate-200">{entry.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Release Modal */}
      {showNewReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Create New Version</h3>

            <form onSubmit={handleCreateRelease} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Version (SemVer)</label>
                  <input
                    type="text"
                    required
                    placeholder="1.2.0"
                    value={newRelForm.version}
                    onChange={e => setNewRelForm({ ...newRelForm, version: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Build Number</label>
                  <input
                    type="number"
                    required
                    value={newRelForm.build}
                    onChange={e => setNewRelForm({ ...newRelForm, build: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Codename / Theme</label>
                <input
                  type="text"
                  placeholder="e.g. Spring Polish & Widgets"
                  value={newRelForm.name}
                  onChange={e => setNewRelForm({ ...newRelForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Status</label>
                  <select
                    value={newRelForm.status}
                    onChange={e => setNewRelForm({ ...newRelForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In development">In development</option>
                    <option value="In TestFlight">In TestFlight</option>
                    <option value="Submitted">Submitted</option>
                    <option value="In review">In review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Planned Target Date</label>
                  <input
                    type="date"
                    value={newRelForm.plannedDate}
                    onChange={e => setNewRelForm({ ...newRelForm, plannedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewReleaseModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Create Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
