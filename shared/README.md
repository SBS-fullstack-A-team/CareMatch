# 공유 폴더 (share 브랜치 전용)

이 브랜치(`share`)는 `main`과 병합하지 않는다. 팀원끼리 파일을 주고받기 위한 공용 공간이다.

## 사용법

```bash
# 받기
git fetch origin
git checkout share
git pull origin share

# 올리기
git checkout share
# shared/ 안에 파일 추가
git add shared/
git commit -m "chore: 공유파일 추가 - 설명"
git push origin share
```

## 규칙

- 파일은 전부 `shared/` 안에만 둔다.
- 브랜치 코드 규칙(feature/fe-*, feature/be-*)과 무관한 예외 브랜치다. PR 대상 아님.
- 오래된 파일은 올린 사람이 직접 정리한다.
