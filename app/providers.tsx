'use client';

import { LangProvider, useLang } from '@/lib/context/LangContext';

function LangToggleButton() {
  const { lang, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      aria-label="Switch language"
      className="fixed bottom-5 right-5 z-50
        w-12 h-12 rounded-full
        flex items-center justify-center
        text-sm font-black tracking-tight
        shadow-lg border-2
        transition-all duration-200 hover:scale-110 active:scale-95
        bg-white border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600"
    >
      {lang === 'ko' ? 'EN' : '한'}
    </button>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      {children}
      <LangToggleButton />
    </LangProvider>
  );
}
