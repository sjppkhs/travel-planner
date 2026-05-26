'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Database,
  Globe,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  Tag,
  Ticket,
} from 'lucide-react';
import type { TravelSpot } from '@/lib/types';

const CATEGORY_LABEL: Record<string, string> = {
  attraction: '관광지',
  food: '먹거리',
  nature: '자연',
  culture: '문화',
  shopping: '쇼핑',
  activity: '액티비티',
};

const CATEGORY_COLOR: Record<string, string> = {
  attraction: 'bg-orange-100 text-orange-700 border-orange-300',
  food: 'bg-rose-100 text-rose-700 border-rose-300',
  nature: 'bg-green-100 text-green-700 border-green-300',
  culture: 'bg-purple-100 text-purple-700 border-purple-300',
  shopping: 'bg-pink-100 text-pink-700 border-pink-300',
  activity: 'bg-cyan-100 text-cyan-700 border-cyan-300',
};

function PlaceCard({
  spot,
  selected,
  order,
  onToggle,
  isEventVenue = false,
}: {
  spot: TravelSpot;
  selected: boolean;
  order: number;
  onToggle: () => void;
  isEventVenue?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

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

        {/* 행사장 배지 or Category badge */}
        {isEventVenue ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold border
            bg-violet-500 text-white border-violet-400 flex items-center gap-1">
            <Sparkles size={11} />
            행사장
          </span>
        ) : (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold border
              ${CATEGORY_COLOR[spot.category]}`}
          >
            {CATEGORY_LABEL[spot.category]}
          </span>
        )}

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
            <span>약 {spot.estimatedVisitTime}분</span>
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
  const region = params.get('region') ?? '';
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

  const categories = ['all', ...Array.from(new Set(spots.map((s) => s.category)))];
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
        <p className="text-slate-700 font-medium">{region} 여행지 정보를 불러오는 중...</p>
        <p className="text-slate-400 text-sm">TourAPI + Google Places 조회 중</p>
      </div>
    );
  }

  if (!loading && spots.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <MapPin size={48} className="text-slate-300" />
        <p className="text-slate-700 text-lg font-medium">
          &apos;{region}&apos; 지역의 여행지 정보를 찾을 수 없어요
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm"
        >
          <ArrowLeft size={18} />
          돌아가기
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
            <h1 className="font-bold text-slate-900 text-lg leading-tight">
              {region} 여행지 선택
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-slate-500 text-sm">
                {spots.length}개 · {selected.length}개 선택됨
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
            일정 생성
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Category filter */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all
                ${activeCategory === cat
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
            >
              {cat === 'all' ? '전체' : CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* 행사 출발 배너 */}
        {eventTitle && (
          <div className="mb-4 p-4 rounded-xl bg-violet-50 border border-violet-200 flex items-start gap-3">
            <Sparkles size={18} className="text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-violet-800 font-semibold text-sm line-clamp-2">{eventTitle}</p>
              {eventDate && (
                <p className="text-violet-500 text-xs mt-0.5">{eventDate} · 이 행사를 기준으로 여행 코스를 골라보세요</p>
              )}
            </div>
          </div>
        )}

        {selected.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200
            text-blue-700 text-sm font-medium">
            {selected.length}개 선택 완료 · 원하는 곳을 더 선택하거나{' '}
            <button
              onClick={handleGenerate}
              className="underline font-bold hover:text-blue-900"
            >
              일정 생성하기
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
              <p className="text-slate-900 font-semibold">{selected.length}개 장소 선택됨</p>
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
              일정 리포트 생성
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
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
