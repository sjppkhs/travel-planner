import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const TOUR_BASE = 'https://apis.data.go.kr/B551011/KorService2';

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

export interface BrowseEvent {
  id: string;
  title: string;
  addr1: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: 'ongoing' | 'upcoming';
  province: string;
  regionName: string;
}

function todayKST(): string {
  const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return [
    kst.getFullYear(),
    String(kst.getMonth() + 1).padStart(2, '0'),
    String(kst.getDate()).padStart(2, '0'),
  ].join('');
}

function extractProvince(addr1: string): string {
  if (!addr1) return '';
  const a = addr1;
  if (a.startsWith('서울')) return '서울';
  if (a.startsWith('부산')) return '부산';
  if (a.startsWith('인천')) return '인천';
  if (a.startsWith('대전')) return '대전';
  if (a.startsWith('대구')) return '대구';
  if (a.startsWith('광주')) return '광주';
  if (a.startsWith('울산')) return '울산';
  if (a.startsWith('세종')) return '세종';
  if (a.startsWith('경기')) return '경기';
  if (a.startsWith('강원')) return '강원';
  if (a.startsWith('충청북도') || a.startsWith('충북')) return '충북';
  if (a.startsWith('충청남도') || a.startsWith('충남')) return '충남';
  if (a.startsWith('경상북도') || a.startsWith('경북')) return '경북';
  if (a.startsWith('경상남도') || a.startsWith('경남')) return '경남';
  if (a.startsWith('전라북도') || a.startsWith('전북')) return '전북';
  if (a.startsWith('전라남도') || a.startsWith('전남')) return '전남';
  if (a.startsWith('제주')) return '제주';
  return '';
}

function extractCity(addr1: string): string {
  if (!addr1) return '';
  const parts = addr1.trim().split(/\s+/);
  const city = parts[1] ?? parts[0] ?? '';
  return city.replace(/(특별시|광역시|특별자치시|특별자치도|시|군|구)$/, '');
}

async function fetchPage(
  key: string,
  from: string,
  pageNo: number,
): Promise<{ items: FestivalItem[]; total: number }> {
  const url = new URL(`${TOUR_BASE}/searchFestival2`);
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'KoreaTravelPlanner');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('eventStartDate', from);
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('arrange', 'B');

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
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
  const sp = req.nextUrl.searchParams;
  const from = sp.get('from') ?? todayKST();
  const province = sp.get('province') ?? '';

  const key = process.env.TOUR_API_KEY;
  if (!key) return NextResponse.json({ events: [], total: 0, from });

  try {
    const { items: p1, total } = await fetchPage(key, from, 1);
    let all = [...p1];
    if (total > 100) {
      const { items: p2 } = await fetchPage(key, from, 2);
      all = [...all, ...p2];
    }
    if (total > 200) {
      const { items: p3 } = await fetchPage(key, from, 3);
      all = [...all, ...p3];
    }

    const events: BrowseEvent[] = all
      .filter((it) => it?.contentid && it.progresstype !== '03')
      .map((it) => ({
        id: `ev-${it.contentid}`,
        title: it.title ?? '',
        addr1: it.addr1 ?? '',
        imageUrl: it.firstimage || it.firstimage2 || '',
        startDate: it.eventstartdate ?? '',
        endDate: it.eventenddate ?? '',
        status: it.progresstype === '01' ? 'ongoing' : 'upcoming',
        province: extractProvince(it.addr1 ?? ''),
        regionName: extractCity(it.addr1 ?? ''),
      }));

    const result = province
      ? events.filter((e) => e.province === province)
      : events;

    return NextResponse.json({ events: result, total: result.length, from });
  } catch (err) {
    console.error('[API/events/browse]', err);
    return NextResponse.json({ events: [], total: 0, from });
  }
}
