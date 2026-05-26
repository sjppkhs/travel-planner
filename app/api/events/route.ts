import { NextRequest, NextResponse } from 'next/server';
import type { RegionalEvent } from '@/lib/types';

export const runtime = 'nodejs';

const TOUR_BASE = 'https://apis.data.go.kr/B551011/KorService2';

// 지역명 → 주소 검색 키워드 (addr1에 포함되는 행정구역명)
const REGION_ADDR_KEYWORDS: Record<string, string[]> = {
  서울: ['서울'],
  부산: ['부산'],
  인천: ['인천'],
  대전: ['대전'],
  대구: ['대구'],
  광주: ['광주'],
  울산: ['울산'],
  세종: ['세종'],
  경기: ['경기'],
  수원: ['수원'],
  강릉: ['강릉'],
  속초: ['속초'],
  춘천: ['춘천'],
  안동: ['안동'],
  경주: ['경주'],
  문경: ['문경'],
  포항: ['포항'],
  통영: ['통영'],
  남해: ['남해'],
  전주: ['전주'],
  담양: ['담양'],
  목포: ['목포'],
  여수: ['여수'],
  제주: ['제주'],
};

interface FestivalItem {
  contentid: string;
  title: string;
  addr1: string;
  firstimage: string;
  firstimage2: string;
  eventstartdate: string;
  eventenddate: string;
  progresstype: string; // 01=진행중, 02=예정, 03=종료
  areacode: string;
}

function todayKST(): string {
  const d = new Date();
  const kst = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

async function fetchFestivals(key: string, today: string, pageNo = 1): Promise<{ items: FestivalItem[]; total: number }> {
  const url = new URL(`${TOUR_BASE}/searchFestival2`);
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'KoreaTravelPlanner');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('eventStartDate', today);
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('arrange', 'A'); // 날짜순

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) return { items: [], total: 0 };

  const data = await res.json();
  const body = data?.response?.body;
  const total = Number(body?.totalCount ?? 0);
  const raw = body?.items;
  const items: FestivalItem[] = !raw || raw === ''
    ? []
    : Array.isArray(raw.item) ? raw.item : raw.item ? [raw.item] : [];

  return { items, total };
}

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get('region')?.trim();
  if (!region) {
    return NextResponse.json({ error: 'region 파라미터가 필요합니다' }, { status: 400 });
  }

  const key = process.env.TOUR_API_KEY;
  const today = todayKST();
  if (!key) return NextResponse.json({ events: [], today });

  const keywords = REGION_ADDR_KEYWORDS[region] ?? [region];

  try {
    // 전국 행사 조회 (최대 2페이지 = 200건) 후 주소로 필터
    const { items: page1, total } = await fetchFestivals(key, today, 1);
    let allItems = [...page1];

    if (total > 100) {
      const { items: page2 } = await fetchFestivals(key, today, 2);
      allItems = [...allItems, ...page2];
    }

    // 주소에 지역 키워드가 포함된 행사만 필터
    const filtered = allItems.filter((it) => {
      if (!it?.contentid || it.progresstype === '03') return false;
      const addr = (it.addr1 ?? '') + (it.title ?? '');
      return keywords.some((kw) => addr.includes(kw));
    });

    const events: RegionalEvent[] = filtered.map((it) => ({
      id: `ev-${it.contentid}`,
      title: it.title,
      address: it.addr1 ?? '',
      imageUrl: it.firstimage || it.firstimage2 || '',
      startDate: it.eventstartdate ?? '',
      endDate: it.eventenddate ?? '',
      status: it.progresstype === '01' ? 'ongoing' : 'upcoming',
    }));

    return NextResponse.json({ events, today });
  } catch (err) {
    console.error('[API/events] Error:', err);
    return NextResponse.json({ events: [], today });
  }
}
