'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DICTIONARY, Language } from './i18n';

interface LanguageContextValue {
  language: Language;
  direction: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof DICTIONARY['ar']) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage, defaulting to 'en'
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('scouts_language') as Language;
      if (savedLang === 'ar' || savedLang === 'en') {
        setLanguageState(savedLang);
      }
    } catch {
      // ignore
    }
  }, []);

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('scouts_language', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const t = (key: keyof typeof DICTIONARY['ar']): string => {
    const dict = DICTIONARY[language] || DICTIONARY['en'] || DICTIONARY['ar'];
    return (dict as any)[key] || (DICTIONARY['en'] as any)[key] || (DICTIONARY['ar'] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, toggleLanguage, t }}>
      <div dir={direction} className={language === 'ar' ? 'font-arabic' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
