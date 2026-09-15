package com.carematch.member.repository;

import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** 관리자 회원 검색(역할/상태/키워드) 조건. 모든 조건은 값이 있을 때만 AND 로 추가된다. */
public final class MemberSpecs {

    private MemberSpecs() {
    }

    public static Specification<Member> search(Role role, MemberStatus status, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();

            if (role != null) {
                ps.add(cb.equal(root.get("role"), role));
            }
            if (status != null) {
                ps.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                Predicate name = cb.like(cb.lower(root.get("name")), like);
                Predicate loginId = cb.like(cb.lower(root.get("loginId")), like);
                Predicate email = cb.like(cb.lower(root.get("email")), like);
                Predicate phone = cb.like(root.get("phone"), like);
                ps.add(cb.or(name, loginId, email, phone));
            }

            return cb.and(ps.toArray(new Predicate[0]));
        };
    }
}
