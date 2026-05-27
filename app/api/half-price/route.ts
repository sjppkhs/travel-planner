import { NextRequest, NextResponse } from 'next/server';
import { AREA_CODES } from '@/lib/api/tourApi';
import { HALF_PRICE_ELIGIBLE } from '@/lib/data/benefits';

export const runtime = 'nodejs';
export const revalidate = 3600;

const TOUR_BASE = 'https://apis.data.go.kr/B551011/KorService2';

export interface HalfPriceItem {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  tel: string;
  lat: number;
  lng: number;
  contentTypeId: string;
}

async function fetchByType(
  areaCode: string,
  sigunguCode: string | undefined,
  contentTypeId: string,
  numOfRows = 12,
): Promise<HalfPriceItem[]> {
  const key = process.env.TOUR_API_KEY;
  if (!key) return [];

  const url = new URL(`${TOUR_BASE}/areaBasedList2`);
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'KoreaTravelPlanner');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('numOfRows', String(numOfRows));
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('arrange', 'Q');
  url.searchParams.set('areaCode', areaCode);
  if (sigunguCode) url.searchParams.set('sigunguCode', sigunguCode);
  url.searchParams.set('contentTypeId', contentTypeId);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data?.response?.body?.items?.item;
    if (!raw) return [];
    const items = Array.isArray(raw) ? raw : [raw];
    return items.map((item) => ({
      id: `tour-${item.contentid}`,
      name: item.title ?? '',
      address: [item.addr1, item.addr2].filter(Boolean).join(' '),
      imageUrl: item.firstimage || item.firstimage2 || '',
      tel: item.tel ?? '',
      lat: parseFloat(item.mapy) || 0,
      lng: parseFloat(item.mapx) || 0,
      contentTypeId,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get('region')?.trim();
  if (!region) return NextResponse.json({ error: 'region required' }, { status: 400 });
  if (!HALF_PRICE_ELIGIBLE.has(region))
    return NextResponse.json({ error: 'region not eligible for half-price program' }, { status: 404 });

  const areaInfo = AREA_CODES[region];
  if (!areaInfo) return NextResponse.json({ error: 'unknown region' }, { status: 404 });

  const [attractions, restaurants, lodging] = await Promise.all([
    fetchByType(areaInfo.areaCode, areaInfo.sigunguCode, '12', 12), // 관광지
    fetchByType(areaInfo.areaCode, areaInfo.sigunguCode, '38', 12), // 음식점
    fetchByType(areaInfo.areaCode, areaInfo.sigunguCode, '32', 8),  // 숙박
  ]);

  return NextResponse.json({ region, attractions, restaurants, lodging });
}
