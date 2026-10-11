import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  Sparkles,
  Camera,
  Folder,
} from 'lucide-react';

export interface AppIconPreset {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const APP_ICON_PRESETS: AppIconPreset[] = [
  {
    id: 'habitpulse',
    name: 'HabitPulse',
    category: 'Productivity',
    url: '/src/assets/images/app_icon_habitpulse_1791271816455.jpg',
  },
  {
    id: 'chronos',
    name: 'Chronos Timer',
    category: 'Utilities',
    url: '/src/assets/images/app_icon_chronos_1791271827616.jpg',
  },
  {
    id: 'lumina',
    name: 'Lumina Camera',
    category: 'Photography',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'audio',
    name: 'Waveform Synth',
    category: 'Music',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'ledger',
    name: 'Vault Finance',
    category: 'Finance',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'fitness',
    name: 'Pulse Health',
    category: 'Health',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'mindful',
    name: 'Zen Focus',
    category: 'Lifestyle',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'notes',
    name: 'Ink & Paper',
    category: 'Education',
    url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300&auto=format&fit=crop&q=80',
  },
];

interface ProjectImagePickerProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  projectName?: string;
  label?: string;
  description?: string;
}

export const ProjectImagePicker: React.FC<ProjectImagePickerProps> = ({
  value = '',
  onChange,
  projectName = 'App',
  label = 'App Icon & Visual Artwork',
  description = 'Set or upload a high-resolution app icon to display on project tiles and released overviews.',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('presets');
  const [customUrl, setCustomUrl] = useState(value && !value.startsWith('data:') ? value : '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to compress/resize uploaded image to avoid localStorage quota issues
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 384; // 384x384 is ideal for sharp retina display without large size
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            onChange(dataUrl);
            setIsProcessing(false);
          } else {
            onChange(event.target?.result as string);
            setIsProcessing(false);
          }
        } catch {
          onChange(event.target?.result as string);
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setErrorMsg('Failed to process image file.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onChange(customUrl.trim());
    setErrorMsg(null);
  };

  const handleClear = () => {
    onChange('');
    setCustomUrl('');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-3.5 p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-200">
            {label}
          </label>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {description}
          </p>
        </div>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <X className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Visual Live Preview Bar */}
      <div className="flex items-center gap-3 p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
        {value ? (
          <div className="relative group shrink-0">
            <img
              src={value}
              alt={projectName}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-md bg-slate-800"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full ring-2 ring-slate-900">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex flex-col items-center justify-center font-bold text-xs shrink-0">
            <span>{projectName.slice(0, 2).toUpperCase()}</span>
            <span className="text-[8px] text-slate-500 uppercase font-mono mt-0.5">No Icon</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">
            {projectName || 'App Icon'}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {value
              ? value.startsWith('data:')
                ? 'Uploaded local image'
                : value
              : 'Using fallback initials. Pick a preset or upload an image below.'}
          </p>
        </div>
      </div>

      {/* Tab Switcher: Presets | Upload File | Web URL */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'presets'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Curated Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3 h-3" />
          <span>Upload Image</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'url'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LinkIcon className="w-3 h-3" />
          <span>Image URL</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-2 text-[11px] text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Tab 1: Presets Grid */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
          {APP_ICON_PRESETS.map(preset => {
            const isSelected = value === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer group text-center ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-500/10'
                    : 'hover:bg-slate-700/40'
                }`}
                title={`${preset.name} (${preset.category})`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-slate-700 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] text-slate-300 truncate w-full">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 2: Upload File */}
      {activeTab === 'upload' && (
        <div className="pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 rounded-xl p-4 text-center cursor-pointer transition-all"
          >
            <Upload className="w-6 h-6 text-blue-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-200">
              {isProcessing ? 'Processing image...' : 'Click to browse and upload app icon'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PNG, JPG, or WebP. Automatically optimized for App Store display.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Direct URL */}
      {activeTab === 'url' && (
        <div className="flex gap-2 pt-1">
          <input
            type="url"
            placeholder="https://example.com/app-icon.png"
            value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            disabled={!customUrl.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};
