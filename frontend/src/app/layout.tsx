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
  title: 'SMSR | St. Mary Scouts Rehab - كشافة السيدة العذراء بالرحاب',
  description: 'SMSR (St. Mary Scouts Rehab) - المجموعة الكشفية البحرية بكنيسة السيدة العذراء بالرحاب. منظومة إدارة شؤون الكشافة والحضور والعهدة وأرشيف الوسائط.',
  icons: {
    icon: '/smsr-logo.jpg',
    apple: '/smsr-logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={`dark ${notoSansArabic.variable} ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFD] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F1F5F9] font-sans antialiased selection:bg-sky-500/20 selection:text-sky-300">
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

