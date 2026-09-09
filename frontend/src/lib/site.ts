/** 고객센터 정보 — Footer 와 메인 고객센터 영역이 함께 사용한다 */
export const CUSTOMER_SERVICE = {
  tel: '1588-1234',
  telHref: 'tel:15881234',
  weekday: '평일 09:00 ~ 18:00',
  lunch: '점심시간 12:00 ~ 13:00',
  email: 'help@carematch.co.kr',
  kakaoUrl: 'https://pf.kakao.com',
} as const

export const SITE_TAGLINE = ['사람과 사람을 이어주는', '요양 일자리 플랫폼'] as const

/**
 * 구인공고 상세의 유의사항.
 * 공고 데이터가 아니라 서비스가 항상 동일하게 안내하는 문구라 여기에 둔다.
 */
export const JOB_APPLY_NOTICES = [
  '케어매치는 채용 과정에서 어떠한 명목으로도 금전을 요구하지 않습니다. 금전을 요구받으신 경우 고객센터로 신고해 주세요.',
  '주민등록번호, 계좌번호 등 민감한 개인정보는 채용이 확정되기 전에 제공하지 마세요.',
  '공고 내용은 시설이 직접 등록한 정보이며, 근무 조건은 면접 과정에서 다시 한 번 확인해 주세요.',
] as const
