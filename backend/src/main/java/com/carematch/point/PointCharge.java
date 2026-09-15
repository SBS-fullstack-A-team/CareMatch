package com.carematch.point;

import com.carematch.common.entity.BaseTimeEntity;
import com.carematch.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 포인트 충전(포트원 결제) 1건. prepare 단계에서 PENDING 으로 생성하고,
 * complete 단계에서 포트원 서버 API로 실결제를 재확인한 뒤 PAID 로 바꾼다.
 * paymentId 는 프론트가 결제창을 열 때 함께 넘기는 값으로, 결제 1건과 1:1 매핑된다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "point_charge", uniqueConstraints = {
        @UniqueConstraint(name = "uk_point_charge_payment_id", columnNames = "payment_id")
})
public class PointCharge extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "payment_id", nullable = false, length = 64)
    private String paymentId;

    /** 충전 요청 금액(원). 적립 포인트도 동일(1원 = 1P). */
    @Column(name = "amount", nullable = false)
    private long amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PointChargeStatus status;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Builder
    private PointCharge(Member member, String paymentId, long amount) {
        this.member = member;
        this.paymentId = paymentId;
        this.amount = amount;
        this.status = PointChargeStatus.PENDING;
    }

    public boolean isPending() {
        return status == PointChargeStatus.PENDING;
    }

    public void markPaid() {
        this.status = PointChargeStatus.PAID;
        this.completedAt = LocalDateTime.now();
    }
}
