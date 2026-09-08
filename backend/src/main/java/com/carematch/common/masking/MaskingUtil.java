package com.carematch.common.masking;

/**
 * 개인정보 마스킹 유틸.
 * - 응답 DTO 조립 시점에 적용한다(엔티티에는 원본 저장).
 */
public final class MaskingUtil {

    private MaskingUtil() {
    }

    /**
     * 휴대폰 번호 마스킹: 010-1234-5678 -> 010-****-5678
     * 형식이 예상과 다르면 가운데 절반을 * 로 치환.
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return phone;
        }
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() == 11) {
            return digits.substring(0, 3) + "-****-" + digits.substring(7);
        }
        if (digits.length() == 10) {
            return digits.substring(0, 3) + "-***-" + digits.substring(6);
        }
        int keep = Math.max(1, digits.length() / 4);
        return digits.substring(0, keep) + "*".repeat(Math.max(0, digits.length() - keep));
    }

    /**
     * 거주지 마스킹: "서울특별시 강남구 역삼동 123-45 4층" -> "서울특별시 강남구"
     * 시/도 + 구(군) 단위까지만 노출.
     */
    public static String maskResidence(String residence) {
        if (residence == null || residence.isBlank()) {
            return residence;
        }
        String[] tokens = residence.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String token : tokens) {
            sb.append(token);
            if (endsWithAny(token, "시", "도", "군", "구")) {
                if (endsWithAny(token, "군", "구")) {
                    break;
                }
                sb.append(' ');
            } else {
                break;
            }
        }
        String result = sb.toString().trim();
        return result.isEmpty() ? tokens[0] : result;
    }

    /**
     * 이메일 마스킹: abcdef@gmail.com -> ab****@gmail.com
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int at = email.indexOf('@');
        String local = email.substring(0, at);
        String domain = email.substring(at);
        if (local.length() <= 2) {
            return local.charAt(0) + "*" + domain;
        }
        return local.substring(0, 2) + "*".repeat(local.length() - 2) + domain;
    }

    /**
     * 이름 마스킹: 홍길동 -> 홍*동, 김철 -> 김*
     */
    public static String maskName(String name) {
        if (name == null || name.length() < 2) {
            return name;
        }
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }

    private static boolean endsWithAny(String s, String... suffixes) {
        for (String suffix : suffixes) {
            if (s.endsWith(suffix)) {
                return true;
            }
        }
        return false;
    }
}
