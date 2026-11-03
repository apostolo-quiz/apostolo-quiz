import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apostolos.quizbiblico',
  appName: 'Apóstolos - Quiz Bíblico',
  webDir: 'public',
  server: {
    url: 'https://apostolo-quiz.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#09090b'
  }
};

export default config;
