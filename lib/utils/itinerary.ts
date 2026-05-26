import type { TravelSpot, SelectedSpot, TransportLeg, ItineraryReport, RegionalApp } from '../types';

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ── 경로 최적화 (Nearest Neighbor + 2-opt) ──────────────────────────

function totalRouteDistance(route: TravelSpot[]): number {
  let dist = 0;
  for (let i = 0; i < route.length - 1; i++) {
    dist += haversineKm(route[i].coordinates, route[i + 1].coordinates);
  }
  return dist;
}

function nearestNeighborRoute(spots: TravelSpot[]): TravelSpot[] {
  if (spots.length <= 2) return [...spots];
  const remaining = [...spots];
  const result: TravelSpot[] = [remaining.splice(0, 1)[0]];
  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineKm(last.coordinates, s.coordinates);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    result.push(remaining.splice(bestIdx, 1)[0]);
  }
  return result;
}

function twoOptImprove(route: TravelSpot[]): TravelSpot[] {
  if (route.length <= 3) return route;
  let best = [...route];
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 2; i++) {
      for (let j = i + 2; j < best.length; j++) {
        // 개방형 경로(출발지≠도착지)에서의 2-opt 비용 비교
        const dBefore =
          haversineKm(best[i].coordinates, best[i + 1].coordinates) +
          (j + 1 < best.length
            ? haversineKm(best[j].coordinates, best[j + 1].coordinates)
            : 0);
        const dAfter =
          haversineKm(best[i].coordinates, best[j].coordinates) +
          (j + 1 < best.length
            ? haversineKm(best[i + 1].coordinates, best[j + 1].coordinates)
            : 0);
        if (dAfter < dBefore - 0.01) {
          // i+1 ~ j 구간 역방향으로 교체
          best = [
            ...best.slice(0, i + 1),
            ...best.slice(i + 1, j + 1).reverse(),
            ...best.slice(j + 1),
          ];
          improved = true;
        }
      }
    }
  }
  return best;
}

export function optimizeRoute(spots: TravelSpot[]): {
  route: TravelSpot[];
  originalKm: number;
  optimizedKm: number;
} {
  const originalKm = Math.round(totalRouteDistance(spots) * 10) / 10;
  if (spots.length <= 2) {
    return { route: [...spots], originalKm, optimizedKm: originalKm };
  }
  const nn = nearestNeighborRoute(spots);
  const optimized = twoOptImprove(nn);
  const optimizedKm = Math.round(totalRouteDistance(optimized) * 10) / 10;
  return { route: optimized, originalKm, optimizedKm };
}

// ───────────────────────────────────────────────────────────────────

function buildTransportLeg(from: TravelSpot, to: TravelSpot): TransportLeg {
  const dist = haversineKm(from.coordinates, to.coordinates);
  const methods: TransportLeg['methods'] = [];

  if (dist < 1.5) {
    methods.push({ type: 'walk', description: `${from.name}에서 도보 이동`, duration: Math.round(dist * 13), cost: '무료' });
  }
  if (dist < 30) {
    const busDuration = Math.round(dist * 4 + 5);
    methods.push({ type: 'bus', description: `버스 이용 (정류장 확인 후 탑승)`, duration: busDuration, cost: '약 1,500원' });
  }
  if (dist >= 0.5 && dist < 50) {
    const subwayDuration = Math.round(dist * 3 + 8);
    methods.push({
      type: 'subway',
      description: `지하철/도시철도 이용`,
      duration: subwayDuration,
      cost: dist < 10 ? '약 1,500원' : `약 ${Math.round(dist * 60)}원`,
    });
  }
  {
    const taxiDuration = Math.round(dist * 2 + 3);
    const taxiCost = Math.max(4800, Math.round(dist * 1000));
    methods.push({ type: 'taxi', description: `택시 이용`, duration: taxiDuration, cost: `약 ${taxiCost.toLocaleString()}원` });
  }

  const recommended = methods.reduce((best, m) => (m.duration < best.duration ? m : best), methods[0]);

  return {
    from: from.name,
    to: to.name,
    distanceKm: Math.round(dist * 10) / 10,
    methods,
    recommendedMethod: recommended.type === 'walk' ? '도보' : recommended.type === 'bus' ? '버스' : recommended.type === 'subway' ? '지하철' : '택시',
  };
}

const REGION_TIPS: Record<string, string[]> = {
  서울: [
    'T-money 교통카드 구입 시 버스·지하철 환승 할인 적용',
    '관광지 밀집 지역은 도보 이동 가능 — 편한 신발 필수',
    '시티투어버스(도심·남산 코스) 활용 시 주요 관광지 편리하게 이동',
    '카카오T 앱으로 택시 호출 시 영어 지원 가능',
  ],
  부산: [
    '부산 도시철도 1·2호선이 주요 관광지 연결',
    '부산 시티투어버스(해운대·태종대 코스) 이용 편리',
    '동래역 기점 버스로 해운대까지 이동 가능',
    '부산역에서 KTX로 서울까지 약 2시간 30분',
  ],
  제주: [
    '렌터카 없이 대중교통만으로 이동 가능 (급행버스 활용)',
    '교통카드(탐나로패스) 구입 시 버스 무제한 이용',
    '섬 북쪽(제주시)·남쪽(서귀포시) 주요 버스 노선 파악 필수',
    '택시보다 버스가 정확하고 저렴',
  ],
  경주: [
    '경주시내버스 600번 노선이 주요 관광지 순환',
    '자전거 대여(황리단길 인근) 후 고분군 투어 인기',
    '경주역(KTX 신경주역 차이)에서 버스로 시내 이동',
    '황리단길 → 대릉원 → 첨성대 → 동궁과월지는 도보 권장',
  ],
  전주: [
    '한옥마을 중심 반경 1km 내 주요 명소 밀집',
    '전주역에서 한옥마을까지 버스 60·79번 이용',
    '한옥마을 내부는 도보 이동 권장 (자전거 대여도 가능)',
    '전통 한정식 레스토랑은 점심·저녁 예약 필수',
  ],
  강릉: [
    '강릉역에서 출발하는 버스로 경포·안목 등 이동 가능',
    '강릉 커피 거리는 여러 카페 방문 시 당일 스탬프 투어 추천',
    '정동진 이동은 무궁화호 열차 또는 버스 이용',
    '동해 일출은 정동진·경포대 모두 일출 1시간 전 도착 필수',
  ],
  여수: [
    '여수엑스포역 기점 시내버스·섬마을 배편 이용',
    '돌산대교 건너 돌산도 투어 후 여수 시내 복귀 가능',
    '야간에는 이순신광장 분수쇼·여수 밤바다 감상 추천',
    '거문도·백도 투어는 사전 예약 필수',
  ],
  문경: [
    '문경새재·에코랄라는 차량 이동 권장 (관광지 간 거리 있음)',
    '문경역(KTX 미연결) - 서울에서 버스 이용 약 2시간 30분',
    '오미자·사과 등 농산물 직거래 구입 추천',
    '주말 레일바이크·집라인 예약은 온라인 사전 예약 필수',
  ],
  포항: [
    '포항역(KTX 운행)에서 시내버스·택시로 관광지 이동',
    '호미곶은 포항 시내에서 버스 200번 이용 약 1시간',
    '죽도시장~영일대해수욕장 도보 이동 가능',
    '구룡포·내연산은 차량 또는 버스 이용 권장',
  ],
  목포: [
    '목포역(KTX 운행)에서 시내버스로 주요 명소 이동 가능',
    '해상케이블카 예약은 성수기 사전 온라인 예약 필수',
    '유달산~근대역사관~갓바위 시내 주요 명소는 도보 연계 가능',
    '무안국제공항 이용 시 목포까지 버스 30분',
  ],
  통영: [
    '통영버스터미널에서 케이블카·동피랑 도보 또는 버스 이용',
    '한산도·욕지도 섬 여행은 통영여객선터미널 이용',
    '통영 케이블카는 주말 대기 심함 - 오전 일찍 방문 권장',
    '통영~거제 연계 여행 시 1박 2일 추천',
  ],
  안동: [
    '안동역(KTX 운행)에서 버스·택시로 하회마을 이동 (40분)',
    '하회마을~도산서원~봉정사는 차량 이동 필수 (간격 큼)',
    '안동 찜닭은 구시장 골목 원조집들이 밀집',
    '유교 문화권 탐방 시 안동시 문화관광 해설사 동행 추천',
  ],
  속초: [
    '서울 동서울터미널에서 속초까지 직행버스 약 2시간 30분',
    '설악산 케이블카는 성수기(가을) 2시간 이상 대기 가능',
    '속초 시내는 버스 1·7-1번으로 주요 명소 이동 가능',
    '양양·고성 연계 여행 시 1박 2일 이상 추천',
  ],
  담양: [
    '광주송정역(KTX)에서 담양 버스 이용 약 40분',
    '죽녹원·메타세쿼이아길·소쇄원은 차량 이동 권장 (간격 있음)',
    '담양 떡갈비·대통밥은 죽녹원 인근 식당가에서',
    '담양 한과·죽제품 기념품 구입 추천',
  ],
  남해: [
    '차량 이동 필수 - 남해도는 대중교통 불편',
    '진주 또는 삼천포에서 남해대교 건너 진입',
    '독일마을~다랭이마을~금산 드라이브 코스 1박 2일 추천',
    '남해 특산품: 마늘·유자·멸치·시금치 구입 가능',
  ],
  인천: [
    '공항철도로 인천공항↔인천역 약 60분, 서울역 직결',
    '차이나타운·자유공원·인천개항장은 인천역에서 도보 연계',
    '강화도 이동은 강화버스터미널에서 직행버스 약 70분',
    '월미도 유람선·문화의거리는 인천역 도보 10분',
  ],
  수원: [
    '수원역(KTX 운행)에서 버스 5·36·37번으로 수원화성 이동',
    '수원화성 내부는 도보 투어 권장 (성곽길 순환 약 2시간)',
    '화성행궁~연무대~화서문 도보 순환 코스 인기',
    '수원 왕갈비통닭·수원갈비는 행궁동 인근에서 체험 가능',
  ],
  춘천: [
    '용산역/청량리역에서 ITX-청춘 열차로 춘천역까지 약 1시간',
    '명동 닭갈비·막국수 골목은 춘천역에서 버스 또는 도보 이동',
    '소양강 스카이워크~춘천댐은 버스 또는 택시 이용 권장',
    '레고랜드·소양강 유람선 성수기 사전 예약 필수',
  ],
  가평: [
    '용산역에서 ITX-청춘으로 가평역까지 약 1시간',
    '남이섬은 가평 선착장에서 배편 (가평역 도보 5분)',
    '쁘띠프랑스·자라섬은 차량 또는 셔틀버스 이용 권장',
    '잠실에서 가평 직행버스 이용 시 약 1시간 30분',
  ],
  양양: [
    '동서울터미널에서 양양 직행버스 약 3시간',
    '양양국제공항 제주·부산 노선 이용 시 공항에서 바로 접근 가능',
    '서피비치·죽도해변 서핑 체험 성수기 예약 필수',
    '낙산사~의상대 도보 연계 약 30분, 낙산해수욕장 인근',
  ],
  평창: [
    '청량리역에서 KTX로 진부역(평창올림픽) 약 1시간 20분',
    '대관령 양떼목장·삼양목장은 차량 이동 권장',
    '알펜시아 리조트 내 셔틀버스 이용 가능',
    '이효석문화마을·봉평 메밀꽃 축제(9월) 방문 시 사전 확인 권장',
  ],
  영월: [
    '청량리역에서 무궁화호로 영월역까지 약 2시간',
    '동강·한반도지형·청령포는 차량 이동 권장',
    '청령포 배편은 영월읍 청령포선착장 이용 (운임 소액)',
    '별마로천문대는 시내 셔틀버스 이용 (예약 필수)',
  ],
  단양: [
    '청량리역에서 무궁화호 단양역까지 약 2시간 30분',
    '단양 8경은 렌터카 또는 관광 셔틀버스 이용 추천',
    '만천하스카이워크·도담삼봉은 단양읍 근처 (택시 이용 가능)',
    '단양 마늘·올갱이국 현지 식당 체험 권장',
  ],
  공주: [
    '서울 남부터미널에서 공주 직행버스 약 1시간 30분',
    '공산성·무령왕릉·국립공주박물관은 시내버스 또는 택시 이용',
    '공주~부여 연계 여행 시 버스 또는 렌터카 (약 40분)',
    '백제문화제(9~10월) 기간 방문 시 사전 행사 확인 필수',
  ],
  부여: [
    '서울 남부터미널에서 부여 직행버스 약 2시간',
    '궁남지·정림사지·국립부여박물관은 시내버스 또는 택시 이용',
    '부여~공주 연계 여행 추천 (차량 약 40분)',
    '궁남지 연꽃 군락 감상은 7~8월 방문 추천',
  ],
  보령: [
    '서울 센트럴시티에서 보령 직행버스 약 2시간',
    '대천해수욕장은 장항선 대천역에서 도보 20분 또는 버스 이용',
    '보령 머드축제(7월) 기간 방문 시 숙박 사전 예약 필수',
    '원산도·삽시도 섬 여행은 대천항 여객선 이용',
  ],
  태안: [
    '서울 센트럴시티에서 태안 직행버스 약 2시간 30분',
    '천리포수목원·꽃지해수욕장은 차량 이동 권장',
    '안면도 꽃 축제(4~5월) 성수기 주차 혼잡 주의',
    '태안 박속밀국낙지·꽃게탕 현지 해산물 식당 추천',
  ],
  거제: [
    '부산 사상버스터미널에서 거제 버스 약 1시간 30분',
    '외도 보타니아 배편은 구조라·도장포 선착장 이용',
    '거제 케이블카는 사전 온라인 예약 권장 (성수기 대기 긺)',
    '거제~통영 연계 여행 추천 (버스 약 30분)',
  ],
  순천: [
    '순천역(KTX 운행)에서 시내버스로 순천만·낙안읍성 이동',
    '순천만국가정원은 순천역에서 도보 10분 거리',
    '낙안읍성은 시내버스 67번 이용 약 40분',
    '순천만습지 갈대 감상은 가을~겨울 방문 추천',
  ],
  군산: [
    '서울 센트럴시티에서 군산 직행버스 약 2시간 30분',
    '근대역사문화거리(동국사·히로쓰가옥·초원사진관) 도보 연계 가능',
    '새만금 방조제 드라이브는 차량 이동 권장',
    '군산 어죽·꽃게장·이성당 빵 현지 체험 추천',
  ],
  남원: [
    '서울 남부터미널에서 남원 직행버스 약 2시간 30분',
    '광한루원~춘향테마파크~만복사지 시내버스 또는 택시 이용',
    '지리산 뱀사골 등산은 차량 이동 후 트레킹',
    '남원 추어탕(미꾸라지) 현지 식당 체험 필수',
  ],
  진주: [
    '서울 센트럴시티에서 진주 직행버스 약 3시간',
    '진주성·국립진주박물관·촉석루는 도보 연계 1~2시간',
    '남강유등축제(10월) 기간 방문 시 숙박 사전 예약 필수',
    '진주 냉면·진주 비빔밥은 남강 인근 식당에서 체험 가능',
  ],
  하동: [
    '진주 또는 순천에서 버스로 하동 이동 약 1시간',
    '쌍계사·화개장터는 차량 이동 후 도보 탐방 권장',
    '섬진강 벚꽃 드라이브(3월 말~4월 초) 강력 추천',
    '화개장터·다원 야생 녹차 체험 방문 추천 (차량 필요)',
  ],
  영주: [
    '청량리역에서 무궁화호로 영주역까지 약 3시간',
    '부석사는 영주역에서 버스 이용 약 1시간 (시간표 사전 확인)',
    '소수서원·선비촌은 도보 연계 가능 (약 20분)',
    '풍기 사과·인삼 직거래 시장 방문 추천',
  ],
  서귀포: [
    '제주공항에서 600번 급행버스로 서귀포까지 약 1시간',
    '정방폭포·천지연폭포·천제연폭포 도보 연계 가능',
    '올레 6·7코스 서귀포 구간 걷기 추천 (4~5시간)',
    '외돌개~이중섭거리~서귀포매일올레시장 도보 투어 가능',
  ],
};

const UNIVERSAL_APPS: RegionalApp[] = [
  {
    name: '대한민국 구석구석',
    description: '한국관광공사 공식 앱 — 전국 관광지·음식점·숙소 통합 검색',
    website: 'https://korean.visitkorea.or.kr',
    appSearch: '대한민국 구석구석',
    platforms: ['ios', 'android', 'web'],
  },
  {
    name: '1330 관광안내 챗봇',
    description: '24시간 한국어·영어·일본어·중국어 관광 안내 (전화 1330)',
    website: 'https://www.visitkorea.or.kr',
    platforms: ['web'],
  },
];

const REGIONAL_APPS: Record<string, RegionalApp[]> = {
  서울: [
    {
      name: 'Visit Seoul',
      description: '서울시 공식 관광 앱 — 코스 추천·AR 가이드·혜택 쿠폰 제공',
      website: 'https://www.visitseoul.net',
      appSearch: 'Visit Seoul 서울 공식 관광',
      platforms: ['ios', 'android', 'web'],
    },
    {
      name: '서울 시티투어버스 예약',
      description: '서울 시티투어버스 온라인 예약 및 노선 확인',
      website: 'https://www.seoulcitytourbus.com',
      platforms: ['web'],
    },
  ],
  부산: [
    {
      name: 'Visit Busan',
      description: '부산관광공사 공식 앱 — 명소·축제·교통 정보 제공',
      website: 'https://www.visitbusan.net',
      appSearch: 'Visit Busan 부산관광',
      platforms: ['ios', 'android', 'web'],
    },
    {
      name: '부산 시티투어',
      description: '부산 시티투어버스 예약 및 노선 안내',
      website: 'https://www.citytourbusan.com',
      platforms: ['web'],
    },
  ],
  제주: [
    {
      name: 'Visit Jeju',
      description: '제주관광공사 공식 앱 — 관광지·렌터카·버스 통합 정보',
      website: 'https://www.visitjeju.net',
      appSearch: 'Visit Jeju 제주관광',
      platforms: ['ios', 'android', 'web'],
    },
    {
      name: '제주버스정보',
      description: '제주 버스 노선·도착 정보 실시간 확인',
      website: 'https://bus.jeju.go.kr',
      appSearch: '제주버스정보',
      platforms: ['ios', 'android', 'web'],
    },
  ],
  경주: [
    {
      name: '경주관광',
      description: '경주시 공식 관광 포털 — 문화재·야간개장·공연 일정 안내',
      website: 'https://tour.gyeongju.go.kr',
      platforms: ['web'],
    },
    {
      name: '경주엑스포',
      description: '경주세계문화엑스포 공원 안내 및 입장권 예약',
      website: 'https://www.cultureexpo.or.kr',
      platforms: ['web'],
    },
  ],
  전주: [
    {
      name: '전주관광',
      description: '전주시 공식 관광 안내 — 한옥마을·음식·축제 정보',
      website: 'https://tour.jeonju.go.kr',
      platforms: ['web'],
    },
    {
      name: '전주한옥마을',
      description: '한옥마을 공식 안내 사이트 — 체험·숙박·음식 예약',
      website: 'https://hanok.jeonju.go.kr',
      platforms: ['web'],
    },
  ],
  강릉: [
    {
      name: '강릉관광',
      description: '강릉시 공식 관광 포털 — 경포·정동진·오죽헌 안내',
      website: 'https://www.gangneung.go.kr/tour',
      platforms: ['web'],
    },
    {
      name: '강릉 커피 지도',
      description: '안목 커피거리·카페 지도 안내 (강릉커피협동조합)',
      website: 'https://www.gncoffee.co.kr',
      platforms: ['web'],
    },
  ],
  여수: [
    {
      name: '여수관광',
      description: '여수시 공식 관광 포털 — 밤바다·엑스포·섬 여행 안내',
      website: 'https://tour.yeosu.go.kr',
      platforms: ['web'],
    },
    {
      name: '여수 해상케이블카',
      description: '여수 해상케이블카 예약 및 운행 정보',
      website: 'https://www.yeosucablecar.com',
      platforms: ['web'],
    },
  ],
  문경: [
    {
      name: '문경관광',
      description: '문경시 공식 관광 포털 — 새재·에코랄라·레일바이크 안내',
      website: 'https://www.gbmg.go.kr/tour',
      platforms: ['web'],
    },
    {
      name: '문경레일바이크',
      description: '문경 레일바이크 예약 및 코스 안내',
      website: 'https://www.mungyeongrailbike.co.kr',
      platforms: ['web'],
    },
  ],
  포항: [
    {
      name: '포항관광',
      description: '포항시 공식 관광 포털 — 호미곶·구룡포·죽도시장 안내',
      website: 'https://tour.pohang.go.kr',
      platforms: ['web'],
    },
    {
      name: '포항 스페이스워크',
      description: '환호해맞이공원 스페이스워크 예약 안내',
      website: 'https://tour.pohang.go.kr',
      platforms: ['web'],
    },
  ],
  목포: [
    {
      name: '목포관광',
      description: '목포시 공식 관광 포털 — 케이블카·근대역사·유달산 안내',
      website: 'https://tour.mokpo.go.kr',
      platforms: ['web'],
    },
    {
      name: '목포 해상케이블카',
      description: '목포 해상케이블카 예약 및 운행 정보',
      website: 'https://www.mokpocablecar.co.kr',
      platforms: ['web'],
    },
  ],
  통영: [
    {
      name: '통영관광',
      description: '통영시 공식 관광 포털 — 케이블카·한산도·동피랑 안내',
      website: 'https://www.tongyeong.go.kr/tour',
      platforms: ['web'],
    },
    {
      name: '통영 케이블카',
      description: '통영 한려수도 조망 케이블카 예약 안내',
      website: 'https://www.cablecar.co.kr',
      platforms: ['web'],
    },
  ],
  안동: [
    {
      name: '안동관광',
      description: '안동시 공식 관광 포털 — 하회마을·도산서원·찜닭 안내',
      website: 'https://www.tourandong.com',
      platforms: ['web'],
    },
    {
      name: '하회마을',
      description: '유네스코 세계유산 하회마을 공식 안내',
      website: 'https://hahoe.or.kr',
      platforms: ['web'],
    },
  ],
  속초: [
    {
      name: '속초관광',
      description: '속초시 공식 관광 포털 — 설악산·청초호·아바이마을 안내',
      website: 'https://tour.sokcho.go.kr',
      platforms: ['web'],
    },
    {
      name: '설악산 케이블카',
      description: '설악산 권금성 케이블카 예약 및 운행 정보',
      website: 'https://www.sorakcablecar.co.kr',
      platforms: ['web'],
    },
  ],
  담양: [
    {
      name: '담양관광',
      description: '담양군 공식 관광 포털 — 죽녹원·메타세쿼이아길 안내',
      website: 'https://tour.damyang.go.kr',
      platforms: ['web'],
    },
    {
      name: '죽녹원',
      description: '죽녹원 입장권 예약 및 대나무숲 코스 안내',
      website: 'https://juknokwon.go.kr',
      platforms: ['web'],
    },
  ],
  남해: [
    {
      name: '남해관광',
      description: '남해군 공식 관광 포털 — 독일마을·다랭이마을·금산 안내',
      website: 'https://tour.namhae.go.kr',
      platforms: ['web'],
    },
  ],
  인천: [
    {
      name: 'Visit Incheon',
      description: '인천관광공사 공식 포털 — 차이나타운·강화도·월미도·영종도 안내',
      website: 'https://www.visitincheon.or.kr',
      platforms: ['web'],
    },
  ],
  수원: [
    {
      name: '수원화성',
      description: '수원화성 공식 안내 — 입장권 예약·해설 일정·성곽 투어 코스',
      website: 'https://www.suwonhc.kr',
      platforms: ['web'],
    },
    {
      name: '수원관광',
      description: '수원시 공식 관광 포털 — 행궁동·화성열차·야경 코스 안내',
      website: 'https://tour.suwon.go.kr',
      platforms: ['web'],
    },
  ],
  춘천: [
    {
      name: '춘천관광',
      description: '춘천시 공식 관광 포털 — 소양강·레고랜드·닭갈비거리 안내',
      website: 'https://tour.chuncheon.go.kr',
      platforms: ['web'],
    },
  ],
  가평: [
    {
      name: '가평관광',
      description: '가평군 공식 관광 포털 — 남이섬·쁘띠프랑스·자라섬 안내',
      website: 'https://www.gapyeong.go.kr/tour',
      platforms: ['web'],
    },
  ],
  양양: [
    {
      name: '양양관광',
      description: '양양군 공식 관광 포털 — 서핑·낙산사·하조대 해변 안내',
      website: 'https://tour.yangyang.go.kr',
      platforms: ['web'],
    },
  ],
  평창: [
    {
      name: '평창관광',
      description: '평창군 공식 관광 포털 — 대관령·올림픽 시설·이효석문화마을 안내',
      website: 'https://www.pyeongchang.go.kr/tour',
      platforms: ['web'],
    },
  ],
  영월: [
    {
      name: '영월관광',
      description: '영월군 공식 관광 포털 — 동강·한반도지형·별마로천문대 안내',
      website: 'https://tour.yw.go.kr',
      platforms: ['web'],
    },
  ],
  단양: [
    {
      name: '단양관광',
      description: '단양군 공식 관광 포털 — 단양8경·만천하스카이워크·도담삼봉 안내',
      website: 'https://www.danyang.go.kr/tour',
      platforms: ['web'],
    },
  ],
  공주: [
    {
      name: '공주관광',
      description: '공주시 공식 관광 포털 — 공산성·무령왕릉·백제문화 안내',
      website: 'https://tour.gongju.go.kr',
      platforms: ['web'],
    },
  ],
  부여: [
    {
      name: '부여관광',
      description: '부여군 공식 관광 포털 — 궁남지·정림사지·백제유산 안내',
      website: 'https://www.buyeo.go.kr/tour',
      platforms: ['web'],
    },
  ],
  보령: [
    {
      name: '보령관광',
      description: '보령시 공식 관광 포털 — 대천해수욕장·머드축제·원산도 안내',
      website: 'https://tour.boryeong.go.kr',
      platforms: ['web'],
    },
  ],
  태안: [
    {
      name: '태안관광',
      description: '태안군 공식 관광 포털 — 안면도·꽃지해수욕장·천리포수목원 안내',
      website: 'https://tour.taean.go.kr',
      platforms: ['web'],
    },
  ],
  거제: [
    {
      name: '거제관광',
      description: '거제시 공식 관광 포털 — 외도·케이블카·거가대교·포로수용소 안내',
      website: 'https://tour.geoje.go.kr',
      platforms: ['web'],
    },
  ],
  순천: [
    {
      name: '순천관광',
      description: '순천시 공식 관광 포털 — 순천만습지·낙안읍성·국가정원 안내',
      website: 'https://tour.suncheon.go.kr',
      platforms: ['web'],
    },
  ],
  군산: [
    {
      name: '군산관광',
      description: '군산시 공식 관광 포털 — 근대역사문화거리·새만금·진포해양 안내',
      website: 'https://www.gunsan.go.kr/tour',
      platforms: ['web'],
    },
  ],
  남원: [
    {
      name: '남원관광',
      description: '남원시 공식 관광 포털 — 광한루원·지리산·춘향테마파크 안내',
      website: 'https://tour.namwon.go.kr',
      platforms: ['web'],
    },
  ],
  진주: [
    {
      name: '진주관광',
      description: '진주시 공식 관광 포털 — 진주성·촉석루·남강유등축제 안내',
      website: 'https://tour.jinju.go.kr',
      platforms: ['web'],
    },
  ],
  하동: [
    {
      name: '하동관광',
      description: '하동군 공식 관광 포털 — 쌍계사·섬진강·화개장터·녹차 다원 안내',
      website: 'https://tour.hadong.go.kr',
      platforms: ['web'],
    },
  ],
  영주: [
    {
      name: '영주관광',
      description: '영주시 공식 관광 포털 — 부석사·소수서원·선비촌 안내',
      website: 'https://tour.yeongju.go.kr',
      platforms: ['web'],
    },
  ],
  서귀포: [
    {
      name: '서귀포관광',
      description: '서귀포시 공식 관광 포털 — 정방폭포·올레길·이중섭미술관 안내',
      website: 'https://www.visitjeju.net/ko/region/seogwipo',
      platforms: ['web'],
    },
  ],
};

const EMERGENCY_INFO = {
  touristHotline: '1330 (한국관광공사 24시간 다국어 안내)',
  policeEmergency: '112',
  medicalEmergency: '119',
};

export function buildItinerary(region: string, spots: TravelSpot[]): ItineraryReport {
  // 최적 이동 경로로 순서 재조정
  const { route, originalKm, optimizedKm } = optimizeRoute(spots);
  const routeOptimized = route.map((s) => s.id).join() !== spots.map((s) => s.id).join();

  const selected: SelectedSpot[] = route.map((s, i) => ({ ...s, visitOrder: i + 1 }));

  const transportLegs: TransportLeg[] = [];
  for (let i = 0; i < selected.length - 1; i++) {
    transportLegs.push(buildTransportLeg(selected[i], selected[i + 1]));
  }

  const visitMinutes = selected.reduce((sum, s) => sum + s.estimatedVisitTime, 0);
  const travelMinutes = transportLegs.reduce((sum, l) => {
    const best = l.methods.reduce((b, m) => (m.duration < b.duration ? m : b), l.methods[0]);
    return sum + best.duration;
  }, 0);
  const totalDuration = visitMinutes + travelMinutes;

  const admissions = selected.map((s) => {
    if (!s.admissionFee || s.admissionFee.includes('무료')) return 0;
    const match = s.admissionFee.match(/(\d[\d,]+)/);
    return match ? parseInt(match[1].replace(',', '')) : 0;
  });
  const totalAdmission = admissions.reduce((a, b) => a + b, 0);
  const avgTransport = transportLegs.length * 2000;
  const estimatedTotalCost = `약 ${(totalAdmission + avgTransport).toLocaleString()}원 ~ ${(totalAdmission + avgTransport + 30000).toLocaleString()}원 (교통·입장료 기준)`;

  const regionTips = REGION_TIPS[region] ?? [
    '사전에 해당 지역 관광 안내소 정보 확인',
    '현지 교통카드 또는 1일권 이용 추천',
  ];

  const regionalApps = [
    ...(REGIONAL_APPS[region] ?? []),
    ...UNIVERSAL_APPS,
  ];

  return {
    region,
    spots: selected,
    transportLegs,
    totalDuration,
    estimatedTotalCost,
    tips: regionTips,
    regionalApps,
    emergencyInfo: EMERGENCY_INFO,
    generatedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    routeOptimized,
    originalDistanceKm: originalKm,
    optimizedDistanceKm: optimizedKm,
  };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
