import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Play,
  Square,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Calendar,
  FolderGit2,
  Search,
  AlertTriangle,
  History,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useFormatDate } from '../../utils/dateFormat';
import { getProjectColorTheme } from '../../utils/projectColors';
import {
  formatElapsedClock,
  formatDurationCompact,
  toLocalDateString,
  toLocalTimeHHMM,
  buildIsoRangeFromDateAndTimes,
} from '../../utils/timeFormat';
import { TimeLogEntry } from '../../types';

interface TimeTrackerViewProps {
  onNavigate?: (view: string) => void;
  onOpenNewModal?: (type: 'idea' | 'project' | 'task' | 'release') => void;
}

export const TimeTrackerView: React.FC<TimeTrackerViewProps> = ({
  onNavigate,
  onOpenNewModal,
}) => {
  const {
    db,
    activeProjectId,
    setActiveProjectId,
    startTimer,
    stopTimer,
    updateActiveTimerNote,
    discardActiveTimer,
    addTimeLog,
    updateTimeLog,
    deleteTimeLog,
    clearTimeLogHistory,
  } = useData();
  const { formatDate } = useFormatDate();

  const sortedProjects = useMemo(() => {
    return [...db.projects].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [db.projects]);

  const activeTimer = db.activeTimer || null;
  const timeLogs = useMemo(() => {
    return [...(db.timeLogs || [])].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [db.timeLogs]);

  // Selected project for timer & manual entry defaults
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return activeTimer?.projectId || activeProjectId || sortedProjects[0]?.id || '';
  });

  // Keep selectedProjectId valid if projects load/change
  useEffect(() => {
    if (activeTimer?.projectId) {
      setSelectedProjectId(activeTimer.projectId);
      return;
    }
    if (selectedProjectId && sortedProjects.some(p => p.id === selectedProjectId)) {
      return;
    }
    setSelectedProjectId(activeProjectId || sortedProjects[0]?.id || '');
  }, [activeTimer?.projectId, activeProjectId, sortedProjects, selectedProjectId]);

  // Live ticker for running timer
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!activeTimer) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeTimer]);

  const elapsedSeconds = useMemo(() => {
    if (!activeTimer) return 0;
    const startMs = new Date(activeTimer.startedAt).getTime();
    return Math.max(0, Math.floor((nowMs - startMs) / 1000));
  }, [activeTimer, nowMs]);

  const [sessionNote, setSessionNote] = useState<string>(activeTimer?.note || '');
  useEffect(() => {
    setSessionNote(activeTimer?.note || '');
  }, [activeTimer?.startedAt]);

  const [confirmDiscardTimer, setConfirmDiscardTimer] = useState(false);

  // Manual Time Registration ("Register afterwards")
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProjectId, setManualProjectId] = useState<string>(selectedProjectId);
  const [manualDate, setManualDate] = useState<string>(() => toLocalDateString(new Date()));
  const [manualStartTime, setManualStartTime] = useState<string>('09:00');
  const [manualEndTime, setManualEndTime] = useState<string>('10:30');
  const [manualHours, setManualHours] = useState<number>(1);
  const [manualMinutes, setManualMinutes] = useState<number>(30);
  const [manualNote, setManualNote] = useState<string>('');
  const [manualSavedNotice, setManualSavedNotice] = useState(false);

  useEffect(() => {
    if (selectedProjectId && (!manualProjectId || !sortedProjects.some(p => p.id === manualProjectId))) {
      setManualProjectId(selectedProjectId);
    }
  }, [selectedProjectId, manualProjectId, sortedProjects]);

  const syncDurationFromTimes = (dateStr: string, startHHMM: string, endHHMM: string) => {
    const { durationSeconds } = buildIsoRangeFromDateAndTimes(dateStr, startHHMM, endHHMM);
    const totalMins = Math.round(durationSeconds / 60);
    setManualHours(Math.floor(totalMins / 60));
    setManualMinutes(totalMins % 60);
  };

  const syncEndTimeFromDuration = (dateStr: string, startHHMM: string, hrs: number, mins: number) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [sh, sm] = startHHMM.split(':').map(Number);
    const totalMins = Math.max(1, hrs * 60 + mins);
    const endDate = new Date(y, (m || 1) - 1, d || 1, sh || 0, (sm || 0) + totalMins, 0, 0);
    setManualEndTime(toLocalTimeHHMM(endDate));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPid = manualProjectId || selectedProjectId || sortedProjects[0]?.id;
    if (!targetPid) return;

    const totalSeconds = Math.max(60, (manualHours * 60 + manualMinutes) * 60);
    const { startedAt, endedAt } = buildIsoRangeFromDateAndTimes(
      manualDate,
      manualStartTime,
      manualEndTime
    );

    addTimeLog({
      projectId: targetPid,
      startedAt,
      endedAt,
      durationSeconds: totalSeconds,
      note: manualNote,
      source: 'manual',
    });

    setManualNote('');
    setManualSavedNotice(true);
    setTimeout(() => setManualSavedNotice(false), 2500);
  };

  // History filtering & search
  const [filterProjectId, setFilterProjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  const filteredLogs = useMemo(() => {
    return timeLogs.filter(entry => {
      if (filterProjectId !== 'all' && entry.projectId !== filterProjectId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const projName = sortedProjects.find(p => p.id === entry.projectId)?.name.toLowerCase() || '';
        const noteText = (entry.note || '').toLowerCase();
        if (!projName.includes(q) && !noteText.includes(q)) return false;
      }
      return true;
    });
  }, [timeLogs, filterProjectId, searchQuery, sortedProjects]);

  // Edit registered time entry modal state
  const [editingEntry, setEditingEntry] = useState<TimeLogEntry | null>(null);
  const [editProjectId, setEditProjectId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editNote, setEditNote] = useState('');

  const openEditModal = (entry: TimeLogEntry) => {
    setEditingEntry(entry);
    setEditProjectId(entry.projectId);
    setEditDate(toLocalDateString(entry.startedAt));
    setEditStartTime(toLocalTimeHHMM(entry.startedAt));
    setEditEndTime(toLocalTimeHHMM(entry.endedAt));
    const totalMins = Math.max(1, Math.round(entry.durationSeconds / 60));
    setEditHours(Math.floor(totalMins / 60));
    setEditMinutes(totalMins % 60);
    setEditNote(entry.note || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editProjectId) return;

    const totalSeconds = Math.max(60, (editHours * 60 + editMinutes) * 60);
    const { startedAt, endedAt } = buildIsoRangeFromDateAndTimes(
      editDate,
      editStartTime,
      editEndTime
    );

    updateTimeLog(editingEntry.id, {
      projectId: editProjectId,
      startedAt,
      endedAt,
      durationSeconds: totalSeconds,
      note: editNote,
    });
    setEditingEntry(null);
  };

  // Summary calculations
  const projectMap = useMemo(() => {
    return new Map(sortedProjects.map(p => [p.id, p]));
  }, [sortedProjects]);

  const summary = useMemo(() => {
    const todayStr = toLocalDateString(new Date());
    let totalSeconds = 0;
    let todaySeconds = 0;
    const perProject = new Map<string, { seconds: number; sessions: number }>();

    for (const log of timeLogs) {
      totalSeconds += log.durationSeconds;
      if (toLocalDateString(log.startedAt) === todayStr) {
        todaySeconds += log.durationSeconds;
      }
      const prev = perProject.get(log.projectId) || { seconds: 0, sessions: 0 };
      perProject.set(log.projectId, {
        seconds: prev.seconds + log.durationSeconds,
        sessions: prev.sessions + 1,
      });
    }

    const activeProjStats = perProject.get(selectedProjectId) || { seconds: 0, sessions: 0 };

    return {
      totalSeconds,
      todaySeconds,
      sessionsCount: timeLogs.length,
      selectedProjectSeconds: activeProjStats.seconds,
      perProject,
    };
  }, [timeLogs, selectedProjectId]);

  const activeTimerProject = activeTimer ? projectMap.get(activeTimer.projectId) : undefined;
  const selectedProject = projectMap.get(selectedProjectId);

  const handleStartOrSwitchTimer = () => {
    const pid = selectedProjectId || sortedProjects[0]?.id;
    if (!pid) return;
    startTimer(pid, sessionNote);
    setConfirmDiscardTimer(false);
  };

  const handleEndTimer = () => {
    stopTimer(sessionNote);
    setSessionNote('');
    setConfirmDiscardTimer(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Production Time Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track live development sessions per app, log past production hours, and edit or clear time history.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualForm(prev => !prev)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              showManualForm
                ? 'bg-blue-600/15 text-blue-400 border-blue-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Time Afterwards</span>
          </button>
        </div>
      </div>

      {/* Empty Projects Guard */}
      {sortedProjects.length === 0 ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
          <FolderGit2 className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">No Projects Available</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create an iOS app project first to start the production timer or register development hours.
            </p>
          </div>
          {onOpenNewModal && (
            <button
              type="button"
              onClick={() => onOpenNewModal('project')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Section 1: Live Production Timer Card */}
          <div
            className={`p-5 sm:p-6 bg-slate-900 border rounded-xl transition-colors ${
              activeTimer ? 'border-emerald-500/40' : 'border-slate-800'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left: Project Select & Session Note */}
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className={`w-4 h-4 ${activeTimer ? 'text-emerald-400' : 'text-blue-400'}`} />
                  <span className="font-semibold text-white">
                    {activeTimer
                      ? `Timer Running · ${activeTimerProject?.name || 'Selected App'}`
                      : 'Live Session Timer'}
                  </span>
                  {activeTimer && (
                    <span className="text-slate-400 font-mono tabular-nums">
                      · Started at {toLocalTimeHHMM(activeTimer.startedAt)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      App / Project
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {sortedProjects.map(proj => (
                        <option key={proj.id} value={proj.id} className="bg-slate-900 text-white">
                          {proj.name} ({proj.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Work Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={sessionNote}
                      onChange={e => {
                        setSessionNote(e.target.value);
                        if (activeTimer && activeTimer.projectId === selectedProjectId) {
                          updateActiveTimerNote(e.target.value);
                        }
                      }}
                      placeholder="e.g. SwiftUI refactor, TestFlight fixes..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Digital Clock + Start / End Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:pl-6 lg:border-l border-slate-800 shrink-0">
                <div className="px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-center min-w-[148px]">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Elapsed Time
                  </span>
                  <span
                    className={`text-2xl font-mono font-bold tabular-nums tracking-tight ${
                      activeTimer ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {formatElapsedClock(elapsedSeconds)}
                  </span>
                </div>

                {!activeTimer ? (
                  <button
                    type="button"
                    onClick={handleStartOrSwitchTimer}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Timer</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeTimer.projectId !== selectedProjectId && (
                      <button
                        type="button"
                        onClick={handleStartOrSwitchTimer}
                        className="px-3.5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                        title={`Save current session for ${activeTimerProject?.name} and start timing ${selectedProject?.name}`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Switch to {selectedProject?.name}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleEndTimer}
                      className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>End & Save</span>
                    </button>

                    {!confirmDiscardTimer ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDiscardTimer(true)}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="Discard active timer without saving"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs">
                        <span className="text-rose-300 text-[11px]">Discard?</span>
                        <button
                          type="button"
                          onClick={() => {
                            discardActiveTimer();
                            setSessionNote('');
                            setConfirmDiscardTimer(false);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-medium cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDiscardTimer(false)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Register Production Time Afterwards Form */}
          {showManualForm && (
            <form
              onSubmit={handleManualSubmit}
              className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Register Production Time Afterwards
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Log a completed development session by entering start/end times or total hours and minutes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {manualSavedNotice && (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Registered</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                <div className="lg:col-span-2">
                  <label className="block font-medium text-slate-300 mb-1">App / Project</label>
                  <select
                    value={manualProjectId}
                    onChange={e => setManualProjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {sortedProjects.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={manualStartTime}
                    onChange={e => {
                      const val = e.target.value;
                      setManualStartTime(val);
                      syncDurationFromTimes(manualDate, val, manualEndTime);
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={manualEndTime}
                    onChange={e => {
                      const val = e.target.value;
                      setManualEndTime(val);
                      syncDurationFromTimes(manualDate, manualStartTime, val);
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Duration (H : M)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={manualHours}
                      onChange={e => {
                        const h = Math.max(0, Number(e.target.value) || 0);
                        setManualHours(h);
                        syncEndTimeFromDuration(manualDate, manualStartTime, h, manualMinutes);
                      }}
                      className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono tabular-nums focus:outline-none focus:border-blue-500"
                      aria-label="Hours"
                    />
                    <span className="text-slate-500 font-mono">h</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={manualMinutes}
                      onChange={e => {
                        const m = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                        setManualMinutes(m);
                        syncEndTimeFromDuration(manualDate, manualStartTime, manualHours, m);
                      }}
                      className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono tabular-nums focus:outline-none focus:border-blue-500"
                      aria-label="Minutes"
                    />
                    <span className="text-slate-500 font-mono">m</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
                <input
                  type="text"
                  value={manualNote}
                  onChange={e => setManualNote(e.target.value)}
                  placeholder="Optional note about what you built or fixed during this session..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Entry ({manualHours}h {manualMinutes}m)</span>
                </button>
              </div>
            </form>
          )}

          {/* Section 3: Summary Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400">Total Production Time</span>
              <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                {formatDurationCompact(summary.totalSeconds)}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Across {sortedProjects.length} {sortedProjects.length === 1 ? 'app' : 'apps'}
              </span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400">Today Logged</span>
              <p className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
                {formatDurationCompact(summary.todaySeconds)}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Current calendar day
              </span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400 truncate block">
                {selectedProject?.name || 'Selected App'}
              </span>
              <p className="text-xl font-bold text-blue-400 font-mono tabular-nums mt-1">
                {formatDurationCompact(summary.selectedProjectSeconds)}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Selected app total
              </span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400">Recorded Sessions</span>
              <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                {summary.sessionsCount}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Timer & manual logs
              </span>
            </div>
          </div>

          {/* Section 4: Per-App Time Summary + History Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Per-App Production Time Breakdown */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 h-fit">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Time by App</h2>
                {filterProjectId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFilterProjectId('all')}
                    className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                  >
                    Show all
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-800/70">
                {sortedProjects.map(proj => {
                  const stats = summary.perProject.get(proj.id) || { seconds: 0, sessions: 0 };
                  const colorTheme = getProjectColorTheme(proj);
                  const isFiltered = filterProjectId === proj.id;
                  const isTimingThis = activeTimer?.projectId === proj.id;
                  const sharePct =
                    summary.totalSeconds > 0
                      ? Math.round((stats.seconds / summary.totalSeconds) * 100)
                      : 0;

                  return (
                    <div
                      key={proj.id}
                      onClick={() => setFilterProjectId(isFiltered ? 'all' : proj.id)}
                      className={`py-3 px-2 -mx-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                        isFiltered ? 'bg-blue-600/10' : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${colorTheme.dot}`} />
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {proj.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 pl-4">
                          <span>{stats.sessions} {stats.sessions === 1 ? 'session' : 'sessions'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{sharePct}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-semibold tabular-nums text-slate-200">
                          {formatDurationCompact(stats.seconds)}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedProjectId(proj.id);
                            setActiveProjectId(proj.id);
                            if (isTimingThis) {
                              stopTimer(sessionNote);
                            } else {
                              startTimer(proj.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isTimingThis
                              ? 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600/30'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                          }`}
                          title={isTimingThis ? `End timer for ${proj.name}` : `Start timer for ${proj.name}`}
                        >
                          {isTimingThis ? (
                            <Square className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 2 Columns: Registered Production Time History */}
            <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-white">
                    Production Time History
                  </h2>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    ({filteredLogs.length})
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search notes or app..."
                      className="pl-8 pr-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-40"
                    />
                  </div>

                  <select
                    value={filterProjectId}
                    onChange={e => setFilterProjectId(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-white">All Apps</option>
                    {sortedProjects.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {filteredLogs.length > 0 && !confirmClearHistory && (
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(true)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-500/15 border border-slate-700 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {filterProjectId === 'all' ? 'Delete History' : 'Clear App History'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline 2-step confirmation for deleting history */}
              {confirmClearHistory && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      {filterProjectId === 'all'
                        ? `Delete all ${timeLogs.length} registered time entries? This cannot be undone.`
                        : `Delete all ${filteredLogs.length} time entries for ${projectMap.get(filterProjectId)?.name || 'this app'}?`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        clearTimeLogHistory(filterProjectId === 'all' ? undefined : filterProjectId);
                        setConfirmClearHistory(false);
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(false)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* History List / Table */}
              {filteredLogs.length === 0 ? (
                <div className="py-10 text-center space-y-2 border border-dashed border-slate-800 rounded-xl">
                  <Clock className="w-7 h-7 text-slate-600 mx-auto" />
                  <p className="text-xs font-medium text-slate-300">
                    No production time history recorded yet
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Start the live timer above while building an app, or click &quot;Register Time Afterwards&quot; to log past sessions.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                        <th className="py-2 pr-3 font-medium">App</th>
                        <th className="py-2 px-3 font-medium">Date</th>
                        <th className="py-2 px-3 font-medium">Time Window</th>
                        <th className="py-2 px-3 font-medium text-right">Duration</th>
                        <th className="py-2 px-3 font-medium">Notes</th>
                        <th className="py-2 pl-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLogs.map(entry => {
                        const proj = projectMap.get(entry.projectId);
                        const startTimeLabel = toLocalTimeHHMM(entry.startedAt);
                        const endTimeLabel = toLocalTimeHHMM(entry.endedAt);

                        return (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 pr-3 font-medium text-slate-200 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  if (proj && onNavigate) {
                                    setActiveProjectId(proj.id);
                                    onNavigate('projects');
                                  }
                                }}
                                className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                              >
                                {proj?.name || 'Deleted Project'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap font-mono tabular-nums">
                              {formatDate(toLocalDateString(entry.startedAt))}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap font-mono tabular-nums">
                              {startTimeLabel} – {endTimeLabel}
                              <span className="text-slate-600 ml-1.5 font-sans">
                                · {entry.source === 'timer' ? 'Timer' : 'Manual'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-emerald-400 whitespace-nowrap">
                              {formatDurationCompact(entry.durationSeconds)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 max-w-[220px] truncate" title={entry.note || ''}>
                              {entry.note || <span className="text-slate-600">—</span>}
                            </td>
                            <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(entry)}
                                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                  title="Edit registered time"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTimeLog(entry.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                  title="Delete time entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit Registered Time Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Change Registered Time</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">App / Project</label>
                <select
                  value={editProjectId}
                  onChange={e => setEditProjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {sortedProjects.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Start</label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={e => {
                      const val = e.target.value;
                      setEditStartTime(val);
                      const { durationSeconds } = buildIsoRangeFromDateAndTimes(editDate, val, editEndTime);
                      const mins = Math.round(durationSeconds / 60);
                      setEditHours(Math.floor(mins / 60));
                      setEditMinutes(mins % 60);
                    }}
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">End</label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={e => {
                      const val = e.target.value;
                      setEditEndTime(val);
                      const { durationSeconds } = buildIsoRangeFromDateAndTimes(editDate, editStartTime, val);
                      const mins = Math.round(durationSeconds / 60);
                      setEditHours(Math.floor(mins / 60));
                      setEditMinutes(mins % 60);
                    }}
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Total Duration (Hours & Minutes)</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={editHours}
                      onChange={e => {
                        const h = Math.max(0, Number(e.target.value) || 0);
                        setEditHours(h);
                        const [y, m, d] = editDate.split('-').map(Number);
                        const [sh, sm] = editStartTime.split(':').map(Number);
                        const totalMins = Math.max(1, h * 60 + editMinutes);
                        const endObj = new Date(y, (m || 1) - 1, d || 1, sh || 0, (sm || 0) + totalMins, 0, 0);
                        setEditEndTime(toLocalTimeHHMM(endObj));
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono tabular-nums focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-400">hrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={editMinutes}
                      onChange={e => {
                        const minVal = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                        setEditMinutes(minVal);
                        const [y, m, d] = editDate.split('-').map(Number);
                        const [sh, sm] = editStartTime.split(':').map(Number);
                        const totalMins = Math.max(1, editHours * 60 + minVal);
                        const endObj = new Date(y, (m || 1) - 1, d || 1, sh || 0, (sm || 0) + totalMins, 0, 0);
                        setEditEndTime(toLocalTimeHHMM(endObj));
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono tabular-nums focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-400">min</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Work Note</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="Optional session notes..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
