import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apostolos.quizbiblico',
  appName: 'Apóstolos - Quiz Bíblico',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#09090b'
  }
};

export default config;
