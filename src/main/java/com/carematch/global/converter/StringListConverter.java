package com.carematch.global.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * List&lt;String&gt; 를 콤마로 join 해서 단일 컬럼에 저장한다.
 * 주요업무("말벗,식사준비,청소")나 자격요건("자격증,이력서")처럼
 * 검색 조건으로 쓰지 않고 화면 표시용으로만 쓰는 다중값에 사용.
 *
 * <p>엔티티 필드에 {@code @Convert(converter = StringListConverter.class)} 로 붙여 쓴다.
 * autoApply 를 켜면 모든 List&lt;String&gt; 에 적용되어 위험하므로 명시적으로만 사용.
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String DELIMITER = ",";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        return attribute.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(DELIMITER));
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return List.of();
        }
        return Arrays.stream(dbData.split(DELIMITER))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }
}
