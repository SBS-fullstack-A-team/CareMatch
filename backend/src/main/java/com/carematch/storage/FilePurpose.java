package com.carematch.storage;

/**
 * 파일 용도. 스토리지 키의 최상위 prefix 로 사용.
 */
public enum FilePurpose {
    BUSINESS_LICENSE("business-license"),
    CERTIFICATE("certificate"),
    INQUIRY_ATTACHMENT("inquiry-attachment"),
    JOB_POSTING_IMAGE("job-posting-image");

    private final String prefix;

    FilePurpose(String prefix) {
        this.prefix = prefix;
    }

    public String prefix() {
        return prefix;
    }
}
