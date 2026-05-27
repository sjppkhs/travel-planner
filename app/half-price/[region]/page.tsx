'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BadgePercent, MapPin, Phone, ChevronRight,
  Utensils, Building2, Landmark, ExternalLink,
} from 'lucide-react';
import { GROUP_INFO, HALF_PRICE_BY_PROVINCE } from '@/lib/data/benefits';
import type { HalfPriceItem } from '@/app/api/half-price/route';

type Tab = 'attraction' | 'food' | 'lodging';

const TABS: { key: Tab; label: string; icon: typeof Landmark }[] = [
  { key: 'attraction', label: '관광지', icon: Landmark },
  { key: 'food',       label: '식당',   icon: Utensils },
  { key: 'lodging',    label: '숙박',   icon: Building2 },
];

interface RegionData {
  attractions: HalfPriceItem[];
  restaurants: HalfPriceItem[];
  lodging: HalfPriceItem[];
}

function getProvince(region: string) {
  return HALF_PRICE_BY_PROVINCE.find((p) => p.regions.includes(region))?.province ?? '';
}

function ItemCard({ item }: { item: HalfPriceItem }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {item.imageUrl ? (
        <div className="h-36 bg-slate-100 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
          <MapPin size={32} className="text-emerald-300" />
        </div>
      )}
      <div className="p-3">
        <p className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{item.name}</p>
        {item.address && (
          <p className="text-slate-400 text-xs mt-1 line-clamp-1">{item.address}</p>
        )}
        {item.tel && (
          <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
            <Phone size={10} className="shrink-0" /> {item.tel}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HalfPriceRegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region: encodedRegion } = use(params);
  const region = decodeURIComponent(encodedRegion);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('attraction');
  const [data, setData] = useState<RegionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const province = getProvince(region);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/half-price?region=${encodeURIComponent(region)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [region]);

  const currentItems = data
    ? activeTab === 'attraction'
      ? data.attractions
      : activeTab === 'food'
        ? data.restaurants
        : data.lodging
    : [];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div
        className="px-4 pt-10 pb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/70 hover:text-white mb-4 text-sm transition-colors"
          >
            <ArrowLeft size={16} /> 반값여행 지역 목록
          </button>

          <div className="flex items-center gap-2 mb-1">
            {province && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white/80 text-xs font-semibold">
                {province}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300 text-emerald-100 text-xs font-semibold flex items-center gap-1">
              <BadgePercent size={11} /> 반값여행 지원 가능
            </span>
          </div>

          <h1 className="text-3xl font-black mt-2 mb-1">{region}</h1>
          <p className="text-white/70 text-sm">2026년 상반기 · 여행 경비 50~70% 환급</p>
        </div>
      </div>

      {/* 환급 요약 칩 */}
      <section className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.values(GROUP_INFO).map((g) => (
            <span
              key={g.label}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                bg-white border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-sm"
            >
              {g.label}
              <span className="text-slate-300">·</span>
              최대 <span className="text-emerald-600 font-black">{(g.cap / 10000).toFixed(0)}만원</span>
            </span>
          ))}
        </div>

        {/* 여행 계획하기 CTA */}
        <button
          onClick={() => router.push(`/places?region=${encodeURIComponent(region)}`)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl
            text-white font-bold shadow-md hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
        >
          <div>
            <p className="text-base leading-tight">{region} 여행 일정 계획하기</p>
            <p className="text-white/70 text-xs font-normal mt-0.5">장소를 선택하고 최적 경로를 받아보세요</p>
          </div>
          <ChevronRight size={22} className="shrink-0 text-white/70" />
        </button>
      </section>

      {/* 탭 */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === key
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        {loading && (
          <div className="text-center py-16 text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">{region} 정보를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {!loading && !error && currentItems.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">등록된 {TABS.find((t) => t.key === activeTab)?.label} 정보가 없어요</p>
          </div>
        )}

        {!loading && !error && currentItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pb-6">
            {currentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* 착 앱 안내 */}
      <section className="max-w-2xl mx-auto px-4 pb-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <ExternalLink size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm mb-2">환급금 수령 — 착(Chak) 앱 안내</p>
              <ul className="text-xs text-amber-800 space-y-1.5 leading-relaxed">
                <li>• 환급금은 <span className="font-semibold">지역사랑상품권</span>으로 지급됩니다</li>
                <li>• <span className="font-semibold">착 앱</span>에서 신청·사용 가능한 가맹점을 확인하세요</li>
                <li>• 여행 <span className="font-semibold">출발 전</span> 사전 신청이 반드시 필요합니다</li>
                <li>• 인접 시군구 거주자는 지원 대상에서 제외됩니다</li>
                <li>• 앱 스토어에서 <span className="font-semibold">「지역사랑상품권 착」</span>을 검색하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
