import type { Metadata } from 'next';
import { Noto_Sans_Arabic, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '../lib/LanguageContext';
import { AuthProvider } from '../lib/AuthContext';
import { GoogleWorkspaceLayout } from '../components/GoogleWorkspaceLayout';

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Scout Workspace & Drive | منظومة الفوج الكشفي',
  description: 'Google Workspace & Material 3 scout management platform for units, attendance, equipment, and Google Drive archival.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={`dark ${notoSansArabic.variable} ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFD] dark:bg-[#121416] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans antialiased selection:bg-[#C2E7FF] selection:text-[#001D35]">
        <LanguageProvider>
          <AuthProvider>
            <GoogleWorkspaceLayout>
              {children}
            </GoogleWorkspaceLayout>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

