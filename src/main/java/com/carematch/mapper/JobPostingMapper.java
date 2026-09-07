package com.carematch.mapper;

import com.carematch.dto.JobPostingSearchCondition;
import com.carematch.entity.JobPosting;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 구인공고 동적 검색 전용 매퍼. 단건 CRUD(등록/수정/삭제/단건조회)는 JobPostingRepository(JPA)가 담당하고,
 * 조건이 여러 개 붙는 목록 검색만 여기서 MyBatis로 처리한다 (resources/mapper/JobPostingMapper.xml).
 */
@Mapper
public interface JobPostingMapper {

    List<JobPosting> search(JobPostingSearchCondition condition);

    long countSearch(JobPostingSearchCondition condition);
}
