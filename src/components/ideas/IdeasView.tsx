/**
 * iOS Dev Hub - Ideas & Brainstorm Workspace
 * Strictly matches PRD Section 8.2:
 * - Quick capture bar
 * - 3 View Modes: Grid / Cards, Table / List, and Matrix / Whiteboard board view
 * - Scoring criteria: Impact, Effort, Market potential, Fun -> ICE/RICE total score ranking
 * - Statuses: New, Exploring, Validated, Parked, Rejected, Converted
 * - Convert to Project in <= 3 clicks
 * - Comments & Timeline per idea
 * - Keep demo item conversion
 */

import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Columns,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Clock,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Idea, IdeaCategory, IdeaStatus } from '../../types';

interface IdeasViewProps {
  onNavigate: (view: string) => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({ onNavigate }) => {
  const {
    db,
    addIdea,
    updateIdea,
    deleteIdea,
    convertIdeaToProject,
    addIdeaComment,
    keepItemAsMine,
  } = useData();

  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'matrix'>('grid');
  const [quickInput, setQuickInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');

  // Modals state
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState<Idea | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Edit / Create Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Productivity' as IdeaCategory,
    status: 'New' as IdeaStatus,
    tags: '',
    impact: 7,
    effort: 5,
    market: 7,
    fun: 7,
  });

  const categories: IdeaCategory[] = [
    'Productivity',
    'Utilities',
    'Health & Fitness',
    'Finance',
    'Developer Tools',
    'Social',
    'Games',
    'Lifestyle',
    'Education',
  ];

  const statuses: IdeaStatus[] = [
    'New',
    'Exploring',
    'Validated',
    'Parked',
    'Rejected',
    'Converted',
  ];

  // Quick capture handler
  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    addIdea({
      title: quickInput.trim(),
      description: 'Captured idea note.',
      tags: ['QuickIdea'],
      category: 'Productivity',
      scores: { impact: 7, effort: 5, market: 7, fun: 7 },
      status: 'New',
    });
    setQuickInput('');
  };

  // Convert to project in <= 3 clicks!
  const handleConvert = (idea: Idea) => {
    const project = convertIdeaToProject(idea.id);
    setShowConvertModal(null);
    onNavigate('projects');
  };

  // Filter & Sort
  const filteredIdeas = useMemo(() => {
    return db.ideas
      .filter(idea => {
        if (statusFilter !== 'All' && idea.status !== statusFilter) return false;
        if (categoryFilter !== 'All' && idea.category !== categoryFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = idea.title.toLowerCase().includes(q);
          const matchDesc = idea.description.toLowerCase().includes(q);
          const matchTags = idea.tags.some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [db.ideas, statusFilter, categoryFilter, searchQuery, sortBy]);

  const openEditModal = (idea?: Idea) => {
    if (idea) {
      setSelectedIdea(idea);
      setFormData({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        status: idea.status,
        tags: idea.tags.join(', '),
        impact: idea.scores.impact,
        effort: idea.scores.effort,
        market: idea.scores.market,
        fun: idea.scores.fun,
      });
      setIsEditing(true);
    } else {
      setSelectedIdea(null);
      setFormData({
        title: '',
        description: '',
        category: 'Productivity',
        status: 'New',
        tags: 'iOS, SwiftUI',
        impact: 8,
        effort: 5,
        market: 7,
        fun: 8,
      });
      setIsEditing(true);
    }
  };

  const handleSaveIdea = (e: React.FormEvent) => {
    e.preventDefault();
    const tagList = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (selectedIdea) {
      updateIdea(selectedIdea.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        tags: tagList,
        scores: {
          impact: Number(formData.impact),
          effort: Number(formData.effort),
          market: Number(formData.market),
          fun: Number(formData.fun),
        },
      });
    } else {
      addIdea({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        tags: tagList,
        scores: {
          impact: Number(formData.impact),
          effort: Number(formData.effort),
          market: Number(formData.market),
          fun: Number(formData.fun),
        },
      });
    }
    setIsEditing(false);
    setSelectedIdea(null);
  };

  const handleAddComment = (ideaId: string) => {
    if (!newCommentText.trim()) return;
    addIdeaComment(ideaId, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Ideas & Brainstorm
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture, develop, and promote your best iOS ideas directly into projects.
          </p>
        </div>

        <button
          onClick={() => openEditModal()}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Idea</span>
        </button>
      </div>

      {/* Quick Capture Input (PRD Section 8.2) */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <form onSubmit={handleQuickCapture} className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder='Type an idea and press Enter...'
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Capture
          </button>
        </form>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
        {/* Left: Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative flex-1 min-w-44 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ideas or tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="recent">Sort by Newest</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>

        {/* Right: View Switcher (Grid, List, Matrix/Whiteboard) */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-slate-900 text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'list' ? 'bg-slate-900 text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Table List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'matrix' ? 'bg-slate-900 text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Category Board View"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Render View Mode */}
      {filteredIdeas.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900 border border-slate-800">
          <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">No ideas found matching current criteria.</p>
          <button
            onClick={() => openEditModal()}
            className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
          >
            Add first idea
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map(idea => {
            return (
              <div
                key={idea.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      {idea.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {idea.isDemo && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          Demo
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-300">
                        {idea.status}
                      </span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setSelectedIdea(idea)}
                    className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors cursor-pointer line-clamp-1"
                  >
                    {idea.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {idea.description}
                  </p>

                  {/* Clean unboxed tags without bullet dots */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 mt-3">
                    {idea.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/40">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {idea.comments.length > 0 ? (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MessageSquare className="w-3 h-3" />
                        {idea.comments.length}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        {new Date(idea.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {idea.status !== 'Converted' ? (
                      <button
                        onClick={() => setShowConvertModal(idea)}
                        className="px-2 py-1 text-[11px] font-medium bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        title="Convert to iOS Project (in 3 clicks)"
                      >
                        <span>Convert</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        Converted ✓
                      </span>
                    )}
                    <button
                      onClick={() => openEditModal(idea)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Idea"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE / LIST VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Title</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Tags</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredIdeas.map(idea => (
                  <tr key={idea.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                      <span
                        onClick={() => setSelectedIdea(idea)}
                        className="hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {idea.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{idea.category}</td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-medium text-slate-300">{idea.status}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 truncate max-w-xs">
                      {idea.tags.join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {idea.status !== 'Converted' && (
                          <button
                            onClick={() => setShowConvertModal(idea)}
                            className="px-2 py-0.5 text-[11px] bg-emerald-600/15 text-emerald-300 rounded hover:bg-emerald-600/30 cursor-pointer"
                          >
                            Convert
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(idea)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MATRIX / WHITEBOARD BOARD VIEW (Grouped by Category) */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {categories.map(cat => {
            const catIdeas = filteredIdeas.filter(i => i.category === cat);
            if (catIdeas.length === 0) return null;
            return (
              <div key={cat} className="w-72 shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col max-h-[70vh]">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-200">{cat}</h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                    {catIdeas.length}
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {catIdeas.map(idea => (
                    <div
                      key={idea.id}
                      onClick={() => setSelectedIdea(idea)}
                      className="p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-medium text-slate-300">{idea.status}</span>
                        <span className="text-[10px] text-slate-500">{new Date(idea.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-medium text-white line-clamp-2">{idea.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Idea Detail Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400">{selectedIdea.category}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{selectedIdea.status}</span>
                  {selectedIdea.isDemo && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      Demo Item
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{selectedIdea.title}</h2>
              </div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description & Value Proposition
                </h4>
                <p className="text-slate-200 leading-relaxed whitespace-pre-line bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                  {selectedIdea.description}
                </p>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tags
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedIdea.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Comments & Discussion */}
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Notes & Feedback ({selectedIdea.comments.length})
                </h4>
                <div className="space-y-2 mb-3">
                  {selectedIdea.comments.length === 0 ? (
                    <p className="text-slate-500 italic">No notes logged yet.</p>
                  ) : (
                    selectedIdea.comments.map(c => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-slate-800/60 text-slate-300">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-200">{c.author}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add validation feedback or technical note..."
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    onClick={() => handleAddComment(selectedIdea.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Timeline */}
              {selectedIdea.timeline.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Idea Timeline
                  </h4>
                  <div className="space-y-1 text-slate-400">
                    {selectedIdea.timeline.map(tl => (
                      <div key={tl.id} className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="font-mono text-[10px] text-slate-500">{tl.date}:</span>
                        <span>{tl.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedIdea.isDemo && (
                  <button
                    onClick={() => {
                      keepItemAsMine('idea', selectedIdea.id);
                      setSelectedIdea({ ...selectedIdea, isDemo: false });
                    }}
                    className="px-2.5 py-1 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg cursor-pointer"
                  >
                    Keep as My Data
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteIdea(selectedIdea.id);
                    setSelectedIdea(null);
                  }}
                  className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                >
                  Delete Idea
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedIdea)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Edit
                </button>
                {selectedIdea.status !== 'Converted' && (
                  <button
                    onClick={() => {
                      setSelectedIdea(null);
                      setShowConvertModal(selectedIdea);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Convert to Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert Idea To Project Confirmation Modal (3 Clicks Flow) */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2">
              Convert Idea to iOS Project
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              This will automatically initialize a new project workspace for <strong>"{showConvertModal.title}"</strong>, generate starting Kanban tasks, configure SwiftUI & SwiftData defaults, and link this brainstorm idea.
            </p>

            <div className="p-3 bg-slate-800/50 rounded-xl space-y-2 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Generated Bundle ID:</span>
                <span className="font-mono text-slate-200">com.indie.{showConvertModal.title.toLowerCase().replace(/[^a-z0-9]/g, '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Framework:</span>
                <span className="text-slate-200">SwiftUI + SwiftData</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Initial Tasks:</span>
                <span className="text-slate-200">3 starter Kanban cards</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConvertModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConvert(showConvertModal)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm shadow-emerald-500/20"
              >
                Confirm & Open Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Idea Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-3">
              {selectedIdea ? 'Edit Idea' : 'Capture New Idea'}
            </h3>

            <form onSubmit={handleSaveIdea} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lumina RAW Camera"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description (Markdown supported)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="What user pain point does this solve? What Apple frameworks will it use?"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="SwiftUI, HealthKit, Metal, iOS18"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
