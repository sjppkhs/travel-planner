import type { TravelSpot, Category } from '../types';

// Google Places API (New) - v1
// https://developers.google.com/maps/documentation/places/web-service/op-overview
const PLACES_BASE = 'https://places.googleapis.com/v1';

interface PlaceResult {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  primaryTypeDisplayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: {
    openNow: boolean;
    periods: Array<{ open: { day: number; hour: number; minute: number }; close: { day: number; hour: number; minute: number } }>;
    weekdayDescriptions: string[];
  };
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>;
  editorialSummary?: { text: string };
  priceLevel?: string;
  types?: string[];
}

interface PlacesSearchResponse {
  places?: PlaceResult[];
}

const TYPE_TO_CATEGORY: Record<string, Category> = {
  tourist_attraction: 'attraction',
  museum: 'culture',
  art_gallery: 'culture',
  park: 'nature',
  natural_feature: 'nature',
  restaurant: 'food',
  food: 'food',
  shopping_mall: 'shopping',
  store: 'shopping',
  amusement_park: 'activity',
  spa: 'activity',
};

function guessCategory(types: string[] = []): Category {
  for (const t of types) {
    if (t in TYPE_TO_CATEGORY) return TYPE_TO_CATEGORY[t];
  }
  return 'attraction';
}

function photoUrl(photoName: string, maxWidth = 800): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !photoName) return '';
  return `${PLACES_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${key}`;
}

async function placesPost<T>(path: string, body: unknown, fieldMask: string): Promise<T | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(`${PLACES_BASE}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryTypeDisplayName',
  'places.rating',
  'places.userRatingCount',
  'places.regularOpeningHours',
  'places.photos',
  'places.editorialSummary',
  'places.types',
].join(',');

export async function fetchGooglePlaces(region: string, numOfResults = 20): Promise<TravelSpot[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];

  const response = await placesPost<PlacesSearchResponse>(
    'places:searchText',
    {
      textQuery: `${region} 관광지 명소 핫플레이스`,
      languageCode: 'ko',
      regionCode: 'KR',
      maxResultCount: Math.min(numOfResults, 20),
      rankPreference: 'RELEVANCE',
    },
    FIELD_MASK,
  );

  if (!response?.places) return [];

  return response.places.map((p): TravelSpot => {
    const img = p.photos?.[0] ? photoUrl(p.photos[0].name) : '';
    const rating = p.rating ?? 4.0;
    const hours = p.regularOpeningHours?.weekdayDescriptions?.[0] ?? undefined;

    return {
      id: `gplace-${p.id}`,
      name: p.displayName.text,
      region,
      category: guessCategory(p.types),
      description: p.editorialSummary?.text ?? `${p.displayName.text} - Google Places 추천 핫플레이스`,
      imageUrl: img,
      address: p.formattedAddress,
      coordinates: {
        lat: p.location.latitude,
        lng: p.location.longitude,
      },
      tags: [p.primaryTypeDisplayName?.text ?? '명소'],
      estimatedVisitTime: 90,
      openingHours: hours,
      admissionFee: undefined,
      tips: [`리뷰 ${(p.userRatingCount ?? 0).toLocaleString()}건`],
      nearbyTransit: [],
      rating: Math.round(rating * 10) / 10,
    };
  });
}

export async function enrichWithGooglePhotos(spots: TravelSpot[]): Promise<TravelSpot[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return spots;

  return Promise.all(
    spots.map(async (spot): Promise<TravelSpot> => {
      if (spot.imageUrl) return spot;

      const response = await placesPost<PlacesSearchResponse>(
        'places:searchText',
        {
          textQuery: spot.name,
          languageCode: 'ko',
          regionCode: 'KR',
          maxResultCount: 1,
        },
        'places.photos,places.rating',
      );

      const place = response?.places?.[0];
      if (!place) return spot;

      return {
        ...spot,
        imageUrl: place.photos?.[0] ? photoUrl(place.photos[0].name) : spot.imageUrl,
        rating: place.rating ? Math.round(place.rating * 10) / 10 : spot.rating,
      };
    }),
  );
}
