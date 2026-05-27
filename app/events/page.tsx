'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { ALL_REGIONS } from '@/lib/data/koreaData';
import { useLang } from '@/lib/context/LangContext';

const SUPPORTED_REGIONS = new Set(ALL_REGIONS.map((r) => r.name));

// province(광역시) 우선, 없으면 regionName(시군구) 순으로 지원 지역 결정
function getEffectiveRegion(ev: BrowseEvent): string | null {
  if (SUPPORTED_REGIONS.has(ev.province)) return ev.province;
  if (SUPPORTED_REGIONS.has(ev.regionName)) return ev.regionName;
  return null;
}

interface BrowseEvent {
  id: string;
  title: string;
  addr1: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: 'ongoing' | 'upcoming';
  province: string;
  regionName: string;
  lat: number;
  lng: number;
}

const PROVINCES = [
  '전체', '서울', '부산', '인천', '대전', '대구', '광주', '울산', '세종',
  '경기', '강원', '충북', '충남', '경북', '경남', '전북', '전남', '제주',
];

function kstToday(): string {
  const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return [
    kst.getFullYear(),
    String(kst.getMonth() + 1).padStart(2, '0'),
    String(kst.getDate()).padStart(2, '0'),
  ].join('');
}

function nextMonthFirst(): string {
  const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const d = new Date(kst.getFullYear(), kst.getMonth() + 1, 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    '01',
  ].join('');
}

function threeMonthsLater(): string {
  const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const d = new Date(kst.getFullYear(), kst.getMonth() + 3, 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    '01',
  ].join('');
}

function formatDate(s: string): string {
  if (!s || s.length !== 8) return s ?? '';
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

function EventCard({
  event,
  effectiveRegion,
  onPlan,
}: {
  event: BrowseEvent;
  effectiveRegion: string | null;
  onPlan: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const { t } = useLang();

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200">
      {/* Image */}
      <div className="relative w-full h-44 bg-slate-100 shrink-0">
        {event.imageUrl && !imgErr ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            onError={() => setImgErr(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <Sparkles size={36} className="text-blue-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold border
            ${event.status === 'ongoing'
              ? 'bg-green-100 text-green-700 border-green-300'
              : 'bg-blue-100 text-blue-700 border-blue-300'
            }`}
        >
          {event.status === 'ongoing' ? t.ongoing : t.upcoming}
        </span>

        {event.province && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/40 text-white border border-white/20">
            {event.province}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{event.title}</h3>

        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Calendar size={11} className="shrink-0" />
          <span>{formatDate(event.startDate)} ~ {formatDate(event.endDate)}</span>
        </div>

        {event.addr1 && (
          <div className="flex items-start gap-1.5 text-slate-400 text-xs">
            <MapPin size={11} className="shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.addr1}</span>
          </div>
        )}

        <div className="mt-auto pt-2">
          <button
            onClick={onPlan}
            disabled={!effectiveRegion}
            title={!effectiveRegion ? '아직 지원하지 않는 지역이에요' : undefined}
            className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
              text-xs font-semibold transition-colors shadow-sm
              ${effectiveRegion
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
          >
            <MapPin size={13} />
            {effectiveRegion
              ? t.planTrip(effectiveRegion)
              : t.unsupportedRegion(event.regionName || event.province)}
            {effectiveRegion && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

const DATE_TAB_FROMS = [kstToday, nextMonthFirst, threeMonthsLater];

export default function EventsPage() {
  const router = useRouter();
  const { t } = useLang();
  const [tab, setTab] = useState(0);
  const [province, setProvince] = useState('전체');
  const [events, setEvents] = useState<BrowseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const DATE_TABS = [
    { label: t.thisMonth, getFrom: DATE_TAB_FROMS[0] },
    { label: t.nextMonth, getFrom: DATE_TAB_FROMS[1] },
    { label: t.threeMonths, getFrom: DATE_TAB_FROMS[2] },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = DATE_TAB_FROMS[tab]();
      const prov = province === '전체' ? '' : province;
      const qs = new URLSearchParams({ from });
      if (prov) qs.set('province', prov);
      const res = await fetch(`/api/events/browse?${qs.toString()}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [tab, province]);

  useEffect(() => { load(); }, [load]);

  const handlePlan = (ev: BrowseEvent, effectiveRegion: string) => {
    const p = new URLSearchParams({
      region: effectiveRegion,
      eventTitle: ev.title,
      eventDate: `${formatDate(ev.startDate)} ~ ${formatDate(ev.endDate)}`,
      eventAddr: ev.addr1,
      eventImage: ev.imageUrl,
      eventLat: String(ev.lat),
      eventLng: String(ev.lng),
    });
    router.push(`/places?${p.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-50">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-slate-200 bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight">{t.eventsTitle}</h1>
            <p className="text-slate-500 text-sm">{t.eventsSubtitle}</p>
          </div>
        </div>

        {/* Date tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-2">
          {DATE_TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setTab(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                tab === i
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Province chips */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {PROVINCES.map((p) => (
            <button
              key={p}
              onClick={() => setProvince(p)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                province === p
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={40} className="text-blue-500 animate-spin" />
            <p className="text-slate-600 font-medium">{t.loadingEvents}</p>
            <p className="text-slate-400 text-sm">{t.loadingEventsApi}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Sparkles size={48} className="text-slate-300" />
            <p className="text-slate-600 font-medium">{t.noEvents}</p>
            <button
              onClick={() => { setProvince('전체'); setTab(0); }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm"
            >
              {t.resetFilter}
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-4">
              {t.eventsFound(events.length, province)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {events.map((ev) => {
                const effectiveRegion = getEffectiveRegion(ev);
                return (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    effectiveRegion={effectiveRegion}
                    onPlan={() => effectiveRegion && handlePlan(ev, effectiveRegion)}
                  />
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
