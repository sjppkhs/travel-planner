'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Lang } from '@/lib/i18n/translations';

interface LangContextValue {
  lang: Lang;
  t: typeof translations.ko;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'ko',
  t: translations.ko,
  toggleLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ko');

  useEffect(() => {
    const saved = localStorage.getItem('travel-lang') as Lang | null;
    if (saved === 'ko' || saved === 'en') setLang(saved);
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next: Lang = prev === 'ko' ? 'en' : 'ko';
      localStorage.setItem('travel-lang', next);
      return next;
    });
  };

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
