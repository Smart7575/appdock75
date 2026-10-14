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
  Calendar,
  Eye,
  EyeOff,
  AlertCircle,
  Database,
  ArrowUp,
  ArrowDown,
  Edit2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ChecklistTemplateManager } from './ChecklistTemplateManager';
import { AppStoreTemplateManager } from './AppStoreTemplateManager';
import { DataBackupManager } from './DataBackupManager';
import { WorkflowStatus, StatusType, DateFormatOption } from '../../types';
import {
  DATE_FORMAT_OPTIONS,
  DEFAULT_DATE_FORMAT,
  formatDate,
} from '../../utils/dateFormat';

interface SettingsViewProps {
  initialTab?: 'profile' | 'workflow' | 'checklist' | 'data' | 'security';
  onNavigate?: (view: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialTab = 'profile',
  onNavigate,
}) => {
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

  const [activeTab, setActiveTab] = useState<'profile' | 'workflow' | 'checklist' | 'data' | 'security'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Bundle Identifier Prefix State (e.g. "indie" in com.indie.appdock75)
  const [bundlePrefix, setBundlePrefix] = useState(user?.settings?.bundlePrefix || 'indie');

  React.useEffect(() => {
    if (user?.settings?.bundlePrefix) {
      setBundlePrefix(user.settings.bundlePrefix);
    }
  }, [user?.settings?.bundlePrefix]);

  // Date Format Preference State
  const [selectedDateFormat, setSelectedDateFormat] = useState<DateFormatOption>(
    user?.settings?.dateFormat || DEFAULT_DATE_FORMAT
  );
  const [dateFormatSaved, setDateFormatSaved] = useState(false);

  React.useEffect(() => {
    if (user?.settings?.dateFormat) {
      setSelectedDateFormat(user.settings.dateFormat);
    }
  }, [user?.settings?.dateFormat]);

  const handleSelectDateFormat = (newFormat: DateFormatOption) => {
    setSelectedDateFormat(newFormat);
    if (user) {
      updateProfile({
        settings: {
          ...user.settings,
          dateFormat: newFormat,
        },
      });
      setDateFormatSaved(true);
      setTimeout(() => setDateFormatSaved(false), 2500);
    }
  };

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleToggleShowAllPasswords = () => {
    const nextVal = !showAllPasswords;
    setShowAllPasswords(nextVal);
    setShowOldPassword(nextVal);
    setShowNewPassword(nextVal);
    setShowConfirmPassword(nextVal);
  };

  // Status creation
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6');
  const [newStatusType, setNewStatusType] = useState<StatusType>('Active');
  const [newStatusWip, setNewStatusWip] = useState<number | undefined>(undefined);

  // Status editing & reordering
  const [editingStatus, setEditingStatus] = useState<WorkflowStatus | null>(null);
  const [editStatusName, setEditStatusName] = useState('');
  const [editStatusColor, setEditStatusColor] = useState('#3b82f6');
  const [editStatusType, setEditStatusType] = useState<StatusType>('Active');
  const [editStatusWip, setEditStatusWip] = useState<number | undefined>(undefined);

  const handleMoveStatus = (index: number, direction: 'up' | 'down') => {
    const next = [...db.statuses];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    updateStatuses(next);
  };

  const handleOpenEditStatus = (st: WorkflowStatus) => {
    setEditingStatus(st);
    setEditStatusName(st.name);
    setEditStatusColor(st.color || '#3b82f6');
    setEditStatusType(st.type || 'Active');
    setEditStatusWip(st.wipLimit);
  };

  const handleSaveEditStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatus || !editStatusName.trim()) return;
    const nextStatuses = db.statuses.map(st =>
      st.id === editingStatus.id
        ? {
            ...st,
            name: editStatusName.trim(),
            color: editStatusColor,
            type: editStatusType,
            wipLimit: editStatusWip || undefined,
          }
        : st
    );
    updateStatuses(nextStatuses);
    setEditingStatus(null);
  };

  // Account Deletion State (PRD §5.2)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reauthInput, setReauthInput] = useState('');
  const [showReauthPassword, setShowReauthPassword] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrefix = bundlePrefix.toLowerCase().trim().replace(/[^a-z0-9.-]/g, '') || 'indie';
    setBundlePrefix(cleanPrefix);
    updateProfile({
      name,
      settings: {
        ...(user?.settings || { theme: 'dark', emailNotifications: true, compactView: false }),
        bundlePrefix: cleanPrefix,
      },
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  // Change password with double entry validation and visibility toggles
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!oldPassword.trim()) {
      setPasswordMsg({ text: 'Please enter your current password.', success: false });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must have at least 8 characters.', success: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        text: 'The new passwords do not match. Please verify both fields to prevent typing errors.',
        success: false,
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setPasswordMsg({ text: 'Password successfully updated.', success: true });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ text: res.error || 'Failed to update password.', success: false });
      }
    } finally {
      setIsUpdatingPassword(false);
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
          { id: 'checklist', label: 'Standard Checklist', icon: CheckSquare },
          { id: 'data', label: 'Data Backup, Import & Export', icon: Database },
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">
                    Bundle Identifier Prefix (Middle part)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Default: indie
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="px-2.5 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-400 select-none">
                    com.
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="indie"
                    value={bundlePrefix}
                    onChange={e => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '');
                      setBundlePrefix(val);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <span className="px-2.5 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-400 select-none">
                    .&lt;appName&gt;
                  </span>
                </div>
                <div className="mt-1.5 p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Example Bundle Identifier:</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    com.{bundlePrefix.trim() || 'indie'}.appdock75
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This middle part is used by default when creating new projects, converting ideas, and in App Store configurations (e.g. <span className="font-mono text-slate-300">com.{bundlePrefix.trim() || 'indie'}.&lt;app&gt;</span>).
                </p>
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

          {/* Date Format & Regional Display Preferences */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Date Format Preferences</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose how dates (e.g. DD/MM/YYYY) are formatted across projects, releases, deadlines, and activity logs.
                  </p>
                </div>
              </div>

              {dateFormatSaved && (
                <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Date format saved!</span>
                </span>
              )}
            </div>

            {/* Quick dropdown for mobile / fast selection */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Date Format
                </label>
                <div className="flex items-center gap-2 max-w-md">
                  <select
                    value={selectedDateFormat}
                    onChange={e => handleSelectDateFormat(e.target.value as DateFormatOption)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {DATE_FORMAT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} — {opt.description} ({opt.example})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid of format options with real interactive cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {DATE_FORMAT_OPTIONS.map(opt => {
                  const isSelected = selectedDateFormat === opt.id;
                  const livePreview = formatDate(new Date(), opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectDateFormat(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm shadow-blue-500/10'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono font-bold text-xs text-white">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {opt.description}
                      </p>
                      <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Live preview:</span>
                        <span className="font-mono font-semibold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {livePreview}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Box */}
              <div className="mt-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Active Format Preview</span>
                  <span className="font-mono text-[11px] text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    {selectedDateFormat}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Today's Date:</span>
                    <span className="font-mono text-slate-200 font-semibold mt-0.5 block">
                      {formatDate(new Date(), selectedDateFormat)}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Sample Target Release:</span>
                    <span className="font-mono text-slate-200 font-semibold mt-0.5 block">
                      {formatDate('2026-11-15', selectedDateFormat)}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Sample Milestone Due:</span>
                    <span className="font-mono text-slate-200 font-semibold mt-0.5 block">
                      {formatDate('2026-10-25', selectedDateFormat)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password (PRD §5.2) */}
          {(user?.providers.includes('email') || !user?.providers || user.providers.length === 0) && (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Change Password</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Update the password for your account login. Enter your new password twice to prevent typing errors.
                    </p>
                  </div>
                </div>

                {/* Show/Hide all passwords toggle */}
                <button
                  type="button"
                  onClick={handleToggleShowAllPasswords}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto ${
                    showAllPasswords
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={showAllPasswords ? 'Hide all passwords' : 'Show all passwords'}
                >
                  {showAllPasswords ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Passwords</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show Passwords</span>
                    </>
                  )}
                </button>
              </div>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    passwordMsg.success
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {passwordMsg.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs max-w-lg">
                {/* Current Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">Current Password</label>
                    <span className="text-[11px] text-slate-500">Required for verification</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showOldPassword || showAllPasswords ? 'text' : 'password'}
                      required
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      title={showOldPassword || showAllPasswords ? 'Hide password' : 'Show password'}
                    >
                      {showOldPassword || showAllPasswords ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">New Password</label>
                    <span className="text-[11px] text-slate-500">Minimum 8 characters</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword || showAllPasswords ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min. 8 characters)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      title={showNewPassword || showAllPasswords ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword || showAllPasswords ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      {newPassword.length >= 8 ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Minimum length reached ({newPassword.length} chars)
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {8 - newPassword.length} more characters needed
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">Confirm New Password</label>
                    <span className="text-[11px] text-slate-500">Re-enter to prevent typos</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword || showAllPasswords ? 'text' : 'password'}
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full pl-3 pr-10 py-2 bg-slate-800 border rounded-lg text-slate-100 font-mono text-xs focus:outline-none transition-colors ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : confirmPassword && confirmPassword === newPassword
                          ? 'border-emerald-500/80 focus:border-emerald-500'
                          : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      title={showConfirmPassword || showAllPasswords ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword || showAllPasswords ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Real-time match indicator */}
                  {confirmPassword && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5" /> Passwords match!
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match yet
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || (confirmPassword ? newPassword !== confirmPassword : false)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isUpdatingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleShowAllPasswords}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    {showAllPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAllPasswords ? 'Hide plain text' : 'Show plain text'}</span>
                  </button>
                </div>
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
              {db.statuses.map((st, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === db.statuses.length - 1;
                return (
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

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveStatus(idx, 'up')}
                        disabled={isFirst}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isFirst ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStatus(idx, 'down')}
                        disabled={isLast}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isLast ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditStatus(st)}
                        className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded transition-colors cursor-pointer"
                        title="Edit column"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {db.statuses.length > 2 && (
                        <button
                          onClick={() => deleteStatus(st.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          title="Delete column"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edit Status Modal */}
            {editingStatus && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">Edit Workflow Column</h3>
                    <button
                      onClick={() => setEditingStatus(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditStatus} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Column Name *</label>
                      <input
                        type="text"
                        required
                        value={editStatusName}
                        onChange={e => setEditStatusName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Type</label>
                        <select
                          value={editStatusType}
                          onChange={e => setEditStatusType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none cursor-pointer"
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
                          value={editStatusColor}
                          onChange={e => setEditStatusColor(e.target.value)}
                          className="w-full h-9 bg-slate-800 border border-slate-700 rounded-xl p-0.5 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">WIP Limit (optional)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="No limit"
                        value={editStatusWip || ''}
                        onChange={e => setEditStatusWip(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingStatus(null)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium cursor-pointer shadow-md shadow-blue-600/20"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
 
      {/* TAB: STANDARD CHECKLIST (GLOBAL FOR ALL APPS) */}
      {activeTab === 'checklist' && (
        <ChecklistTemplateManager onNavigate={onNavigate} />
      )}

      {/* TAB 3: DATA BACKUP, IMPORT & EXPORT */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Full Workspace Backup, Export & Import Manager */}
          <DataBackupManager />

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
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
              <li>Checklists, certificates, and compliance trackers</li>
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
                <div className="relative">
                  <input
                    type={showReauthPassword ? 'text' : 'password'}
                    placeholder="Enter password or type DELETE"
                    value={reauthInput}
                    onChange={e => setReauthInput(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowReauthPassword(!showReauthPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    title={showReauthPassword ? 'Hide password' : 'Show password'}
                  >
                    {showReauthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
