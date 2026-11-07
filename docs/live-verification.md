# 실제 서비스 연결 사전 검증

## 결과

- `.env.local`은 직접 출력하지 않고 변수 이름·존재 여부·형식만 검사했다. `DATABASE_URL`은 선언되어 있지만 값이 비어 있다. 대체 PostgreSQL 연결 변수는 없었다. 나머지 검사 대상 11개는 존재하며 형식 검사를 통과했다. 비밀정보용 NEXT_PUBLIC 변수와 중복 선언은 발견되지 않았다.
- DB 단계는 `INVALID_DB_CONFIG`로 차단됐다. 실제 PostgreSQL 연결, 기존 테이블 조회, 충돌 판정, 마이그레이션, seed와 실제 DB 비교는 수행하지 않았다.
- SQL 파일에는 DROP/TRUNCATE/DELETE가 없다. 다만 기존 이름이 같은 테이블의 스키마와 RLS 영향을 실제 DB에서 확인하기 전에는 안전하다고 확정할 수 없다.
- GitHub는 설정된 토큰으로 공개 저장소 메타데이터 1건만 조회했고 HTTP 200을 받았다. 페이지네이션 링크와 공개 저장소 ID/메타데이터 형식을 확인했다. 첫 시도는 실행 환경의 네트워크 제약으로 실패했고 네트워크 접근을 허용한 재시도는 성공했다. 전체 수집과 분석 큐 생성은 실행하지 않았다.
- OpenAI는 설정된 모델로 Responses API / 최소 Structured Outputs 요청을 정확히 1회 실행했다. HTTP 200, completed, JSON Schema 검증 성공. 입력 39·출력 14토큰, 출력 상한 64토큰. 설정 단가 기준 추정 비용은 USD 0.0000123이다. 실제 프로젝트 설명 스키마·코드 분석 품질까지 검증한 결과는 아니다.
- DB가 없어 연결 테스트 비용은 무시된 로컬 artifacts 파일에 기록했다. DB의 월간 사용 기록에는 아직 저장되지 않았다.
- 전체 저장소 자동 분석, 외부 서비스 설정 변경, 운영 배포는 수행하지 않았다.

## 실행 명령

```sh
node --import tsx scripts/verify-live.ts env
node --import tsx scripts/verify-live.ts db
node --import tsx scripts/verify-live.ts github
node --import tsx scripts/verify-live.ts openai
npm run test:integration
npm run typecheck
npm run lint
```

GitHub 명령은 네트워크 접근을 허용해 재실행했고 OpenAI 명령은 네트워크 접근을 허용한 단일 호출이다. OpenAI 검증은 의도치 않은 중복 비용을 막기 위해 동일한 로컬 예약 파일이 있으면 재호출을 차단한다.

## 보완한 이관 코드와 테스트

기존 seed는 상세 화면 troubleshooting 6개를 저장했지만 홈 화면 Problem Solving 원문 4개는 별도로 저장하지 않았다. `portfolio_home_problem_solving`에 원문 4개를 손실 없이 저장하고 공개 프로젝트별로 조회하도록 보완했다. 새 테이블은 추가형이며 RLS를 적용하고 재실행 시 원문을 덮어쓰지 않는다.

격리된 메모리 PostgreSQL에서 마이그레이션·seed 반복 실행과 원문 3개/4개 비교를 포함한 통합 시나리오 13개가 통과했다(Node 상위 테스트 포함 14개). lint와 typecheck도 통과했다. 이 테스트의 migrate/seed는 실제 `.env.local` DB를 사용하지 않았다.

## 남은 단계

실제 PostgreSQL 연결 URL을 `.env.local`의 `DATABASE_URL`에 저장해야 한다. URL의 비밀번호는 URL 인코딩하고 연결 문자열은 채팅이나 Git에 올리지 않는다. 이후 읽기 전용 DB 검사 → 기존 테이블 충돌/권한/RLS 검토 → 안전한 경우에만 `npm run db:migrate` → `npm run db:seed` → `node --import tsx scripts/verify-live.ts compare` 순서로 진행한다.

앞서 채팅에 공유한 OpenAI 키는 폐기·재발급하는 것이 좋다. 검증 과정에서는 키·토큰·비밀번호·연결 문자열을 출력하거나 결과 문서에 저장하지 않았다.

## DB URL 저장 후 재검사

`env` → `db` → `db-format` 검사를 실행했다. DB URL은 저장되어 있으며 PostgreSQL URL 구조, pooler 사용자명 형태, 포트 형식은 유효하다. 환경 내 네트워크 제한으로 처음에는 EACCES가 발생했고, 네트워크 접근을 허용한 재시도에서 서버에 도달했으나 `28P01`(invalid_password)로 인증이 거절됐다.

비밀값을 출력하지 않는 추가 검사에서 비밀번호 위치에 예시용 플레이스홀더가 남아 있음을 확인했다. dotenv의 달러 기호 확장이나 URL fragment 문제는 발견되지 않았다. 실제 DB 비밀번호를 올바르게 URL 인코딩해 대체해야 한다. 이 단계에서도 테이블 조회·충돌 확인·마이그레이션·이관·실제 DB 비교는 수행하지 않았다. 기존 GitHub/OpenAI 성공 결과를 재사용했고 추가 API 호출·자동 분석·배포는 실행하지 않았다.

## 인증 수정 후 실제 DB 이관 완료

최종 재시도에서는 DB 인증과 읽기 전용 사전 검사가 성공했다. 기존 사용자 관계 객체 44개 중 추가할 테이블과 같은 이름을 가진 객체는 없었고, public 스키마 생성 권한과 서버 역할의 RLS 접근 권한을 확인했다. SQL 파일의 삭제 구문 부재를 재확인한 뒤 승인된 범위의 추가형 마이그레이션과 seed를 실행했다.

| 검증 | 최종 결과 |
| --- | --- |
| 실제 PostgreSQL 연결 | 성공 |
| 추가 테이블 | 11개 생성, 모두 RLS 활성화, 공개 접근 정책 0개 |
| 기존 객체 | 기존 44개의 기록된 열 형식·종류·RLS 상태가 이관 전과 일치 |
| 프로젝트 | 3개, 각 slug 1건씩이며 전체 Project 객체가 원본과 일치 |
| 홈 Problem Solving | 4개, 전체 원문과 순서 일치 |
| 상세 troubleshooting | 6개 별도 보존 |
| 공개 스냅샷 | 원본 프로젝트 배열과 일치 |
| 공개 페이지 서버 조회 함수 | 프로젝트 3개·홈 항목 4개 반환, 원문 비교 일치 |
| 수동 수정 보호 | 프로젝트별 보호 필드 26개·22개·19개 유지 |
| 자동 분석 큐 / 프로젝트 분석 기록 | 모두 0건 |
| 추가 OpenAI 호출 / 운영 배포 | 실행하지 않음 |

이 단계에서 실행한 명령:

```sh
node --import tsx scripts/verify-live.ts db-format
node --import tsx scripts/verify-live.ts db
node --import tsx scripts/verify-live.ts db-baseline
npm run db:migrate
npm run db:seed
node --import tsx scripts/verify-live.ts compare
node --import tsx scripts/verify-live.ts db-integrity
node --conditions=react-server --import tsx scripts/verify-live.ts public
```

기존 DB 내용에 대한 전체 덤프나 행별 비교를 수행한 것은 아니다. 기존 객체에는 변경 SQL을 실행하지 않았고 구조 메타데이터가 유지되는지 확인했다. 이전 인증 실패는 수정 후 해소됐으며 최종 DB 검증에 남은 실패는 없다. OpenAI 연결 테스트의 기존 비용 기록은 로컬 artifacts 파일에 그대로 보관하며 재호출하거나 DB에 중복 집계하지 않았다.
