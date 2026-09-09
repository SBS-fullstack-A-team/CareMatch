package com.carematch.member.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.Member;
import com.carematch.member.dto.DisplayPreferenceDtos.Response;
import com.carematch.member.dto.DisplayPreferenceDtos.UpdateRequest;
import com.carematch.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 화면 표시 설정(쉬운 화면 모드 / 글자 크기) 조회·수정. 본인만.
 * 인가는 SecurityFilterChain 의 {@code anyRequest().authenticated()} 로 처리(역할 무관, GUEST 포함).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberDisplayPreferenceService {

    private final MemberRepository memberRepository;

    public Response get(Long memberId) {
        return Response.from(findMember(memberId));
    }

    @Transactional
    public Response update(Long memberId, UpdateRequest req) {
        Member member = findMember(memberId);
        member.changeDisplayPreference(req.easyMode(), req.fontScale());
        return Response.from(member);
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND, "id=" + memberId));
    }
}
