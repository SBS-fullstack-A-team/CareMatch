package com.carematch.member.service;

import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import com.carematch.member.dto.AdminMemberSummary;
import com.carematch.member.repository.MemberRepository;
import com.carematch.member.repository.MemberSpecs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관리자 회원관리 — 전체 회원 검색/조회. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

    private final MemberRepository memberRepository;

    public Page<AdminMemberSummary> search(Role role, MemberStatus status, String keyword, Pageable pageable) {
        return memberRepository.findAll(MemberSpecs.search(role, status, keyword), pageable)
                .map(AdminMemberSummary::from);
    }
}
