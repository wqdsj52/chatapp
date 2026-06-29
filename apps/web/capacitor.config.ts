import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatapp.mobile',
  appName: 'ChatApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
