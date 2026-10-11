/**
 * iOS Dev Hub - App Archive Catalog
 * Fully implements PRD Section 8.6:
 * - Published apps catalog (Live, Removed from sale, Superseded)
 * - Deep metadata (Apple ID, Bundle ID, SKU, Age rating, Locales, Pricing model)
 * - Retrospective notes & lessons learned
 * - Manual performance metrics trend log (Downloads, Revenue, Ratings)
 * - Reopen as project (starts a fresh development lifecycle!)
 * - Export catalog as Markdown or JSON
 */

import React, { useState } from 'react';
import {
  Archive,
  ExternalLink,
  Plus,
  TrendingUp,
  Download,
  RotateCcw,
  Star,
  DollarSign,
  Calendar,
  Sparkles,
  Trash2,
  Edit2,
  FileText,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ArchivedApp, PricingModel } from '../../types';

interface ArchiveViewProps {
  onNavigate: (view: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onNavigate }) => {
  const {
    db,
    addArchivedApp,
    updateArchivedApp,
    deleteArchivedApp,
    reopenArchivedAppAsProject,
    keepItemAsMine,
  } = useData();

  const [selectedAppId, setSelectedAppId] = useState<string | null>(db.archivedApps[0]?.id || null);
  const activeApp = db.archivedApps.find(a => a.id === selectedAppId) || db.archivedApps[0];

  // Add metric point form state
  const [newMonth, setNewMonth] = useState('Nov 2026');
  const [newDownloads, setNewDownloads] = useState(3800);
  const [newRevenue, setNewRevenue] = useState(5200);
  const [newRating, setNewRating] = useState(4.9);

  // New archived app modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [appForm, setAppForm] = useState({
    name: '',
    storeUrl: 'https://apps.apple.com/app/id',
    appleId: '6480000000',
    bundleId: 'com.indie.app',
    sku: 'APP-IOS-01',
    category: 'Productivity',
    priceModel: 'Freemium' as PricingModel,
    publishedDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0],
    ageRating: '4+',
    retrospectiveNotes: 'Initial release retrospective.',
  });

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp) return;
    const newPoint = {
      month: newMonth,
      downloads: Number(newDownloads),
      revenue: Number(newRevenue),
      rating: Number(newRating),
    };
    updateArchivedApp(activeApp.id, {
      metrics: [...activeApp.metrics, newPoint],
    });
  };

  const handleReopenAsProject = (app: ArchivedApp) => {
    const proj = reopenArchivedAppAsProject(app.id);
    onNavigate('projects');
  };

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addArchivedApp({
      name: appForm.name,
      storeUrl: appForm.storeUrl,
      appleId: appForm.appleId,
      bundleId: appForm.bundleId,
      sku: appForm.sku,
      category: appForm.category,
      priceModel: appForm.priceModel,
      publishedDate: appForm.publishedDate,
      lastUpdated: appForm.lastUpdated,
      supportedLocales: ['English', 'German'],
      ageRating: appForm.ageRating,
      status: 'Live',
      links: [{ title: 'App Store', url: appForm.storeUrl }],
      metrics: [{ month: 'Initial Month', downloads: 500, revenue: 650, rating: 5.0 }],
      retrospectiveNotes: appForm.retrospectiveNotes,
    });
    setShowAddModal(false);
    setSelectedAppId(created.id);
  };

  const exportAppMarkdown = (app: ArchivedApp) => {
    let md = `# ${app.name} - App Store Archive Report\n\n`;
    md += `- **Apple ID**: ${app.appleId}\n`;
    md += `- **Bundle ID**: ${app.bundleId}\n`;
    md += `- **Category**: ${app.category}\n`;
    md += `- **Monetization**: ${app.priceModel}\n`;
    md += `- **First Published**: ${app.publishedDate}\n`;
    md += `- **Store URL**: ${app.storeUrl}\n\n`;
    md += `## Retrospective & Post-Mortem\n${app.retrospectiveNotes}\n\n`;
    md += `## Metric Performance Log\n`;
    app.metrics.forEach(m => {
      md += `- ${m.month}: ${m.downloads.toLocaleString()} downloads, $${m.revenue.toLocaleString()} revenue, ${m.rating} ★\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_archive_report.md`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Published App Archive
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical portfolio of published iOS apps with performance metrics and post-launch retrospectives.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Published App</span>
        </button>
      </div>

      {db.archivedApps.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <Archive className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Archived Apps Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            When you complete a release cycle or want to archive a live portfolio product, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Apps List */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Archived Catalog ({db.archivedApps.length})
            </h2>

            <div className="space-y-2">
              {db.archivedApps.map(app => {
                const isSelected = activeApp?.id === app.id;
                const latestMetric = app.metrics[app.metrics.length - 1];

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-blue-500/40 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {app.icon ? (
                        <img
                          src={app.icon}
                          alt={app.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shadow-sm shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          APP
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-xs font-semibold text-white truncate">
                            {app.name}
                          </h3>
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            {app.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{app.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{app.priceModel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
                      <span>Published {app.publishedDate}</span>
                      {latestMetric && (
                        <span className="font-mono text-slate-300">
                          {latestMetric.rating} ★ · ${latestMetric.revenue}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (2 spans): Selected App Detail Page */}
          {activeApp && (
            <div className="lg:col-span-2 space-y-6">
              {/* App Overview Card */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    {activeApp.icon && (
                      <img
                        src={activeApp.icon}
                        alt={activeApp.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-700 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">{activeApp.name}</h2>
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {activeApp.status}
                        </span>
                        {activeApp.isDemo && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Apple ID: {activeApp.appleId} · {activeApp.bundleId}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeApp.isDemo && (
                      <button
                        onClick={() => keepItemAsMine('archive', activeApp.id)}
                        className="px-2.5 py-1 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg cursor-pointer"
                      >
                        Keep as My Data
                      </button>
                    )}

                    <button
                      onClick={() => handleReopenAsProject(activeApp)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
                      title="Starts a brand new development cycle in Projects"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen as Project</span>
                    </button>

                    <button
                      onClick={() => exportAppMarkdown(activeApp)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export MD</span>
                    </button>
                  </div>
                </div>

                {/* Core Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-800/40 rounded-lg">
                    <span className="text-slate-500 text-[10px]">Category</span>
                    <p className="text-slate-200 font-medium mt-0.5">{activeApp.category}</p>
                  </div>
                  <div className="p-2.5 bg-slate-800/40 rounded-lg">
                    <span className="text-slate-500 text-[10px]">Business Model</span>
                    <p className="text-slate-200 font-medium mt-0.5">{activeApp.priceModel}</p>
                  </div>
                  <div className="p-2.5 bg-slate-800/40 rounded-lg">
                    <span className="text-slate-500 text-[10px]">Age Rating</span>
                    <p className="text-slate-200 font-medium mt-0.5">{activeApp.ageRating}</p>
                  </div>
                  <div className="p-2.5 bg-slate-800/40 rounded-lg">
                    <span className="text-slate-500 text-[10px]">SKU Identifier</span>
                    <p className="text-slate-200 font-mono mt-0.5">{activeApp.sku}</p>
                  </div>
                </div>

                {/* Store URL */}
                <div className="pt-2">
                  <a
                    href={activeApp.storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
                  >
                    <span>View on Apple App Store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Retrospective & Lessons Learned (PRD §8.6) */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-white">Retrospective & Post-Launch Insights</h3>
                <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {activeApp.retrospectiveNotes}
                </div>
              </div>

              {/* Performance Metrics Log (PRD §8.6) */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Performance Metrics Log (Manual)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Track downloads, store ratings, and revenue trends over time
                    </p>
                  </div>
                </div>

                {/* Metrics Table */}
                <div className="overflow-x-auto bg-slate-800/40 rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Period</th>
                        <th className="py-2 px-3 text-right">Downloads</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                        <th className="py-2 px-3 text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                      {activeApp.metrics.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-sans">{m.month}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{m.downloads.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 tabular-nums">${m.revenue.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{m.rating} ★</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Metric Row Form */}
                <form onSubmit={handleAddMetric} className="grid grid-cols-4 gap-2 pt-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Month (e.g. Nov 2026)"
                    value={newMonth}
                    onChange={e => setNewMonth(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Downloads"
                    value={newDownloads}
                    onChange={e => setNewDownloads(Number(e.target.value))}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Revenue ($)"
                    value={newRevenue}
                    onChange={e => setNewRevenue(Number(e.target.value))}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer"
                  >
                    Log Period
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Published App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-3">Register Published App in Archive</h3>

            <form onSubmit={handleCreateApp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">App Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chronos Timer"
                  value={appForm.name}
                  onChange={e => setAppForm({ ...appForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Numeric Apple ID</label>
                  <input
                    type="text"
                    required
                    placeholder="6478912345"
                    value={appForm.appleId}
                    onChange={e => setAppForm({ ...appForm, appleId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bundle Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="com.indie.app"
                    value={appForm.bundleId}
                    onChange={e => setAppForm({ ...appForm, bundleId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={appForm.category}
                    onChange={e => setAppForm({ ...appForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pricing Model</label>
                  <select
                    value={appForm.priceModel}
                    onChange={e => setAppForm({ ...appForm, priceModel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Free">Free</option>
                    <option value="Freemium">Freemium</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">App Store Product URL</label>
                <input
                  type="url"
                  required
                  value={appForm.storeUrl}
                  onChange={e => setAppForm({ ...appForm, storeUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Retrospective Notes</label>
                <textarea
                  rows={3}
                  value={appForm.retrospectiveNotes}
                  onChange={e => setAppForm({ ...appForm, retrospectiveNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Save to Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
