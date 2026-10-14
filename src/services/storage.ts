/**
 * iOS Dev Hub - Persistent Data Storage & Demo Data Engine
 */

import {
  User,
  Idea,
  Project,
  WorkflowStatus,
  Task,
  Release,
  ChangelogEntry,
  ArchivedApp,
  ChecklistItem,
  PrivacyPermission,
  CertificateReminder,
  NotificationItem,
  AppStoreQuestionItem,
} from '../types';

export interface UserDatabase {
  ideas: Idea[];
  projects: Project[];
  statuses: WorkflowStatus[];
  tasks: Task[];
  releases: Release[];
  changelogEntries: ChangelogEntry[];
  archivedApps: ArchivedApp[];
  checklists: ChecklistItem[];
  checklistTemplate?: ChecklistItem[];
  appStoreInfoTemplate?: AppStoreQuestionItem[];
  privacyPermissions: PrivacyPermission[];
  certificates: CertificateReminder[];
  notifications: NotificationItem[];
  demoPurged?: boolean;
}

const STORAGE_USERS_KEY = 'ios_dev_hub_registered_users';
const STORAGE_SESSION_KEY = 'ios_dev_hub_current_session';
const DATA_PREFIX = 'ios_dev_hub_data_';

// Default App Store submission checklist template (all initialized unchecked)
export const DEFAULT_CHECKLIST_TEMPLATE: ChecklistItem[] = [
  { id: 'chk-1', category: 'App Store Submission', title: 'App Icon 1024×1024 px', description: 'RGB color space, no transparency / alpha channel, square corners.', done: false, required: true },
  { id: 'chk-2', category: 'App Store Submission', title: 'Screenshots for Required Display Sizes', description: '6.9" (iPhone 16 Pro Max), 6.5" / 6.7", and 13" iPad Pro if universal.', done: false, required: true },
  { id: 'chk-3', category: 'App Store Submission', title: 'Keywords string (max 100 characters)', description: 'Comma-separated keywords without spaces after commas, no duplicate category names.', done: false, required: true },
  { id: 'chk-4', category: 'App Store Submission', title: 'Privacy Nutrition Labels configured', description: 'Declared in App Store Connect matching actual third-party SDKs and network calls.', done: false, required: true },
  { id: 'chk-5', category: 'App Store Submission', title: 'Demo / Sandbox Reviewer Account', description: 'Valid credentials provided in App Review Information for gated content.', done: false, required: true },
  { id: 'chk-6', category: 'App Store Submission', title: 'Export Compliance Encryption Documentation', description: 'ITSAppUsesNonExemptEncryption specified in Info.plist (usually NO for standard HTTPS).', done: false, required: true },
  { id: 'chk-7', category: 'App Store Submission', title: 'Support & Privacy Policy URLs', description: 'Publicly reachable HTTPS URLs containing contact information and GDPR/CCPA terms.', done: false, required: true },
  { id: 'chk-8', category: 'App Store Submission', title: 'Age Rating Questionnaire completed', description: 'Updated questionnaire in App Store Connect for content and alcohol/gambling/social features.', done: false, required: true },
  { id: 'chk-9', category: 'App Store Submission', title: 'Sign in with Apple tested', description: 'Mandatory guideline 4.8 if third-party logins (Google/Facebook) are offered.', done: false, required: true },
  { id: 'chk-10', category: 'App Store Submission', title: 'Account Deletion flow present', description: 'Apple guideline 5.1.1(v) requires in-app deletion button if account creation is supported.', done: false, required: true },
];

export const DEFAULT_APP_STORE_QUESTIONS: AppStoreQuestionItem[] = [
  {
    id: 'q-title',
    question: 'App Store Name (Title)',
    description: 'The official name of your app as it appears on the App Store (exact display name).',
    category: 'General Information',
    maxLength: 30,
    order: 1,
    placeholder: 'e.g. HabitPulse: Daily Routine Tracker',
  },
  {
    id: 'q-subtitle',
    question: 'Subtitle',
    description: 'Short summary appearing directly below the app name in search results and product page.',
    category: 'General Information',
    maxLength: 30,
    order: 2,
    placeholder: 'e.g. Build habits and daily routines',
  },
  {
    id: 'q-promotional-text',
    question: 'Promotional Text',
    description: 'Appears at the top of your description. Can be updated at any time without submitting a new binary build.',
    category: 'Descriptions & Texts',
    maxLength: 170,
    order: 3,
    multiline: true,
    placeholder: 'e.g. Now updated for iOS 18 with interactive widgets and Apple Watch support!',
  },
  {
    id: 'q-keywords',
    question: 'Keywords',
    description: 'Search terms separated by commas, no spaces after commas. Extra spaces waste character limit.',
    category: 'Discoverability & ASO',
    maxLength: 100,
    order: 4,
    placeholder: 'habit,tracker,goals,routine,streak,productivity,wellness',
  },
  {
    id: 'q-description',
    question: 'App Description',
    description: 'Full description of your app features, unique capabilities, subscription terms, and support details.',
    category: 'Descriptions & Texts',
    maxLength: 4000,
    order: 5,
    multiline: true,
    placeholder: 'Describe your app core features, benefits, and user workflow...',
  },
  {
    id: 'q-support-url',
    question: 'Support URL',
    description: 'Mandatory link to a webpage where users can find support, FAQs, or contact details.',
    category: 'Links & Legal',
    maxLength: 255,
    order: 6,
    placeholder: 'https://habitpulse.app/support',
  },
  {
    id: 'q-marketing-url',
    question: 'Marketing URL (Website)',
    description: 'Optional link to your official landing page or marketing website.',
    category: 'Links & Legal',
    maxLength: 255,
    order: 7,
    placeholder: 'https://habitpulse.app',
  },
  {
    id: 'q-privacy-url',
    question: 'Privacy Policy URL',
    description: 'Mandatory direct link to your app public privacy policy in compliance with Apple Guideline 5.1.1.',
    category: 'Links & Legal',
    maxLength: 255,
    order: 8,
    placeholder: 'https://habitpulse.app/privacy',
  },
  {
    id: 'q-review-notes',
    question: 'App Reviewer Notes & Demo Account',
    description: 'Login credentials (username/password) and specific testing instructions for the Apple App Review team.',
    category: 'App Review & Submission',
    maxLength: 4000,
    order: 9,
    multiline: true,
    placeholder: 'Demo login: reviewer@appdock75.local / Password: ReviewPass2026! / No special hardware required.',
  },
  {
    id: 'q-copyright',
    question: 'Copyright Notice',
    description: 'The year and name of the copyright owner or development studio (e.g. © 2026 Studio Name).',
    category: 'General Information',
    maxLength: 100,
    order: 10,
    placeholder: '© 2026 Indie Studio B.V.',
  },
];

export const DEFAULT_PRIVACY_PERMISSIONS: PrivacyPermission[] = [
  { key: 'NSCameraUsageDescription', name: 'Camera Access', description: 'Capturing photos, scanning QR codes, or document capture.', enabled: true, usageDescription: 'HabitPulse requires camera access to attach proof photos to your daily habit completions.' },
  { key: 'NSPhotoLibraryUsageDescription', name: 'Photo Library', description: 'Selecting existing images or custom icons from user gallery.', enabled: true, usageDescription: 'Used to select custom avatar and habit challenge inspiration photos.' },
  { key: 'NSLocationWhenInUseUsageDescription', name: 'Location (When In Use)', description: 'Geofencing or location-based reminder alerts.', enabled: false, usageDescription: 'Reminds you of contextual location-based habit cues when arriving home or at the gym.' },
  { key: 'NSUserTrackingUsageDescription', name: 'App Tracking Transparency (ATT)', description: 'Tracking users across third-party websites and apps for ad attribution.', enabled: false, usageDescription: 'Used for privacy-preserving attribution analytics.' },
  { key: 'NSHealthShareUsageDescription', name: 'Apple Health (Read)', description: 'Reading steps, active energy, mindful sessions, or workouts.', enabled: true, usageDescription: 'HabitPulse reads your Apple Health mindful minutes and workout counts to automatically complete active wellness habits.' },
];

export const DEFAULT_CERTIFICATES: CertificateReminder[] = [
  { id: 'cert-1', title: 'Apple Distribution Certificate', type: 'Distribution Certificate', expiryDate: '2027-02-15', daysRemaining: 132, notes: 'Used for signing TestFlight and App Store distribution builds in Xcode.' },
  { id: 'cert-2', title: 'Apple Push Notification Service (APNs) Key', type: 'Push Notification Key', expiryDate: '2027-08-30', daysRemaining: 328, notes: 'AuthKey p8 key registered on Apple Developer portal for APNs background notifications.' },
  { id: 'cert-3', title: 'Apple Developer Program Membership', type: 'Developer Program', expiryDate: '2027-04-10', daysRemaining: 186, notes: 'Annual $99 enrollment renewal via Apple Developer app.' },
];

export const DEFAULT_WORKFLOW_STATUSES: WorkflowStatus[] = [
  { id: 'status-backlog', scope: 'global', name: 'Backlog', color: '#64748b', order: 0, type: 'Backlog' },
  { id: 'status-todo', scope: 'global', name: 'To do', color: '#3b82f6', order: 1, type: 'Active' },
  { id: 'status-in-progress', scope: 'global', name: 'In progress', color: '#f59e0b', order: 2, type: 'Active', wipLimit: 4 },
  { id: 'status-in-review', scope: 'global', name: 'In review', color: '#8b5cf6', order: 3, type: 'Active' },
  { id: 'status-testing', scope: 'global', name: 'Testing', color: '#ec4899', order: 4, type: 'Active' },
  { id: 'status-done', scope: 'global', name: 'Done', color: '#10b981', order: 5, type: 'Done' },
];

/**
 * Builds standard demo data for a newly initialized user account.
 */
export function generateDemoData(userId: string): UserDatabase {
  const projectId = 'proj-demo-habitpulse';
  const releaseV1Id = 'rel-demo-v1-0-0';
  const releaseV11Id = 'rel-demo-v1-1-0';
  const releaseV12Id = 'rel-demo-v1-2-0';

  const demoProject: Project = {
    id: projectId,
    userId,
    name: 'HabitPulse - Minimal Habit Tracker',
    icon: '/src/assets/images/app_icon_habitpulse_1791271816455.jpg',
    description: 'An elegant, distraction-free habit tracker featuring interactive iOS 18 widgets, Live Activities, and seamless HealthKit streak synchronization.',
    bundleId: 'com.indiepulse.habitpulse',
    platforms: ['iPhone', 'Apple Watch', 'iPad', 'visionOS'],
    minIOS: 'iOS 17.4',
    stack: {
      uiFramework: 'SwiftUI',
      swiftVersion: '6.0',
      xcodeVersion: '16.1',
      minIOS: 'iOS 17.4',
      architecture: 'The Composable Architecture (TCA) + SwiftData',
    },
    status: 'In development',
    devSubstatus: 'iOS Testing',
    dates: {
      startDate: '2026-08-01',
      targetDate: '2026-11-15',
    },
    ideaId: 'idea-demo-8',
    links: [
      { id: 'lnk-1', title: 'Figma Design System', url: 'https://figma.com/file/habitpulse-ios', category: 'Design' },
      { id: 'lnk-2', title: 'GitHub Repository', url: 'https://github.com/indiepulse/habitpulse-ios', category: 'Repository' },
      { id: 'lnk-3', title: 'TestFlight Public Beta', url: 'https://testflight.apple.com/join/habitpulse-beta', category: 'Store' },
      { id: 'lnk-4', title: 'App Store Connect', url: 'https://appstoreconnect.apple.com/apps/6481023912', category: 'Store' },
      { id: 'lnk-5', title: 'Privacy Policy', url: 'https://habitpulse.app/privacy', category: 'Docs' },
    ],
    oneDriveUrl: 'https://onedrive.live.com/?id=projects/HabitPulse_Assets',
    externalDiskPath: '/Volumes/T7_Shield/iOS_Projects/HabitPulse',
    databaseName: 'habitpulse_prod_db',
    databaseUrl: 'https://console.cloud.google.com/sql/instances/habitpulse-postgres',
    vercelUrl: 'https://habitpulse.vercel.app',
    appStoreConnectUrl: 'https://appstoreconnect.apple.com/apps/6481023912',
    appStoreUrl: 'https://apps.apple.com/app/habitpulse-minimal-tracker/id6481023912',
    appStoreAnswers: {
      'q-title': 'HabitPulse: Daily Tracker',
      'q-subtitle': 'Build consistent routines',
      'q-promotional-text': 'Now fully upgraded for iOS 18 with interactive Control Center widgets and seamless Apple Watch complications!',
      'q-keywords': 'habits,routine,streak,tracker,planner,healthkit,widgets,pomodoro,focus,mindful',
      'q-description': 'HabitPulse helps you cultivate positive daily habits and routines with zero friction and zero telemetry.\n\n• Interactive Home Screen and Control Center widgets\n• Standalone Apple Watch companion app\n• End-to-end encrypted private iCloud synchronization\n• Apple Health mindful minutes and workout automation\n• Haptic milestone celebrations and dark mode styling',
      'q-support-url': 'https://habitpulse.app/support',
      'q-marketing-url': 'https://habitpulse.app',
      'q-privacy-url': 'https://habitpulse.app/privacy',
      'q-review-notes': 'Demo Reviewer credentials:\nUsername: reviewer@appdock75.local\nPassword: ReviewPassword2026!\nNo specific Bluetooth hardware or purchase required to test.',
      'q-copyright': '© 2026 Indie Studio B.V.',
    },
    customLinks: [
      { id: 'info-1', title: 'Figma Design System', url: 'https://figma.com/file/habitpulse-ios', notes: 'Design componenten, iconen en kleurenpalet v2' },
      { id: 'info-2', title: 'Postman API Collectie', url: 'https://postman.com/collections/habitpulse', notes: 'Sync endpoints voor cloud backup' },
    ],
    notesMarkdown: `# HabitPulse Architecture & Technical Decisions

### Core Tenets
1. **Zero Login Friction**: Local-first storage powered by SwiftData with optional iCloud CloudKit private database syncing.
2. **Swift 6 Strict Concurrency**: All models use \`@Model\` actor isolation and Swift 6 Sendable checks.
3. **App Intents & Widgets**: Every habit toggle is exposed via App Intent for Control Center buttons and StandBy mode.

*Notice: Never store API keys, provision profiles, or private cryptographic keys in notes or git.*`,
    assetSpecs: [
      { id: 'ass-1', title: 'iPhone 6.9" Screenshots (5 screens)', requiredSize: '1320 × 2868 px', completed: false, note: 'Exported from Xcode simulator with dark mode framed mockups.' },
      { id: 'ass-2', title: 'iPhone 6.5" Screenshots (5 screens)', requiredSize: '1284 × 2778 px', completed: false },
      { id: 'ass-3', title: 'iPad Pro 13" Screenshots', requiredSize: '2064 × 2752 px', completed: false, note: 'Need landscape split-view preview.' },
      { id: 'ass-4', title: 'App Store Icon Master', requiredSize: '1024 × 1024 px PNG', completed: false, note: 'RGB profile, no transparency, squircle handled by iOS.' },
    ],
    localizedListings: [
      {
        locale: 'en-US',
        title: 'HabitPulse: Daily Streak Tracker',
        subtitle: 'Build consistent routines & habits',
        keywords: 'habits,routine,streak,tracker,planner,healthkit,widgets,pomodoro,focus,mindful',
        description: 'HabitPulse helps you cultivate positive routines with zero friction. Enjoy interactive iOS widgets, Apple Watch complications, and seamless iCloud backup.',
      },
      {
        locale: 'nl-NL',
        title: 'HabitPulse: Gewoontes & Ritme',
        subtitle: 'Bouw krachtige routines zonder moeite',
        keywords: 'gewoontes,ritme,routine,streaks,focus,widgets,apple watch,gezondheid',
        description: 'HabitPulse is de meest rustgevende gewoontetracker voor iOS. Houd eenvoudig uw voortgang bij met widgets en HealthKit-koppeling.',
      },
    ],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-10-04T14:30:00Z',
    isDemo: true,
  };

  const demoReleasedProject: Project = {
    id: 'proj-demo-chronos',
    userId,
    name: 'Chronos - Mechanical Timer',
    icon: '/src/assets/images/app_icon_chronos_1791271827616.jpg',
    description: 'Precision mechanical stopwatch and interval timer with realistic titanium sound effects, Dynamic Island timers, and interactive widgets.',
    bundleId: 'com.indiechrono.chronostimer',
    platforms: ['iPhone', 'Apple Watch', 'iPad'],
    minIOS: 'iOS 17.0',
    stack: {
      uiFramework: 'SwiftUI',
      swiftVersion: '6.0',
      xcodeVersion: '16.1',
      minIOS: 'iOS 17.0',
      architecture: 'SwiftUI + AudioToolbox Engine',
    },
    status: 'Released',
    dates: {
      startDate: '2025-01-10',
      targetDate: '2025-04-18',
    },
    links: [
      { id: 'lnk-c1', title: 'App Store Product Page', url: 'https://apps.apple.com/app/chronos-timer/id6478912345', category: 'Store' },
      { id: 'lnk-c2', title: 'Marketing Website', url: 'https://chronostimer.app', category: 'Other' },
      { id: 'lnk-c3', title: 'Privacy Policy', url: 'https://chronostimer.app/privacy', category: 'Docs' },
    ],
    assetSpecs: [],
    localizedListings: [
      {
        locale: 'en-US',
        title: 'Chronos: Mechanical Timer',
        subtitle: 'Tactile stopwatch & interval timer',
        keywords: 'timer,stopwatch,mechanical,haptic,focus',
        description: 'Chronos brings analog mechanical tactility to modern iOS.',
      },
    ],
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-06-30T10:00:00Z',
    isDemo: true,
  };

  const demoIdeas: Idea[] = [
    {
      id: 'idea-demo-1',
      userId,
      title: 'Lumina RAW: Pro Manual Camera with Zebra Striping',
      description: 'Ultra-fast manual camera app for indie creators with live ISO/shutter dial, ProRes Log recording, and 48MP ProRAW capture without computational oversharpening.',
      tags: ['Camera', 'ProRAW', 'Photography', 'Metal'],
      category: 'Utilities',
      scores: { impact: 9, effort: 8, market: 8, fun: 9 }, // Score: 34
      status: 'Validated',
      comments: [
        { id: 'c-1', author: 'Alex', text: 'Spoke with 12 street photographers on Threads; strong appetite for disabling Apple smart HDR noise smoothing.', createdAt: '2026-09-12T11:00:00Z' },
      ],
      timeline: [
        { id: 'tl-1', event: 'Created idea draft', date: '2026-09-10' },
        { id: 'tl-2', event: 'Surveyed target photographers & validated market fit', date: '2026-09-18' },
      ],
      createdAt: '2026-09-10T09:00:00Z',
      updatedAt: '2026-09-18T16:00:00Z',
      isDemo: true,
    },
    {
      id: 'idea-demo-2',
      userId,
      title: 'FocusDeck: Pomodoro Timer with Live Activities & Dynamic Island',
      description: 'Tactile minimalist timer that lives gracefully in the Dynamic Island and StandBy mode. Features haptic ticks and binaural soundscapes.',
      tags: ['Productivity', 'LiveActivities', 'Audio', 'StandBy'],
      category: 'Productivity',
      scores: { impact: 8, effort: 4, market: 9, fun: 8 }, // Score: 29
      status: 'Exploring',
      comments: [],
      timeline: [{ id: 'tl-3', event: 'Idea created', date: '2026-09-14' }],
      createdAt: '2026-09-14T10:30:00Z',
      updatedAt: '2026-09-14T10:30:00Z',
      isDemo: true,
    },
    {
      id: 'idea-demo-3',
      userId,
      title: 'ClipStash: Ephemeral Clipboard Guardian with iCloud Keychain',
      description: 'Privacy-first clipboard manager that automatically redacts API keys, credit cards, and passwords. Never leaks to cloud third parties.',
      tags: ['Privacy', 'Keychain', 'MacCatalyst', 'Shortcuts'],
      category: 'Developer Tools',
      scores: { impact: 7, effort: 5, market: 7, fun: 7 }, // Score: 26
      status: 'Exploring',
      comments: [],
      timeline: [{ id: 'tl-4', event: 'Drafted architecture notes', date: '2026-09-20' }],
      createdAt: '2026-09-20T08:15:00Z',
      updatedAt: '2026-09-20T08:15:00Z',
      isDemo: true,
    },
    {
      id: 'idea-demo-4',
      userId,
      title: 'BoulderPeak: Apple Watch Climbing & Bouldering Tracker',
      description: 'Utilizes Apple Watch CoreMotion accelerometer/gyroscope to automatically detect ascent attempts, grades (V-scale), and wall rest times.',
      tags: ['AppleWatch', 'CoreMotion', 'Fitness', 'Sports'],
      category: 'Health & Fitness',
      scores: { impact: 8, effort: 8, market: 7, fun: 9 }, // Score: 32
      status: 'New',
      comments: [],
      timeline: [{ id: 'tl-5', event: 'Captured concept from local gym session', date: '2026-09-25' }],
      createdAt: '2026-09-25T19:00:00Z',
      updatedAt: '2026-09-25T19:00:00Z',
      isDemo: true,
    },
    {
      id: 'idea-demo-5',
      userId,
      title: 'ShelfLife: Smart Food Waste Alerts with Receipt OCR',
      description: 'Scan grocery receipts using Apple Vision framework to populate expiry countdowns. Sends actionable notifications before vegetables spoil.',
      tags: ['Vision', 'OCR', 'Eco', 'Notifications'],
      category: 'Lifestyle',
      scores: { impact: 6, effort: 6, market: 7, fun: 6 }, // Score: 25
      status: 'Parked',
      comments: [
        { id: 'c-2', author: 'Alex', text: 'Receipt OCR is inconsistent between supermarket formats; parked until WWDC improved Vision model.', createdAt: '2026-09-28T14:00:00Z' },
      ],
      timeline: [
        { id: 'tl-6', event: 'Created idea', date: '2026-09-22' },
        { id: 'tl-7', event: 'Parked pending OCR accuracy spikes', date: '2026-09-28' },
      ],
      createdAt: '2026-09-22T13:45:00Z',
      updatedAt: '2026-09-28T14:00:00Z',
      isDemo: true,
    },
    {
      id: 'idea-demo-6',
      userId,
      title: 'SubGuard: Local-First Recurring Subscription Auditor',
      description: 'Track software & streaming subscriptions without connecting sensitive bank OAuth APIs. Simulates annual burn and reminder notifications.',
      tags: ['Finance', 'LocalFirst', 'Charts', 'SwiftUI'],
      category: 'Finance',
      scores: { impact: 8, effort: 5, market: 9, fun: 7 }, // Score: 29
      status: 'Validated',
      comments: [],
      timeline: [{ id: 'tl-8', event: 'Validated with Reddit indie dev community', date: '2026-10-01' }],
      createdAt: '2026-10-01T11:20:00Z',
      updatedAt: '2026-10-01T11:20:00Z',
      isDemo: true,
    },
    {
      id: 'idea-demo-7',
      userId,
      title: 'AudioScribe: Whisper On-Device Meeting Transcriber',
      description: 'Runs distilled Whisper CoreML model locally on Apple Neural Engine. Fast 100% private transcripts with markdown chapter export.',
      tags: ['CoreML', 'Audio', 'AI', 'AppleSilicon'],
      category: 'Developer Tools',
      scores: { impact: 9, effort: 7, market: 9, fun: 8 }, // Score: 33
      status: 'New',
      comments: [],
      timeline: [{ id: 'tl-9', event: 'Tested Whisper.spm performance on iPhone 16 Pro', date: '2026-10-03' }],
      createdAt: '2026-10-03T15:10:00Z',
      updatedAt: '2026-10-03T15:10:00Z',
      isDemo: true,
    },
    {
      id: 'idea-demo-8',
      userId,
      title: 'HabitPulse: Interactive Streaks with Apple Health Sync',
      description: 'The foundation for HabitPulse. Habit streak tracker with Apple Health integration, haptics, and zero ad telemetry.',
      tags: ['SwiftUI', 'HealthKit', 'Widgets', 'Indie'],
      category: 'Health & Fitness',
      scores: { impact: 9, effort: 5, market: 9, fun: 9 }, // Score: 32
      status: 'Converted',
      projectId,
      comments: [
        { id: 'c-3', author: 'Alex', text: 'Converted to full project workspace!', createdAt: '2026-08-01T10:05:00Z' },
      ],
      timeline: [
        { id: 'tl-10', event: 'Idea conceived', date: '2026-07-28' },
        { id: 'tl-11', event: 'Converted to project workspace', date: '2026-08-01' },
      ],
      createdAt: '2026-07-28T16:00:00Z',
      updatedAt: '2026-08-01T10:05:00Z',
      isDemo: true,
    },
  ];

  const demoTasks: Task[] = [
    {
      id: 'task-1',
      projectId,
      title: 'Design interactive iOS 18 Control Center widgets',
      description: 'Create AppIntent for single-tap habit completion directly from the iOS 18 Control Center palette.',
      type: 'Feature',
      priority: 'High',
      statusId: 'status-in-progress',
      labels: ['iOS18', 'AppIntents', 'SwiftUI'],
      dueDate: '2026-10-18',
      subtasks: [
        { id: 'st-1', title: 'Implement HabitToggleControlWidgetIntent', completed: true },
        { id: 'st-2', title: 'Design 1x1 Control Center button icons', completed: true },
        { id: 'st-3', title: 'Handle lock screen authentication bypass safely', completed: false },
      ],
      releaseId: releaseV12Id,
      order: 0,
      loggedMinutes: 180,
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-05T12:00:00Z',
      isDemo: true,
    },
    {
      id: 'task-2',
      projectId,
      title: 'Resolve SwiftData CloudKit conflict on dual device sync',
      description: 'When checking off a habit on Apple Watch and iPhone concurrently, ensure conflict resolution merges timestamps instead of duplicating records.',
      type: 'Bug',
      priority: 'Urgent',
      statusId: 'status-in-review',
      labels: ['SwiftData', 'CloudKit', 'Sync'],
      dueDate: '2026-10-12',
      subtasks: [
        { id: 'st-4', title: 'Add deterministic habit completion UUID keys', completed: true },
        { id: 'st-5', title: 'Write automated unit test for concurrent writes', completed: true },
      ],
      releaseId: releaseV12Id,
      order: 1,
      loggedMinutes: 240,
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-04T15:30:00Z',
      isDemo: true,
    },
    {
      id: 'task-3',
      projectId,
      title: 'Audit App Store Review Guidelines 5.1.1 for HealthKit',
      description: 'Ensure privacy consent string clearly justifies why active calories and mindfulness sessions are read, with strict zero-ad usage guarantees.',
      type: 'Research',
      priority: 'Medium',
      statusId: 'status-testing',
      labels: ['AppReview', 'HealthKit', 'Privacy'],
      dueDate: '2026-10-15',
      subtasks: [
        { id: 'st-6', title: 'Update NSHealthShareUsageDescription in Info.plist', completed: true },
        { id: 'st-7', title: 'Record video demo showing HealthKit permissions grant for Apple Reviewer', completed: true },
      ],
      releaseId: releaseV12Id,
      order: 2,
      loggedMinutes: 90,
      createdAt: '2026-09-28T14:00:00Z',
      updatedAt: '2026-10-04T11:00:00Z',
      isDemo: true,
    },
    {
      id: 'task-4',
      projectId,
      title: 'Implement StoreKit 2 Lifetime Pro unlock paywall',
      description: 'Build StoreKit 2 Transaction.updates listener, native SubscriptionStoreView, and localized currency formatting.',
      type: 'Feature',
      priority: 'High',
      statusId: 'status-todo',
      labels: ['StoreKit2', 'Monetization', 'SwiftUI'],
      dueDate: '2026-10-25',
      subtasks: [
        { id: 'st-8', title: 'Setup StoreKit configuration file in Xcode for testing', completed: true },
        { id: 'st-9', title: 'Add Restore Purchases button', completed: false },
        { id: 'st-10', title: 'Handle family sharing entitlements', completed: false },
      ],
      releaseId: releaseV12Id,
      order: 3,
      loggedMinutes: 60,
      createdAt: '2026-10-03T16:00:00Z',
      updatedAt: '2026-10-03T16:00:00Z',
      isDemo: true,
    },
    {
      id: 'task-5',
      projectId,
      title: 'Add CoreHaptics rich vibration sequence on goal completion',
      description: 'Trigger subtle CHHapticPattern playback when all daily habits reach 100% completion.',
      type: 'Design',
      priority: 'Low',
      statusId: 'status-todo',
      labels: ['Haptics', 'Polish', 'UX'],
      dueDate: '2026-10-28',
      subtasks: [
        { id: 'st-11', title: 'Design AHAP haptic pattern file', completed: false },
      ],
      releaseId: releaseV12Id,
      order: 4,
      loggedMinutes: 0,
      createdAt: '2026-10-04T10:00:00Z',
      updatedAt: '2026-10-04T10:00:00Z',
      isDemo: true,
    },
    {
      id: 'task-6',
      projectId,
      title: 'Apple Watch standalone complication sync',
      description: 'Transfer streak metrics to watchOS using WatchConnectivity WCSession transferCurrentComplicationUserInfo.',
      type: 'Feature',
      priority: 'High',
      statusId: 'status-done',
      labels: ['watchOS', 'Complications', 'Release-v1.1.0'],
      dueDate: '2026-09-10',
      subtasks: [
        { id: 'st-12', title: 'Implement WidgetKit Modular & Corner complications', completed: true },
        { id: 'st-13', title: 'Benchmark battery consumption in background refresh', completed: true },
      ],
      releaseId: releaseV11Id,
      order: 5,
      loggedMinutes: 320,
      createdAt: '2026-08-25T11:00:00Z',
      updatedAt: '2026-09-10T17:00:00Z',
      isDemo: true,
    },
    {
      id: 'task-7',
      projectId,
      title: 'App launch cold-start benchmarking and profiling',
      description: 'Profile time-to-interactive in Instruments. Defer secondary views initialization.',
      type: 'Chore',
      priority: 'Medium',
      statusId: 'status-done',
      labels: ['Instruments', 'Performance', 'Release-v1.0.0'],
      dueDate: '2026-08-15',
      subtasks: [
        { id: 'st-14', title: 'Profile with Time Profiler on physical iPhone 13', completed: true },
        { id: 'st-15', title: 'Reduce binary launch pre-main overhead', completed: true },
      ],
      releaseId: releaseV1Id,
      order: 6,
      loggedMinutes: 150,
      createdAt: '2026-08-10T13:00:00Z',
      updatedAt: '2026-08-15T18:00:00Z',
      isDemo: true,
    },
    {
      id: 'task-8',
      projectId,
      title: 'Explore visionOS spatial 3D habit orbital ring view',
      description: 'Build a prototype RealityKit spatial window with floating milestone spheres for visionOS 2.0.',
      type: 'Research',
      priority: 'Low',
      statusId: 'status-backlog',
      labels: ['visionOS', 'RealityKit', 'Spatial'],
      subtasks: [],
      order: 7,
      loggedMinutes: 0,
      createdAt: '2026-10-05T09:00:00Z',
      updatedAt: '2026-10-05T09:00:00Z',
      isDemo: true,
    },
  ];

  const demoReleases: Release[] = [
    {
      id: releaseV1Id,
      projectId,
      version: '1.0.0',
      build: 12,
      name: 'Initial App Store Launch',
      status: 'Released',
      plannedDate: '2026-08-20',
      releasedDate: '2026-08-20',
      notes: {
        knownIssues: 'None reported.',
        testNotes: 'Passed all smoke tests on iOS 17.4+.',
        appleReviewNotes: 'Full local data sandbox. Demo account not required since all data remains offline.',
        testFlightUrl: 'https://testflight.apple.com/v1-0-0',
        rejectionLog: [],
      },
      locales: {
        'en-US': `Welcome to HabitPulse!
• Clean, minimalist streak tracking with zero ads
• Daily progress rings and customizable reminder alerts
• Private iCloud sync across your Apple devices
• Dark mode and dynamic tint styling`,
      },
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-20T19:00:00Z',
      isDemo: true,
    },
    {
      id: releaseV11Id,
      projectId,
      version: '1.1.0',
      build: 26,
      name: 'Apple Watch & Complications',
      status: 'Released',
      plannedDate: '2026-09-15',
      releasedDate: '2026-09-16',
      notes: {
        knownIssues: 'Minor complication refresh lag on Watch Series 4.',
        testNotes: 'Tested over Bluetooth and independent LTE cellular watch connection.',
        appleReviewNotes: 'Includes companion watchOS app.',
        rejectionLog: [],
      },
      locales: {
        'en-US': `What's New in HabitPulse 1.1:
• Dedicated Apple Watch companion app
• Modular, circular, and corner watch face complications
• Interactive Home Screen and Lock Screen widgets
• Fixed an issue where timezones could miscalculate consecutive streaks
• Performance improvements across habit loading`,
      },
      createdAt: '2026-08-22T10:00:00Z',
      updatedAt: '2026-09-16T15:00:00Z',
      isDemo: true,
    },
    {
      id: releaseV12Id,
      projectId,
      version: '1.2.0',
      build: 40,
      name: 'iOS 18 Controls & SwiftData Upgrade',
      status: 'In TestFlight',
      plannedDate: '2026-10-22',
      notes: {
        knownIssues: 'Dual device simultaneous tap conflict under review.',
        testNotes: 'TestFlight build distributed to 85 external beta testers.',
        appleReviewNotes: 'Testing iOS 18 Control Center extensions and HealthKit permissions.',
        testFlightUrl: 'https://testflight.apple.com/join/habitpulse-beta-v12',
        rejectionLog: [],
      },
      locales: {
        'en-US': `What's New in Version 1.2:
• iOS 18 Control Center widgets for instantaneous habit toggling
• Upgraded storage architecture to SwiftData for lightning-fast responsiveness
• Rich CoreHaptics sensory feedback when completing all daily goals
• Improved HealthKit synchronization reliability
• Bug fixes and battery efficiency enhancements`,
      },
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-10-05T16:00:00Z',
      isDemo: true,
    },
  ];

  const demoChangelogEntries: ChangelogEntry[] = [
    { id: 'cl-1', releaseId: releaseV1Id, type: 'Added', text: 'Initial release with daily habit streak tracking and statistics.' },
    { id: 'cl-2', releaseId: releaseV1Id, type: 'Added', text: 'End-to-end encrypted private iCloud synchronization.' },
    { id: 'cl-3', releaseId: releaseV1Id, type: 'Performance', text: 'Sub-150ms cold launch time on A15 Bionic and newer devices.' },
    { id: 'cl-4', releaseId: releaseV11Id, type: 'Added', text: 'Native Apple Watch companion app with standalone complication updates.' },
    { id: 'cl-5', releaseId: releaseV11Id, type: 'Added', text: 'Lock screen and desktop interactive widgets.' },
    { id: 'cl-6', releaseId: releaseV11Id, type: 'Fixed', text: 'Resolved midnight timezone transition streak discrepancy.' },
    { id: 'cl-7', releaseId: releaseV12Id, type: 'Added', text: 'iOS 18 Control Center habit button controls via AppIntents.', taskId: 'task-1' },
    { id: 'cl-8', releaseId: releaseV12Id, type: 'Fixed', text: 'Fixed simultaneous multi-device sync conflict resolution.', taskId: 'task-2' },
    { id: 'cl-9', releaseId: releaseV12Id, type: 'Performance', text: 'Upgraded underlying persistence engine to SwiftData.' },
    { id: 'cl-10', releaseId: releaseV12Id, type: 'Security', text: 'Tightened HealthKit permission usage strings per Apple Review 5.1.1.', taskId: 'task-3' },
  ];

  const demoNotifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId,
      title: 'Upcoming Release Deadline',
      message: 'HabitPulse v1.2.0 planned release date is approaching (Oct 22, 2026).',
      type: 'deadline',
      targetType: 'release',
      targetId: releaseV12Id,
      read: false,
      createdAt: '2026-10-05T08:00:00Z',
    },
    {
      id: 'notif-2',
      userId,
      title: 'Apple Distribution Certificate Active',
      message: 'Your Apple Distribution Certificate is valid for 132 more days.',
      type: 'certificate',
      targetType: 'certificate',
      targetId: 'cert-1',
      read: true,
      createdAt: '2026-10-01T09:00:00Z',
    },
  ];

  return {
    ideas: demoIdeas,
    projects: [demoProject, demoReleasedProject],
    statuses: DEFAULT_WORKFLOW_STATUSES,
    tasks: demoTasks,
    releases: demoReleases,
    changelogEntries: demoChangelogEntries,
    archivedApps: [],
    checklists: DEFAULT_CHECKLIST_TEMPLATE.map(c => ({ ...c, done: false })),
    checklistTemplate: DEFAULT_CHECKLIST_TEMPLATE.map(c => ({ ...c })),
    appStoreInfoTemplate: DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q })),
    privacyPermissions: DEFAULT_PRIVACY_PERMISSIONS,
    certificates: DEFAULT_CERTIFICATES,
    notifications: demoNotifications,
  };
}

/**
 * Empty baseline database for a user who removes demo data or creates a clean slate.
 */
export function createEmptyDatabase(): UserDatabase {
  return {
    ideas: [],
    projects: [],
    statuses: DEFAULT_WORKFLOW_STATUSES,
    tasks: [],
    releases: [],
    changelogEntries: [],
    archivedApps: [],
    checklists: DEFAULT_CHECKLIST_TEMPLATE.map(c => ({ ...c, done: false })),
    checklistTemplate: DEFAULT_CHECKLIST_TEMPLATE.map(c => ({ ...c })),
    appStoreInfoTemplate: DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q })),
    privacyPermissions: DEFAULT_PRIVACY_PERMISSIONS,
    certificates: DEFAULT_CERTIFICATES,
    notifications: [],
  };
}

// User accounts management
export function getRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load registered users', err);
    return [];
  }
}

export function saveRegisteredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save registered users', err);
  }
}

export function getCurrentSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to load session user', err);
    return null;
  }
}

export function setCurrentSessionUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  } catch (err) {
    console.error('Failed to update session user', err);
  }
}

// User Database CRUD
/**
 * Normalizes checklist items and ensures custom checklist templates are safely preserved
 * across logins, reloads, and database syncs.
 */
export function sanitizeDatabaseChecklists(parsed: UserDatabase, userId?: string): UserDatabase {
  if (!parsed) return parsed;
  const checklists = parsed.checklists || [];

  // Recover custom checklist template if missing from remote or local storage
  let template = Array.isArray(parsed.checklistTemplate) && parsed.checklistTemplate.length > 0
    ? parsed.checklistTemplate
    : undefined;

  if (!template) {
    try {
      const backupKey = userId ? `appdock_template_backup_${userId}` : null;
      const backupRaw = backupKey ? localStorage.getItem(backupKey) : null;
      const globalRaw = localStorage.getItem('appdock_global_checklist_template');
      const rawToUse = backupRaw || globalRaw;
      if (rawToUse) {
        const parsedTpl = JSON.parse(rawToUse);
        if (Array.isArray(parsedTpl) && parsedTpl.length > 0) {
          template = parsedTpl;
        }
      }
    } catch {}
  }

  const resolvedTemplate = template || DEFAULT_CHECKLIST_TEMPLATE.map(c => ({ ...c }));

  // Ensure projects have devSubstatus preserved
  const sanitizedProjects = (parsed.projects || []).map(p => ({
    ...p,
    devSubstatus: p.devSubstatus || (p.status === 'In development' ? 'Design' : undefined),
  }));

  // Reconcile checklists for every project so all items from resolvedTemplate are always present
  let reconciledChecklists = [...checklists];
  for (const proj of sanitizedProjects) {
    const projChecklists = reconciledChecklists.filter(c => c.projectId === proj.id);
    for (const tpl of resolvedTemplate) {
      const exists = projChecklists.some(
        c =>
          c.id === `chk-${proj.id}-${tpl.id}` ||
          c.id.endsWith(`-${tpl.id}`) ||
          c.id === tpl.id ||
          (c.title === tpl.title && c.category === tpl.category)
      );
      if (!exists) {
        reconciledChecklists.push({
          ...tpl,
          id: `chk-${proj.id}-${tpl.id}`,
          projectId: proj.id,
          done: false,
        });
      }
    }
  }

  let appStoreTpl = Array.isArray(parsed.appStoreInfoTemplate) && parsed.appStoreInfoTemplate.length > 0
    ? parsed.appStoreInfoTemplate
    : undefined;

  if (!appStoreTpl) {
    try {
      const backupKey = userId ? `appdock_appstore_questions_backup_${userId}` : null;
      const backupRaw = backupKey ? localStorage.getItem(backupKey) : null;
      const globalRaw = localStorage.getItem('appdock_global_appstore_questions');
      const rawToUse = backupRaw || globalRaw;
      if (rawToUse) {
        const parsedTpl = JSON.parse(rawToUse);
        if (Array.isArray(parsedTpl) && parsedTpl.length > 0) {
          appStoreTpl = parsedTpl;
        }
      }
    } catch {}
  }

  const resolvedAppStoreQuestions = appStoreTpl || DEFAULT_APP_STORE_QUESTIONS.map(q => ({ ...q }));

  return {
    ...parsed,
    projects: sanitizedProjects,
    checklists: reconciledChecklists,
    checklistTemplate: resolvedTemplate,
    appStoreInfoTemplate: resolvedAppStoreQuestions,
  };
}

export function loadUserDatabase(userId: string): UserDatabase {
  try {
    const key = `${DATA_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    const wasPurged =
      localStorage.getItem(`${DATA_PREFIX}${userId}_demo_purged`) === 'true' ||
      localStorage.getItem('ios_dev_hub_global_demo_purged') === 'true';

    if (!raw) {
      if (wasPurged) {
        const empty = createEmptyDatabase();
        empty.demoPurged = true;
        saveUserDatabase(userId, empty);
        return empty;
      }
      // First time initialization: automatically populate demo data!
      const initial = generateDemoData(userId);
      saveUserDatabase(userId, initial);
      return initial;
    }
    const parsed: UserDatabase = JSON.parse(raw);
    const shouldPurge =
      wasPurged ||
      parsed.demoPurged === true ||
      ((parsed.projects || []).length > 0 && !(parsed.projects || []).some(p => p.isDemo) && !(parsed.ideas || []).some(i => i.isDemo)) ||
      ((parsed.projects || []).length === 0 && (parsed.ideas || []).length === 0 && wasPurged);

    if (shouldPurge) {
      parsed.demoPurged = true;
      parsed.ideas = (parsed.ideas || []).filter(i => !i.isDemo);
      parsed.projects = (parsed.projects || []).filter(p => !p.isDemo);
      parsed.tasks = (parsed.tasks || []).filter(t => !t.isDemo);
      parsed.releases = (parsed.releases || []).filter(r => !r.isDemo);
      parsed.changelogEntries = (parsed.changelogEntries || []).filter(c => {
        const rel = (parsed.releases || []).find(r => r.id === c.releaseId);
        return rel && !rel.isDemo;
      });
      parsed.archivedApps = (parsed.archivedApps || []).filter(a => !a.isDemo);
      try {
        localStorage.setItem(`${DATA_PREFIX}${userId}_demo_purged`, 'true');
      } catch {}
    } else if ((parsed.projects || []).some(p => p.isDemo)) {
      if (!parsed.projects.some(p => p.id === 'proj-demo-chronos')) {
        const fullDemo = generateDemoData(userId);
        const chronos = fullDemo.projects.find(p => p.id === 'proj-demo-chronos');
        if (chronos) {
          parsed.projects.push(chronos);
        }
      }
    }
    return sanitizeDatabaseChecklists(parsed, userId);
  } catch (err) {
    console.error('Failed to load user database', err);
    return createEmptyDatabase();
  }
}

export function saveUserDatabase(userId: string, data: UserDatabase): void {
  try {
    const key = `${DATA_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(data));
    if (data.checklistTemplate && data.checklistTemplate.length > 0) {
      localStorage.setItem('appdock_global_checklist_template', JSON.stringify(data.checklistTemplate));
      localStorage.setItem(`appdock_template_backup_${userId}`, JSON.stringify(data.checklistTemplate));
    }
    if (data.appStoreInfoTemplate && data.appStoreInfoTemplate.length > 0) {
      localStorage.setItem('appdock_global_appstore_questions', JSON.stringify(data.appStoreInfoTemplate));
      localStorage.setItem(`appdock_appstore_questions_backup_${userId}`, JSON.stringify(data.appStoreInfoTemplate));
    }
  } catch (err) {
    console.error('Failed to save user database', err);
  }
}

/**
 * Remove only items where isDemo === true.
 * User-created items remain completely untouched.
 */
export function removeDemoData(userId: string): UserDatabase {
  const current = loadUserDatabase(userId);
  const demoProjectIds = new Set((current.projects || []).filter(p => p.isDemo).map(p => p.id));
  const cleaned: UserDatabase = {
    ...current,
    ideas: (current.ideas || []).filter(i => !i.isDemo),
    projects: (current.projects || []).filter(p => !p.isDemo),
    tasks: (current.tasks || []).filter(t => !t.isDemo),
    releases: (current.releases || []).filter(r => !r.isDemo),
    changelogEntries: (current.changelogEntries || []).filter(c => {
      // Keep entry only if release still exists
      const rel = (current.releases || []).find(r => r.id === c.releaseId);
      return rel && !rel.isDemo;
    }),
    archivedApps: (current.archivedApps || []).filter(a => !a.isDemo),
    checklists: (current.checklists || []).filter(c => !c.projectId || !demoProjectIds.has(c.projectId)),
    demoPurged: true,
  };
  saveUserDatabase(userId, cleaned);
  try {
    localStorage.setItem(`${DATA_PREFIX}${userId}_demo_purged`, 'true');
    localStorage.setItem('ios_dev_hub_global_demo_purged', 'true');
  } catch {}
  return cleaned;
}

/**
 * Restore demo data back into user workspace.
 */
export function restoreDemoData(userId: string): UserDatabase {
  const current = loadUserDatabase(userId);
  const demo = generateDemoData(userId);

  // Merge non-demo user items with fresh demo items
  const nonDemoIdeas = (current.ideas || []).filter(i => !i.isDemo);
  const nonDemoProjects = (current.projects || []).filter(p => !p.isDemo);
  const nonDemoTasks = (current.tasks || []).filter(t => !t.isDemo);
  const nonDemoReleases = (current.releases || []).filter(r => !r.isDemo);
  const nonDemoChangelogs = (current.changelogEntries || []).filter(c => {
    const rel = (current.releases || []).find(r => r.id === c.releaseId);
    return rel && !rel.isDemo;
  });
  const nonDemoArchives = (current.archivedApps || []).filter(a => !a.isDemo);

  const merged: UserDatabase = {
    ...current,
    ideas: [...nonDemoIdeas, ...demo.ideas],
    projects: [...nonDemoProjects, ...demo.projects],
    tasks: [...nonDemoTasks, ...demo.tasks],
    releases: [...nonDemoReleases, ...demo.releases],
    changelogEntries: [...nonDemoChangelogs, ...demo.changelogEntries],
    archivedApps: [...nonDemoArchives, ...demo.archivedApps],
    checklists: [...(current.checklists || []), ...demo.checklists],
    demoPurged: false,
  };

  saveUserDatabase(userId, merged);
  try {
    localStorage.removeItem(`${DATA_PREFIX}${userId}_demo_purged`);
    localStorage.removeItem('ios_dev_hub_global_demo_purged');
  } catch {}
  return merged;
}

/**
 * Mark a single demo item as user's own data (keep item action).
 */
export function keepDemoItem(userId: string, entityType: 'idea' | 'project' | 'task' | 'release', itemId: string): UserDatabase {
  const current = loadUserDatabase(userId);
  if (entityType === 'idea') {
    current.ideas = current.ideas.map(i => i.id === itemId ? { ...i, isDemo: false } : i);
  } else if (entityType === 'project') {
    current.projects = current.projects.map(p => p.id === itemId ? { ...p, isDemo: false } : p);
  } else if (entityType === 'task') {
    current.tasks = current.tasks.map(t => t.id === itemId ? { ...t, isDemo: false } : t);
  } else if (entityType === 'release') {
    current.releases = current.releases.map(r => r.id === itemId ? { ...r, isDemo: false } : r);
  }
  saveUserDatabase(userId, current);
  return current;
}

/**
 * Permanent account deletion:
 * Purges the user account, revokes mock tokens, and deletes all user database records.
 */
export function permanentlyDeleteAccount(userId: string): boolean {
  try {
    // 1. Remove user database
    localStorage.removeItem(`${DATA_PREFIX}${userId}`);

    // 2. Remove user from registered list
    const users = getRegisteredUsers().filter(u => u.id !== userId);
    saveRegisteredUsers(users);

    // 3. Clear session
    const current = getCurrentSessionUser();
    if (current && current.id === userId) {
      setCurrentSessionUser(null);
    }
    return true;
  } catch (err) {
    console.error('Failed to permanently delete account', err);
    return false;
  }
}

/**
 * Export full user data as JSON formatted string.
 */
export function exportUserDataAsJson(user: User, data: UserDatabase): string {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    application: 'AppDock75',
    version: '1.0.0',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      providers: user.providers,
      createdAt: user.createdAt,
    },
    data,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Export tasks as CSV format.
 */
export function exportTasksAsCsv(tasks: Task[], projects: Project[], statuses: WorkflowStatus[]): string {
  const statusMap = new Map(statuses.map(s => [s.id, s.name]));
  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  const headers = ['Task ID', 'Project', 'Title', 'Type', 'Priority', 'Status', 'Due Date', 'Logged Minutes', 'Subtasks Count', 'Is Demo'];
  const rows = tasks.map(t => [
    t.id,
    `"${(projectMap.get(t.projectId) || 'Unknown').replace(/"/g, '""')}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    t.type,
    t.priority,
    statusMap.get(t.statusId) || 'Unknown',
    t.dueDate || '',
    t.loggedMinutes || 0,
    t.subtasks.length,
    t.isDemo ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export changelog as formatted Markdown.
 */
export function exportChangelogAsMarkdown(projectName: string, releases: Release[], entries: ChangelogEntry[]): string {
  let md = `# ${projectName} - Changelog\n\n`;
  for (const rel of releases) {
    md += `## Version ${rel.version} (Build ${rel.build}) - ${rel.status}\n`;
    if (rel.releasedDate) {
      md += `*Released on ${rel.releasedDate}*\n\n`;
    } else if (rel.plannedDate) {
      md += `*Planned for ${rel.plannedDate}*\n\n`;
    }
    const relEntries = entries.filter(e => e.releaseId === rel.id);
    if (relEntries.length > 0) {
      const types: ('Added' | 'Changed' | 'Fixed' | 'Removed' | 'Security' | 'Performance')[] = [
        'Added', 'Changed', 'Fixed', 'Removed', 'Security', 'Performance'
      ];
      for (const t of types) {
        const matches = relEntries.filter(e => e.type === t);
        if (matches.length > 0) {
          md += `### ${t}\n`;
          for (const item of matches) {
            md += `- ${item.text}\n`;
          }
          md += '\n';
        }
      }
    } else {
      md += '_No changelog entries registered._\n\n';
    }
  }
  return md;
}
