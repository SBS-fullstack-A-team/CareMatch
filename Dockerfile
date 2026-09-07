# ==========================================================================
# 멀티스테이지 빌드 — 최종 이미지에는 JRE + jar 만 남긴다.
# gradlew(wrapper) 대신 gradle 베이스 이미지를 사용 → 별도 wrapper 바이너리 불필요.
# (로컬 개발자는 IntelliJ 또는 `gradle wrapper` 로 ./gradlew 를 생성해 쓰면 된다)
# ==========================================================================

# ---- build stage ----
FROM gradle:8.10.2-jdk17 AS build
WORKDIR /workspace

# 의존성 캐시 레이어
COPY build.gradle settings.gradle ./
RUN gradle dependencies --no-daemon || true

# 소스 복사 후 빌드 (테스트는 CI 에서 별도 수행)
COPY src ./src
RUN gradle clean bootJar --no-daemon -x test

# ---- run stage ----
FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app

# 비루트 사용자로 실행
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

COPY --from=build /workspace/build/libs/*.jar app.jar

# Render 는 $PORT 를 주입한다. 기본 8080.
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8080

# 컨테이너 레벨 헬스체크 (Render 자체 헬스체크와 별개)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-8080}/actuator/health" | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
