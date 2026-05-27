'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronRight, Sparkles, BadgePercent, ChevronDown } from 'lucide-react';
import { ALL_REGIONS, getRegionSuggestions } from '@/lib/data/koreaData';
import { useLang } from '@/lib/context/LangContext';
import { HALF_PRICE_BY_PROVINCE, GROUP_INFO } from '@/lib/data/benefits';

export default function HomePage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ReturnType<typeof getRegionSuggestions>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [halfPriceOpen, setHalfPriceOpen] = useState(false);

  const handleInput = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setSuggestions(getRegionSuggestions(value));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const navigate = (region: string) => {
    if (!region.trim()) return;
    router.push(`/places?region=${encodeURIComponent(region.trim())}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query);
  };

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center px-4 py-24 sm:py-36 text-center"
        style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #ffffff 0%, transparent 50%), radial-gradient(circle at 80% 70%, #bae6fd 0%, transparent 50%)',
          }}
        />

        <div className="relative z-10 max-w-2xl w-full">
          <div className="mb-4 flex items-center justify-center gap-2">
            <MapPin className="text-yellow-300" size={28} />
            <span className="text-yellow-300 font-semibold text-lg tracking-wide">{t.heroLabel}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span className="text-white">{t.tagline1}</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #fde68a, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.tagline2}
            </span>
          </h1>

          <p className="text-white/80 text-lg mb-4">
            <span className="text-yellow-300 font-semibold">{t.regionCountDesc(ALL_REGIONS.length)}</span>
          </p>

          <form onSubmit={handleSubmit} className="relative w-full mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                onFocus={() => { setSuggestions(getRegionSuggestions(query)); setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-12 pr-14 py-4 rounded-2xl text-base font-medium
                  bg-white/20 backdrop-blur-sm border border-white/30
                  text-white placeholder-white/50
                  focus:outline-none focus:border-white/70 focus:bg-white/25"
              />
              <button
                type="submit"
                disabled={!query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2
                  bg-amber-400 hover:bg-amber-300 disabled:bg-white/20
                  text-white rounded-xl p-2.5 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden
                bg-white border border-slate-200 shadow-2xl z-50 max-h-72 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onMouseDown={() => navigate(s.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                  >
                    <MapPin size={16} className="text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-800 font-medium">{s.name}</span>
                      <span className="text-slate-400 text-xs ml-2">{s.province}</span>
                    </div>
                    {s.tags && (
                      <div className="flex gap-1 shrink-0">
                        {s.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 행사·축제로 여행하기 */}
      <section className="max-w-5xl mx-auto w-full px-4 pt-8 pb-2">
        <button
          onClick={() => router.push('/events')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl text-left
            shadow-md hover:shadow-lg transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-lg leading-tight">{t.eventBannerTitle}</div>
            <div className="text-white/75 text-sm mt-0.5">{t.eventBannerDesc}</div>
          </div>
          <ChevronRight size={22} className="shrink-0 text-white/60" />
        </button>
      </section>

      {/* 반값여행지원 — 한국어 모드에서만 표시, 접기/펼치기 */}
      {lang === 'ko' && (
        <section className="max-w-5xl mx-auto w-full px-4 pt-3 pb-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden shadow-sm">
            {/* 헤더 (클릭으로 토글) */}
            <button
              onClick={() => setHalfPriceOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-white
                hover:bg-emerald-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <BadgePercent size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">반값여행지원금 가능 지역으로 계획하기</p>
                  <p className="text-slate-500 text-xs mt-0.5">2026년 상반기 · 여행 경비 50~70% 환급</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-emerald-700 font-black text-base leading-tight">최대 50만원</p>
                  <p className="text-emerald-500 text-xs">청년 14만원 환급</p>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-emerald-600 transition-transform duration-200 ${halfPriceOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* 펼쳐지는 콘텐츠 */}
            {halfPriceOpen && (
              <>
                {/* 환급 요약 칩 */}
                <div className="px-5 py-3 flex flex-wrap gap-2 border-t border-emerald-100">
                  {Object.entries(GROUP_INFO).map(([, g]) => (
                    <span key={g.label} className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                      bg-white border border-emerald-200 text-xs font-semibold text-emerald-700">
                      {g.label} <span className="text-slate-400 font-normal">·</span>
                      최대 {(g.cap / 10000).toFixed(0)}만원 {Math.round(g.rate * 100)}%
                    </span>
                  ))}
                </div>

                {/* 지역별 버튼 그리드 */}
                <div className="px-5 py-4 space-y-3">
                  {HALF_PRICE_BY_PROVINCE.map(({ province, regions }) => (
                    <div key={province} className="flex items-start gap-3">
                      <span className="shrink-0 mt-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
                        {province}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {regions.map((r) => (
                          <button
                            key={r}
                            onClick={() => router.push(`/half-price/${encodeURIComponent(r)}`)}
                            className="px-3 py-1.5 rounded-xl text-sm font-semibold
                              bg-white border border-emerald-300 text-emerald-800
                              hover:bg-emerald-600 hover:text-white hover:border-emerald-600
                              transition-all shadow-sm flex items-center gap-1"
                          >
                            <BadgePercent size={12} className="opacity-70" />
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 안내 */}
                <div className="px-5 py-3 bg-emerald-100/60 text-xs text-emerald-800 flex items-start gap-2 border-t border-emerald-100">
                  <span className="shrink-0">📋</span>
                  <span>여행 <span className="font-semibold">전</span> 사전 신청 필수 · 환급금은 지역사랑상품권(착 앱)으로 지급 · 인접 시군구 거주자 제외</span>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* 이용 안내 */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">{t.howToUse}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: t.step1Title, desc: t.step1Desc },
              { step: '02', title: t.step2Title, desc: t.step2Desc },
              { step: '03', title: t.step3Title, desc: t.step3Desc },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 font-black text-lg text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-slate-400 text-sm border-t border-slate-200 bg-white">
        {t.footerText(ALL_REGIONS.length)}
      </footer>
    </main>
  );
}
