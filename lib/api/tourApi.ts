import type { TravelSpot, Category } from '../types';

// TourAPI 한국관광공사 (https://apis.data.go.kr/B551011/KorService2)
const TOUR_BASE = 'https://apis.data.go.kr/B551011/KorService2';

// 지역코드 매핑 — 전국 228개 시군구 (TourAPI areaCode + sigunguCode)
export const AREA_CODES: Record<string, { areaCode: string; sigunguCode?: string }> = {
  // ── 광역시도 ──
  서울: { areaCode: '1' },
  인천: { areaCode: '2' },
  대전: { areaCode: '3' },
  대구: { areaCode: '4' },
  광주: { areaCode: '5' },
  부산: { areaCode: '6' },
  울산: { areaCode: '7' },
  세종: { areaCode: '8' },
  경기: { areaCode: '31' },
  강원: { areaCode: '32' },
  충북: { areaCode: '33' },
  충남: { areaCode: '34' },
  경북: { areaCode: '35' },
  경남: { areaCode: '36' },
  전북: { areaCode: '37' },
  전남: { areaCode: '38' },
  제주: { areaCode: '39' },
  // ── 경기도 (31) ──
  가평: { areaCode: '31', sigunguCode: '1' },
  고양: { areaCode: '31', sigunguCode: '2' },
  과천: { areaCode: '31', sigunguCode: '3' },
  광명: { areaCode: '31', sigunguCode: '4' },
  광주시: { areaCode: '31', sigunguCode: '5' },
  구리: { areaCode: '31', sigunguCode: '6' },
  군포: { areaCode: '31', sigunguCode: '7' },
  김포: { areaCode: '31', sigunguCode: '8' },
  남양주: { areaCode: '31', sigunguCode: '9' },
  동두천: { areaCode: '31', sigunguCode: '10' },
  부천: { areaCode: '31', sigunguCode: '11' },
  성남: { areaCode: '31', sigunguCode: '12' },
  수원: { areaCode: '31', sigunguCode: '13' },
  시흥: { areaCode: '31', sigunguCode: '14' },
  안산: { areaCode: '31', sigunguCode: '15' },
  안성: { areaCode: '31', sigunguCode: '16' },
  안양: { areaCode: '31', sigunguCode: '17' },
  양주: { areaCode: '31', sigunguCode: '18' },
  양평: { areaCode: '31', sigunguCode: '19' },
  여주: { areaCode: '31', sigunguCode: '20' },
  연천: { areaCode: '31', sigunguCode: '21' },
  오산: { areaCode: '31', sigunguCode: '22' },
  용인: { areaCode: '31', sigunguCode: '23' },
  의왕: { areaCode: '31', sigunguCode: '24' },
  의정부: { areaCode: '31', sigunguCode: '25' },
  이천: { areaCode: '31', sigunguCode: '26' },
  파주: { areaCode: '31', sigunguCode: '27' },
  평택: { areaCode: '31', sigunguCode: '28' },
  포천: { areaCode: '31', sigunguCode: '29' },
  하남: { areaCode: '31', sigunguCode: '30' },
  화성: { areaCode: '31', sigunguCode: '31' },
  // ── 강원 (32) ──
  강릉: { areaCode: '32', sigunguCode: '1' },
  '고성(강원)': { areaCode: '32', sigunguCode: '2' },
  동해: { areaCode: '32', sigunguCode: '3' },
  삼척: { areaCode: '32', sigunguCode: '4' },
  속초: { areaCode: '32', sigunguCode: '5' },
  양구: { areaCode: '32', sigunguCode: '6' },
  양양: { areaCode: '32', sigunguCode: '7' },
  영월: { areaCode: '32', sigunguCode: '8' },
  원주: { areaCode: '32', sigunguCode: '9' },
  인제: { areaCode: '32', sigunguCode: '10' },
  정선: { areaCode: '32', sigunguCode: '11' },
  철원: { areaCode: '32', sigunguCode: '12' },
  춘천: { areaCode: '32', sigunguCode: '13' },
  태백: { areaCode: '32', sigunguCode: '14' },
  평창: { areaCode: '32', sigunguCode: '15' },
  홍천: { areaCode: '32', sigunguCode: '16' },
  화천: { areaCode: '32', sigunguCode: '17' },
  횡성: { areaCode: '32', sigunguCode: '18' },
  // ── 충북 (33) ──
  괴산: { areaCode: '33', sigunguCode: '1' },
  단양: { areaCode: '33', sigunguCode: '2' },
  보은: { areaCode: '33', sigunguCode: '3' },
  영동: { areaCode: '33', sigunguCode: '4' },
  옥천: { areaCode: '33', sigunguCode: '5' },
  음성: { areaCode: '33', sigunguCode: '6' },
  제천: { areaCode: '33', sigunguCode: '7' },
  진천: { areaCode: '33', sigunguCode: '8' },
  청주: { areaCode: '33', sigunguCode: '10' },
  충주: { areaCode: '33', sigunguCode: '11' },
  증평: { areaCode: '33', sigunguCode: '12' },
  // ── 충남 (34) ──
  공주: { areaCode: '34', sigunguCode: '1' },
  금산: { areaCode: '34', sigunguCode: '2' },
  논산: { areaCode: '34', sigunguCode: '3' },
  당진: { areaCode: '34', sigunguCode: '4' },
  보령: { areaCode: '34', sigunguCode: '5' },
  부여: { areaCode: '34', sigunguCode: '6' },
  서산: { areaCode: '34', sigunguCode: '7' },
  서천: { areaCode: '34', sigunguCode: '8' },
  아산: { areaCode: '34', sigunguCode: '9' },
  예산: { areaCode: '34', sigunguCode: '11' },
  천안: { areaCode: '34', sigunguCode: '12' },
  청양: { areaCode: '34', sigunguCode: '13' },
  태안: { areaCode: '34', sigunguCode: '14' },
  홍성: { areaCode: '34', sigunguCode: '15' },
  계룡: { areaCode: '34', sigunguCode: '16' },
  // ── 경북 (35) ──
  경산: { areaCode: '35', sigunguCode: '1' },
  경주: { areaCode: '35', sigunguCode: '2' },
  고령: { areaCode: '35', sigunguCode: '3' },
  구미: { areaCode: '35', sigunguCode: '4' },
  김천: { areaCode: '35', sigunguCode: '6' },
  문경: { areaCode: '35', sigunguCode: '7' },
  봉화: { areaCode: '35', sigunguCode: '8' },
  상주: { areaCode: '35', sigunguCode: '9' },
  성주: { areaCode: '35', sigunguCode: '10' },
  안동: { areaCode: '35', sigunguCode: '11' },
  영덕: { areaCode: '35', sigunguCode: '12' },
  영양: { areaCode: '35', sigunguCode: '13' },
  영주: { areaCode: '35', sigunguCode: '14' },
  영천: { areaCode: '35', sigunguCode: '15' },
  예천: { areaCode: '35', sigunguCode: '16' },
  울릉: { areaCode: '35', sigunguCode: '17' },
  울진: { areaCode: '35', sigunguCode: '18' },
  의성: { areaCode: '35', sigunguCode: '19' },
  청도: { areaCode: '35', sigunguCode: '20' },
  청송: { areaCode: '35', sigunguCode: '21' },
  칠곡: { areaCode: '35', sigunguCode: '22' },
  포항: { areaCode: '35', sigunguCode: '23' },
  // ── 경남 (36) ──
  거제: { areaCode: '36', sigunguCode: '1' },
  거창: { areaCode: '36', sigunguCode: '2' },
  '고성(경남)': { areaCode: '36', sigunguCode: '3' },
  김해: { areaCode: '36', sigunguCode: '4' },
  남해: { areaCode: '36', sigunguCode: '5' },
  밀양: { areaCode: '36', sigunguCode: '7' },
  사천: { areaCode: '36', sigunguCode: '8' },
  산청: { areaCode: '36', sigunguCode: '9' },
  양산: { areaCode: '36', sigunguCode: '10' },
  의령: { areaCode: '36', sigunguCode: '12' },
  진주: { areaCode: '36', sigunguCode: '13' },
  창녕: { areaCode: '36', sigunguCode: '15' },
  창원: { areaCode: '36', sigunguCode: '16' },
  통영: { areaCode: '36', sigunguCode: '17' },
  하동: { areaCode: '36', sigunguCode: '18' },
  함안: { areaCode: '36', sigunguCode: '19' },
  함양: { areaCode: '36', sigunguCode: '20' },
  합천: { areaCode: '36', sigunguCode: '21' },
  // ── 전북 (37) ──
  고창: { areaCode: '37', sigunguCode: '1' },
  군산: { areaCode: '37', sigunguCode: '2' },
  김제: { areaCode: '37', sigunguCode: '3' },
  남원: { areaCode: '37', sigunguCode: '4' },
  무주: { areaCode: '37', sigunguCode: '5' },
  부안: { areaCode: '37', sigunguCode: '6' },
  순창: { areaCode: '37', sigunguCode: '7' },
  완주: { areaCode: '37', sigunguCode: '8' },
  익산: { areaCode: '37', sigunguCode: '9' },
  임실: { areaCode: '37', sigunguCode: '10' },
  장수: { areaCode: '37', sigunguCode: '11' },
  전주: { areaCode: '37', sigunguCode: '12' },
  정읍: { areaCode: '37', sigunguCode: '13' },
  진안: { areaCode: '37', sigunguCode: '14' },
  // ── 전남 (38) ──
  강진: { areaCode: '38', sigunguCode: '1' },
  고흥: { areaCode: '38', sigunguCode: '2' },
  곡성: { areaCode: '38', sigunguCode: '3' },
  광양: { areaCode: '38', sigunguCode: '4' },
  구례: { areaCode: '38', sigunguCode: '5' },
  나주: { areaCode: '38', sigunguCode: '6' },
  담양: { areaCode: '38', sigunguCode: '7' },
  목포: { areaCode: '38', sigunguCode: '8' },
  무안: { areaCode: '38', sigunguCode: '9' },
  보성: { areaCode: '38', sigunguCode: '10' },
  순천: { areaCode: '38', sigunguCode: '11' },
  신안: { areaCode: '38', sigunguCode: '12' },
  여수: { areaCode: '38', sigunguCode: '13' },
  영광: { areaCode: '38', sigunguCode: '16' },
  영암: { areaCode: '38', sigunguCode: '17' },
  완도: { areaCode: '38', sigunguCode: '18' },
  장성: { areaCode: '38', sigunguCode: '19' },
  장흥: { areaCode: '38', sigunguCode: '20' },
  진도: { areaCode: '38', sigunguCode: '21' },
  함평: { areaCode: '38', sigunguCode: '22' },
  해남: { areaCode: '38', sigunguCode: '23' },
  화순: { areaCode: '38', sigunguCode: '24' },
  // ── 제주 (39) ──
  서귀포: { areaCode: '39', sigunguCode: '3' },
  제주시: { areaCode: '39', sigunguCode: '4' },
};

// TourAPI contentTypeId → 우리 앱 Category 매핑
const CONTENT_TYPE_MAP: Record<string, Category> = {
  '12': 'attraction', // 관광지
  '14': 'culture',   // 문화시설
  '15': 'activity',  // 축제공연행사
  '25': 'activity',  // 여행코스
  '28': 'activity',  // 레포츠
  '32': 'attraction', // 숙박 (제외하거나 다른 처리)
  '38': 'food',      // 음식점
  '39': 'shopping',  // 쇼핑
};

interface TourItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2: string;
  mapx: string;
  mapy: string;
  firstimage: string;
  firstimage2: string;
  cat1: string;
  cat2: string;
  cat3: string;
  tel: string;
  overview?: string;
}

interface TourDetailItem {
  contentid: string;
  usetime?: string;
  opentime?: string;
  restdate?: string;
  usefee?: string;
  parking?: string;
  infocenterculture?: string;
  accomcount?: string;
}

async function tourFetch<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  const key = process.env.TOUR_API_KEY;
  if (!key) return null;

  const url = new URL(`${TOUR_BASE}/${endpoint}`);
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'KoreaTravelPlanner');
  url.searchParams.set('_type', 'json');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } }); // 1시간 캐시
    if (!res.ok) return null;
    const data = await res.json();
    return data?.response?.body?.items?.item ?? null;
  } catch {
    return null;
  }
}

async function fetchDetail(contentId: string, contentTypeId: string): Promise<TourDetailItem | null> {
  const items = await tourFetch<TourDetailItem | TourDetailItem[]>('detailIntro2', {
    contentId,
    contentTypeId,
  });
  if (!items) return null;
  return Array.isArray(items) ? items[0] : items;
}

function mapToSpot(item: TourItem, detail: TourDetailItem | null, extraImage?: string): TravelSpot {
  const category: Category = CONTENT_TYPE_MAP[item.contenttypeid] ?? 'attraction';

  const openingHours =
    detail?.usetime ?? detail?.opentime ?? undefined;
  const admissionFee =
    detail?.usefee?.replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]+>/g, '').trim() || undefined;

  const image = item.firstimage || extraImage || item.firstimage2 || '';

  return {
    id: `tour-${item.contentid}`,
    name: item.title,
    region: '',
    category,
    description: item.overview?.replace(/<[^>]+>/g, '').slice(0, 200) ?? `${item.title} - 한국관광공사 추천 여행지`,
    imageUrl: image,
    address: [item.addr1, item.addr2].filter(Boolean).join(' '),
    coordinates: {
      lat: parseFloat(item.mapy) || 0,
      lng: parseFloat(item.mapx) || 0,
    },
    tags: [CONTENT_TYPE_MAP[item.contenttypeid] === 'food' ? '맛집' : '관광지'],
    estimatedVisitTime: 90,
    openingHours,
    admissionFee,
    tips: [],
    nearbyTransit: [],
    rating: 4.0,
  };
}

export async function fetchTourApiSpots(region: string, numOfRows = 20): Promise<TravelSpot[]> {
  const areaInfo = AREA_CODES[region];
  if (!areaInfo) return [];

  // 관광지(12) + 문화시설(14) + 음식점(38) 세 카테고리 병렬 요청
  const contentTypes = ['12', '14', '38'];

  const results = await Promise.all(
    contentTypes.map((ctId) =>
      tourFetch<TourItem[]>('areaBasedList2', {
        numOfRows: String(Math.ceil(numOfRows / contentTypes.length)),
        pageNo: '1',
        arrange: 'Q', // Q = 랭크순 (조회수 + 인기도)
        areaCode: areaInfo.areaCode,
        ...(areaInfo.sigunguCode ? { sigunguCode: areaInfo.sigunguCode } : {}),
        contentTypeId: ctId,
      }),
    ),
  );

  const rawItems: TourItem[] = results
    .flatMap((r) => (Array.isArray(r) ? r : r ? [r] : []))
    .filter((item): item is TourItem => !!item && !!item.contentid);

  // 상세 정보 병렬 조회 (최대 10개로 제한해 응답 속도 유지)
  const limited = rawItems.slice(0, numOfRows);
  const details = await Promise.all(
    limited.map((item) => fetchDetail(item.contentid, item.contenttypeid)),
  );

  return limited.map((item, i) => ({
    ...mapToSpot(item, details[i]),
    region,
  }));
}
