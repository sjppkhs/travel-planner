// 반값여행지원금 (지역사랑 휴가지원 시범사업) 데이터

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

export type GroupType = 'solo' | 'youth' | 'couple' | 'family';

export const GROUP_INFO: Record<GroupType, { label: string; cap: number; rate: number; desc: string }> = {
  solo:   { label: '1인',           cap: 100000, rate: 0.5,  desc: '여행 경비의 50% 환급, 최대 10만원' },
  youth:  { label: '청년 (19~34세)', cap: 140000, rate: 0.7,  desc: '여행 경비의 70% 환급, 최대 14만원' },
  couple: { label: '2인 이상',       cap: 200000, rate: 0.5,  desc: '여행 경비의 50% 환급, 최대 20만원' },
  family: { label: '대가족 (5인+)',  cap: 500000, rate: 0.5,  desc: '여행 경비의 50% 환급, 최대 50만원' },
};

// 2026년 상반기 반값여행지원 가능 지역 (광역시도별)
export const HALF_PRICE_BY_PROVINCE: { province: string; regions: string[] }[] = [
  { province: '강원', regions: ['평창', '영월', '횡성'] },
  { province: '충북', regions: ['제천'] },
  { province: '전북', regions: ['고창'] },
  { province: '전남', regions: ['강진', '영광', '해남', '고흥', '완도', '영암'] },
  { province: '경남', regions: ['남해', '밀양', '하동', '합천', '거창'] },
];

export const HALF_PRICE_ELIGIBLE: Set<string> = new Set(
  HALF_PRICE_BY_PROVINCE.flatMap((p) => p.regions),
);

export const CAPITAL_REGIONS: Set<string> = new Set(['서울', '인천', '경기', '수원']);

export const MAX_REFUND = Math.max(...Object.values(GROUP_INFO).map((g) => g.cap));
export const YOUTH_CAP = GROUP_INFO.youth.cap; // 청년 최대 환급액
