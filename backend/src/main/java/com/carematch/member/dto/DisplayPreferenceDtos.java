package com.carematch.member.dto;

import com.carematch.member.domain.FontScale;
import com.carematch.member.domain.Member;
import jakarta.validation.constraints.NotNull;

/**
 * 회원 화면 표시 설정(쉬운 화면 모드 / 글자 크기) 조회·수정 DTO.
 *
 * 이 설정은 기기 localStorage 에도 저장되지만, 로그인 회원은 서버에도 저장해
 * 다른 기기에서 로그인해도 같은 화면 설정이 유지되도록 한다.
 */
public final class DisplayPreferenceDtos {

    private DisplayPreferenceDtos() {
    }

    /** 현재 설정. */
    public record Response(boolean easyMode, FontScale fontScale) {
        public static Response from(Member member) {
            return new Response(member.isEasyMode(), member.getFontScale());
        }
    }

    /** 설정 변경 요청. 프론트가 두 값 모두 현재 상태로 채워 보낸다(전체 교체). */
    public record UpdateRequest(
            @NotNull Boolean easyMode,
            @NotNull FontScale fontScale
    ) {
    }
}
