import { NextRequest, NextResponse } from 'next/server';
import { fetchTourApiSpots } from '@/lib/api/tourApi';
import { fetchGooglePlaces, enrichWithGooglePhotos } from '@/lib/api/googlePlaces';
import { searchSpots } from '@/lib/data/koreaData';
import type { TravelSpot } from '@/lib/types';

export const runtime = 'nodejs';
export const revalidate = 3600; // 1시간 캐시

function dedupeByName(spots: TravelSpot[]): TravelSpot[] {
  const seen = new Set<string>();
  return spots.filter((s) => {
    const key = s.name.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortByRating(spots: TravelSpot[]): TravelSpot[] {
  return [...spots].sort((a, b) => b.rating - a.rating);
}

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get('region')?.trim();
  if (!region) {
    return NextResponse.json({ error: 'region 파라미터가 필요합니다' }, { status: 400 });
  }

  const source = req.nextUrl.searchParams.get('source') ?? 'auto';

  const hasTourKey = !!process.env.TOUR_API_KEY;
  const hasGoogleKey = !!process.env.GOOGLE_PLACES_API_KEY;

  try {
    let spots: TravelSpot[] = [];

    if (source === 'local' || (!hasTourKey && !hasGoogleKey)) {
      // API 키 없음 → 내장 데이터 사용
      spots = searchSpots(region);
    } else if (source === 'tour' || (hasTourKey && !hasGoogleKey)) {
      // TourAPI만 사용
      const tourSpots = await fetchTourApiSpots(region, 20);
      spots = tourSpots.length > 0 ? tourSpots : searchSpots(region);
    } else if (source === 'google' || (!hasTourKey && hasGoogleKey)) {
      // Google Places만 사용
      const googleSpots = await fetchGooglePlaces(region, 20);
      spots = googleSpots.length > 0 ? googleSpots : searchSpots(region);
    } else {
      // 두 API 모두 사용 → 병렬 요청 후 병합
      const [tourSpots, googleSpots] = await Promise.all([
        fetchTourApiSpots(region, 15),
        fetchGooglePlaces(region, 10),
      ]);

      // TourAPI 결과 우선, Google Places 보완, 내장 데이터 fallback
      const combined = [...tourSpots, ...googleSpots];

      if (combined.length === 0) {
        spots = searchSpots(region);
      } else {
        // 이미지 없는 spot에 Google 사진 보강
        const enriched = await enrichWithGooglePhotos(combined);
        const fallback = searchSpots(region);

        // 이름 기준 중복 제거 후 병합
        spots = dedupeByName([...enriched, ...fallback]);
      }
    }

    const sorted = sortByRating(dedupeByName(spots));

    return NextResponse.json({
      region,
      source: !hasTourKey && !hasGoogleKey ? 'local' : source,
      total: sorted.length,
      spots: sorted,
    });
  } catch (err) {
    console.error('[API/spots] Error:', err);
    // 오류 시 내장 데이터로 안전하게 fallback
    const fallback = searchSpots(region);
    return NextResponse.json({ region, source: 'local-fallback', total: fallback.length, spots: fallback });
  }
}
