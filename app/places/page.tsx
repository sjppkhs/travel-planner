'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  BadgePercent,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Database,
  ExternalLink,
  Globe,
  Landmark,
  Loader2,
  MapPin,
  Palette,
  Phone,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Ticket,
  TreePine,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import type { TravelSpot } from '@/lib/types';
import { useLang } from '@/lib/context/LangContext';
import { HALF_PRICE_ELIGIBLE, GROUP_INFO } from '@/lib/data/benefits';
import type { HalfPriceItem } from '@/lib/data/benefits';

const CATEGORY_KEYS = ['attraction', 'food', 'nature', 'culture', 'shopping', 'activity'] as const;

// 카테고리 필터 탭 아이콘 (카드 뱃지와 별개)
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  attraction: <Landmark size={11} />,
  food: <Utensils size={11} />,
  nature: <TreePine size={11} />,
  culture: <Palette size={11} />,
  shopping: <ShoppingBag size={11} />,
  activity: <Zap size={11} />,
};

// ── 반값 팝업 탭 ──────────────────────────────────────────────────
type DrawerTab = 'attraction' | 'food' | 'lodging';
const DRAWER_TABS: { key: DrawerTab; label: string; icon: React.ReactNode }[] = [
  { key: 'attraction', label: '관광지', icon: <Landmark size={14} /> },
  { key: 'food',       label: '식당',   icon: <Utensils size={14} /> },
  { key: 'lodging',    label: '숙박',   icon: <Building2 size={14} /> },
];

function HalfPriceDrawer({
  region,
  open,
  onClose,
}: {
  region: string;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DrawerTab>('attraction');
  const [data, setData] = useState<{ attractions: HalfPriceItem[]; restaurants: HalfPriceItem[]; lodging: HalfPriceItem[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (open && !fetched.current) {
      fetched.current = true;
      setLoading(true);
      fetch(`/api/half-price?region=${encodeURIComponent(region)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => setData(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, region]);

  const items =
    data
      ? tab === 'attraction'
        ? data.attractions
        : tab === 'food'
          ? data.restaurants
          : data.lodging
      : [];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[85dvh]
        bg-white rounded-t-2xl shadow-2xl overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <BadgePercent size={16} className="text-emerald-600" />
              <span className="font-bold text-slate-900">{region} 반값여행 정보</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">2026 상반기 · 50~70% 환급</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 환급 칩 */}
        <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-slate-100 shrink-0">
          {Object.values(GROUP_INFO).map((g) => (
            <span
              key={g.label}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700"
            >
              {g.label}
              <span className="text-slate-300">·</span>
              최대 {(g.cap / 10000).toFixed(0)}만원
            </span>
          ))}
        </div>

        {/* 탭 */}
        <div className="px-5 py-2 flex gap-1 border-b border-slate-100 shrink-0">
          {DRAWER_TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                ${tab === key
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* 아이템 목록 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={28} className="text-emerald-500 animate-spin" />
              <p className="text-slate-400 text-sm">{region} 정보를 불러오는 중...</p>
            </div>
          )}

          {!loading && items.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-12">
              등록된 {DRAWER_TABS.find((t) => t.key === tab)?.label} 정보가 없어요
            </p>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200"
                >
                  {item.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg shrink-0 bg-emerald-100 flex items-center justify-center">
                      <MapPin size={20} className="text-emerald-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">{item.name}</p>
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
              ))}
            </div>
          )}
        </div>

        {/* 착 앱 안내 */}
        <div className="px-5 py-3 border-t border-slate-100 bg-amber-50 shrink-0">
          <div className="flex items-start gap-2 text-xs text-amber-800">
            <ExternalLink size={13} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              환급금은 <span className="font-semibold">지역사랑상품권(착 앱)</span>으로 지급됩니다.
              여행 <span className="font-semibold">전</span> 사전 신청 필수 · 앱스토어에서 <span className="font-semibold">「지역사랑상품권 착」</span> 검색
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── 장소 카드 ────────────────────────────────────────────────────
function PlaceCard({
  spot,
  selected,
  order,
  onToggle,
  isEventVenue = false,
  isHalfPrice = false,
}: {
  spot: TravelSpot;
  selected: boolean;
  order: number;
  onToggle: () => void;
  isEventVenue?: boolean;
  isHalfPrice?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const { t } = useLang();

  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col rounded-2xl overflow-hidden border text-left
        transition-all duration-200
        ${isEventVenue && !selected
          ? 'border-violet-400 ring-2 ring-violet-400/20 shadow-md'
          : selected
          ? 'border-blue-500 ring-2 ring-blue-500/30 scale-[1.01] shadow-lg'
          : 'border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md'
        }
        bg-white`}
    >
      {/* Image */}
      <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
        {spot.imageUrl && !imgError ? (
          <Image
            src={spot.imageUrl}
            alt={spot.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-blue-100">
            <Sparkles size={40} className="text-violet-300" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* 배지: 행사장 > 반값 라벨 > 없음 */}
        {isEventVenue ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold border
            bg-violet-500 text-white border-violet-400 flex items-center gap-1">
            <Sparkles size={11} />
            {t.eventVenueLabel}
          </span>
        ) : isHalfPrice && spot.category === 'attraction' ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold
            bg-emerald-500 text-white flex items-center gap-1">
            <BadgePercent size={11} />
            반값 지정관광지
          </span>
        ) : isHalfPrice && spot.category === 'food' ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold
            bg-emerald-500 text-white flex items-center gap-1">
            <BadgePercent size={11} />
            지원금 사용 가능
          </span>
        ) : null}

        {/* Selection indicator */}
        <div
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
            transition-all duration-200 font-bold text-sm
            ${selected
              ? 'bg-blue-500 text-white scale-110 shadow-md'
              : 'bg-black/30 border border-white/40 text-white/60'
            }`}
        >
          {selected ? order : <Check size={14} className="opacity-0" />}
        </div>

        {/* Rating */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-white text-xs font-semibold">{spot.rating}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-slate-900 text-base leading-tight">{spot.name}</h3>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{spot.description}</p>

        <div className="flex flex-wrap gap-2 mt-1">
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Clock size={12} />
            <span>{t.estVisitTime(spot.estimatedVisitTime)}</span>
          </div>
          {spot.admissionFee && (
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Ticket size={12} />
              <span className="truncate max-w-[120px]">{spot.admissionFee.split('/')[0].trim()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-1">
          {spot.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-0.5 px-2 py-0.5 rounded-full
                bg-blue-50 text-blue-600 text-xs"
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  local: { label: '내장 데이터', color: 'text-slate-500' },
  'local-fallback': { label: '내장 데이터 (API 오류)', color: 'text-amber-600' },
  tour: { label: '한국관광공사', color: 'text-green-600' },
  google: { label: 'Google Places', color: 'text-blue-600' },
  auto: { label: 'TourAPI + Google', color: 'text-purple-600' },
};

function PlacesContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, lang } = useLang();
  const region = params.get('region') ?? '';
  const isHalfPrice = HALF_PRICE_ELIGIBLE.has(region);
  const eventTitle = params.get('eventTitle') ?? '';
  const eventDate = params.get('eventDate') ?? '';
  const eventAddr = params.get('eventAddr') ?? '';
  const eventImage = params.get('eventImage') ?? '';
  const eventLat = parseFloat(params.get('eventLat') ?? '0') || 0;
  const eventLng = parseFloat(params.get('eventLng') ?? '0') || 0;

  const [spots, setSpots] = useState<TravelSpot[]>([]);
  const [dataSource, setDataSource] = useState<string>('local');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(
    eventTitle ? ['event-venue'] : [],
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!region) return;
    setLoading(true);

    const venueSpot: TravelSpot | null = eventTitle
      ? {
          id: 'event-venue',
          name: eventTitle,
          region,
          category: 'culture',
          description: `${eventDate} 기간 동안 열리는 행사·축제 장소입니다.`,
          imageUrl: eventImage,
          address: eventAddr,
          coordinates: { lat: eventLat, lng: eventLng },
          tags: ['행사', '축제'],
          estimatedVisitTime: 120,
          tips: eventDate ? [`행사 기간: ${eventDate}`] : [],
          nearbyTransit: [],
          rating: 4.5,
        }
      : null;

    const inject = (base: TravelSpot[]) =>
      venueSpot ? [venueSpot, ...base] : base;

    fetch(`/api/spots?region=${encodeURIComponent(region)}`)
      .then((r) => r.json())
      .then((data) => {
        setSpots(inject(data.spots ?? []));
        setDataSource(data.source ?? 'local');
      })
      .catch(() => {
        import('@/lib/data/koreaData').then(({ searchSpots }) => {
          setSpots(inject(searchSpots(region)));
          setDataSource('local-fallback');
        });
      })
      .finally(() => setLoading(false));
  }, [region, eventTitle, eventDate, eventAddr, eventImage, eventLat, eventLng]);

  const categories = ['all', ...Array.from(new Set(spots.map((s) => s.category))).filter(c => CATEGORY_KEYS.includes(c as typeof CATEGORY_KEYS[number]))];
  const filtered =
    activeCategory === 'all' ? spots : spots.filter((s) => s.category === activeCategory);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  const orderOf = (id: string) => selected.indexOf(id) + 1;

  const handleGenerate = () => {
    if (selected.length === 0) return;
    const orderedSpots = selected.map((id) => spots.find((s) => s.id === id)!);
    sessionStorage.setItem('travel_spots', JSON.stringify(orderedSpots));
    sessionStorage.setItem('travel_region', region);
    router.push('/itinerary');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-slate-700 font-medium">{t.loadingSpots(region)}</p>
        <p className="text-slate-400 text-sm">{t.loadingApiDesc}</p>
      </div>
    );
  }

  if (!loading && spots.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <MapPin size={48} className="text-slate-300" />
        <p className="text-slate-700 text-lg font-medium">{t.noSpots(region)}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm"
        >
          <ArrowLeft size={18} />
          {t.goBack}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-slate-200 bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-slate-900 text-lg leading-tight">
                {t.selectingPlaces(region)}
              </h1>
              {isHalfPrice && lang === 'ko' && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-bold
                    hover:bg-emerald-200 transition-colors"
                >
                  <BadgePercent size={11} />
                  반값지원 가능 · 정보 보기
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-slate-500 text-sm">
                {t.nSpots(spots.length)} · {t.nSelected(selected.length)}
              </p>
              {dataSource && SOURCE_BADGE[dataSource] && (
                <span className={`text-xs font-medium flex items-center gap-1 ${SOURCE_BADGE[dataSource].color}`}>
                  {dataSource === 'local' || dataSource === 'local-fallback'
                    ? <Database size={11} />
                    : <Globe size={11} />}
                  {SOURCE_BADGE[dataSource].label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={selected.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600
              text-white shrink-0 shadow-sm"
          >
            {t.generateItinerary}
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Category filter */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all
                ${activeCategory === cat
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
            >
              {cat !== 'all' && CATEGORY_ICON[cat]}
              {cat === 'all' ? t.allCategories : ({ attraction: t.catAttraction, food: t.catFood, nature: t.catNature, culture: t.catCulture, shopping: t.catShopping, activity: t.catActivity } as Record<string,string>)[cat] ?? cat}
            </button>
          ))}
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* 반값여행지원 배너 */}
        {isHalfPrice && lang === 'ko' && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200
              flex items-center gap-3 text-left hover:bg-emerald-100 transition-colors group"
          >
            <BadgePercent size={18} className="text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="text-emerald-800 font-bold text-sm">
                {region}은(는) 반값여행지원금 대상 지역이에요!
              </p>
              <p className="text-emerald-600 text-xs mt-0.5">
                여행 경비의 50~70% 환급 · 청년 최대 14만원 · 사전 신청 필수
              </p>
            </div>
            <span className="text-emerald-600 text-xs font-semibold flex items-center gap-0.5 shrink-0
              group-hover:translate-x-0.5 transition-transform">
              관광지·식당·숙박 보기 <ChevronRight size={14} />
            </span>
          </button>
        )}

        {/* 행사 출발 배너 */}
        {eventTitle && (
          <div className="mb-4 p-4 rounded-xl bg-violet-50 border border-violet-200 flex items-start gap-3">
            <Sparkles size={18} className="text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-violet-800 font-semibold text-sm line-clamp-2">{eventTitle}</p>
              {eventDate && (
                <p className="text-violet-500 text-xs mt-0.5">{t.eventVenueDesc(eventDate)}</p>
              )}
            </div>
          </div>
        )}

        {selected.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200
            text-blue-700 text-sm font-medium">
            {t.selectionNotice(selected.length)}{' '}
            <button
              onClick={handleGenerate}
              className="underline font-bold hover:text-blue-900"
            >
              {t.selectionNoticeLink}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((spot) => (
            <PlaceCard
              key={spot.id}
              spot={spot}
              selected={selected.includes(spot.id)}
              order={orderOf(spot.id)}
              onToggle={() => toggle(spot.id)}
              isEventVenue={spot.id === 'event-venue'}
              isHalfPrice={isHalfPrice && lang === 'ko'}
            />
          ))}
        </div>
      </main>

      {/* Bottom sticky bar */}
      {selected.length > 0 && (
        <div
          className="no-print sticky bottom-0 z-40 border-t border-slate-200 px-4 py-4 bg-white/95"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-slate-900 font-semibold">{t.nSelectedSpots(selected.length)}</p>
              <p className="text-slate-500 text-sm">
                {selected
                  .map((id) => spots.find((s) => s.id === id)?.name)
                  .filter(Boolean)
                  .join(' → ')}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold
                bg-blue-600 hover:bg-blue-500 text-white text-sm shadow-sm"
            >
              {t.generateReport}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 반값 bottom-sheet 팝업 */}
      {isHalfPrice && lang === 'ko' && (
        <HalfPriceDrawer
          region={region}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

export default function PlacesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">여행지 로딩 중...</div>
      </div>
    }>
      <PlacesContent />
    </Suspense>
  );
}
