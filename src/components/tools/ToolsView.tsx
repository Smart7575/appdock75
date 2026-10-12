/**
 * iOS Dev Hub - iOS Developer Toolset & Compliance Suite
 * Strictly implements PRD Section 8.7:
 * 1. App Store Submission Checklist
 * 2. Privacy & Compliance Tracker (Info.plist strings, ATT, Privacy Manifest)
 * 3. App Store Rejection Tracker (Guideline numbers, reasons, fixes)
 * 4. ASO & Keyword Counter (Title 30, Subtitle 30, Keywords 100 char boundaries)
 * 5. Certificate & Developer Program Expiry Reminders
 * 6. Device & OS Test Matrix
 */

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  ShieldCheck,
  AlertOctagon,
  Key,
  Smartphone,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Clock,
  Layers,
  HelpCircle,
  FolderGit2,
  Edit2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useFormatDate } from '../../utils/dateFormat';
import { PrivacyPermission, CertificateReminder } from '../../types';
import { DEFAULT_CHECKLIST_TEMPLATE } from '../../services/storage';

interface ToolsViewProps {
  onNavigate?: (view: string) => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ onNavigate }) => {
  const {
    db,
    activeProjectId,
    toggleChecklist,
    resetChecklist,
    updatePrivacyPermission,
    addCertificate,
    deleteCertificate,
  } = useData();
  const { formatDate } = useFormatDate();

  const [activeSubTool, setActiveSubTool] = useState<
    'submission' | 'privacy' | 'rejections' | 'aso' | 'certificates' | 'testmatrix'
  >('submission');

  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || db.projects[0]?.id || '');

  const currentProject = db.projects.find(p => p.id === selectedProjectId) || db.projects.find(p => p.id === activeProjectId) || db.projects[0];

  const visibleChecklists = useMemo(() => {
    const templateToUse = db.checklistTemplate && db.checklistTemplate.length > 0
      ? db.checklistTemplate
      : DEFAULT_CHECKLIST_TEMPLATE;

    if (currentProject) {
      const items = db.checklists.filter(c => c.projectId === currentProject.id);
      if (items.length > 0) {
        return [...items].sort((a, b) => {
          const indexA = templateToUse.findIndex(t => a.id.includes(t.id) || (a.title === t.title && a.category === t.category));
          const indexB = templateToUse.findIndex(t => b.id.includes(t.id) || (b.title === t.title && b.category === t.category));
          const posA = indexA === -1 ? 9999 : indexA;
          const posB = indexB === -1 ? 9999 : indexB;
          return posA - posB;
        });
      }

      return templateToUse.map(c => ({
        ...c,
        id: `chk-${currentProject.id}-${c.id}`,
        projectId: currentProject.id,
        done: false,
      }));
    }

    return db.checklists;
  }, [db.checklists, db.checklistTemplate, currentProject]);

  const completedChecklistCount = visibleChecklists.filter(c => c.done).length;
  const checklistPercent = visibleChecklists.length > 0 ? Math.round((completedChecklistCount / visibleChecklists.length) * 100) : 0;

  // ASO Tool State
  const [asoTitle, setAsoTitle] = useState('HabitPulse: Daily Habit Streak');
  const [asoSubtitle, setAsoSubtitle] = useState('Build lasting positive routines');
  const [asoKeywords, setAsoKeywords] = useState('habits,routine,streak,tracker,planner,healthkit,widgets,pomodoro');

  // Rejection Tracker State
  const [rejections, setRejections] = useState([
    {
      id: 'rej-1',
      date: '2026-08-14',
      guideline: 'Guideline 5.1.1 - Data Collection and Storage',
      reason: 'Missing clear explanation why NSHealthShareUsageDescription is requested on launch.',
      resolution: 'Updated Info.plist with explicit explanation and moved request until after user initiates mindful habit setup. Approved upon resubmission.',
      resolved: true,
    },
    {
      id: 'rej-2',
      date: '2026-06-20',
      guideline: 'Guideline 2.1 - App Completeness',
      reason: 'TestFlight build crashed on iPad split-screen multitask rotation.',
      resolution: 'Fixed SwiftUI GeometryReader view bounds calculation for compact horizontal class. Approved.',
      resolved: true,
    },
  ]);

  const [newRejForm, setNewRejForm] = useState({
    guideline: 'Guideline 2.1 - App Completeness',
    reason: '',
    resolution: '',
  });

  // Certificate Modal State
  const [showAddCert, setShowAddCert] = useState(false);
  const [certForm, setCertForm] = useState({
    title: 'Apple Distribution Certificate 2027',
    type: 'Distribution Certificate' as const,
    expiryDate: '2027-04-15',
    notes: 'Used by Xcode automatic signing for App Store releases.',
  });

  // Test matrix data
  const [testMatrix, setTestMatrix] = useState([
    { device: 'iPhone 16 Pro Max', os: 'iOS 18.1', status: 'Passed', tester: 'Alex (Physical Device)' },
    { device: 'iPhone 15', os: 'iOS 18.0', status: 'Passed', tester: 'Alex (Physical Device)' },
    { device: 'iPhone 13 mini (Compact Screen)', os: 'iOS 17.5', status: 'Passed', tester: 'Simulator' },
    { device: 'iPad Pro 13" M4', os: 'iPadOS 18.0', status: 'Passed', tester: 'Simulator' },
    { device: 'Apple Watch Series 9', os: 'watchOS 11.0', status: 'Passed', tester: 'Physical Device' },
    { device: 'Apple Vision Pro', os: 'visionOS 2.0', status: 'Testing', tester: 'Simulator' },
  ]);

  // ASO keyword character calculations
  const parsedKeywords = asoKeywords.split(',').map(k => k.trim()).filter(Boolean);
  const duplicateKeywords = parsedKeywords.filter((item, index) => parsedKeywords.indexOf(item) !== index);

  const handleAddRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRejForm.reason.trim()) return;
    setRejections([
      ...rejections,
      {
        id: `rej-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        guideline: newRejForm.guideline,
        reason: newRejForm.reason,
        resolution: newRejForm.resolution,
        resolved: !!newRejForm.resolution,
      },
    ]);
    setNewRejForm({ guideline: 'Guideline 2.1 - App Completeness', reason: '', resolution: '' });
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    addCertificate({
      title: certForm.title,
      type: certForm.type,
      expiryDate: certForm.expiryDate,
      notes: certForm.notes,
    });
    setShowAddCert(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          iOS Development Tools & Compliance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Essential utilities for App Store submission, privacy manifests, Apple review guidelines, and ASO.
        </p>
      </div>

      {/* Subtool Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-1 text-xs">
        {[
          { id: 'submission', label: 'App Store Checklist', icon: CheckSquare },
          { id: 'privacy', label: 'Privacy & Info.plist', icon: ShieldCheck },
          { id: 'rejections', label: 'Rejection Tracker', icon: AlertOctagon },
          { id: 'aso', label: 'ASO & Keywords (100 Chars)', icon: Sparkles },
          { id: 'certificates', label: 'Certificate Reminders', icon: Key },
          { id: 'testmatrix', label: 'Device Test Matrix', icon: Smartphone },
        ].map(tool => {
          const Icon = tool.icon;
          const isActive = activeSubTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveSubTool(tool.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. APP STORE SUBMISSION CHECKLIST (PRD §8.7) */}
      {activeSubTool === 'submission' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">App Store Pre-Flight Submission Checklist</h3>
                {currentProject && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {currentProject.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {completedChecklistCount} of {visibleChecklists.length} tasks completed ({checklistPercent}%)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {db.projects.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={currentProject?.id || ''}
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                  >
                    {db.projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="w-28 sm:w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${checklistPercent}%` }} />
              </div>

              <button
                type="button"
                onClick={() => onNavigate?.('settings:checklist')}
                className="px-2.5 py-1 text-[11px] font-medium bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Edit standard checklist template for all apps in Settings"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Standard Checklist</span>
              </button>

              <button
                type="button"
                onClick={() => resetChecklist(currentProject?.id)}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                title="Reset all checklist tasks to unchecked"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {visibleChecklists.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  item.done
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklist(item.id)}
                  className="w-4 h-4 rounded text-blue-600 mt-0.5 cursor-pointer accent-blue-500 shrink-0"
                />
                <div className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5 border border-slate-700/60" title={`Step ${idx + 1}`}>
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${item.done ? 'line-through text-slate-400' : 'text-white'}`}>
                      {item.title}
                    </span>
                    {item.category && (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
                        {item.category}
                      </span>
                    )}
                    {item.required && (
                      <span className="text-[10px] text-rose-400 font-medium px-1.5 py-0.2 bg-rose-500/10 rounded border border-rose-500/20">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PRIVACY & COMPLIANCE TRACKER (PRD §8.7) */}
      {activeSubTool === 'privacy' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white">
              Info.plist Permission Usage Descriptions & Apple Privacy Manifest
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Apple strictly rejects builds missing user-facing consent strings or incomplete NSPrivacyAccessedAPITypes declarations.
            </p>
          </div>

          <div className="space-y-3">
            {db.privacyPermissions.map(perm => (
              <div key={perm.key} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">{perm.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-400">({perm.key})</span>
                  </div>
                  <button
                    onClick={() => updatePrivacyPermission(perm.key, { enabled: !perm.enabled })}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      perm.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {perm.enabled ? 'Active in Info.plist' : 'Disabled'}
                  </button>
                </div>

                <p className="text-slate-400">{perm.description}</p>

                {perm.enabled && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Configured Info.plist Prompt String:
                    </label>
                    <input
                      type="text"
                      value={perm.usageDescription}
                      onChange={e => updatePrivacyPermission(perm.key, { usageDescription: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. REJECTION TRACKER (PRD §8.7) */}
      {activeSubTool === 'rejections' && (
        <div className="space-y-5">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white">App Store Review Rejection Log</h3>
            <p className="text-xs text-slate-400 mt-1">
              Document past Apple review rejections, reasons, and proven resolutions for future releases.
            </p>
          </div>

          {/* Add rejection log */}
          <form onSubmit={handleAddRejection} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
            <h4 className="font-semibold text-slate-200">Log New Apple Review Rejection</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Guideline Reference</label>
                <select
                  value={newRejForm.guideline}
                  onChange={e => setNewRejForm({ ...newRejForm, guideline: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  <option value="Guideline 2.1 - App Completeness">Guideline 2.1 - App Completeness</option>
                  <option value="Guideline 5.1.1 - Data Collection and Storage">Guideline 5.1.1 - Privacy & Permissions</option>
                  <option value="Guideline 3.1.1 - In-App Purchases">Guideline 3.1.1 - StoreKit Payments</option>
                  <option value="Guideline 4.0 - Design Standards">Guideline 4.0 - Design Minimums</option>
                  <option value="Guideline 4.8 - Sign in with Apple">Guideline 4.8 - Sign in with Apple</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Resolution (if resolved)</label>
                <input
                  type="text"
                  placeholder="How was this fixed?"
                  value={newRejForm.resolution}
                  onChange={e => setNewRejForm({ ...newRejForm, resolution: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Apple Reviewer Explanation</label>
              <textarea
                rows={2}
                required
                placeholder="Paste the message from App Store Connect Resolution Center..."
                value={newRejForm.reason}
                onChange={e => setNewRejForm({ ...newRejForm, reason: e.target.value })}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium cursor-pointer"
            >
              Log Rejection
            </button>
          </form>

          {/* Past rejections */}
          <div className="space-y-3">
            {rejections.map(rej => (
              <div key={rej.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400">{rej.guideline}</span>
                  <span className="font-mono text-slate-500">{formatDate(rej.date)}</span>
                </div>
                <p className="text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  {rej.reason}
                </p>
                {rej.resolution && (
                  <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-emerald-300">
                    <strong>Resolution:</strong> {rej.resolution}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ASO & KEYWORD OPTIMIZER (PRD §8.7) */}
      {activeSubTool === 'aso' && (
        <div className="space-y-5">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white">App Store Optimization (ASO) Character Counter</h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify strict Apple constraints: Title (30 characters), Subtitle (30 characters), and Keywords (100 characters comma-separated).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Title & Subtitle */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-semibold text-slate-300">App Title</label>
                  <span className={`font-mono ${asoTitle.length > 30 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {asoTitle.length} / 30 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={asoTitle}
                  onChange={e => setAsoTitle(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-semibold text-slate-300">App Subtitle</label>
                  <span className={`font-mono ${asoSubtitle.length > 30 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {asoSubtitle.length} / 30 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={asoSubtitle}
                  onChange={e => setAsoSubtitle(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            {/* 100 Character Keywords Field */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between">
                <label className="font-semibold text-slate-300">Keywords String</label>
                <span className={`font-mono font-bold ${asoKeywords.length > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {asoKeywords.length} / 100 chars
                </span>
              </div>

              <textarea
                rows={3}
                value={asoKeywords}
                onChange={e => setAsoKeywords(e.target.value)}
                placeholder="habit,streak,routine,tracker,healthkit"
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs"
              />

              {duplicateKeywords.length > 0 && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[11px]">
                  Duplicate keyword detected: {duplicateKeywords.join(', ')}. Removing duplicates frees up valuable characters!
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tip: Do not add spaces after commas (e.g. <code>habit,tracker</code> not <code>habit, tracker</code>) to save precious character budget.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. CERTIFICATES & PROVISIONING REMINDERS (PRD §8.7) */}
      {activeSubTool === 'certificates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-white">Apple Developer Certificates & Expiry Tracker</h3>
              <p className="text-xs text-slate-400">
                Track expiry dates of distribution certificates, APNs keys, and developer program enrollment.
              </p>
            </div>
            <button
              onClick={() => setShowAddCert(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              + Add Reminder
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {db.certificates.map(cert => (
              <div key={cert.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-white">{cert.title}</span>
                  <button
                    onClick={() => deleteCertificate(cert.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {cert.daysRemaining} days left
                </div>

                <div className="text-slate-400 text-[11px]">
                  Expires on: <span className="font-mono text-slate-300">{formatDate(cert.expiryDate)}</span>
                </div>
                <p className="text-[11px] text-slate-500">{cert.notes}</p>
              </div>
            ))}
          </div>

          {/* Add Cert Reminder Modal */}
          {showAddCert && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs">
                <h3 className="text-sm font-bold text-white mb-3">Add Certificate Expiry Reminder</h3>
                <form onSubmit={handleAddCert} className="space-y-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={certForm.title}
                      onChange={e => setCertForm({ ...certForm, title: e.target.value })}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={certForm.expiryDate}
                      onChange={e => setCertForm({ ...certForm, expiryDate: e.target.value })}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={certForm.notes}
                      onChange={e => setCertForm({ ...certForm, notes: e.target.value })}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCert(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold"
                    >
                      Save Reminder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. DEVICE & OS TEST MATRIX (PRD §8.7) */}
      {activeSubTool === 'testmatrix' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white">Apple Hardware & iOS Test Matrix</h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify compatibility across device form factors (compact screens, Dynamic Island, iPad split-view, watchOS).
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Device Target</th>
                  <th className="py-2.5 px-3">OS Version</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Test Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {testMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-white">{item.device}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.os}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{item.tester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
