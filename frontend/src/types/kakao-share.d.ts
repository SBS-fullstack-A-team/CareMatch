/**
 * 카카오톡 공유하기 JS SDK — kakao.maps.d.ts 패키지엔 없어서 직접 선언한다.
 * 지도/우편번호 서비스가 쓰는 소문자 `kakao` 전역과는 별개의 `Kakao`(대문자) 전역이다.
 * @see https://developers.kakao.com/docs/latest/ko/kakaotalk-share/js-link
 */
interface KakaoShareLink {
  mobileWebUrl: string
  webUrl: string
}

declare const Kakao: {
  init(appKey: string): void
  isInitialized(): boolean
  Share: {
    sendDefault(options: {
      objectType: 'feed'
      content: {
        title: string
        description?: string
        imageUrl: string
        link: KakaoShareLink
      }
      buttons?: Array<{ title: string; link: KakaoShareLink }>
    }): void
  }
}
