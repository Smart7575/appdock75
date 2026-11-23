import React from 'react';
import {
  Trash2,
  ShieldCheck,
  AlertTriangle,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface DeleteDemoDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteDemoDataModal: React.FC<DeleteDemoDataModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { db, demoBreakdown, purgeDemoData, keepItemAsMine } = useData();

  if (!isOpen) return null;

  const { demo, original, attachedOriginalItems } = demoBreakdown;
  const totalAttachedOriginal =
    attachedOriginalItems.tasksCount +
    attachedOriginalItems.releasesCount +
    attachedOriginalItems.timeLogsCount;

  const handleConfirmDelete = () => {
    purgeDemoData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Delete All Demo Data
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Demo records are explicitly tagged as <span className="text-amber-300 font-semibold">Demo</span>. Only demo items will be deleted; all of your original projects, ideas, tasks, releases, time logs, and settings stay intact in the database.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two-Column Specific Separation Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left: Demo Data to be Removed */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Demo Data to Delete</span>
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">
                {demo.total} items
              </span>
            </div>

            {demo.projectNames.length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-slate-300">
                <span className="text-slate-400 block mb-1">Demo projects included:</span>
                <span className="font-medium text-amber-300">
                  {demo.projectNames.join(', ')}
                </span>
              </div>
            )}

            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Demo Projects</span>
                <span className="font-mono font-semibold text-white">{demo.projects}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Demo Ideas</span>
                <span className="font-mono font-semibold text-white">{demo.ideas}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Demo Tasks</span>
                <span className="font-mono font-semibold text-white">{demo.tasks}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Demo Releases & Changelogs</span>
                <span className="font-mono font-semibold text-white">
                  {demo.releases} / {demo.changelogEntries}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Demo Time Logs</span>
                <span className="font-mono font-semibold text-white">{demo.timeLogs}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Demo Notifications</span>
                <span className="font-mono font-semibold text-white">{demo.notifications}</span>
              </li>
            </ul>
          </div>

          {/* Right: Original User Data Remaining in Database */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Your Original Data (Kept)</span>
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                {original.total} items
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-emerald-200/90 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>All original user items &amp; custom templates stay in the database.</span>
            </div>

            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Your Projects</span>
                <span className="font-mono font-semibold text-emerald-300">{original.projects}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Your Ideas</span>
                <span className="font-mono font-semibold text-emerald-300">{original.ideas}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Your Tasks</span>
                <span className="font-mono font-semibold text-emerald-300">{original.tasks}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Your Releases & Changelogs</span>
                <span className="font-mono font-semibold text-emerald-300">
                  {original.releases} / {original.changelogEntries}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Your Time Logs</span>
                <span className="font-mono font-semibold text-emerald-300">{original.timeLogs}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Certificates &amp; Templates</span>
                <span className="font-mono font-semibold text-emerald-300">Protected</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Warning if user added original items inside a demo project */}
        {totalAttachedOriginal > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-200">
                  Original data attached to a Demo Project
                </p>
                <p className="text-slate-300 leading-relaxed">
                  You created {attachedOriginalItems.tasksCount} task(s), {attachedOriginalItems.releasesCount} release(s), and {attachedOriginalItems.timeLogsCount} time log(s) inside a demo project. Those original records will remain in the database, or you can convert the parent project to your own data now so everything stays linked:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pl-6">
              {attachedOriginalItems.projectIds.map(pid => {
                const proj = db.projects.find(p => p.id === pid);
                if (!proj) return null;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => keepItemAsMine('project', pid)}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Keep &quot;{proj.name}&quot; as My Data
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] text-slate-500">
            You can restore the sample workspace later in Settings → Data &amp; Backup.
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={demo.total === 0}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-600/25"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Demo Data ({demo.total})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
