package com.carematch.jobposting.dto;

import com.carematch.jobposting.domain.CareGrade;
import com.carematch.jobposting.domain.CognitiveStatus;
import com.carematch.jobposting.domain.ElderGender;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.MealStatus;
import com.carematch.jobposting.domain.MobilityStatus;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkSchedule;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.jobposting.dto.JobPostingDtos.CreateRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class JobPostingDtosValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private CreateRequest request(WorkType workType, WorkSchedule workSchedule) {
        return new CreateRequest(
                "t", JobType.CAREGIVER, null, null, null,
                null, null, null, null,
                workType, workSchedule, EmploymentType.CONTRACT, null,
                "Mon-Fri", LocalTime.of(9, 0), LocalTime.of(12, 0),
                PayType.MONTHLY, 3_000_000, 1, LocalDate.now().plusDays(30),
                "Seoul", "Gangnam", null, null, null,
                CareGrade.GRADE_4, ElderGender.FEMALE, null,
                MobilityStatus.INDEPENDENT, MealStatus.ASSIST, CognitiveStatus.NORMAL, null,
                List.of(), List.of(),
                null);
    }

    @Test
    void workType이_LIVE_IN이_아닌데_workSchedule이_없으면_검증에_걸린다() {
        Set<ConstraintViolation<CreateRequest>> violations =
                validator.validate(request(WorkType.COMMUTE, null));

        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .contains("workScheduleValid");
    }

    @Test
    void workType이_LIVE_IN이면_workSchedule이_없어도_통과한다() {
        Set<ConstraintViolation<CreateRequest>> violations =
                validator.validate(request(WorkType.LIVE_IN, null));

        assertThat(violations).isEmpty();
    }

    @Test
    void workType이_COMMUTE여도_workSchedule이_있으면_통과한다() {
        Set<ConstraintViolation<CreateRequest>> violations =
                validator.validate(request(WorkType.COMMUTE, WorkSchedule.DAY));

        assertThat(violations).isEmpty();
    }
}
