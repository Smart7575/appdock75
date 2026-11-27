interface CapacitorAppConfig {
  appId: string;
  appName: string;
  webDir: string;
  ios?: {
    contentInset?: 'automatic' | 'scrollableAxes' | 'never' | 'always';
  };
}

const config: CapacitorAppConfig = {
  appId: 'com.appdock75.app',
  appName: 'AppDock75',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
  },
};

export default config;
