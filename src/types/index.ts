/**
 * iOS Dev Hub - Core Data Types & Models
 * Strictly English interface as mandated by PRD.
 */

export type AuthProvider = 'email' | 'google' | 'apple';

export type DateFormatOption =
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD'
  | 'MM/DD/YYYY'
  | 'DD-MM-YYYY'
  | 'DD.MM.YYYY'
  | 'D MMM YYYY'
  | 'MMMM D, YYYY';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  providers: AuthProvider[];
  createdAt: string;
  settings: {
    theme: 'dark' | 'light' | 'system';
    emailNotifications: boolean;
    compactView: boolean;
    dateFormat?: DateFormatOption;
    bundlePrefix?: string;
  };
}

export type IdeaStatus = 'New' | 'Exploring' | 'Validated' | 'Parked' | 'Rejected' | 'Converted';

export type IdeaCategory =
  | 'Productivity'
  | 'Utilities'
  | 'Health & Fitness'
  | 'Finance'
  | 'Developer Tools'
  | 'Social'
  | 'Games'
  | 'Lifestyle'
  | 'Education';

export interface IdeaScores {
  impact: number; // 1 - 10
  effort: number; // 1 - 10
  market: number; // 1 - 10
  fun: number;    // 1 - 10
}

export interface IdeaComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface IdeaTimelineEvent {
  id: string;
  event: string;
  date: string;
}

export interface Idea {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  category: IdeaCategory;
  scores: IdeaScores;
  status: IdeaStatus;
  attachments?: string[];
  projectId?: string;
  comments: IdeaComment[];
  timeline: IdeaTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type ProjectPlatform = 'iPhone' | 'iPad' | 'Apple Watch' | 'Mac Catalyst' | 'visionOS';

export type ProjectStatus =
  | 'Planning'
  | 'In development'
  | 'Beta'
  | 'In review'
  | 'Released'
  | 'On hold';

export type DevelopmentSubstatus =
  | 'Design'
  | 'Functions'
  | 'Testing Webapp'
  | 'iOS Design'
  | 'iOS Testing'
  | 'Apple Connect'
  | 'Apple Review';

export interface DevSubstatusInfo {
  id: DevelopmentSubstatus;
  step: number;
  label: string;
  name: string;
  shortLabel: string;
  description: string;
}

export const DEVELOPMENT_SUBSTATUSES: DevSubstatusInfo[] = [
  {
    id: 'Design',
    step: 1,
    label: '1) Design',
    name: 'Design',
    shortLabel: 'Design',
    description: 'Wireframes, UI/UX concept and mockup validation',
  },
  {
    id: 'Functions',
    step: 2,
    label: '2) Functions',
    name: 'Functions',
    shortLabel: 'Functions',
    description: 'Core logic, data models and feature implementation',
  },
  {
    id: 'Testing Webapp',
    step: 3,
    label: '3) Testing Webapp',
    name: 'Testing Webapp',
    shortLabel: 'Web Test',
    description: 'Web app testing, API integration and backend verification',
  },
  {
    id: 'iOS Design',
    step: 4,
    label: '4) iOS Design',
    name: 'iOS Design',
    shortLabel: 'iOS Design',
    description: 'Native SwiftUI components & iOS design guidelines',
  },
  {
    id: 'iOS Testing',
    step: 5,
    label: '5) iOS Testing',
    name: 'iOS Testing',
    shortLabel: 'iOS Testing',
    description: 'Simulator and on-device TestFlight beta test suite',
  },
  {
    id: 'Apple Connect',
    step: 6,
    label: '6) Apple Connect',
    name: 'Apple Connect',
    shortLabel: 'Apple Connect',
    description: 'App Store Connect metadata, certificates, screenshots & pricing',
  },
  {
    id: 'Apple Review',
    step: 7,
    label: '7) Apple Review',
    name: 'Apple Review',
    shortLabel: 'Apple Review',
    description: 'Submitted for App Store Review / In Review by Apple team',
  },
];

/**
 * Calculates project progress percentage based on the 7 development subphases.
 * Each subphase counts for 1/7 (14.2857%), rounded up to the nearest whole number (Math.ceil).
 * Step 1: 15% | Step 2: 29% | Step 3: 43% | Step 4: 58% | Step 5: 72% | Step 6: 86% | Step 7: 100%
 */
export function calculateSubphaseProgress(substatus?: DevelopmentSubstatus): number {
  if (!substatus) return Math.ceil((1 / 7) * 100);
  const info = DEVELOPMENT_SUBSTATUSES.find(s => s.id === substatus);
  const step = info ? info.step : 1;
  return Math.min(100, Math.ceil((step / 7) * 100));
}

export interface ProjectTechStack {
  uiFramework: 'SwiftUI' | 'UIKit' | 'Hybrid';
  swiftVersion: string;
  xcodeVersion: string;
  minIOS: string;
  architecture?: string;
}

export interface ProjectDates {
  startDate: string;
  targetDate?: string;
}

export interface ProjectLink {
  id: string;
  title: string;
  url: string;
  category: 'Design' | 'Repository' | 'Store' | 'Backend' | 'Docs' | 'Other';
}

export interface ProjectAssetSpec {
  id: string;
  title: string;
  requiredSize: string;
  completed: boolean;
  note?: string;
}

export interface LocalizedListing {
  locale: string;
  title: string;
  subtitle: string;
  keywords: string;
  description: string;
}

export type ProjectColor =
  | 'indigo'
  | 'emerald'
  | 'cyan'
  | 'purple'
  | 'amber'
  | 'rose'
  | 'teal'
  | 'blue';

export interface Project {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: ProjectColor;
  description: string;
  bundleId: string;
  platforms: ProjectPlatform[];
  minIOS: string;
  stack: ProjectTechStack;
  status: ProjectStatus;
  devSubstatus?: DevelopmentSubstatus;
  dates: ProjectDates;
  ideaId?: string;
  links: ProjectLink[];
  notesMarkdown?: string;
  assetSpecs: ProjectAssetSpec[];
  localizedListings: LocalizedListing[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;

  // App Resources & External Links
  oneDriveUrl?: string;
  externalDiskPath?: string;
  databaseName?: string;
  databaseUrl?: string;
  vercelUrl?: string;
  appStoreConnectUrl?: string;
  appStoreUrl?: string;
  customLinks?: ProjectCustomInfo[];
  appStoreAnswers?: Record<string, string>;
  githubUrl?: string;
}

export interface ProjectCustomInfo {
  id: string;
  title: string;
  url: string;
  notes?: string;
}

export type StatusType = 'Backlog' | 'Active' | 'Done' | 'Cancelled';

export interface WorkflowStatus {
  id: string;
  scope: 'global' | 'project';
  projectId?: string;
  name: string;
  color: string;
  order: number;
  type: StatusType;
  wipLimit?: number;
}

export type TaskType = 'Feature' | 'Bug' | 'Chore' | 'Design' | 'Research';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  statusId: string;
  labels: string[];
  dueDate?: string;
  subtasks: Subtask[];
  releaseId?: string;
  order: number;
  loggedMinutes?: number;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type ReleaseStatus =
  | 'Planned'
  | 'In development'
  | 'In TestFlight'
  | 'Submitted'
  | 'In review'
  | 'Released'
  | 'Rejected'
  | 'Withdrawn';

export type ChangelogType =
  | 'Added'
  | 'Changed'
  | 'Fixed'
  | 'Removed'
  | 'Security'
  | 'Performance';

export interface ChangelogEntry {
  id: string;
  releaseId: string;
  type: ChangelogType;
  text: string;
  taskId?: string;
}

export interface RejectionItem {
  id: string;
  date: string;
  guideline: string;
  reason: string;
  resolution?: string;
}

export interface ReleaseNotes {
  knownIssues?: string;
  testNotes?: string;
  appleReviewNotes?: string;
  testFlightUrl?: string;
  rejectionLog: RejectionItem[];
}

export interface Release {
  id: string;
  projectId: string;
  version: string; // e.g. 1.2.0
  build: number;   // e.g. 42
  name?: string;   // e.g. "Spring Refresh"
  status: ReleaseStatus;
  plannedDate?: string;
  releasedDate?: string;
  notes: ReleaseNotes;
  locales: Record<string, string>; // locale -> "What's New" text
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type ArchivedAppStatus = 'Live' | 'Removed from sale' | 'Superseded';
export type PricingModel = 'Free' | 'Freemium' | 'Subscription' | 'Paid';

export interface AppMetricPoint {
  month: string;
  downloads: number;
  revenue: number;
  rating: number;
}

export interface ArchivedApp {
  id: string;
  userId: string;
  projectId?: string;
  name: string;
  icon?: string;
  storeUrl: string;
  appleId: string; // Numeric App Store ID (e.g. 6478912345)
  bundleId: string;
  sku: string;
  category: string;
  priceModel: PricingModel;
  publishedDate: string;
  lastUpdated: string;
  supportedLocales: string[];
  ageRating: string;
  status: ArchivedAppStatus;
  links: { title: string; url: string }[];
  metrics: AppMetricPoint[];
  retrospectiveNotes: string;
  isDemo?: boolean;
}

export interface ChecklistItem {
  id: string;
  projectId?: string;
  category: string;
  title: string;
  description: string;
  done: boolean;
  required: boolean;
}

export interface PrivacyPermission {
  key: string; // Info.plist key
  name: string;
  description: string;
  enabled: boolean;
  usageDescription: string;
}

export interface CertificateReminder {
  id: string;
  title: string;
  type: 'Distribution Certificate' | 'Push Notification Key' | 'Developer Program' | 'Provisioning Profile';
  expiryDate: string;
  daysRemaining: number;
  notes: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deadline' | 'release' | 'certificate' | 'system';
  targetType?: 'project' | 'release' | 'task' | 'certificate';
  targetId?: string;
  read: boolean;
  createdAt: string;
}

export interface AppStoreQuestionItem {
  id: string;
  question: string;
  description?: string;
  category: string;
  maxLength: number;
  order: number;
  multiline?: boolean;
  placeholder?: string;
}
