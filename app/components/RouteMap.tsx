'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Navigation, Map } from 'lucide-react';
import type { TravelSpot } from '@/lib/types';

interface Props {
  spots: TravelSpot[];
  region: string;
}

function buildGoogleMapsUrl(spots: TravelSpot[]): string {
  const valid = spots.filter((s) => s.coordinates.lat && s.coordinates.lng);
  if (valid.length === 0) return 'https://maps.google.com';
  const parts = valid.map((s) => `${s.coordinates.lat},${s.coordinates.lng}`);
  return `https://www.google.com/maps/dir/${parts.join('/')}`;
}

function buildNaverMapsUrl(spots: TravelSpot[]): string {
  const valid = spots.filter((s) => s.coordinates.lat && s.coordinates.lng);
  if (valid.length < 2) return 'https://map.naver.com';
  const first = valid[0];
  const last = valid[valid.length - 1];
  const slng = first.coordinates.lng;
  const slat = first.coordinates.lat;
  const elng = last.coordinates.lng;
  const elat = last.coordinates.lat;
  return `https://map.naver.com/v5/directions/${slng},${slat},${encodeURIComponent(first.name)},,/` +
    `${elng},${elat},${encodeURIComponent(last.name)},,/-/-/transit`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function RouteMap({ spots, region: _region }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null);
  const [routeStatus, setRouteStatus] = useState<'loading' | 'ok' | 'fallback' | 'nocoords'>('loading');

  const validSpots = spots.filter((s) => s.coordinates.lat !== 0 || s.coordinates.lng !== 0);

  useEffect(() => {
    if (!containerRef.current || validSpots.length === 0) {
      setRouteStatus('nocoords');
      return;
    }

    let destroyed = false;

    (async () => {
      const L = (await import('leaflet')).default;

      if (destroyed || !containerRef.current) return;

      // Fix default icon paths (common Leaflet/webpack issue)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const center: [number, number] = [
        validSpots.reduce((sum, s) => sum + s.coordinates.lat, 0) / validSpots.length,
        validSpots.reduce((sum, s) => sum + s.coordinates.lng, 0) / validSpots.length,
      ];

      const map = L.map(containerRef.current, { zoomControl: true }).setView(center, 12);
      mapRef.current = map;

      // 동적 임포트 후 컨테이너 크기가 확정되지 않은 경우 타일이 어긋나는 문제 방지
      setTimeout(() => { if (!destroyed) map.invalidateSize(); }, 0);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Numbered markers
      const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#9333ea', '#0d9488'];
      validSpots.forEach((spot, i) => {
        const color = COLORS[i % COLORS.length];
        const icon = L.divIcon({
          html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)">${i + 1}</div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });
        L.marker([spot.coordinates.lat, spot.coordinates.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:140px"><b style="font-size:13px">${i + 1}. ${spot.name}</b>` +
            (spot.address ? `<br><span style="font-size:11px;color:#64748b">${spot.address}</span>` : '') +
            `</div>`,
          );
      });

      // OSRM route
      if (validSpots.length >= 2) {
        const coordStr = validSpots.map((s) => `${s.coordinates.lng},${s.coordinates.lat}`).join(';');
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordStr}?geometries=geojson&overview=full`,
            { signal: AbortSignal.timeout(6000) },
          );
          const data = await res.json();
          if (!destroyed && data.routes?.[0]?.geometry) {
            L.geoJSON(data.routes[0].geometry, {
              style: { color: '#2563eb', weight: 4, opacity: 0.75 },
            }).addTo(map);
            setRouteStatus('ok');
          } else {
            throw new Error('no geometry');
          }
        } catch {
          if (!destroyed) {
            // Fallback: dashed straight-line polyline
            const latLngs = validSpots.map((s): [number, number] => [s.coordinates.lat, s.coordinates.lng]);
            L.polyline(latLngs, { color: '#2563eb', weight: 3, opacity: 0.55, dashArray: '8, 6' }).addTo(map);
            setRouteStatus('fallback');
          }
        }
      } else {
        setRouteStatus('ok');
      }

      // Fit bounds
      const bounds = L.latLngBounds(validSpots.map((s) => [s.coordinates.lat, s.coordinates.lng]));
      map.fitBounds(bounds, { padding: [48, 48] });
    })();

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (validSpots.length === 0) {
    return (
      <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 gap-2">
        <Map size={32} className="text-slate-300" />
        <p className="text-sm">지도 표시를 위한 좌표 정보가 없습니다</p>
      </div>
    );
  }

  const googleUrl = buildGoogleMapsUrl(validSpots);
  const naverUrl = buildNaverMapsUrl(validSpots);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* 지도 영역 — 인라인 height 필수: Leaflet이 CSS 클래스보다 먼저 크기를 읽으면 0으로 계산됨 */}
      <div ref={containerRef} className="w-full" style={{ height: '320px' }} />

      {/* 하단 컨트롤 */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {routeStatus === 'loading' && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border border-blue-400 border-t-blue-600 rounded-full animate-spin" />
              경로 계산 중…
            </span>
          )}
          {routeStatus === 'ok' && (
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              실제 도로 경로
            </span>
          )}
          {routeStatus === 'fallback' && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              직선 경로 (도로 조회 실패)
            </span>
          )}
          <span className="text-slate-300">·</span>
          <span>OpenStreetMap</span>
        </div>

        <div className="flex gap-2 shrink-0">
          <a
            href={naverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Navigation size={12} /> 네이버 길안내
            <ExternalLink size={10} />
          </a>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Navigation size={12} /> Google 길안내
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
