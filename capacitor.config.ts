import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apostolos.quizbiblico',
  appName: 'Apóstolos - Quiz Bíblico',
  webDir: 'public',
  server: {
    url: 'https://apostolo-quiz.vercel.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'apostolo-quiz.vercel.app',
      '*.supabase.co',
      'accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com'
    ]
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#09090b',
    captureInput: true,
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  }
};

export default config;
