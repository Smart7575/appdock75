import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  X,
  FileText,
  Sliders,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AppStoreQuestionItem } from '../../types';

const PRESET_LENGTHS = [
  { label: '30 (Title/Subtitle)', value: 30 },
  { label: '100 (Keywords)', value: 100 },
  { label: '170 (Promo Text)', value: 170 },
  { label: '255 (URL)', value: 255 },
  { label: '4000 (Description/Notes)', value: 4000 },
];

export const AppStoreTemplateManager: React.FC = () => {
  const {
    db,
    appStoreQuestions,
    addAppStoreQuestion,
    updateAppStoreQuestion,
    bulkUpdateAppStoreQuestions,
    deleteAppStoreQuestion,
    reorderAppStoreQuestion,
    resetAppStoreQuestions,
  } = useData();

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AppStoreQuestionItem | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Algemene Informatie');
  const [formMaxLength, setFormMaxLength] = useState<number>(100);
  const [formMultiline, setFormMultiline] = useState(false);
  const [formPlaceholder, setFormPlaceholder] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Delete Confirmation state
  const [deletingQuestion, setDeletingQuestion] = useState<AppStoreQuestionItem | null>(null);

  // Reset Confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Notification state
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Extract all categories in template
  const categories = useMemo(() => {
    const set = new Set<string>();
    appStoreQuestions.forEach(q => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set).sort();
  }, [appStoreQuestions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return appStoreQuestions
      .filter(q => {
        if (selectedCategory !== 'All' && q.category !== selectedCategory) {
          return false;
        }
        if (!searchQuery.trim()) return true;
        const qText = searchQuery.toLowerCase();
        const matchesQ = q.question.toLowerCase().includes(qText);
        const matchesDesc = (q.description || '').toLowerCase().includes(qText);
        const matchesCat = (q.category || '').toLowerCase().includes(qText);
        return matchesQ || matchesDesc || matchesCat;
      })
      .sort((a, b) => a.order - b.order);
  }, [appStoreQuestions, selectedCategory, searchQuery]);

  // Open Modal for Create
  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormQuestion('');
    setFormDescription('');
    setFormCategory(categories[0] || 'Algemene Informatie');
    setFormMaxLength(100);
    setFormMultiline(false);
    setFormPlaceholder('');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (q: AppStoreQuestionItem) => {
    setEditingQuestion(q);
    setFormQuestion(q.question);
    setFormDescription(q.description || '');
    setFormCategory(q.category || 'Algemene Informatie');
    setFormMaxLength(q.maxLength || 100);
    setFormMultiline(!!q.multiline || q.maxLength > 100);
    setFormPlaceholder(q.placeholder || '');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim()) return;

    const finalCategory = isCustomCategory && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : formCategory;

    const finalMaxLength = Math.max(1, Number(formMaxLength) || 100);

    if (editingQuestion) {
      const oldCategory = editingQuestion.category;
      updateAppStoreQuestion(editingQuestion.id, {
        question: formQuestion.trim(),
        description: formDescription.trim() || undefined,
        category: finalCategory,
        maxLength: finalMaxLength,
        multiline: formMultiline,
        placeholder: formPlaceholder.trim() || undefined,
      });

      if (oldCategory && finalCategory !== oldCategory && isCustomCategory) {
        const updates = appStoreQuestions
          .filter(q => q.category === oldCategory && q.id !== editingQuestion.id)
          .map(q => ({ id: q.id, changes: { category: finalCategory } }));
        
        if (updates.length > 0) {
          bulkUpdateAppStoreQuestions(updates);
        }
      }

      showNotification('Question and category successfully updated and synchronized to all projects!');
    } else {
      addAppStoreQuestion({
        question: formQuestion.trim(),
        description: formDescription.trim() || undefined,
        category: finalCategory,
        maxLength: finalMaxLength,
        multiline: formMultiline,
        placeholder: formPlaceholder.trim() || undefined,
      });
      showNotification('New question added and synchronized to all projects!');
    }

    setIsModalOpen(false);
  };

  // Delete Question
  const handleConfirmDelete = () => {
    if (!deletingQuestion) return;
    deleteAppStoreQuestion(deletingQuestion.id);
    showNotification(`Question "${deletingQuestion.question}" removed from template.`);
    setDeletingQuestion(null);
  };

  // Reset to Defaults
  const handleConfirmReset = () => {
    resetAppStoreQuestions();
    setShowResetConfirm(false);
    showNotification('Default Apple App Store questions restored.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-xl transition-all ${
          notificationMsg.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
            : 'bg-blue-950/80 border-blue-500/30 text-blue-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                Default Template
              </span>
              <span className="text-xs text-slate-400">
                {appStoreQuestions.length} standard questions
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              App Store Info Questions Template
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
              Any question you add, edit, or delete here automatically synchronizes to all existing
              and future projects. Answers are saved per app in the 'App Store Info' tab.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restore Defaults</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative min-w-56 flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All categories ({appStoreQuestions.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat} ({appStoreQuestions.filter(q => q.category === cat).length})
              </option>
            ))}
          </select>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 text-right">
          {filteredQuestions.length} questions shown
        </div>
      </div>

      {/* Question Cards */}
      <div className="space-y-3">
        {filteredQuestions.map((q, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === filteredQuestions.length - 1;

          return (
            <div
              key={q.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700 font-semibold">
                  {q.order}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      {q.question}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      {q.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Max. {q.maxLength} chars
                    </span>
                    {q.multiline && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-500">
                        Multiline
                      </span>
                    )}
                  </div>
                  {q.description && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {q.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                <button
                  onClick={() => reorderAppStoreQuestion(q.id, 'up')}
                  disabled={isFirst}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isFirst
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => reorderAppStoreQuestion(q.id, 'down')}
                  disabled={isLast}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLast
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenEdit(q)}
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setDeletingQuestion(q)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingQuestion ? 'Edit App Store Question' : 'Add New App Store Question'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Template Synchronization:</strong> This question is immediately visible in the 'App Store Info' tab of every project.
                </span>
              </div>

              {/* Question Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Question or Field Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Promotional Text"
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Category
                  </label>
                  {editingQuestion && !isCustomCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(true);
                        setCustomCategoryInput(formCategory);
                      }}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit category name</span>
                    </button>
                  )}
                </div>
                {!isCustomCategory ? (
                  <select
                    value={formCategory}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                        setCustomCategoryInput('');
                      } else {
                        setFormCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Add new category...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Category name..."
                      value={customCategoryInput}
                      onChange={e => setCustomCategoryInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Max Characters */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Maximum Character Count *
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Limit: {formMaxLength} chars
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={formMaxLength}
                  onChange={e => setFormMaxLength(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />

                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-500">Default limits:</span>
                  {PRESET_LENGTHS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        setFormMaxLength(p.value);
                        if (p.value > 100) setFormMultiline(true);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        formMaxLength === p.value
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description & Guideline (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short guideline for filling in this App Store information..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Placeholder */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Placeholder (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://example.com"
                  value={formPlaceholder}
                  onChange={e => setFormPlaceholder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Multiline Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="templateMultiline"
                  checked={formMultiline}
                  onChange={e => setFormMultiline(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="templateMultiline" className="text-xs text-slate-300 cursor-pointer select-none">
                  Use multiline text area
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-600/20"
                >
                  {editingQuestion ? 'Save Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Question</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete the question <strong>"{deletingQuestion.question}"</strong>?
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              This question will be removed from the template for <strong>all projects</strong>.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingQuestion(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Restore Default Questions</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to restore the default Apple App Store Connect questionnaire?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-600/20"
              >
                Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
