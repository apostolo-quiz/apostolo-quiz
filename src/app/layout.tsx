import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apóstolos - Quiz Bíblico',
  description: 'Jogo de Quiz Bíblico Épico com Criador de Personagens',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased bg-zinc-950 text-zinc-100" suppressHydrationWarning>{children}</body>
    </html>
  );
}
