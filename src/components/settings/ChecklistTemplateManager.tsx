import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Layers,
  ShieldCheck,
  Tag,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ArrowUpDown,
  ArrowLeft,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ChecklistItem } from '../../types';

interface ChecklistTemplateManagerProps {
  onClose?: () => void;
  isModal?: boolean;
  onNavigate?: (view: string) => void;
}

const STORAGE_CUSTOM_CATEGORIES_KEY = 'appdock_custom_checklist_categories';

const PRESET_CATEGORIES = [
  'App Store Submission',
  'Metadata & Media',
  'Privacy & Compliance',
  'Testing & Review',
  'Legal & URLs',
  'Monetization & In-App Purchases',
  'Localization & Translations',
  'Marketing & ASO',
  'Security & Encryption',
];

export const ChecklistTemplateManager: React.FC<ChecklistTemplateManagerProps> = ({
  onClose,
  isModal = false,
  onNavigate,
}) => {
  const {
    checklistTemplate,
    addChecklistTemplateItem,
    updateChecklistTemplateItem,
    deleteChecklistTemplateItem,
    reorderChecklistTemplate,
    resetChecklistTemplate,
    syncChecklistTemplateToAllProjects,
  } = useData();

  // Custom categories state (persisted across sessions)
  const [savedCustomCategories, setSavedCustomCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_CATEGORIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('App Store Submission');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [formRequired, setFormRequired] = useState(true);
  const [formPosition, setFormPosition] = useState<'end' | 'start'>('end');

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Delete Confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Available categories for selecting/creating items (presets + template + custom added)
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    PRESET_CATEGORIES.forEach(c => set.add(c));
    checklistTemplate.forEach(item => {
      if (item.category?.trim()) set.add(item.category.trim());
    });
    savedCustomCategories.forEach(c => {
      if (c?.trim()) set.add(c.trim());
    });
    if (formCategory && formCategory !== '__NEW__' && formCategory.trim()) {
      set.add(formCategory.trim());
    }
    return Array.from(set);
  }, [checklistTemplate, savedCustomCategories, formCategory]);

  // Extract unique categories currently in the template for filtering
  const categories = useMemo(() => {
    const cats = Array.from(new Set(checklistTemplate.map(c => c.category || 'App Store Submission')));
    return ['All', ...cats];
  }, [checklistTemplate]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return checklistTemplate.filter(item => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [checklistTemplate, selectedCategory, searchQuery]);

  const requiredCount = checklistTemplate.filter(c => c.required).length;

  const handleCreateAndSelectCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    if (!savedCustomCategories.includes(trimmed)) {
      const updated = [...savedCustomCategories, trimmed];
      setSavedCustomCategories(updated);
      try {
        localStorage.setItem(STORAGE_CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
      } catch {
        // fallback
      }
    }
    setFormCategory(trimmed);
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    showFeedback(`New category "${trimmed}" added to list and selected.`);
  };

  const openAddForm = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory(availableCategories[0] || 'App Store Submission');
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setFormRequired(true);
    setFormPosition('end');
    setIsFormOpen(true);
  };

  const openEditForm = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormCategory(item.category || 'App Store Submission');
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setFormRequired(item.required);
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let finalCategory = formCategory.trim() || 'App Store Submission';
    if (isAddingNewCategory && newCategoryInput.trim()) {
      finalCategory = newCategoryInput.trim();
      if (!savedCustomCategories.includes(finalCategory)) {
        const updated = [...savedCustomCategories, finalCategory];
        setSavedCustomCategories(updated);
        try {
          localStorage.setItem(STORAGE_CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
        } catch {
          // fallback
        }
      }
    }

    if (editingItem) {
      updateChecklistTemplateItem(editingItem.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: finalCategory,
        required: formRequired,
      });
      showFeedback(`Checklist item "${formTitle.trim()}" updated successfully.`);
    } else {
      addChecklistTemplateItem({
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: finalCategory,
        required: formRequired,
        position: formPosition,
      });
      showFeedback(`New checklist item added to all apps in category "${finalCategory}".`);
    }

    setIsFormOpen(false);
  };

  const handleDeleteItem = (id: string, title: string) => {
    deleteChecklistTemplateItem(id);
    setDeletingId(null);
    showFeedback(`Item "${title}" removed from standard checklist.`);
  };

  // Reordering handlers
  const handleMove = (itemId: string, direction: 'up' | 'down') => {
    const fullList = [...checklistTemplate];
    const currentFilteredIndex = filteredItems.findIndex(i => i.id === itemId);
    if (currentFilteredIndex === -1) return;

    if (direction === 'up' && currentFilteredIndex > 0) {
      const prevFilteredItem = filteredItems[currentFilteredIndex - 1];
      const fullIdx = fullList.findIndex(i => i.id === itemId);
      const targetIdx = fullList.findIndex(i => i.id === prevFilteredItem.id);
      if (fullIdx !== -1 && targetIdx !== -1) {
        const [item] = fullList.splice(fullIdx, 1);
        fullList.splice(targetIdx, 0, item);
        reorderChecklistTemplate(fullList);
        showFeedback(`Item "${item.title}" moved up.`);
      }
    } else if (direction === 'down' && currentFilteredIndex < filteredItems.length - 1) {
      const nextFilteredItem = filteredItems[currentFilteredIndex + 1];
      const fullIdx = fullList.findIndex(i => i.id === itemId);
      const targetIdx = fullList.findIndex(i => i.id === nextFilteredItem.id);
      if (fullIdx !== -1 && targetIdx !== -1) {
        const [item] = fullList.splice(fullIdx, 1);
        fullList.splice(targetIdx, 0, item);
        reorderChecklistTemplate(fullList);
        showFeedback(`Item "${item.title}" moved down.`);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== targetId) {
      setDragOverId(targetId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const fullList = [...checklistTemplate];
    const sourceIdx = fullList.findIndex(i => i.id === sourceId);
    const targetIdx = fullList.findIndex(i => i.id === targetId);
    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedItem] = fullList.splice(sourceIdx, 1);
      fullList.splice(targetIdx, 0, movedItem);
      reorderChecklistTemplate(fullList);
      showFeedback(`Order updated: "${movedItem.title}" repositioned.`);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset the standard checklist template to original Apple guidelines?')) {
      resetChecklistTemplate();
      showFeedback('Standard checklist template reset to Apple defaults.');
    }
  };

  const handleSyncAll = () => {
    syncChecklistTemplateToAllProjects();
    showFeedback('Standard checklist synchronized with all active app projects.');
  };

  return (
    <div className={`space-y-5 ${isModal ? 'p-1' : ''}`}>
      {/* Header card */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Standard App Checklist (Template)
                </h2>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Applies to all apps
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Manage the standard checklist template for all iOS apps: add items, modify requirements, delete items, or reorder with up/down arrows or drag & drop.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onNavigate && !isModal && (
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Return to Projects Workspace"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                <span>Back to Projects</span>
              </button>
            )}
            <button
              type="button"
              onClick={openAddForm}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Item</span>
            </button>
            <button
              type="button"
              onClick={handleSyncAll}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Ensure all existing projects include all current template items"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Sync with Apps</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset to default Apple App Store guidelines"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Quick metrics summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Total Items</span>
            <span className="text-lg font-bold font-mono text-white">{checklistTemplate.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Required for Release</span>
            <span className="text-lg font-bold font-mono text-rose-400">{requiredCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Optional / Recommended</span>
            <span className="text-lg font-bold font-mono text-slate-300">{checklistTemplate.length - requiredCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Categories</span>
            <span className="text-lg font-bold font-mono text-blue-400">{categories.length - 1}</span>
          </div>
        </div>
      </div>

      {/* Reorder instruction banner */}
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Reorder items:</strong> Use the buttons <strong className="text-white">⬆</strong> and <strong className="text-white">⬇</strong> or drag items with the handle (<GripVertical className="w-3.5 h-3.5 inline text-slate-400 -mt-0.5" />). This order is automatically used across all projects.
          </span>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search checklist items (title, description, or category)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist items list */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400">
            <p>No checklist items found for the current selection.</p>
            <button
              type="button"
              onClick={openAddForm}
              className="mt-3 text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add new item
            </button>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isDeletingThis = deletingId === item.id;
            const isDragging = draggedId === item.id;
            const isDragOver = dragOverId === item.id && draggedId !== item.id;

            return (
              <div
                key={item.id}
                onDragOver={e => handleDragOver(e, item.id)}
                onDrop={e => handleDrop(e, item.id)}
                className={`p-3.5 sm:p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 group shadow-sm ${
                  isDragging
                    ? 'opacity-40 border-dashed border-2 border-blue-500 bg-slate-800/40'
                    : isDragOver
                    ? 'border-2 border-blue-500 bg-blue-500/10 shadow-lg ring-1 ring-blue-500/50'
                    : 'bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80'
                }`}
              >
                {/* Left side: Reorder controls + Number + Content */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Reorder grip & up/down controls */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {/* Drag Handle */}
                    <div
                      draggable
                      onDragStart={e => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors"
                      title="Drag to change order"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Step number badge */}
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-xs border border-slate-700/60" title={`Item position: ${idx + 1}`}>
                      {idx + 1}
                    </div>

                    {/* Move Up / Move Down buttons */}
                    <div className="flex flex-col gap-0.5 ml-0.5">
                      <button
                        type="button"
                        onClick={() => handleMove(item.id, 'up')}
                        disabled={idx === 0}
                        className={`p-1 rounded transition-colors ${
                          idx === 0
                            ? 'text-slate-700 cursor-not-allowed'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'
                        }`}
                        title={idx === 0 ? 'Already at top' : 'Move up one position'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(item.id, 'down')}
                        disabled={idx === filteredItems.length - 1}
                        className={`p-1 rounded transition-colors ${
                          idx === filteredItems.length - 1
                            ? 'text-slate-700 cursor-not-allowed'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'
                        }`}
                        title={idx === filteredItems.length - 1 ? 'Already at bottom' : 'Move down one position'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Item Text & Badges */}
                  <div className="min-w-0 flex-1 pl-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-xs text-slate-100">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-blue-400" />
                        {item.category || 'App Store Submission'}
                      </span>
                      {item.required ? (
                        <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                          Required for release
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 w-full sm:w-auto justify-end">
                  {isDeletingThis ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-500/30 p-1.5 rounded-lg text-xs">
                      <span className="text-[11px] text-rose-300 font-medium px-1">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium text-[11px] cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-[11px] cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-slate-700/60"
                        title="Edit item (title, description, category, required)"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingItem ? 'Edit Standard Checklist Item' : 'New Standard Checklist Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Checklist Item Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. App Icon 1024×1024 px"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-300">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  {!isAddingNewCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(true);
                        setNewCategoryInput('');
                      }}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add new category</span>
                    </button>
                  )}
                </div>

                {!isAddingNewCategory ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={formCategory}
                      onChange={e => {
                        if (e.target.value === '__NEW__') {
                          setIsAddingNewCategory(true);
                          setNewCategoryInput('');
                        } else {
                          setFormCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__NEW__">+ Add new category to list...</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(true);
                        setNewCategoryInput('');
                      }}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                      title="Add a new category to selection list"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">New Category</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800/90 border border-blue-500/40 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-400" />
                        Add New Category to List
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategory(false)}
                        className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                        title="Cancel and return to list"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Localization & Translations, Monetization, ASO..."
                        value={newCategoryInput}
                        onChange={e => setNewCategoryInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateAndSelectCategory();
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCreateAndSelectCategory}
                        disabled={!newCategoryInput.trim()}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                          newCategoryInput.trim()
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Add & Select</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      This category is added to the selection options and automatically selected for this item.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Detailed Description / Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe concrete guidelines or requirements for this verification item..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Position selector when creating new item */}
              {!editingItem && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Position in Checklist
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPosition('end')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                        formPosition === 'end'
                          ? 'bg-blue-600/15 border-blue-500 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold block text-xs">Add at bottom</span>
                      <span className="text-[11px] text-slate-400">Appended as the last step</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPosition('start')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                        formPosition === 'start'
                          ? 'bg-blue-600/15 border-blue-500 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold block text-xs">Add at top</span>
                      <span className="text-[11px] text-slate-400">Placed as the very first step (#1)</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequired}
                    onChange={e => setFormRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Required item for release
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Shows a red 'Required' tag and flags that the app is not ready for App Store submission without this action.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  {editingItem ? 'Save Changes' : 'Add to Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
