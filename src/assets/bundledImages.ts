import habitPulseIcon from './images/app_icon_habitpulse_1791271816455.jpg';
import chronosIcon from './images/app_icon_chronos_1791271827616.jpg';
import heroIosWorkspace from './images/hero_ios_workspace_1791271788673.jpg';

export const HABITPULSE_ICON = habitPulseIcon;
export const CHRONOS_ICON = chronosIcon;
export const HERO_IOS_WORKSPACE = heroIosWorkspace;

const LEGACY_PATH_MAP: Record<string, string> = {
  '/src/assets/images/app_icon_habitpulse_1791271816455.jpg': habitPulseIcon,
  'src/assets/images/app_icon_habitpulse_1791271816455.jpg': habitPulseIcon,
  '/src/assets/images/app_icon_chronos_1791271827616.jpg': chronosIcon,
  'src/assets/images/app_icon_chronos_1791271827616.jpg': chronosIcon,
  '/src/assets/images/hero_ios_workspace_1791271788673.jpg': heroIosWorkspace,
  'src/assets/images/hero_ios_workspace_1791271788673.jpg': heroIosWorkspace,
};

/**
 * Resolves stored legacy /src/assets/images/... paths to Vite-bundled relative URLs
 * so images load properly inside Capacitor's dist/ bundle.
 */
export function resolveBundledImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return LEGACY_PATH_MAP[src] || src;
}
