import { Project, ProjectColor } from '../types';

export interface ProjectThemeClasses {
  color: ProjectColor;
  label: string;
  hex: string;
  titleField: string;
  titleText: string;
  dot: string;
  cardBorder: string;
  progressBar: string;
  badge: string;
}

export const PROJECT_COLOR_THEMES: Record<ProjectColor, ProjectThemeClasses> = {
  emerald: {
    color: 'emerald',
    label: 'Mint / Emerald',
    hex: '#10b981',
    titleField:
      'text-emerald-800 bg-emerald-100/90 border-emerald-300/80 shadow-sm dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30',
    titleText: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500 shadow-sm shadow-emerald-500/50',
    cardBorder: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
    progressBar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  },
  cyan: {
    color: 'cyan',
    label: 'Electric Cyan',
    hex: '#06b6d4',
    titleField:
      'text-cyan-900 bg-cyan-100/90 border-cyan-300/80 shadow-sm dark:text-cyan-300 dark:bg-cyan-500/15 dark:border-cyan-500/30',
    titleText: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500 shadow-sm shadow-cyan-500/50',
    cardBorder: 'border-l-4 border-l-cyan-500 dark:border-l-cyan-400',
    progressBar: 'bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
  },
  indigo: {
    color: 'indigo',
    label: 'Royal Indigo',
    hex: '#6366f1',
    titleField:
      'text-indigo-900 bg-indigo-100/90 border-indigo-300/80 shadow-sm dark:text-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500/30',
    titleText: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500 shadow-sm shadow-indigo-500/50',
    cardBorder: 'border-l-4 border-l-indigo-500 dark:border-l-indigo-400',
    progressBar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
  },
  purple: {
    color: 'purple',
    label: 'Deep Violet',
    hex: '#a855f7',
    titleField:
      'text-purple-900 bg-purple-100/90 border-purple-300/80 shadow-sm dark:text-purple-300 dark:bg-purple-500/15 dark:border-purple-500/30',
    titleText: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500 shadow-sm shadow-purple-500/50',
    cardBorder: 'border-l-4 border-l-purple-500 dark:border-l-purple-400',
    progressBar: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
  },
  amber: {
    color: 'amber',
    label: 'Warm Amber',
    hex: '#f59e0b',
    titleField:
      'text-amber-900 bg-amber-100/90 border-amber-300/80 shadow-sm dark:text-amber-300 dark:bg-amber-500/15 dark:border-amber-500/30',
    titleText: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500 shadow-sm shadow-amber-500/50',
    cardBorder: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
    progressBar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  },
  rose: {
    color: 'rose',
    label: 'Coral Rose',
    hex: '#f43f5e',
    titleField:
      'text-rose-900 bg-rose-100/90 border-rose-300/80 shadow-sm dark:text-rose-300 dark:bg-rose-500/15 dark:border-rose-500/30',
    titleText: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500 shadow-sm shadow-rose-500/50',
    cardBorder: 'border-l-4 border-l-rose-500 dark:border-l-rose-400',
    progressBar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  },
  teal: {
    color: 'teal',
    label: 'Nordic Teal',
    hex: '#14b8a6',
    titleField:
      'text-teal-900 bg-teal-100/90 border-teal-300/80 shadow-sm dark:text-teal-300 dark:bg-teal-500/15 dark:border-teal-500/30',
    titleText: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500 shadow-sm shadow-teal-500/50',
    cardBorder: 'border-l-4 border-l-teal-500 dark:border-l-teal-400',
    progressBar: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
  },
  blue: {
    color: 'blue',
    label: 'Cupertino Blue',
    hex: '#3b82f6',
    titleField:
      'text-blue-900 bg-blue-100/90 border-blue-300/80 shadow-sm dark:text-blue-300 dark:bg-blue-500/15 dark:border-blue-500/30',
    titleText: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500 shadow-sm shadow-blue-500/50',
    cardBorder: 'border-l-4 border-l-blue-500 dark:border-l-blue-400',
    progressBar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  },
};

const COLOR_SEQUENCE: ProjectColor[] = [
  'emerald',
  'cyan',
  'indigo',
  'purple',
  'amber',
  'rose',
  'teal',
  'blue',
];

/**
 * Returns the color theme for a project.
 * If project.color is set, uses that.
 * Otherwise, computes a deterministic distinct color from project.id or index.
 */
export function getProjectColorTheme(project: Project, index?: number): ProjectThemeClasses {
  if (project.color && PROJECT_COLOR_THEMES[project.color]) {
    return PROJECT_COLOR_THEMES[project.color];
  }

  if (typeof index === 'number') {
    const colorKey = COLOR_SEQUENCE[Math.abs(index) % COLOR_SEQUENCE.length];
    return PROJECT_COLOR_THEMES[colorKey];
  }

  // Hash based on project ID and name
  const str = `${project.id || ''}-${project.name || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const colorKey = COLOR_SEQUENCE[Math.abs(hash) % COLOR_SEQUENCE.length];
  return PROJECT_COLOR_THEMES[colorKey];
}
