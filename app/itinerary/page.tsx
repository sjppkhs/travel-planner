'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  BadgePercent,
  BedDouble,
  Bus,
  CalendarDays,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FootprintsIcon,
  Globe,
  Gift,
  MapPin,
  Phone,
  Printer,
  Route,
  Smartphone,
  UtensilsCrossed,
  Wallet,
  Zap,
  Star,
  Train,
  Ticket,
  Info,
  LightbulbIcon,
} from 'lucide-react';
import { buildItinerary, formatDuration } from '@/lib/utils/itinerary';
import type { TravelSpot, ItineraryReport, TransportLeg, NearbyRestaurant, NearbyAccommodation, RegionalApp, RegionalEvent } from '@/lib/types';
import { useLang } from '@/lib/context/LangContext';
import { HALF_PRICE_ELIGIBLE, CAPITAL_REGIONS, GROUP_INFO, type GroupType } from '@/lib/data/benefits';

const TRANSPORT_ICON: Record<string, React.ElementType> = {
  subway: Train,
  bus: Bus,
  walk: FootprintsIcon,
  taxi: Car,
};

const TRANSPORT_COLOR: Record<string, string> = {
  subway: 'text-blue-600',
  bus: 'text-green-600',
  walk: 'text-amber-500',
  taxi: 'text-orange-500',
};

const TRANSPORT_LABEL: Record<string, string> = {
  subway: '지하철',
  bus: '버스',
  walk: '도보',
  taxi: '택시',
};

function TransportCard({ leg }: { leg: TransportLeg }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLang();

  const recommended = leg.methods.find((m) => TRANSPORT_LABEL[m.type] === leg.recommendedMethod)
    ?? leg.methods.reduce((b, m) => (m.duration < b.duration ? m : b), leg.methods[0]);

  const Icon = TRANSPORT_ICON[recommended.type] ?? Bus;

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-blue-100" />

      <div className="relative pl-14 pb-6">
        {/* Icon node */}
        <div className="absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center
          bg-white border-2 border-blue-200 shadow-sm z-10">
          <Icon size={18} className={TRANSPORT_COLOR[recommended.type]} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-slate-800 text-sm font-semibold">
                {leg.from} → {leg.to}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">{t.distanceLabel(leg.distanceKm)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${TRANSPORT_COLOR[recommended.type]}`}>
                {TRANSPORT_LABEL[recommended.type]} 추천
              </p>
              <p className="text-slate-500 text-xs">{recommended.duration}분 · {recommended.cost}</p>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
          >
            {expanded ? t.transportCollapse : t.transportExpand}
          </button>

          {expanded && (
            <div className="mt-3 grid gap-2">
              {leg.methods.map((m) => {
                const MIcon = TRANSPORT_ICON[m.type] ?? Bus;
                return (
                  <div
                    key={m.type}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg
                      ${m.type === recommended.type ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <MIcon size={14} className={TRANSPORT_COLOR[m.type]} />
                      <span className="text-slate-700 text-xs">{m.description}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-600 text-xs">{m.duration}분</span>
                      <span className="text-slate-400 text-xs mx-1">·</span>
                      <span className="text-slate-600 text-xs">{m.cost}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpotSummaryCard({ spot, index }: { spot: TravelSpot & { visitOrder: number }; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative">
      {/* Number node */}
      <div className="absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center
        font-black text-sm text-white shadow-md z-10"
        style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}>
        {index + 1}
      </div>

      <div className="pl-14 pb-4">
        <div className="flex gap-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="relative w-24 h-24 shrink-0 bg-slate-100">
            {!imgError ? (
              <Image
                src={spot.imageUrl}
                alt={spot.name}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin size={24} className="text-slate-300" />
              </div>
            )}
          </div>
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-sm leading-tight">{spot.name}</h3>
              <div className="flex items-center gap-0.5 shrink-0">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-amber-500 text-xs font-semibold">{spot.rating}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-slate-500 text-xs">
                <Clock size={11} /> {spot.estimatedVisitTime}분
              </span>
              {spot.admissionFee && (
                <span className="flex items-center gap-1 text-slate-500 text-xs">
                  <Ticket size={11} />
                  {spot.admissionFee.split('/')[0].trim()}
                </span>
              )}
            </div>
            {spot.openingHours && (
              <p className="text-slate-400 text-xs mt-1">{spot.openingHours}</p>
            )}
            {spot.tips.length > 0 && (
              <p className="text-blue-600 text-xs mt-1 leading-snug">
                💡 {spot.tips[0]}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 여행 지원 혜택 ────────────────────────────────────────────────────

function TravelBenefitsSection({ region }: { region: string }) {
  const isHalfPriceEligible = HALF_PRICE_ELIGIBLE.has(region);
  const isStayDealEligible  = !CAPITAL_REGIONS.has(region);

  const [spending, setSpending] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('solo');

  const rawNum = parseInt(spending.replace(/,/g, '')) || 0;
  const { cap, rate, desc } = GROUP_INFO[groupType];
  const refund = Math.min(rawNum * rate, cap);

  const handleSpending = (v: string) => {
    const digits = v.replace(/[^\d]/g, '');
    setSpending(digits ? parseInt(digits).toLocaleString() : '');
  };

  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
        <Gift className="text-emerald-600" size={20} />
        여행 지원 혜택 안내
      </h2>

      <div className="grid gap-4">

        {/* ① 반값여행지원금 */}
        <div className={`rounded-xl border overflow-hidden ${
          isHalfPriceEligible
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BadgePercent size={18} className={isHalfPriceEligible ? 'text-emerald-600' : 'text-slate-400'} />
              <span className="font-bold text-slate-900 text-sm">반값여행지원금 (지역사랑 휴가지원 시범사업)</span>
            </div>
            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
              isHalfPriceEligible
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {isHalfPriceEligible ? '✓ 해당 지역' : '해당 없음'}
            </span>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* 지원 내용 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(GROUP_INFO).map(([k, g]) => (
                <div key={k} className="bg-white rounded-lg p-2.5 text-center border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs mb-1">{g.label}</p>
                  <p className="text-slate-900 font-black text-sm">{(g.cap / 10000).toFixed(0)}만원</p>
                  <p className="text-emerald-600 text-xs">{(g.rate * 100).toFixed(0)}% 환급</p>
                </div>
              ))}
            </div>

            {/* 신청 조건 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs text-slate-700">
              <p className="font-semibold text-slate-800 mb-1">📋 신청 조건 & 주의사항</p>
              <p>• <span className="text-amber-600 font-medium">여행 전 사전 신청 필수</span> — 여행 후 신청 시 지원 불가</p>
              <p>• 거주지 인근 지역 여행 시 제외 (인접 시군구 불가)</p>
              <p>• 카드 결제 또는 현금영수증 발급 영수증만 인정</p>
              <p>• 환급금은 <span className="text-emerald-600">지역사랑상품권(착 앱)</span>으로 지급</p>
              <p>• 2026년 상반기 대상 지역: 강원 3개·충북 1개·전북 1개·전남 6개·경남 5개 군</p>
              {!isHalfPriceEligible && (
                <p className="text-amber-600 font-medium pt-1">※ {region}은(는) 2026년 상반기 지원 대상 지역이 아닙니다. 하반기 지역 확대 예정이니 공식 포털에서 확인하세요.</p>
              )}
            </div>

            {/* 4단계 신청 방법 */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">📌 신청 방법 (4단계)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { step: '01', title: '사전 신청', desc: '여행 전 구석구석 포털 또는 해당 지자체 홈페이지에서 신청' },
                  { step: '02', title: '승인 확인', desc: '승인 후 카카오톡 알림 수신 (일부 지역)' },
                  { step: '03', title: '여행 및 영수증', desc: '지원 지역 내 카드결제·현금영수증 수집' },
                  { step: '04', title: '증빙 제출', desc: '영수증·방문 인증사진 업로드 → 착 앱으로 환급' },
                ].map((s) => (
                  <div key={s.step} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white mb-1.5"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                      {s.step}
                    </div>
                    <p className="text-slate-900 text-xs font-semibold mb-0.5">{s.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 환급액 계산기 */}
            {isHalfPriceEligible && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-emerald-700 font-semibold text-sm mb-3 flex items-center gap-2">
                  <Wallet size={14} />
                  예상 환급액 계산기
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-slate-600 text-xs mb-1 block">예상 지출 금액</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={spending}
                        onChange={(e) => handleSpending(e.target.value)}
                        placeholder="예: 300,000"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm pr-8
                          focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">원</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-slate-600 text-xs mb-1 block">여행 유형</label>
                    <select
                      value={groupType}
                      onChange={(e) => setGroupType(e.target.value as GroupType)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm
                        focus:outline-none focus:border-emerald-500"
                    >
                      {Object.entries(GROUP_INFO).map(([k, g]) => (
                        <option key={k} value={k}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {rawNum > 0 && (
                  <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-slate-600 text-xs">{desc}</p>
                      <p className="text-slate-500 text-xs mt-0.5">실제 납부액: {(rawNum - refund).toLocaleString()}원</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">예상 환급</p>
                      <p className="text-emerald-600 font-black text-xl">{refund.toLocaleString()}원</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 신청 링크 */}
            <div className="flex flex-wrap gap-2">
              <a href="https://korean.visitkorea.or.kr/dgtourcard/tour50.do"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-sm">
                <Globe size={12} /> 공식 신청 포털 (구석구석)
                <ExternalLink size={10} />
              </a>
              <a href="https://localpay.komscochak.com/"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors">
                <Smartphone size={12} /> 착(Chak) 앱 — 환급금 수령
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* ② 대한민국 숙박세일 페스타 */}
        <div className={`rounded-xl border overflow-hidden ${
          isStayDealEligible
            ? 'border-blue-200 bg-blue-50'
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BedDouble size={18} className={isStayDealEligible ? 'text-blue-600' : 'text-slate-400'} />
              <span className="font-bold text-slate-900 text-sm">대한민국 숙박세일 페스타 (숙박쿠폰)</span>
            </div>
            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
              isStayDealEligible ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {isStayDealEligible ? '✓ 비수도권 적용' : '수도권 미적용'}
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              {[
                { label: '7만원 이상 숙박', value: '2만원 할인' },
                { label: '연박 (2박 이상)', value: '최대 7만원' },
                { label: '적용 시기', value: '연 2회 한시 운영' },
              ].map((i) => (
                <div key={i.label} className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs mb-1">{i.label}</p>
                  <p className="text-blue-600 font-bold text-sm">{i.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-800 mb-1">📋 이용 방법</p>
              <p>• 한국관광공사 운영 — 야놀자·여기어때·GoodChoice 등 제휴 OTA에서 쿠폰 발급</p>
              <p>• 매일 오전 10시 선착순 발급 (수량 소진 시 조기 마감)</p>
              <p>• 서울·경기·인천·세종 숙박 시 제외, 비수도권 전 지역 적용</p>
              <p>• 쿠폰 발급 후 유효기간 내 결제 완료 필수</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://ktostay.visitkorea.or.kr"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm">
                <Globe size={12} /> 숙박세일 페스타 공식
                <ExternalLink size={10} />
              </a>
              <a href="https://apps.apple.com/kr/search?term=%EC%95%BC%EB%86%80%EC%9E%90"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors">
                <Smartphone size={12} /> 야놀자 / 여기어때
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* ③ 여행가는달 & 문화가 있는 날 */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* 여행가는달 */}
          <div className="rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-purple-100">
              <CalendarDays size={16} className="text-purple-600" />
              <span className="font-bold text-slate-900 text-sm">여행가는달</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600 text-white font-medium">연 2회</span>
            </div>
            <div className="px-4 py-3 space-y-2 text-xs text-slate-700">
              <p>한국관광공사 주관 전국 동시 관광 할인 행사. 매년 <span className="text-purple-600 font-medium">4월·10월</span> 운영.</p>
              <p>• 관광지·숙박·교통·음식 등 최대 50% 할인</p>
              <p>• 참여 지역 관광안내소·관광지 입장료 할인</p>
              <p>• KTO 공식 앱 '대한민국 구석구석'에서 참여 시설 확인</p>
              <a href="https://korean.visitkorea.or.kr"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium mt-1">
                <Globe size={11} /> 구석구석 공식 사이트 <ExternalLink size={9} />
              </a>
            </div>
          </div>

          {/* 문화가 있는 날 */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-100">
              <Ticket size={16} className="text-amber-600" />
              <span className="font-bold text-slate-900 text-sm">문화가 있는 날</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-medium">매월 마지막 수요일</span>
            </div>
            <div className="px-4 py-3 space-y-2 text-xs text-slate-700">
              <p>매월 마지막 수요일, 전국 문화시설 <span className="text-amber-600 font-medium">무료 또는 50% 할인</span> 입장.</p>
              <p>• 국·공립 박물관, 미술관, 고궁 무료 개방</p>
              <p>• 영화관 조조 특별 할인 (CGV·롯데·메가박스)</p>
              <p>• 공연·전시 관람 할인 혜택 (시설별 상이)</p>
              <a href="https://www.culture.go.kr/wday"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium mt-1">
                <Globe size={11} /> 문화가 있는 날 공식 <ExternalLink size={9} />
              </a>
            </div>
          </div>
        </div>

        {/* ④ 지역사랑상품권 (착 앱) */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-orange-100">
            <Wallet size={16} className="text-orange-500" />
            <span className="font-bold text-slate-900 text-sm">지역사랑상품권 (착 · Chak 앱)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500 text-white font-medium">환급금 수령</span>
          </div>
          <div className="px-5 py-4 space-y-2 text-xs text-slate-700">
            <p>반값여행지원금 환급금은 <span className="text-orange-600 font-medium">지역사랑상품권(지역화폐)</span>으로 지급됩니다. 착(Chak) 앱을 미리 설치하세요.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs mb-1">사용처</p>
                <p className="text-slate-800 text-xs">해당 지역 내 가맹점 (대형마트·프랜차이즈 제외)</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs mb-1">유효기간</p>
                <p className="text-slate-800 text-xs">2026년 12월 31일까지</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <a href="https://apps.apple.com/kr/search?term=%EC%B0%A9+%EC%A7%80%EC%97%AD%EC%82%AC%EB%9E%91%EC%83%81%ED%92%88%EA%B6%8C"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors">
                <Smartphone size={12} /> App Store — 착(Chak)
                <ExternalLink size={10} />
              </a>
              <a href="https://play.google.com/store/search?q=%EC%B0%A9+%EC%A7%80%EC%97%AD%EC%82%AC%EB%9E%91%EC%83%81%ED%92%88%EA%B6%8C&c=apps"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors">
                <Smartphone size={12} /> Google Play — 착(Chak)
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function formatEventDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}

function RegionalEventsSection({ region }: { region: string }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<RegionalEvent[]>([]);
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const toggle = () => {
    if (!open && !fetched) {
      setFetching(true);
      fetch(`/api/events?region=${encodeURIComponent(region)}`)
        .then((r) => r.json())
        .then((data) => { setEvents(data.events ?? []); setFetched(true); setFetching(false); })
        .catch(() => { setFetched(true); setFetching(false); });
    }
    setOpen((v) => !v);
  };

  return (
    <section className="mb-8">
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="text-pink-500" size={20} />
            <span className="text-lg font-bold text-slate-900">{region} 예정 행사 · 축제</span>
            {fetching && (
              <span className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">오늘 이후 행사</span>
            {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </button>

        {open && fetched && (
          <div className="border-t border-slate-200 px-5 pb-5 pt-4">
            {events.length === 0 ? (
              <div className="text-center py-6">
                <CalendarDays size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">현재 등록된 예정 행사가 없습니다.</p>
                <p className="text-slate-400 text-xs mt-1">한국관광공사 데이터 기준이며, 지자체 직접 행사는 해당 지역 관광 사이트를 확인하세요.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {events.map((ev) => (
                  <div key={ev.id} className="flex gap-3 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    {/* 이미지 */}
                    <div className="relative w-20 h-20 shrink-0 bg-slate-200">
                      {ev.imageUrl && !imgErrors[ev.id] ? (
                        <Image
                          src={ev.imageUrl}
                          alt={ev.title}
                          fill
                          className="object-cover"
                          onError={() => setImgErrors((prev) => ({ ...prev, [ev.id]: true }))}
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CalendarDays size={24} className="text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0 p-3">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-slate-900 text-sm font-semibold leading-snug line-clamp-2">{ev.title}</p>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                          ev.status === 'ongoing'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-pink-100 text-pink-700 border border-pink-200'
                        }`}>
                          {ev.status === 'ongoing' ? '진행중' : '예정'}
                        </span>
                      </div>
                      <p className="flex items-center gap-1 text-pink-600 text-xs font-medium">
                        <CalendarDays size={11} />
                        {formatEventDate(ev.startDate)}
                        {ev.endDate && ev.endDate !== ev.startDate && ` ~ ${formatEventDate(ev.endDate)}`}
                      </p>
                      {ev.address && (
                        <p className="flex items-start gap-1 text-slate-500 text-xs mt-0.5 line-clamp-1">
                          <MapPin size={10} className="mt-0.5 shrink-0" />
                          {ev.address}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

const PLATFORM_LABEL: Record<string, string> = {
  ios: 'App Store',
  android: 'Google Play',
  web: '웹사이트',
};

function RegionalAppCard({ app }: { app: RegionalApp }) {
  const hasApp = app.platforms.includes('ios') || app.platforms.includes('android');

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm">{app.name}</p>
          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{app.description}</p>
        </div>
        <div className="flex flex-wrap gap-1 shrink-0">
          {app.platforms.map((p) => (
            <span key={p} className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${p === 'ios' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                p === 'android' ? 'bg-green-100 text-green-700 border border-green-200' :
                'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {PLATFORM_LABEL[p]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={app.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
            bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
        >
          <Globe size={12} />
          공식 사이트
          <ExternalLink size={10} className="text-slate-400" />
        </a>
        {hasApp && app.appSearch && (
          <>
            <a
              href={`https://apps.apple.com/kr/search?term=${encodeURIComponent(app.appSearch)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
            >
              <Smartphone size={12} />
              App Store
              <ExternalLink size={10} className="text-blue-400" />
            </a>
            <a
              href={`https://play.google.com/store/search?q=${encodeURIComponent(app.appSearch)}&c=apps`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors"
            >
              <Smartphone size={12} />
              Google Play
              <ExternalLink size={10} className="text-green-400" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function NearbyPlaceList<T extends { id: string; name: string; category: string; distanceM: number; imageUrl: string }>({
  items,
  emptyMsg,
  Icon,
}: {
  items: T[];
  emptyMsg: string;
  Icon: React.ElementType;
}) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (items.length === 0) {
    return <p className="text-slate-400 text-xs mt-3">{emptyMsg}</p>;
  }

  return (
    <div className="grid gap-2 mt-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-200">
            {item.imageUrl && !imgErrors[item.id] ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon size={16} className="text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 text-sm font-semibold truncate">{item.name}</p>
            <p className="text-slate-500 text-xs">
              {item.category} · {item.distanceM < 1000 ? `${item.distanceM}m` : `${(item.distanceM / 1000).toFixed(1)}km`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NearbyRestaurantsSection({ lat, lng }: { lat: number; lng: number }) {
  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);

  const toggle = () => {
    if (!open && !fetched) {
      setFetching(true);
      fetch(`/api/nearby?lat=${lat}&lng=${lng}&type=food`)
        .then((r) => r.json())
        .then((data) => { setRestaurants(data.restaurants ?? []); setFetched(true); setFetching(false); })
        .catch(() => { setFetched(true); setFetching(false); });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button onClick={toggle} className="flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
        <UtensilsCrossed size={14} />
        근처 맛집 보기
        {fetching && <span className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin ml-1" />}
        {!fetching && (open ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>
      {open && fetched && (
        <NearbyPlaceList items={restaurants} emptyMsg="반경 1km 내 등록된 맛집 정보가 없습니다." Icon={UtensilsCrossed} />
      )}
    </div>
  );
}

function NearbyAccommodationsSection({ lat, lng }: { lat: number; lng: number }) {
  const [open, setOpen] = useState(false);
  const [accommodations, setAccommodations] = useState<NearbyAccommodation[]>([]);
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);

  const toggle = () => {
    if (!open && !fetched) {
      setFetching(true);
      fetch(`/api/nearby?lat=${lat}&lng=${lng}&type=stay`)
        .then((r) => r.json())
        .then((data) => { setAccommodations(data.accommodations ?? []); setFetched(true); setFetching(false); })
        .catch(() => { setFetched(true); setFetching(false); });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="mt-2 pt-2">
      <button onClick={toggle} className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors">
        <BedDouble size={14} />
        근처 숙소 보기
        {fetching && <span className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin ml-1" />}
        {!fetching && (open ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>
      {open && fetched && (
        <NearbyPlaceList items={accommodations} emptyMsg="반경 2km 내 등록된 숙소 정보가 없습니다." Icon={BedDouble} />
      )}
    </div>
  );
}

export default function ItineraryPage() {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<ItineraryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLang();

  useEffect(() => {
    const spotsJson = sessionStorage.getItem('travel_spots');
    const region = sessionStorage.getItem('travel_region');
    if (!spotsJson || !region) {
      router.replace('/');
      return;
    }
    const spots: TravelSpot[] = JSON.parse(spotsJson);
    const built = buildItinerary(region, spots);
    setReport(built);
    setLoading(false);
  }, [router]);

  const handlePrint = () => window.print();

  if (loading || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t.generatingItinerary}</p>
        </div>
      </div>
    );
  }

  const totalHours = Math.floor(report.totalDuration / 60);
  const totalMins = report.totalDuration % 60;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="no-print sticky top-0 z-40 backdrop-blur-md border-b border-slate-200 bg-white/95">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-slate-900">{t.itineraryHeader(report.region)}</h1>
            <p className="text-slate-500 text-sm">{t.itinerarySubHeader(report.spots.length, totalHours, totalMins)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="no-print flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">{t.printBtn}</span>
            </button>
            <button
              onClick={() => { router.push('/') }}
              className="no-print flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">{t.newTripBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Report */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8" ref={reportRef}>
        {/* Title Card */}
        <div
          className="rounded-2xl p-6 mb-8 text-center"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="text-white/80" size={22} />
            <span className="text-white/80 font-semibold">{report.region}</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-1">{t.itineraryTitle(report.region)}</h2>
          <p className="text-white/60 text-sm">{t.generatedAt} {report.generatedAt}</p>

          {report.routeOptimized && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm font-semibold bg-white/20 border border-white/30">
              <Zap size={14} className="text-yellow-300" />
              <span className="text-white">{t.routeOptimized}</span>
              <span className="text-white/70 text-xs">
                {report.originalDistanceKm}km → {report.optimizedDistanceKm}km
                {report.originalDistanceKm > report.optimizedDistanceKm && (
                  <> · <span className="text-yellow-300 font-bold">
                    {t.distanceShortened(Math.round((report.originalDistanceKm - report.optimizedDistanceKm) * 10) / 10)}
                  </span></>
                )}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: t.statSpots, value: t.spotsN(report.spots.length) },
              { label: t.statTime, value: formatDuration(report.totalDuration) },
              { label: t.statDistance, value: `${report.optimizedDistanceKm}km` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/15 rounded-xl p-3">
                <p className="text-white/60 text-xs mb-1">{stat.label}</p>
                <p className="text-white font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Route Summary */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Route className="text-blue-600" size={20} />
              {t.routeSummaryTitle}
            </h2>
            {report.routeOptimized && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Zap size={12} />
                {t.routeOptimizedBadge}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            {report.spots.map((spot, i) => (
              <div key={spot.id} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-sm font-semibold text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}>
                  {i + 1}
                </span>
                <span className="text-slate-800 text-sm font-medium">{spot.name}</span>
                {i < report.spots.length - 1 && (
                  <span className="text-slate-400">→</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Itinerary */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-6">
            <Clock className="text-purple-600" size={20} />
            {t.detailedRouteTitle}
          </h2>

          <div className="relative pl-5">
            {report.spots.length > 1 && (
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-blue-100" />
            )}

            {report.spots.map((spot, i) => (
              <div key={spot.id}>
                <SpotSummaryCard spot={spot} index={i} />
                {i < report.transportLegs.length && (
                  <TransportCard leg={report.transportLegs[i]} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Spot Details */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
            <Info className="text-cyan-600" size={20} />
            {t.spotDetailTitle}
          </h2>

          <div className="grid gap-4">
            {report.spots.map((spot, i) => (
              <div key={spot.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}>
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-slate-900">{spot.name}</h3>
                  <div className="ml-auto flex items-center gap-1">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="text-amber-500 text-sm font-semibold">{spot.rating}</span>
                  </div>
                </div>

                <div className="p-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-3">{spot.description}</p>
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <p className="flex items-start gap-2">
                        <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                        {spot.address}
                      </p>
                      {spot.openingHours && (
                        <p className="flex items-start gap-2">
                          <Clock size={12} className="mt-0.5 shrink-0 text-slate-400" />
                          {spot.openingHours}
                        </p>
                      )}
                      {spot.admissionFee && (
                        <p className="flex items-start gap-2">
                          <Ticket size={12} className="mt-0.5 shrink-0 text-slate-400" />
                          {spot.admissionFee}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      {spot.nearbyTransit.map((t, ti) => (
                        <p key={ti} className="flex items-start gap-2 text-xs text-slate-500">
                          <Train size={12} className="mt-0.5 shrink-0 text-blue-500" />
                          {t}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{t.travelTipsLabel}</p>
                    <ul className="space-y-2">
                      {spot.tips.map((tip, ti) => (
                        <li key={ti} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="text-amber-500 shrink-0">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 근처 맛집·숙소 */}
                <div className="px-4 pb-4">
                  <NearbyRestaurantsSection lat={spot.coordinates.lat} lng={spot.coordinates.lng} />
                  <NearbyAccommodationsSection lat={spot.coordinates.lat} lng={spot.coordinates.lng} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Budget */}
        <section className="mb-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
              <Ticket className="text-green-600" size={19} />
              {t.budgetTitle}
            </h2>
            <p className="text-green-700 font-semibold text-lg">{report.estimatedTotalCost}</p>
            <p className="text-slate-500 text-xs mt-1">{t.budgetNote}</p>
          </div>
        </section>

        {/* Travel Benefits — 한국어 모드 + 반값지원 가능 지역만 표시 */}
        {lang === 'ko' && HALF_PRICE_ELIGIBLE.has(report.region) && (
          <TravelBenefitsSection region={report.region} />
        )}

        {/* Region Tips */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
            <LightbulbIcon className="text-amber-500" size={20} />
            {t.regionalTipsTitle(report.region)}
          </h2>
          <div className="grid gap-3">
            {report.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  {i + 1}
                </span>
                <p className="text-slate-700 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Regional Events */}
        <RegionalEventsSection region={report.region} />

        {/* Regional Apps */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
            <Smartphone className="text-blue-600" size={20} />
            {t.regionalAppsTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {report.regionalApps.map((app, i) => (
              <RegionalAppCard key={i} app={app} />
            ))}
          </div>
        </section>

        {/* Emergency */}
        <section className="mb-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-red-700 mb-4">
              <Phone size={19} />
              {t.emergencyTitle}
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: t.emergencyHotline, value: report.emergencyInfo.touristHotline },
                { label: t.emergencyPolice, value: report.emergencyInfo.policeEmergency },
                { label: t.emergencyMedical, value: report.emergencyInfo.medicalEmergency },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-red-500 text-xs mb-1">{item.label}</p>
                  <p className="text-slate-900 font-black text-2xl">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer note */}
        <div className="text-center text-slate-400 text-xs pb-8">
          본 일정표는 한국 여행 플래너에 의해 자동 생성되었습니다.
          실제 운행 시간·입장료·교통 정보는 방문 전 공식 채널에서 재확인하시기 바랍니다.
        </div>
      </main>

      {/* Bottom action bar */}
      <div
        className="no-print sticky bottom-0 border-t border-slate-200 px-4 py-4 bg-white/95"
        style={{ backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700
              hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            장소 다시 선택
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
              bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-sm transition-colors"
          >
            <Printer size={16} />
            일정표 인쇄 / 저장
          </button>
        </div>
      </div>
    </div>
  );
}
