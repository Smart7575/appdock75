/**
 * iOS Dev Hub - Settings, Workflow Configuration & Data Management
 * Strictly implements PRD Section 5.2, Section 6, Section 8.4 & Section 8.7:
 * - Profile & Linked Providers (Email, Google, Apple)
 * - Password Change
 * - Workflow Status Customization (Kanban columns, colors, types, WIP limits)
 * - Demo Data removal & restoration
 * - Export Data (JSON, Tasks CSV, Changelog MD) & Import Data (JSON)
 * - Permanent Account Deletion with Re-Authentication & Apple Token Revocation
 */

import React, { useState } from 'react';
import {
  User,
  ShieldAlert,
  Key,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Columns,
  Check,
  AlertTriangle,
  Lock,
  Apple,
  RotateCcw,
  Plus,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ChecklistTemplateManager } from './ChecklistTemplateManager';
import {
  exportUserDataAsJson,
  exportTasksAsCsv,
  exportChangelogAsMarkdown,
  saveUserDatabase,
} from '../../services/storage';
import { WorkflowStatus, StatusType } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateProfile,
    changePassword,
    deleteCurrentAccount,
    linkProvider,
  } = useAuth();

  const {
    db,
    hasDemoData,
    purgeDemoData,
    reloadDemoData,
    updateStatuses,
    addStatus,
    deleteStatus,
  } = useData();

  const [activeTab, setActiveTab] = useState<'profile' | 'workflow' | 'checklist' | 'data' | 'security'>('profile');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Status creation
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6');
  const [newStatusType, setNewStatusType] = useState<StatusType>('Active');
  const [newStatusWip, setNewStatusWip] = useState<number | undefined>(undefined);

  // Account Deletion State (PRD §5.2)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reauthInput, setReauthInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    const res = await changePassword(oldPassword, newPassword);
    if (res.success) {
      setPasswordMsg({ text: 'Password successfully updated.', success: true });
      setOldPassword('');
      setNewPassword('');
    } else {
      setPasswordMsg({ text: res.error || 'Failed to update password.', success: false });
    }
  };

  // Status management
  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;
    addStatus({
      scope: 'global',
      name: newStatusName.trim(),
      color: newStatusColor,
      order: db.statuses.length,
      type: newStatusType,
      wipLimit: newStatusWip || undefined,
    });
    setNewStatusName('');
    setNewStatusWip(undefined);
  };

  // Export handlers
  const handleExportJson = () => {
    if (!user) return;
    const jsonStr = exportUserDataAsJson(user, db);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ios_dev_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportCsv = () => {
    const csvStr = exportTasksAsCsv(db.tasks, db.projects, db.statuses);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ios_dev_hub_tasks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportMarkdownChangelog = () => {
    const currentProj = db.projects[0];
    const mdStr = exportChangelogAsMarkdown(
      currentProj?.name || 'iOS App',
      db.releases,
      db.changelogEntries
    );
    const blob = new Blob([mdStr], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `changelog_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  // Import JSON handler
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data) {
          saveUserDatabase(user.id, parsed.data);
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Account deletion confirmation (PRD §5.2)
  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteCurrentAccount(reauthInput);
    if (!res.success) {
      setIsDeleting(false);
      setDeleteError(res.error || 'Account deletion failed.');
    } else {
      // User is logged out and session wiped
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Settings & Account Governance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your developer profile, custom Kanban workflow columns, data backups, and account privacy.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-1 text-xs">
        {[
          { id: 'profile', label: 'Profile & Account', icon: User },
          { id: 'workflow', label: 'Kanban Workflow Statuses', icon: Columns },
          { id: 'checklist', label: 'Standaard Checklist', icon: CheckSquare },
          { id: 'data', label: 'Data & Demo Management', icon: Sparkles },
          { id: 'security', label: 'Danger Zone & Deletion', icon: ShieldAlert },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFILE & ACCOUNT (PRD §5.2) */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Developer Profile</h3>

            <div className="flex items-center gap-4 pb-3 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-inner shrink-0">
                <User className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Linked Providers:
                  </span>
                  {user?.providers.map(p => (
                    <span
                      key={p}
                      className="text-[11px] capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs max-w-md">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email (Primary)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium cursor-pointer"
                >
                  Save Profile
                </button>
                {profileSaved && (
                  <span className="text-emerald-400 text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Change Password (PRD §5.2) */}
          {user?.providers.includes('email') && (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-white">Change Password</h3>
              <p className="text-xs text-slate-400">
                Update the password for your email login. (Minimum 8 characters)
              </p>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-lg text-xs ${
                    passwordMsg.success
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs max-w-md">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WORKFLOW STATUSES & KANBAN CONFIG (PRD §8.4) */}
      {activeTab === 'workflow' && (
        <div className="space-y-5">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Custom Kanban Workflow Columns</h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize column names, colors, status classifications, and optional WIP limits across all boards.
              </p>
            </div>

            {/* Statuses List */}
            <div className="space-y-2">
              {db.statuses.map(st => (
                <div
                  key={st.id}
                  className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                    <span className="font-semibold text-white">{st.name}</span>
                    <span className="text-[11px] text-slate-400">({st.type})</span>
                    {st.wipLimit && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        WIP: max {st.wipLimit}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {db.statuses.length > 2 && (
                      <button
                        onClick={() => deleteStatus(st.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Status Form */}
            <form onSubmit={handleAddStatus} className="pt-3 border-t border-slate-800 space-y-3 text-xs">
              <h4 className="font-semibold text-slate-200">Add Workflow Column</h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Column Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design Review"
                    value={newStatusName}
                    onChange={e => setNewStatusName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Type</label>
                  <select
                    value={newStatusType}
                    onChange={e => setNewStatusType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="Active">Active</option>
                    <option value="Done">Done</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Color</label>
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={e => setNewStatusColor(e.target.value)}
                    className="w-full h-8 bg-slate-800 border border-slate-700 rounded-lg p-0.5 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium cursor-pointer"
              >
                + Add Column
              </button>
            </form>
          </div>
        </div>
      )}
 
      {/* TAB: STANDAARD CHECKLIST (GLOBAL VOOR ALLE APPS) */}
      {activeTab === 'checklist' && (
        <ChecklistTemplateManager />
      )}

      {/* TAB 3: DATA & DEMO MANAGEMENT (PRD §6 & §8.7) */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Demo Data Management (PRD Section 6) */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Demo Workspace Environment</span>
                    {hasDemoData ? (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Clean Slate
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {hasDemoData
                      ? "You're viewing demo data. Remove it whenever you're ready to work exclusively with your own iOS projects and records."
                      : "Your workspace is currently clean with no demo data. You can restore the sample iOS habit tracker anytime to explore features."}
                  </p>
                </div>
              </div>
            </div>

            {hasDemoData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Demo Projects</span>
                  <p className="font-bold text-white mt-0.5 font-mono">{db.projects.filter(p => p.isDemo).length}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Demo Ideas</span>
                  <p className="font-bold text-white mt-0.5 font-mono">{db.ideas.filter(i => i.isDemo).length}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Demo Releases</span>
                  <p className="font-bold text-white mt-0.5 font-mono">{db.releases.filter(r => r.isDemo).length}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Demo Archive</span>
                  <p className="font-bold text-white mt-0.5 font-mono">{db.archivedApps.filter(a => a.isDemo).length}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <button
                onClick={purgeDemoData}
                disabled={!hasDemoData}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold disabled:opacity-40 disabled:cursor-not-allowed text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Demo Data</span>
              </button>

              <button
                onClick={reloadDemoData}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Demo Workspace</span>
              </button>
            </div>
          </div>

          {/* Export & Backup (PRD Section 8.7) */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Export & Backup Workspace Data</h3>
            <p className="text-xs text-slate-400">
              Download complete local backups of your projects, kanban tasks, release logs, and ideas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleExportJson}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-400">
                    Export All Data (JSON)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Full dump of projects, tasks, releases, and settings.
                </p>
              </button>

              <button
                onClick={handleExportCsv}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-400">
                    Export Tasks (CSV)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Formatted spreadsheet of all active and completed tasks.
                </p>
              </button>

              <button
                onClick={handleExportMarkdownChangelog}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-400">
                    Export Changelog (MD)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Clean Markdown formatted changelog file.
                </p>
              </button>
            </div>

            {/* Import Data */}
            <div className="pt-4 border-t border-slate-800 text-xs">
              <label className="block text-slate-300 font-medium mb-1">Restore from Backup (JSON)</label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DANGER ZONE & ACCOUNT DELETION (PRD §5.2) */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Permanently Delete Account</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Deleting your account is <strong>permanent and irreversible</strong>. It completely erases:
            </p>

            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-1">
              <li>All registered projects, Kanban tasks, and workflow statuses</li>
              <li>All brainstorm ideas and discussion notes</li>
              <li>All semantic versions, changelogs, and generated release notes</li>
              <li>App archive records, metrics logs, and compliance trackers</li>
              <li>
                Revocation of Apple client authorization token (mandatory requirement for apps with Sign in with Apple)
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-sm shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Re-Authentication Dialog (PRD §5.2) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-2.5 text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Confirm Permanent Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              This action cannot be undone. To prevent accidental loss, please enter your password or type <strong>DELETE</strong> below to re-authenticate and confirm.
            </p>

            {deleteError && (
              <div className="p-3 mb-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="space-y-3 mb-5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Re-Authentication Credential / Confirmation:
                </label>
                <input
                  type="password"
                  placeholder="Enter password or type DELETE"
                  value={reauthInput}
                  onChange={e => setReauthInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              {user?.providers.includes('apple') && (
                <div className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-lg text-slate-400 text-[11px]">
                  <Apple className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                  <span>Will notify Apple to revoke user authorization token.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                  setReauthInput('');
                }}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting || !reauthInput.trim()}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting All Records...' : 'Permanently Erase Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
