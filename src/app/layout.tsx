import type { Metadata } from 'next';
import { Alexandria, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '../lib/LanguageContext';
import { AuthProvider } from '../lib/AuthContext';
import { Navbar } from '../components/Navbar';

const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  variable: '--font-alexandria',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Scout Organization Platform | منظومة الفوج الكشفي',
  description: 'Authentic scout management platform for attendance, members, equipment bookings, and media archiving.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${alexandria.variable} ${jakarta.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F8F7F4] dark:bg-[#0F1412] text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-[#E8F0EC] selection:text-[#1B4332]">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="border-t border-[#E2DED6] dark:border-[#27342F] bg-white dark:bg-[#161D1A] py-5 text-center text-xs text-stone-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
                <div className="text-stone-700 dark:text-stone-300 font-medium">
                  Scout Organization Management Platform &copy; {new Date().getFullYear()}
                </div>
                <div className="text-stone-500 dark:text-stone-400">
                  Built for ~1,000 Scouts &bull; Unit Attendance &bull; Equipment Roster &bull; Media Pipeline
                </div>
              </div>
            </footer>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
