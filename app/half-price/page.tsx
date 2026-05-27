'use client';

import { useRouter } from 'next/navigation';
import { BadgePercent, ChevronRight, MapPin, ArrowLeft } from 'lucide-react';
import { HALF_PRICE_BY_PROVINCE, GROUP_INFO } from '@/lib/data/benefits';

export default function HalfPricePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div
        className="px-4 pt-10 pb-8 text-white"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/70 hover:text-white mb-5 text-sm transition-colors"
          >
            <ArrowLeft size={16} /> 돌아가기
          </button>

          <div className="flex items-center gap-2 mb-2">
            <BadgePercent size={24} className="text-emerald-300" />
            <span className="text-emerald-300 font-semibold text-sm">반값여행지원금</span>
          </div>
          <h1 className="text-2xl font-black mb-1">지원 가능 지역으로 여행하기</h1>
          <p className="text-white/75 text-sm">
            2026년 상반기 · 여행 경비의 50~70%를 지역사랑상품권으로 환급
          </p>
        </div>
      </div>

      {/* 환급 그룹 요약 */}
      <section className="max-w-2xl mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">그룹별 환급 한도</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(GROUP_INFO).map((g) => (
              <div key={g.label} className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{g.label}</p>
                <p className="text-emerald-700 font-black text-lg leading-tight">
                  {(g.cap / 10000).toFixed(0)}만원
                </p>
                <p className="text-emerald-500 text-xs">{Math.round(g.rate * 100)}% 환급</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">신청 유의사항</span><br />
            여행 <span className="font-semibold">전</span> 사전 신청 필수 · 환급금은 <span className="font-semibold">지역사랑상품권(착 앱)</span>으로 지급 · 인접 시군구 거주자 제외
          </div>
        </div>
      </section>

      {/* 지역별 목록 */}
      <section className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {HALF_PRICE_BY_PROVINCE.map(({ province, regions }) => (
          <div key={province}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                {province}
              </span>
              <span className="text-slate-400 text-xs">{regions.length}개 지역</span>
            </div>
            <div className="space-y-2">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => router.push(`/half-price/${encodeURIComponent(region)}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3.5
                    border border-slate-200 hover:border-emerald-400 hover:shadow-md
                    transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0
                    group-hover:bg-emerald-500 transition-colors">
                    <MapPin size={16} className="text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{region}</p>
                    <p className="text-slate-400 text-xs mt-0.5">관광지 · 식당 · 숙박 정보 보기</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                      반값지원
                    </span>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
