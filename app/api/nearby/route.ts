import { NextRequest, NextResponse } from 'next/server';
import type { NearbyRestaurant, NearbyAccommodation } from '@/lib/types';

export const runtime = 'nodejs';

const TOUR_BASE = 'https://apis.data.go.kr/B551011/KorService2';

interface TourLocationItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  mapx: string;
  mapy: string;
  firstimage: string;
  firstimage2: string;
  dist: string;
  cat3: string;
}

const FOOD_CAT_LABEL: Record<string, string> = {
  A05020100: '한식',
  A05020200: '서양식',
  A05020300: '일식',
  A05020400: '중식',
  A05020700: '이색음식점',
  A05020900: '카페/전통찻집',
};

const STAY_CAT_LABEL: Record<string, string> = {
  B02010100: '관광호텔',
  B02010500: '한국전통호텔',
  B02010600: '가족호텔',
  B02011000: '호스텔',
  B02011100: '소형호텔',
  B02020100: '콘도미니엄',
  B02030100: '야영장',
  B02040000: '모텔',
  B02050300: '게스트하우스',
  B02060100: '한옥',
};

async function fetchNearby(
  key: string,
  lat: string,
  lng: string,
  radius: string,
  contentTypeId: string,
  numOfRows: string,
): Promise<TourLocationItem[]> {
  const url = new URL(`${TOUR_BASE}/locationBasedList2`);
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'KoreaTravelPlanner');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('mapX', lng);
  url.searchParams.set('mapY', lat);
  url.searchParams.set('radius', radius);
  url.searchParams.set('contentTypeId', contentTypeId);
  url.searchParams.set('numOfRows', numOfRows);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('arrange', 'S'); // 거리순

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = await res.json();
  const items = data?.response?.body?.items?.item ?? [];
  return Array.isArray(items) ? items : items ? [items] : [];
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  const type = req.nextUrl.searchParams.get('type') ?? 'food'; // food | stay
  const radius = req.nextUrl.searchParams.get('radius') ?? (type === 'stay' ? '2000' : '1000');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat, lng 파라미터가 필요합니다' }, { status: 400 });
  }

  const key = process.env.TOUR_API_KEY;
  if (!key) {
    return type === 'stay'
      ? NextResponse.json({ accommodations: [] })
      : NextResponse.json({ restaurants: [] });
  }

  try {
    if (type === 'stay') {
      const items = await fetchNearby(key, lat, lng, radius, '32', '8');
      const accommodations: NearbyAccommodation[] = items
        .filter((item) => item?.contentid)
        .map((item) => ({
          id: `na-${item.contentid}`,
          name: item.title,
          address: item.addr1 ?? '',
          distanceM: Math.round(parseFloat(item.dist) || 0),
          imageUrl: item.firstimage || item.firstimage2 || '',
          category: STAY_CAT_LABEL[item.cat3] ?? '숙소',
        }));
      return NextResponse.json({ accommodations });
    } else {
      const items = await fetchNearby(key, lat, lng, radius, '39', '8');
      const restaurants: NearbyRestaurant[] = items
        .filter((item) => item?.contentid)
        .map((item) => ({
          id: `nr-${item.contentid}`,
          name: item.title,
          address: item.addr1 ?? '',
          distanceM: Math.round(parseFloat(item.dist) || 0),
          imageUrl: item.firstimage || item.firstimage2 || '',
          category: FOOD_CAT_LABEL[item.cat3] ?? '음식점',
        }));
      return NextResponse.json({ restaurants });
    }
  } catch (err) {
    console.error('[API/nearby] Error:', err);
    return type === 'stay'
      ? NextResponse.json({ accommodations: [] })
      : NextResponse.json({ restaurants: [] });
  }
}
