export type Category = 'attraction' | 'food' | 'nature' | 'culture' | 'shopping' | 'activity';

export interface TravelSpot {
  id: string;
  name: string;
  region: string;
  category: Category;
  description: string;
  imageUrl: string;
  address: string;
  coordinates: { lat: number; lng: number };
  tags: string[];
  estimatedVisitTime: number; // minutes
  openingHours?: string;
  admissionFee?: string;
  tips: string[];
  nearbyTransit: string[];
  rating: number;
}

export interface SelectedSpot extends TravelSpot {
  visitOrder: number;
}

export interface TransportLeg {
  from: string;
  to: string;
  distanceKm: number;
  methods: {
    type: 'subway' | 'bus' | 'walk' | 'taxi';
    description: string;
    duration: number; // minutes
    cost: string;
  }[];
  recommendedMethod: string;
}

export interface RegionalApp {
  name: string;
  description: string;
  website: string;
  appSearch?: string; // App Store / Play Store 검색어
  platforms: ('ios' | 'android' | 'web')[];
}

export interface NearbyRestaurant {
  id: string;
  name: string;
  address: string;
  distanceM: number;
  imageUrl: string;
  category: string;
}

export interface RegionalEvent {
  id: string;
  title: string;
  address: string;
  imageUrl: string;
  startDate: string; // YYYYMMDD
  endDate: string;   // YYYYMMDD
  status: 'upcoming' | 'ongoing';
}

export interface NearbyAccommodation {
  id: string;
  name: string;
  address: string;
  distanceM: number;
  imageUrl: string;
  category: string;
}

export interface ItineraryReport {
  region: string;
  spots: SelectedSpot[];
  transportLegs: TransportLeg[];
  totalDuration: number; // minutes
  estimatedTotalCost: string;
  tips: string[];
  regionalApps: RegionalApp[];
  emergencyInfo: {
    touristHotline: string;
    policeEmergency: string;
    medicalEmergency: string;
  };
  generatedAt: string;
  routeOptimized: boolean;
  originalDistanceKm: number;
  optimizedDistanceKm: number;
}
