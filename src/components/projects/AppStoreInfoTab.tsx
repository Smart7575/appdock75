import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Search,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  FileText,
  Layers,
  CheckCircle2,
  Share2,
  ExternalLink,
  Info,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Project, AppStoreQuestionItem } from '../../types';

interface AppStoreInfoTabProps {
  project: Project;
}

const PRESET_LENGTHS = [
  { label: '30 (Title/Subtitle)', value: 30 },
  { label: '100 (Keywords)', value: 100 },
  { label: '170 (Promo Text)', value: 170 },
  { label: '255 (URL)', value: 255 },
  { label: '4000 (Description/Notes)', value: 4000 },
];

export const AppStoreInfoTab: React.FC<AppStoreInfoTabProps> = ({ project }) => {
  const {
    db,
    appStoreQuestions,
    addAppStoreQuestion,
    updateAppStoreQuestion,
    bulkUpdateAppStoreQuestions,
    deleteAppStoreQuestion,
    reorderAppStoreQuestion,
    resetAppStoreQuestions,
    updateProjectAppStoreAnswer,
  } = useData();

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AppStoreQuestionItem | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('General Information');
  const [formMaxLength, setFormMaxLength] = useState<number>(100);
  const [formMultiline, setFormMultiline] = useState(false);
  const [formPlaceholder, setFormPlaceholder] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Delete Confirmation state
  const [deletingQuestion, setDeletingQuestion] = useState<AppStoreQuestionItem | null>(null);

  // Reset Confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Copy Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
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
        const answer = (project.appStoreAnswers?.[q.id] || '').toLowerCase();
        const matchesAns = answer.includes(qText);
        return matchesQ || matchesDesc || matchesCat || matchesAns;
      })
      .sort((a, b) => a.order - b.order);
  }, [appStoreQuestions, selectedCategory, searchQuery, project.appStoreAnswers]);

  // Statistics
  const stats = useMemo(() => {
    const total = appStoreQuestions.length;
    let answered = 0;
    let totalChars = 0;
    let overLimitCount = 0;

    appStoreQuestions.forEach(q => {
      const ans = project.appStoreAnswers?.[q.id] || '';
      if (ans.trim().length > 0) {
        answered++;
        totalChars += ans.length;
        if (ans.length > q.maxLength) {
          overLimitCount++;
        }
      }
    });

    const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { total, answered, totalChars, percent, overLimitCount };
  }, [appStoreQuestions, project.appStoreAnswers]);

  // Open Modal for Create
  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormQuestion('');
    setFormDescription('');
    setFormCategory(categories[0] || 'General Information');
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
    setFormCategory(q.category || 'General Information');
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

      showNotification('Question and category successfully updated and synchronized across all projects!');
    } else {
      addAppStoreQuestion({
        question: formQuestion.trim(),
        description: formDescription.trim() || undefined,
        category: finalCategory,
        maxLength: finalMaxLength,
        multiline: formMultiline,
        placeholder: formPlaceholder.trim() || undefined,
      });
      showNotification('New question added and synchronized across all projects!');
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
    showNotification('Default App Store questions restored.');
  };

  // Copy Single Answer
  const handleCopyAnswer = (q: AppStoreQuestionItem) => {
    const text = project.appStoreAnswers?.[q.id] || '';
    if (!text) {
      showNotification('No answer filled in to copy.', 'info');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
    showNotification(`Answer for "${q.question}" copied!`);
  };

  // Copy All Q&A
  const handleCopyAll = () => {
    if (appStoreQuestions.length === 0) return;

    let markdown = `# App Store Information: ${project.name}\n`;
    markdown += `Bundle ID: ${project.bundleId || '-'}\n`;
    markdown += `Date: ${new Date().toLocaleDateString()}\n\n`;

    appStoreQuestions.forEach((q, idx) => {
      const answer = project.appStoreAnswers?.[q.id] || '(Not yet filled in)';
      markdown += `### ${idx + 1}. ${q.question} (${q.category})\n`;
      if (q.description) {
        markdown += `> ${q.description}\n`;
      }
      markdown += `**Characters**: ${(project.appStoreAnswers?.[q.id] || '').length} / ${q.maxLength}\n\n`;
      markdown += `${answer}\n\n---\n\n`;
    });

    navigator.clipboard.writeText(markdown);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
    showNotification('All questions and answers copied to clipboard as Markdown!');
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

      {/* Top Banner / Context Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                App Store Connect Q&A
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Synchronized across all {db.projects.length} projects</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>App Store Information & Copywriting</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Manage all official App Store copy, keywords, and answers. Questions are automatically
              synchronized across all existing and new projects. Answers are unique per app with precise
              live character counting.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors cursor-pointer shadow-sm"
              title="Copy all questions and answers to clipboard"
            >
              {allCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy All</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Question</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Restore default Apple App Store question template"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
            <div className="text-slate-400 text-[11px] font-medium mb-1 flex items-center justify-between">
              <span>Completion Progress</span>
              <span className="font-bold text-white font-mono">{stats.answered} / {stats.total} ({stats.percent}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  stats.percent === 100
                    ? 'bg-emerald-500'
                    : stats.percent > 50
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[11px] font-medium">Total Character Count</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">{stats.totalChars.toLocaleString()}</div>
            </div>
            <FileText className="w-5 h-5 text-slate-600" />
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[11px] font-medium">Limit Status</div>
              <div className="mt-0.5">
                {stats.overLimitCount > 0 ? (
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {stats.overLimitCount} question {stats.overLimitCount === 1 ? 'exceeds' : 'exceed'} limit!
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All texts within limit
                  </span>
                )}
              </div>
            </div>
            <Sparkles className={`w-5 h-5 ${stats.overLimitCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative min-w-56 flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search in questions or answers..."
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
              Clear filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 text-right">
          {filteredQuestions.length} {filteredQuestions.length === 1 ? 'question' : 'questions'} shown
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No questions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No questions match "${searchQuery}".`
              : 'There are currently no questions configured in this template.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg cursor-pointer"
              >
                Clear search
              </button>
            ) : (
              <button
                onClick={handleOpenAdd}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs text-white rounded-lg cursor-pointer"
              >
                + Add first question
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const currentAnswer = project.appStoreAnswers?.[q.id] || '';
            const charCount = currentAnswer.length;
            const isOverLimit = charCount > q.maxLength;
            const isNearLimit = !isOverLimit && q.maxLength > 0 && charCount >= q.maxLength * 0.9;
            const isMultiline = q.multiline || q.maxLength > 100;
            const isFirst = idx === 0;
            const isLast = idx === filteredQuestions.length - 1;

            return (
              <div
                key={q.id}
                className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-sm ${
                  isOverLimit
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : 'border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700/60 font-semibold">
                      {q.order}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {q.question}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                          {q.category}
                        </span>
                      </div>
                      {q.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {q.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Top-Right Badges & Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {/* Live Character Limit Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border ${
                        isOverLimit
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : isNearLimit
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : charCount > 0
                          ? 'bg-slate-800 text-slate-200 border-slate-700'
                          : 'bg-slate-800/50 text-slate-500 border-slate-800'
                      }`}
                      title={
                        isOverLimit
                          ? `You exceed the maximum character limit by ${charCount - q.maxLength} chars!`
                          : `Maximum ${q.maxLength} characters allowed in App Store Connect`
                      }
                    >
                      <span>
                        {charCount} / {q.maxLength} chars
                      </span>
                      {isOverLimit && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                    </div>

                    {/* Copy answer */}
                    <button
                      onClick={() => handleCopyAnswer(q)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Copy this answer to clipboard"
                    >
                      {copiedId === q.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => reorderAppStoreQuestion(q.id, 'up')}
                      disabled={isFirst}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isFirst
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title="Move question up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => reorderAppStoreQuestion(q.id, 'down')}
                      disabled={isLast}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLast
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title="Move question down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Question */}
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit question and character limit (synchronizes to all projects)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Question */}
                    <button
                      onClick={() => setDeletingQuestion(q)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remove question from template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Answer Field with Live Character Counter */}
                <div className="space-y-1.5">
                  {isMultiline ? (
                    <textarea
                      rows={Math.min(8, Math.max(3, Math.ceil(q.maxLength / 100)))}
                      value={currentAnswer}
                      placeholder={q.placeholder || `Enter your answer (max ${q.maxLength} chars)...`}
                      onChange={e => updateProjectAppStoreAnswer(project.id, q.id, e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors resize-y leading-relaxed ${
                        isOverLimit
                          ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                          : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                      }`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={currentAnswer}
                      placeholder={q.placeholder || `Enter your answer (max ${q.maxLength} chars)...`}
                      onChange={e => updateProjectAppStoreAnswer(project.id, q.id, e.target.value)}
                      className={`w-full px-3.5 py-2 bg-slate-950/80 border rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors ${
                        isOverLimit
                          ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                          : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                      }`}
                    />
                  )}

                  {/* Bottom Counter Bar */}
                  <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                    <div className="flex items-center gap-2">
                      {isOverLimit ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{charCount - q.maxLength} chars over App Store Connect limit!</span>
                        </span>
                      ) : (
                        <span>
                          {q.maxLength - charCount} chars remaining
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {currentAnswer.length > 0 && (
                        <button
                          onClick={() => updateProjectAppStoreAnswer(project.id, q.id, '')}
                          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          Clear field
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  <strong>Note:</strong> Changes to questions and character limits are instantly synchronized across all
                  projects in AppDock75. Existing answers per app are preserved.
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
                  <div className="flex items-center gap-2">
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
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__custom__">+ Type new category...</option>
                    </select>
                  </div>
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

              {/* Max Characters Limit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Maximum Character Limit *
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

                {/* Preset suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-500">Apple standards:</span>
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

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Explanation & Helper Tip (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short guideline or description for filling out this App Store information..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Placeholder */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Example Placeholder (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://mydomain.com/privacy"
                  value={formPlaceholder}
                  onChange={e => setFormPlaceholder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Multiline Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formMultiline"
                  checked={formMultiline}
                  onChange={e => setFormMultiline(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="formMultiline" className="text-xs text-slate-300 cursor-pointer select-none">
                  Use a large input field (multiple lines / textarea)
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
              This question will be removed from the template for <strong>all projects</strong>. Previously entered answers
              will no longer be visible.
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
              Custom questions you added will be overwritten with the official standard set.
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
                Restore to Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
