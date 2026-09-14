/**
 * 카카오 우편번호(주소 검색) 서비스 — kakao.maps.d.ts 패키지엔 없어서 직접 선언한다.
 * @see https://postcode.map.kakao.com/guide
 */
declare namespace kakao {
  interface PostcodeData {
    /** 새 우편번호 */
    zonecode: string
    /** 검색 방식에 따른 기본 주소 */
    address: string
    /** 도로명 주소 */
    roadAddress: string
    /** 지번 주소 */
    jibunAddress: string
    /** 건물명(있는 경우) */
    buildingName: string
    /** 'R'(도로명) 또는 'J'(지번) — 사용자가 선택한 주소 타입 */
    userSelectedType: 'R' | 'J'
  }

  class Postcode {
    constructor(options: { oncomplete: (data: PostcodeData) => void })
    open(): void
    embed(element: HTMLElement): void
  }
}
