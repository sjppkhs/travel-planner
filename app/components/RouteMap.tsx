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

// 네이버 지도 웹 /p/directions/ URL은 내부 Place ID 없는 커스텀 좌표를 지원하지 않음.
// 커스텀 좌표(WGS84) + 다중 경유지를 지원하는 공식 방법은 nmap:// 앱 스킴.
// 모바일에서 네이버 지도 앱으로 열림 (v1~v5 최대 5개 경유지)
function buildNaverMapsUrl(spots: TravelSpot[]): string {
  const valid = spots.filter((s) => s.coordinates.lat && s.coordinates.lng);
  if (valid.length < 2) return 'https://map.naver.com';

  const first = valid[0];
  const last = valid[valid.length - 1];
  const vias = valid.slice(1, -1).slice(0, 5);

  const params: Record<string, string> = {
    slat: String(first.coordinates.lat),
    slng: String(first.coordinates.lng),
    sname: first.name,
    dlat: String(last.coordinates.lat),
    dlng: String(last.coordinates.lng),
    dname: last.name,
    appname: 'kr.co.travelplanner',
  };
  vias.forEach((spot, i) => {
    params[`v${i + 1}lat`] = String(spot.coordinates.lat);
    params[`v${i + 1}lng`] = String(spot.coordinates.lng);
    params[`v${i + 1}name`] = spot.name;
  });

  return `nmap://route/car?${new URLSearchParams(params).toString()}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function RouteMap({ spots, region: _region }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null);
  const [routeStatus, setRouteStatus] = useState<'loading' | 'ok' | 'fallback' | 'nocoords'>('loading');
  const [naverTooltip, setNaverTooltip] = useState(false);

  const validSpots = spots.filter((s) => s.coordinates.lat !== 0 || s.coordinates.lng !== 0);

  useEffect(() => {
    if (!containerRef.current || validSpots.length === 0) {
      setRouteStatus('nocoords');
      return;
    }

    let destroyed = false;
    let ro: ResizeObserver | null = null;

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

      // 두 프레임 뒤에 invalidateSize — 동적 임포트 + React 렌더 사이클 완료를 기다림
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!destroyed) map.invalidateSize(); }));

      // 이후 컨테이너 크기 변화에도 타일 재정렬
      ro = new ResizeObserver(() => { if (!destroyed) map.invalidateSize(); });
      ro.observe(containerRef.current);

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
      ro?.disconnect();
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
    <div className="rounded-xl border border-slate-200 shadow-sm">
      {/* 지도 영역 — overflow-hidden을 지도에만 적용해 하단 툴팁이 잘리지 않게 함 */}
      <div className="overflow-hidden rounded-t-xl">
        <div ref={containerRef} className="w-full" style={{ height: '320px' }} />
      </div>

      {/* 하단 컨트롤 — overflow 허용으로 툴팁이 아래로 표시됨 */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3 flex-wrap rounded-b-xl overflow-visible">
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
          <div className="relative">
            <button
              onClick={() => {
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                  window.location.href = naverUrl;
                } else {
                  setNaverTooltip(true);
                  setTimeout(() => setNaverTooltip(false), 3000);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Navigation size={12} /> 네이버 앱 길안내
            </button>
            {naverTooltip && (
              <div className="absolute top-full mt-2 right-0 w-52 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50 leading-relaxed">
                <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800" />
                모바일 기기에서 네이버 지도 앱으로 이용 가능합니다
              </div>
            )}
          </div>
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
