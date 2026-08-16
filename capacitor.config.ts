import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sidebyside.app',
  appName: 'SideBySide',
  webDir: 'dist',
  // Evite le "cleartext traffic" bloqué par défaut sur Android pour les appels API.
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#1E3A8A',
      showSpinner: false,
    },
  },
};

export default config;
