import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  FolderGit2,
  Lightbulb,
  CheckSquare,
  Tag,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { exportTasksAsCsv, exportChangelogAsMarkdown } from '../../services/storage';

export const DataBackupManager: React.FC = () => {
  const { user } = useAuth();
  const { db, exportFullDatabase, importDatabase } = useData();

  // Export States
  const [copied, setCopied] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Import States
  const [importSource, setImportSource] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedJson, setPastedJson] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    appName?: string;
    exportedAt?: string;
    counts?: {
      projects: number;
      tasks: number;
      ideas: number;
      releases: number;
      changelogs: number;
    };
    projectNames?: string[];
    parsedData?: any;
  } | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    stats?: { projects: number; tasks: number; ideas: number; releases: number; changelogs?: number };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats calculation
  const totalProjects = db.projects.length;
  const totalTasks = db.tasks.length;
  const totalIdeas = db.ideas.length;
  const totalReleases = db.releases.length;
  const totalChangelogs = db.changelogEntries.length;

  // Handle Export Full JSON
  const handleDownloadJson = () => {
    try {
      const jsonStr = exportFullDatabase();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `AppDock75_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice('Full backup JSON downloaded successfully.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch {
      setExportNotice('Failed to generate JSON backup.');
    }
  };

  // Handle Copy JSON to Clipboard
  const handleCopyJson = async () => {
    try {
      const jsonStr = exportFullDatabase();
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      setExportNotice('Complete JSON backup copied to clipboard.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch {
      setExportNotice('Could not copy to clipboard. Please download the file instead.');
    }
  };

  // Handle Export Tasks CSV
  const handleExportCsv = () => {
    try {
      const csvStr = exportTasksAsCsv(db.tasks, db.projects, db.statuses);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `AppDock75_tasks_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice('Tasks CSV exported successfully.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch {
      setExportNotice('Failed to generate CSV export.');
    }
  };

  // Handle Export Changelog Markdown
  const handleExportMarkdown = () => {
    try {
      const currentProj = db.projects[0];
      const mdStr = exportChangelogAsMarkdown(
        currentProj?.name || 'iOS Apps',
        db.releases,
        db.changelogEntries
      );
      const blob = new Blob([mdStr], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `AppDock75_changelog_${dateStr}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice('Changelog Markdown exported successfully.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch {
      setExportNotice('Failed to generate Markdown export.');
    }
  };

  // Inspect & Validate Raw JSON
  const validateAndInspectJson = (rawContent: string) => {
    try {
      if (!rawContent.trim()) {
        setValidationResult(null);
        return;
      }

      const parsed = JSON.parse(rawContent);
      const src = parsed.data || parsed.workspace || parsed.db || parsed;

      if (!src || typeof src !== 'object') {
        setValidationResult({
          valid: false,
          error: 'JSON is valid syntax, but does not contain a recognizable AppDock75 workspace structure.',
        });
        return;
      }

      const projects = Array.isArray(src.projects) ? src.projects : [];
      const tasks = Array.isArray(src.tasks) ? src.tasks : [];
      const ideas = Array.isArray(src.ideas) ? src.ideas : [];
      const releases = Array.isArray(src.releases) ? src.releases : [];
      const changelogs = Array.isArray(src.changelogEntries) ? src.changelogEntries : [];

      if (
        projects.length === 0 &&
        tasks.length === 0 &&
        ideas.length === 0 &&
        releases.length === 0
      ) {
        setValidationResult({
          valid: false,
          error: 'The JSON backup contains empty entity lists. No workspace data found.',
        });
        return;
      }

      setValidationResult({
        valid: true,
        appName: parsed.application || 'AppDock75',
        exportedAt: parsed.exportedAt,
        counts: {
          projects: projects.length,
          tasks: tasks.length,
          ideas: ideas.length,
          releases: releases.length,
          changelogs: changelogs.length,
        },
        projectNames: projects.slice(0, 5).map((p: any) => p.name || 'Untitled Project'),
        parsedData: src,
      });
    } catch (err: any) {
      setValidationResult({
        valid: false,
        error: `JSON syntax error: ${err?.message || 'Invalid format'}`,
      });
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      validateAndInspectJson(content);
    };
    reader.onerror = () => {
      setValidationResult({
        valid: false,
        error: 'Could not read the selected file. Please verify file permissions.',
      });
    };
    reader.readAsText(file);
  };

  // Handle Pasted Text Change
  const handlePastedTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedJson(text);
    setImportStatus(null);
    validateAndInspectJson(text);
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!validationResult?.valid || !validationResult.parsedData) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const res = await importDatabase(validationResult.parsedData, importMode);
      if (res.success) {
        setImportStatus({
          success: true,
          message: `Workspace successfully ${
            importMode === 'replace' ? 'restored' : 'merged'
          }! ${res.stats.projects} projects, ${res.stats.tasks} tasks, and ${
            res.stats.ideas
          } ideas synced to Cloud Firestore.`,
          stats: res.stats,
        });

        // Clear input form
        setSelectedFile(null);
        setPastedJson('');
        setValidationResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setImportStatus({
          success: false,
          message: res.error || 'Failed to complete workspace import.',
        });
      }
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err?.message || 'An unexpected error occurred during import.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Workspace Statistics Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Workspace Data & Cloud Storage</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current live database contents for <strong className="text-slate-300">{user?.name || 'Developer'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Firebase Database: appdock75</span>
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-center text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <FolderGit2 className="w-3 h-3 text-blue-400" />
              <span>Projects</span>
            </span>
            <p className="font-bold text-white text-base mt-1 font-mono">{totalProjects}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <CheckSquare className="w-3 h-3 text-indigo-400" />
              <span>Tasks</span>
            </span>
            <p className="font-bold text-white text-base mt-1 font-mono">{totalTasks}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Ideas</span>
            </span>
            <p className="font-bold text-white text-base mt-1 font-mono">{totalIdeas}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Tag className="w-3 h-3 text-emerald-400" />
              <span>Releases</span>
            </span>
            <p className="font-bold text-white text-base mt-1 font-mono">{totalReleases}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <FileText className="w-3 h-3 text-purple-400" />
              <span>Changelogs</span>
            </span>
            <p className="font-bold text-white text-base mt-1 font-mono">{totalChangelogs}</p>
          </div>
        </div>
      </div>

      {/* EXPORT SECTION */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              <span>Export Workspace Data</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Download complete local backups of your projects, tasks, release history, and settings.
            </p>
          </div>
        </div>

        {exportNotice && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Full JSON Backup */}
          <div className="p-4 bg-slate-800/60 hover:bg-slate-800/90 rounded-xl border border-slate-700/70 flex flex-col justify-between transition-all group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <FileJson className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Complete Backup
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                  Full Workspace Backup (JSON)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Contains all projects, Kanban tasks, subtasks, ideas, changelogs, checklists, and workflow settings.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                title="Copy full JSON to clipboard"
                className="py-2 px-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 2. Tasks CSV Export */}
          <div className="p-4 bg-slate-800/60 hover:bg-slate-800/90 rounded-xl border border-slate-700/70 flex flex-col justify-between transition-all group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Spreadsheet
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Tasks Spreadsheet (CSV)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Formatted spreadsheet of tasks with project titles, priority, status column, and logged minutes.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Tasks (CSV)</span>
              </button>
            </div>
          </div>

          {/* 3. Changelog Markdown Export */}
          <div className="p-4 bg-slate-800/60 hover:bg-slate-800/90 rounded-xl border border-slate-700/70 flex flex-col justify-between transition-all group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Markdown
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Changelog Notes (MD)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Standardized Markdown release notes categorized by Added, Changed, Fixed, and Security.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Changelog (MD)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* IMPORT & RESTORE SECTION */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import & Restore Workspace Data</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Restore an earlier AppDock75 backup or migrate projects from another workspace.
            </p>
          </div>

          {/* Toggle between File upload and Paste JSON */}
          <div className="flex p-0.5 bg-slate-800 rounded-lg text-xs self-start">
            <button
              type="button"
              onClick={() => { setImportSource('file'); setValidationResult(null); }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                importSource === 'file' ? 'bg-slate-700 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => { setImportSource('text'); setValidationResult(null); }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                importSource === 'text' ? 'bg-slate-700 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste JSON
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {importStatus && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
              importStatus.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{importStatus.message}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        {importSource === 'file' ? (
          <div className="space-y-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-800/30 hover:bg-slate-800/50"
            >
              <FileJson className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop AppDock75 JSON backup file'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB — Click to choose a different file`
                  : 'Accepts .json backup files exported from AppDock75'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Paste JSON Backup Content
            </label>
            <textarea
              rows={6}
              value={pastedJson}
              onChange={handlePastedTextChange}
              placeholder='{"application":"AppDock75", "version":"1.0.0", "data": { "projects": [...], "tasks": [...] }}'
              className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {/* PREVIEW & VALIDATION INSPECTOR */}
        {validationResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-3 ${
              validationResult.valid
                ? 'bg-blue-500/10 border-blue-500/30 text-slate-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className="font-semibold text-white">
                  {validationResult.valid ? 'Valid AppDock75 Backup Detected' : 'Invalid Backup Content'}
                </span>
              </div>

              {validationResult.exportedAt && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Exported: {new Date(validationResult.exportedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {validationResult.error && (
              <p className="text-xs text-rose-300">{validationResult.error}</p>
            )}

            {validationResult.valid && validationResult.counts && (
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Projects</span>
                    <p className="font-bold text-white mt-0.5">{validationResult.counts.projects}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Tasks</span>
                    <p className="font-bold text-white mt-0.5">{validationResult.counts.tasks}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Ideas</span>
                    <p className="font-bold text-white mt-0.5">{validationResult.counts.ideas}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Releases</span>
                    <p className="font-bold text-white mt-0.5">{validationResult.counts.releases}</p>
                  </div>
                </div>

                {validationResult.projectNames && validationResult.projectNames.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                    <span className="text-slate-400">Included projects:</span>
                    {validationResult.projectNames.map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700/60"
                      >
                        {name}
                      </span>
                    ))}
                    {validationResult.counts.projects > validationResult.projectNames.length && (
                      <span className="text-slate-500">
                        +{validationResult.counts.projects - validationResult.projectNames.length} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* IMPORT MODE SELECTION & CONFIRMATION */}
        {validationResult?.valid && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                Choose Import Strategy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Replace Current Workspace</span>
                    <RefreshCw className={`w-3.5 h-3.5 ${importMode === 'replace' ? 'text-blue-400' : 'text-slate-500'}`} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Completely overwrites current projects, tasks, and ideas with this backup. Ideal for restoring a clean snapshot.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'merge'
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Merge & Append Data</span>
                    <Layers className={`w-3.5 h-3.5 ${importMode === 'merge' ? 'text-blue-400' : 'text-slate-500'}`} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Keeps all your current projects and ideas, and appends new items from this backup without overwriting.
                  </p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-slate-400">
                Data will be persisted locally and synced to Firebase Cloud Firestore.
              </p>

              <button
                type="button"
                disabled={isImporting}
                onClick={handleExecuteImport}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing & Syncing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>
                      {importMode === 'replace' ? 'Restore Workspace' : 'Merge into Workspace'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
